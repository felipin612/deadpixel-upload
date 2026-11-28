"""Build a vertical short from its Chatterbox narration.
usage: python3 build_short.py S10 sh10 "SIGNALMAN" [yellow phrase ...]
voice: /home/claude/deadpixel-upload/narration/<ID>/<ID>.wav (leading silence trimmed to 0)
out:   /home/claude/dp/final5/<ID>_short_9x16.mp4 + shorts5/<ID>_caps.json"""
import json, os, re, subprocess, sys
sys.path.insert(0, '/home/claude/dp')
from captions import speech_chunks, align
sid, scene, title, yellow = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4:]
D = '/home/claude/dp'; os.makedirs(f'{D}/final5', exist_ok=True); os.makedirs(f'{D}/shorts5/{sid}', exist_ok=True)
src = f'/home/claude/deadpixel-upload/narration/{sid}/{sid}.wav'
voice = f'{D}/shorts5/{sid}_voice.wav'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af',
                'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0,aresample=48000', voice], check=True)
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', voice], capture_output=True, text=True).stdout)
words = open(f'{D}/shorts5/{sid}.txt').read().split()
timed = align(words, speech_chunks(voice))
caps = {'words': [[w, round(a, 2), round(b, 2)] for w, a, b in timed], 'yellow': yellow}
caps['words'][0][1] = 0.0
json.dump(caps, open(f'{D}/shorts5/{sid}_caps.json', 'w'), indent=0)
vdur = round(dur + 0.4, 2)
raw = f'{D}/shorts5/{sid}/raw.mp4'
subprocess.run(['python3', f'{D}/render.py', raw, '270', '480', '24', f'{scene}:{vdur}'], check=True, env=dict(os.environ, PORT=os.environ.get('PORT', '8781')))
subprocess.run(['python3', f'{D}/finish.py', raw, voice, f'{D}/final5/{sid}_short_9x16.mp4', f'{D}/shorts5/{sid}_caps.json', title], check=True)
print(sid, 'voice', round(dur, 2), 'video', vdur)
