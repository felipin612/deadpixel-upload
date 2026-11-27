"""Run by GitHub Actions (free, CPU). For every jobs/tts/*.json not done: synthesize with Chatterbox (MIT, Resemble AI).
Job: {"out_dir": "samples", "items": [{"name": "B_x", "text": "...", "ref": "assets/voices/ref_bm_george.wav" or null,
       "exaggeration": 0.5, "cfg_weight": 0.5, "temperature": 0.8}]}
Long texts are split by sentence groups and joined with short pauses. Writes <out_dir>/<name>.wav and .mp3."""
import glob, json, os, re, subprocess, time
import torch, torchaudio as ta
from chatterbox.tts import ChatterboxTTS

torch.set_num_threads(os.cpu_count() or 4)
model = ChatterboxTTS.from_pretrained(device="cpu")

def chunks(text, limit=280):
    sents = re.split(r"(?<=[.!?])\s+", text.strip())
    out, cur = [], ""
    for s in sents:
        if cur and len(cur) + len(s) + 1 > limit:
            out.append(cur); cur = s
        else:
            cur = (cur + " " + s).strip()
    if cur: out.append(cur)
    return out

for path in sorted(glob.glob("jobs/tts/*.json")):
    job = json.load(open(path))
    if job.get("done"):
        continue
    os.makedirs(job.get("out_dir", "samples"), exist_ok=True)
    report = []
    for it in job["items"]:
        t0 = time.time()
        kw = dict(exaggeration=it.get("exaggeration", 0.5), cfg_weight=it.get("cfg_weight", 0.5), temperature=it.get("temperature", 0.8))
        if it.get("ref"):
            kw["audio_prompt_path"] = it["ref"]
        parts = []
        for c in chunks(it["text"]):
            wav = model.generate(c, **kw)
            parts += [wav, torch.zeros(1, int(model.sr * it.get("pause", 0.35)))]
        audio = torch.cat(parts[:-1], dim=1)
        base = os.path.join(job.get("out_dir", "samples"), it["name"])
        ta.save(base + ".wav", audio, model.sr)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", base + ".wav", "-b:a", "160k", base + ".mp3"], check=True)
        secs = audio.shape[1] / model.sr
        json.dump({"engine": "chatterbox", "ref": it.get("ref"), "params": {k: v for k, v in kw.items() if k != "audio_prompt_path"},
                   "seconds": round(secs, 2), "text": it["text"]}, open(base + ".json", "w"), indent=1)  # marker read by gate.py R19
        report.append({"name": it["name"], "seconds": round(secs, 1), "render_seconds": round(time.time() - t0, 1)})
        print(report[-1], flush=True)
    job["done"], job["result"] = True, report
    json.dump(job, open(path, "w"), indent=1)
