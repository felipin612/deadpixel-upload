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
