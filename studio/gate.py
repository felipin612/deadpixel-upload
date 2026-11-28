#!/usr/bin/env python3
"""Publishing gate: enforces studio/rules.json before any upload.

Check before publishing (exit code 0 = PASS, 1 = FAIL, nothing may be published on FAIL):
  python3 studio/gate.py check --id S07 --kind short --platform tiktok \
      --video final/S07_9x16.mp4 --script shorts/S07.txt --caps shorts/S07_caps.json \
      --caption posts/S07_tiktok.txt [--at 2026-11-27T18:00] \
      --confirm R3-content-check,R4-ai-label,R9-no-slow-open

Record after the post is verified live (or scheduled):
  python3 studio/gate.py record --id S07 --platform tiktok --video final/S07_9x16.mp4 \
      --post-id 77125... [--at 2026-11-27T18:00]

Every check writes studio/compliance/<ID>_<platform>.json (commit it): the Analista
reads these files to verify that each rule was really applied.
"""
import argparse, datetime as dt, hashlib, json, os, re, subprocess, sys
from zoneinfo import ZoneInfo

HERE = os.path.dirname(os.path.abspath(__file__))
TZ = ZoneInfo("America/Argentina/Buenos_Aires")
LOG = os.path.join(HERE, "publish_log.json")
COMP = os.path.join(HERE, "compliance")


def load(p, default):
    try:
        with open(p) as f:
            return json.load(f)
    except FileNotFoundError:
        return default


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()


def when(s):
    if not s:
        return dt.datetime.now(TZ)
    t = dt.datetime.fromisoformat(s)
    return t if t.tzinfo else t.replace(tzinfo=TZ)


def leading_silence(video):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-t", "3", "-i", video, "-af",
                          "silencedetect=noise=-40dB:d=0.05", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    starts = [float(x) for x in re.findall(r"silence_start: (-?[\d.]+)", out)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    if starts and starts[0] <= 0.02:
        return ends[0] if ends else 3.0
    return 0.0


def probe(video):
    out = subprocess.run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
                          "stream=width,height:format=duration,size", "-of", "json", video],
                         capture_output=True, text=True).stdout
    j = json.loads(out or "{}")
    st = (j.get("streams") or [{}])[0]
    fm = j.get("format", {})
    return float(fm.get("duration", 0)), int(fm.get("size", 0)), st.get("width", 0), st.get("height", 0)


def first_sentence(script):
    text = open(script).read().strip()
    return re.split(r"(?<=[.!?])\s", text, maxsplit=1)[0]


def check(a):
    rules = load(os.path.join(HERE, "rules.json"), {"rules": []})["rules"]
    log = load(LOG, [])
    confirmed = set(filter(None, (a.confirm or "").split(",")))
    at = when(a.at)
    res = []
    for r in rules:
        if a.platform not in r.get("platforms", []) or ("kinds" in r and a.kind not in r["kinds"]):
            continue
        if r.get("enabled") is False:  # turned off by the user (see disabled_by)
            continue
        rid, ok, why = r["id"], None, ""
        if r["check"] == "confirm":
            ok = rid in confirmed
            why = "confirmed by producer" if ok else "NOT confirmed: do it, then pass --confirm " + rid
        elif rid == "R1-no-repost":
            h = sha(a.video)
            dup = [e for e in log if e["platform"] == a.platform and (e["sha"] == h or e["id"] == a.id)]
            ok, why = not dup, ("already published: %s" % dup[0].get("post_id") if dup else "new file")
        elif rid == "R2-tiktok-spacing":
            tl = [when(e["at"]) for e in log if e["platform"] == "tiktok"]
            same_day = [t for t in tl if t.astimezone(TZ).date() == at.astimezone(TZ).date()]
            gaps = [abs((at - t).total_seconds()) / 3600 for t in tl]
            near = min(gaps) if gaps else None
            ok = len(same_day) < 3 and (near is None or near >= 3)
            why = "%d TikToks that day, nearest %.1f h" % (len(same_day), near) if near is not None else "first TikTok"
            if not ok:
                why += " -> schedule it later (pass --at)"
        elif rid == "R5-exp-no-youtube":
            first_today = not [e for e in log if e["platform"] == "tiktok"
                               and when(e["at"]).astimezone(TZ).date() == at.astimezone(TZ).date()]
            cap = open(a.caption).read() if a.caption else ""
            if first_today:
                ok = "youtube" not in cap.lower()
                why = "first TikTok of the day: caption must not mention YouTube" + ("" if ok else " (it does)")
            else:
                ok, why = True, "not the first TikTok of the day"
        elif rid == "R12-scheduled-slot":
            sch = load(os.path.join(HERE, "schedule.json"), {}).get("channels", {}).get(a.platform, {})
            if a.platform == "youtube":
                slots = [sch.get("episode")] if a.kind == "episode" else sch.get("shorts", [])
            elif a.platform == "instagram" and a.kind == "part1":
                slots = [sch.get("episode_part1")]
            else:
                slots = sch.get("slots", [])
            hm = at.astimezone(TZ).strftime("%H:%M")
            ok = bool(a.at) and hm in [x for x in slots if x]
            why = "%s vs Rastreador slots %s" % (hm if a.at else "no --at given", slots)
        elif rid == "R20-gate-current":
            ok, why = True, "enforced by 'gate.py record' (needs this report with pass:true and every enabled rule)"
        elif rid == "R21-tiktok-circuit-breaker":
            mets = {p.get("post_id"): {m["type"]: m["value"] for m in (p.get("metrics") or [])}
                    for p in load(os.path.join(HERE, "metrics", "buffer_posts.json"), [])}
            now = dt.datetime.now(TZ)
            aged = [e for e in log if e["platform"] == "tiktok" and when(e["at"]) <= now - dt.timedelta(hours=24)
                    and "views" in mets.get(e.get("post_id"), {})]
            aged.sort(key=lambda e: when(e["at"]))
            last3 = aged[-3:]
            if len(last3) < 3:
                ok, why = True, "only %d TikToks with 24 h Buffer metrics: no verdict yet" % len(last3)
            elif all(mets[e["post_id"]]["views"] == 0 for e in last3):
                until = when(last3[-1]["at"]) + dt.timedelta(days=7)
                ok = at >= until
                why = "last 3 TikToks (%s) have 0 views at 24 h -> TikTok paused until %s" % (
                    ", ".join(e["id"] for e in last3), until.strftime("%Y-%m-%d %H:%M"))
            else:
                ok, why = True, "views of last 3 TikToks at 24 h: %s" % [mets[e["post_id"]]["views"] for e in last3]
        elif rid == "R24-youtube-buffer-limit":
            bl = [when(e["at"]) for e in log if e["platform"] == "youtube"
                  and re.fullmatch(r"[0-9a-f]{24}", str(e.get("post_id", ""))) and e["id"] != a.id]
            before = [t for t in bl if at - dt.timedelta(hours=24) < t <= at]
            after = [t for t in bl if at <= t < at + dt.timedelta(hours=24)]
            ok = len(before) < 2 and len(after) < 2
            why = "Buffer YouTube posts in the 24 h before/after: %d/%d (max 1 so this is the 2nd)" % (len(before), len(after))
            if not ok:
                why += " -> use the next free slot or upload by API (R25)"
        elif rid == "R13-short-length":
            d = probe(a.video)[0]
            ok, why = 30 <= d <= 60, "duration %.1f s (allowed 30-60 s)" % d
        elif rid == "R15-caption-question":
            cap = open(a.caption).read() if a.caption else ""
            ok = "?" in cap
            why = "caption asks a question" if ok else ("no --caption file given" if not a.caption else "caption has no question: add one about the story clue")
        elif rid == "R16-ig-reel-format":
            d, size, w, h = probe(a.video)
            ratio = (w / h) if h else 0
            ok = 3 <= d <= 900 and size <= 300 * 1024 * 1024 and 0.5625 - 0.01 <= ratio <= 0.8 + 0.01 and w <= 1920
            why = "%.1f s, %.1f MB, %dx%d (Buffer auto-publish: 3 s-15 min, <=300 MB, 4:5 to 9:16, <=1920 px wide)" % (d, size / 1048576, w, h)
        elif rid == "R19-voice-chatterbox":
            base = os.path.join(os.path.dirname(HERE), "narration")
            cands = [a.id, a.id.split("_")[0], re.sub(r"(_?P(ART)?\d+)$", "", a.id, flags=re.I)]
            found = [c for c in cands if os.path.isdir(os.path.join(base, c))]
            marks = []
            if found:
                d = os.path.join(base, found[0])
                marks = [load(os.path.join(d, f), {}) for f in os.listdir(d) if f.endswith(".json")]
            ok = bool(marks) and all(m.get("engine") == "chatterbox" for m in marks)
            why = ("narration/%s: %d chatterbox segments" % (found[0], len(marks))) if found else "no narration/<ID>/ folder from the TTS workflow"
        elif rid == "R6-hook-at-zero":
            s = leading_silence(a.video)
            ok, why = s <= 0.15, "leading silence %.2f s" % s
        elif rid == "R7-hook-onscreen":
            if not a.caps:
                ok, why = False, "no --caps file given"
            else:
                w = load(a.caps, {}).get("words", [])
                st = w[0][1] if w else 99
                ok, why = st <= 0.3, "first caption at %.2f s" % st
        elif rid == "R8-hook-short":
            if not a.script:
                ok, why = False, "no --script file given"
            else:
                fs = first_sentence(a.script)
                n = len(fs.split())
                ok, why = n <= 10, "%d words: %r" % (n, fs)
        else:
            ok, why = False, "rule has no automatic check: add one to gate.py or make it 'confirm'"
        res.append({"rule": rid, "research": r.get("research"), "ok": bool(ok), "detail": why})
    passed = all(x["ok"] for x in res)
    os.makedirs(COMP, exist_ok=True)
    rep = {"id": a.id, "kind": a.kind, "platform": a.platform, "video": os.path.basename(a.video),
           "checked_at": dt.datetime.now(TZ).isoformat(timespec="seconds"), "publish_at": at.isoformat(timespec="minutes"),
           "pass": passed, "results": res}
    with open(os.path.join(COMP, "%s_%s.json" % (a.id, a.platform)), "w") as f:
        json.dump(rep, f, indent=1, ensure_ascii=False)
    for x in res:
        print(("PASS " if x["ok"] else "FAIL ") + x["rule"] + ": " + x["detail"])
    print("GATE", "PASS" if passed else "FAIL - fix the failures above, do not publish")
    return 0 if passed else 1


def record(a):
    log = load(LOG, [])
    rules = load(os.path.join(HERE, "rules.json"), {"rules": []})["rules"]
    r20 = [r for r in rules if r["id"] == "R20-gate-current" and r.get("enabled") is not False]
    if r20 and a.platform in r20[0]["platforms"]:
        rep = load(os.path.join(COMP, "%s_%s.json" % (a.id, a.platform)), None)
        if not rep:
            print("REFUSED (R20): no compliance report: run gate.py check first"); return 1
        need = [r["id"] for r in rules if r.get("enabled") is not False and a.platform in r.get("platforms", [])
                and ("kinds" not in r or rep.get("kind") in r["kinds"])]
        have = {x["rule"] for x in rep["results"]}
        missing = [x for x in need if x not in have]
        if not rep.get("pass") or missing:
            print("REFUSED (R20): report pass=%s, rules not checked: %s -> run gate.py check again with the current rules"
                  % (rep.get("pass"), missing)); return 1
        if a.at and rep.get("publish_at") != when(a.at).isoformat(timespec="minutes"):
            print("REFUSED (R20): checked for %s but recorded for %s" % (rep.get("publish_at"), when(a.at).isoformat(timespec="minutes"))); return 1
    log.append({"id": a.id, "platform": a.platform, "sha": sha(a.video), "post_id": a.post_id,
                "at": when(a.at).isoformat(timespec="minutes")})
    with open(LOG, "w") as f:
        json.dump(log, f, indent=1)
    print("recorded", a.id, a.platform, a.post_id)
    return 0


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    c = sub.add_parser("check")
    r = sub.add_parser("record")
    for q in (c, r):
        q.add_argument("--id", required=True)
        q.add_argument("--platform", required=True, choices=["tiktok", "youtube", "instagram"])
        q.add_argument("--video", required=True)
        q.add_argument("--at")
    c.add_argument("--kind", required=True, choices=["short", "episode", "part1"])
    c.add_argument("--script")
    c.add_argument("--caps")
    c.add_argument("--caption")
    c.add_argument("--confirm")
    r.add_argument("--post-id", required=True)
    a = p.parse_args()
    sys.exit(check(a) if a.cmd == "check" else record(a))
