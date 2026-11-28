"""EP05 Part 1 (9:16, re-rendered vertical, ~1:41): cold open + logo + scene 2, cuts to black mid-sentence in scene 3.
voice from /home/claude/dp/ep05/voice.wav; out /home/claude/dp/final5/EP05P1_9x16.mp4"""
import json, os, re, subprocess, sys
sys.path.insert(0, '/home/claude/dp')
from captions import speech_chunks, align
D = '/home/claude/dp/ep05'; os.makedirs('/home/claude/dp/final5', exist_ok=True)
plan = json.load(open(f'{D}/plan.json')); script = open('/home/claude/deadpixel-upload/studio/ep05/script.md').read()
scenes = dict(zip(re.findall(r'^## (e\d\d)', script, re.M), [s.split() for s in re.split(r'^## e\d\d\n', script, flags=re.M)[1:]]))
CUT = 100.0
t, shots, words = 0.0, [], []
for sid, d, key in plan:
    if t >= CUT: break
    use = min(d, CUT - t); shots.append(f'{sid}:{round(use, 3)}')
    if key:
        timed = align(scenes[key], speech_chunks(f'{D}/voice.wav', t, t + d))
        words += [[w, round(a, 2), round(b, 2)] for w, a, b in timed if a < CUT - 0.3]
    t += use
words[0][1] = 0.0
caps = {'words': words, 'yellow': ['COUNT EVERY SWEEP'], 'part': 'PART 1'}
json.dump(caps, open(f'{D}/P1_caps.json', 'w'), indent=0)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{D}/voice.wav', '-t', str(CUT), f'{D}/P1_voice.wav'], check=True)
raw = f'{D}/P1_raw.mp4'
subprocess.run(['python3', '/home/claude/dp/render.py', raw, '270', '480', '24'] + shots, check=True, env=dict(os.environ, PORT=os.environ.get('PORT', '8774')))
mid = f'{D}/P1_mid.mp4'
subprocess.run(['python3', '/home/claude/dp/finish.py', raw, f'{D}/P1_voice.wav', mid, f'{D}/P1_caps.json', 'LAMPLIGHT'], check=True)
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mid, '-vf', 'tpad=stop_mode=add:stop_duration=1.2:color=black', '-af', 'apad=pad_dur=1.2',
                '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart',
                '/home/claude/dp/final5/EP05P1_9x16.mp4'], check=True)
print('ok', shots, len(words))
