# claims shots via atomic .lock files so two workers can share one job list
import os, sys, subprocess, json
port=sys.argv[1]; jobs=json.load(open(sys.argv[2]))   # [[out_dir, W, H, idx, sid, dur], ...]
for out,W,H,i,sid,d in jobs:
    os.makedirs(out,exist_ok=True); f=f'{out}/{i:02d}_{sid}.mp4'
    if os.path.exists(f+'.ok'): continue
    try: fd=os.open(f+'.lock',os.O_CREAT|os.O_EXCL); os.close(fd)
    except FileExistsError: continue
    r=subprocess.run(['python3','/home/claude/dp/render.py',f,str(W),str(H),'24',f'{sid}:{d}'],env=dict(os.environ,PORT=port),capture_output=True,text=True)
    if r.returncode==0: open(f+'.ok','w').write('1')
    else: print('FAIL',sid,r.stderr[-500:],flush=True); os.remove(f+'.lock')
    print('done',out,i,sid,flush=True)
