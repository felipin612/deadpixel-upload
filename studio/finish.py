"""Final mix: video + narration + low ambient bed (+ burned Anton captions for vertical pieces).
usage: python3 finish.py video_raw.mp4 voice.wav out.mp4 [captions.json title]"""
import json, subprocess, sys
sys.path.insert(0, '/home/claude/dp')
from captions import drawtext_chain, esc

video, voice, out = sys.argv[1], sys.argv[2], sys.argv[3]
caps = json.load(open(sys.argv[4])) if len(sys.argv) > 4 else None
title = sys.argv[5] if len(sys.argv) > 5 else None
FONT = '/home/claude/dp/fonts/Anton.ttf'

dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', video],
                           capture_output=True, text=True).stdout)
# ambient: filtered brown noise + a faint 55 Hz CRT hum, well under the voice
amb = (f"anoisesrc=color=brown:amplitude=0.5:duration={dur:.2f}:seed=7,lowpass=f=320,volume=0.09[n];"
       f"sine=f=55:duration={dur:.2f},volume=0.012[h];[n][h]amix=inputs=2:normalize=0[amb]")
audio = (f"[1:a]aresample=48000,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=10:release=200[v];"
         f"{amb};[v][amb]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=11[a]")
vf = None
if caps is not None:
    W, H = 1080, 1920
    chain = drawtext_chain([tuple(x) for x in caps['words']], W, H, FONT, caps.get('yellow', []), y_frac=0.68)
    top = []
    if title:
        # wrap long titles to two lines so they never run off the 1080 frame (Anton ~0.5 em per char)
        words = title.upper().split(); lines = [' '.join(words)]
        if len(lines[0]) * 52 * 0.5 > W * 0.88:
            k = len(words) // 2 + (1 if len(' '.join(words[:len(words)//2])) < len(' '.join(words[len(words)//2:])) - 6 else 0)
            lines = [' '.join(words[:k]), ' '.join(words[k:])]
        for i, ln in enumerate(lines):
            top.append(f"drawtext=fontfile={FONT}:text='{esc(ln)}':fontsize=56:fontcolor=white:borderw=5:bordercolor=black"
                       f":x=(w-tw)/2:y=h*0.17+{i * 70}:enable='between(t\\,0\\,5)'")
    if caps.get('part'):
        top.append(f"drawtext=fontfile={FONT}:text='{esc(caps['part'])}':fontsize=76:fontcolor=yellow:borderw=5:bordercolor=black:x=(w-tw)/2:y=h*0.09")
    vf = ','.join(top + chain)
cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-i', video, '-i', voice, '-filter_complex', audio + (f";[0:v]{vf}[vo]" if vf else ''),
       '-map', '[vo]' if vf else '0:v', '-map', '[a]']
cmd += (['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21', '-pix_fmt', 'yuv420p'] if vf else ['-c:v', 'copy'])
cmd += ['-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-shortest', '-movflags', '+faststart', out]
subprocess.run(cmd, check=True)
print('ok', out)
