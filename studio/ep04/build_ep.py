"""EP04 voice track + plan from Chatterbox scene files (narration/EP04/EP04_sNN.wav).
Lengthens pauses between sentences (to >= 0.75 s), optionally slows slightly (atempo >= 0.93),
then adds holds so the episode lands near TARGET seconds. Writes ep04/voice.wav, plan.json, jobs.json, chapters.txt."""
import json, subprocess, numpy as np, soundfile as sf
D = '/home/claude/dp/ep04'; N = '/home/claude/deadpixel-upload/narration/EP04'
TARGET, INTRO = 615.0, 6.0
SR = 48000
CH = ['A train outside my house', 'The timetable', 'SIGNALMAN', 'First night', 'Three minutes past three', 'Held at red',
      'The lit window', 'The magazine', 'J. Kell', 'Line view', 'Holding is not stopping', 'The circled departure',
      'Pulling the lever', 'The porch light']

def load(i):
    out = f'{D}/s{i:02d}_48k.wav'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{N}/EP04_s{i:02d}.wav', '-af',
                    'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.2,areverse,aresample=48000', '-ac', '1', out], check=True)
    a, sr = sf.read(out); return a

def stretch_pauses(a, minp=0.95, thr=10 ** (-42 / 20)):
    win = int(SR * 0.02); n = len(a) // win
    env = np.array([np.sqrt(np.mean(a[k * win:(k + 1) * win] ** 2)) for k in range(n)])
    quiet = env < thr; out = []; k = 0; last = 0
    while k < n:
        if quiet[k]:
            j = k
            while j < n and quiet[j]: j += 1
            run = (j - k) * win
            if run >= SR * 0.18 and k > 0 and j < n:
                out.append(a[last:k * win]); out.append(np.zeros(max(run, int(SR * minp)))); last = j * win
            k = j
        else: k += 1
    out.append(a[last:]); return np.concatenate(out)

scenes = [stretch_pauses(load(i)) for i in range(1, 15)]
speech = sum(len(s) for s in scenes) / SR
tempo = 1.0
budget = TARGET - INTRO - 14 * 2.0
if speech > budget: pass
elif speech / 0.93 <= budget - 14 * 2.5: tempo = 0.93
else: tempo = max(0.93, speech / budget)
if tempo < 1.0:
    res = []
    for i, s in enumerate(scenes):
        sf.write(f'{D}/tmp.wav', s, SR)
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{D}/tmp.wav', '-af', f'atempo={tempo:.3f}', f'{D}/tmp2.wav'], check=True)
        res.append(sf.read(f'{D}/tmp2.wav')[0])
    scenes = res
speech = sum(len(s) for s in scenes) / SR
hold = max(1.5, min(9.0, (TARGET - INTRO - speech) / 14))
plan, parts, chapters, t = [], [], [], 0.0
for i, s in enumerate(scenes):
    d = round(len(s) / SR + hold, 3)
    chapters.append((t, CH[i]))
    plan.append([f'e4{i + 1:02d}', d, f'e{i + 1:02d}'])
    parts += [s, np.zeros(int(round(d * SR)) - len(s))]; t += d
    if i == 0:
        plan.append(['e400', INTRO, None]); parts.append(np.zeros(int(INTRO * SR))); t += INTRO
voice = np.concatenate(parts); sf.write(f'{D}/voice.wav', voice, SR)
json.dump(plan, open(f'{D}/plan.json', 'w'), indent=0)
json.dump([['/home/claude/dp/ep04/clips', 480, 270, k, sid, d] for k, (sid, d, _) in enumerate(plan)], open(f'{D}/jobs.json', 'w'))
fmt = lambda x: f'{int(x // 60)}:{int(x % 60):02d}'
open(f'{D}/chapters.txt', 'w').write('\n'.join(f'{fmt(a)} {b}' for a, b in chapters))
print('speech', round(speech, 1), 'tempo', tempo, 'hold', round(hold, 2), 'total', round(t, 1))
