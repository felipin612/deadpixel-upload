import sys, soundfile as sf, numpy as np
from kokoro_onnx import Kokoro
k=Kokoro('/home/claude/tts/kokoro-v1.0.onnx','/home/claude/tts/voices-v1.0.bin')
def say(text, out, voice='bm_george', speed=0.92):
    # split on blank lines = long pauses
    parts=[p.strip() for p in text.split('\n\n') if p.strip()]
    sr=24000; chunks=[]
    for p in parts:
        a,sr=k.create(p, voice=voice, speed=speed, lang='en-gb' if voice.startswith('b') else 'en-us')
        chunks += [a, np.zeros(int(sr*0.9),dtype=a.dtype)]
    sf.write(out, np.concatenate(chunks), sr)
if __name__=='__main__':
    say(open(sys.argv[1]).read(), sys.argv[2], *(sys.argv[3:4] or []))
