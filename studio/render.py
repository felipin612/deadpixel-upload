"""Render a scene list to an MP4 at internal low res, then upscale x4 nearest-neighbour
with scanlines and grain.

usage: python3 render.py out.mp4 W H FPS sceneId:dur[:offset] [sceneId:dur ...]
"""
import os, subprocess, sys, time, threading, http.server, socketserver, functools, base64
from playwright.sync_api import sync_playwright

ROOT = '/home/claude/dp'
PORT = int(os.environ.get('PORT', 8765))

def serve():
    h = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT)
    h.log_message = lambda *a: None
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), h) as s:
        s.serve_forever()

def main():
    out, W, H, FPS = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4])
    shots = []
    for a in sys.argv[5:]:
        p = a.split(':')
        shots.append((p[0], float(p[1]), float(p[2]) if len(p) > 2 else 0.0))
    threading.Thread(target=serve, daemon=True).start()
    time.sleep(0.5)
    scale = 4
    vf = (f"scale={W*scale}:{H*scale}:flags=neighbor,"
          f"geq=lum='lum(X,Y)*(0.86+0.14*mod(Y,4)/3)':cb='cb(X,Y)':cr='cr(X,Y)',"
          f"noise=alls=4:allf=t")
    ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba',
                           '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-vf', vf,
                           '-c:v', 'libx264', '-preset', 'veryfast', '-crf', os.environ.get('CRF','23'), '-pix_fmt', 'yuv420p', out],
                          stdin=subprocess.PIPE)
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True,
                               args=['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = b.new_page(viewport={'width': W, 'height': H})
        pg.on('console', lambda m: print('[page]', m.text) if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: print('[pageerror]', e))
        pg.goto(f'http://127.0.0.1:{PORT}/engine/index.html?w={W}&h={H}')
        pg.wait_for_function('window.DP && window.DP.ready', timeout=20000)
        t0 = time.time(); n = 0
        total = sum(int(round(d * FPS)) for _, d, _ in shots)
        prog = out + '.progress.json'
        for sid, dur, off in shots:
            frames = int(round(dur * FPS))
            for i in range(frames):
                t = off + i / FPS
                data = pg.evaluate("""([id,t,d]) => { DP.frame(id,t,d);
                    const c=document.querySelector('canvas'); const gl=c.getContext('webgl2');
                    const w=c.width,h=c.height,px=new Uint8Array(w*h*4);
                    gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,px);
                    // flip rows
                    const row=w*4, out=new Uint8Array(px.length);
                    for(let y=0;y<h;y++) out.set(px.subarray((h-1-y)*row,(h-y)*row), y*row);
                    let s=''; const CH=0x8000;
                    for(let i=0;i<out.length;i+=CH) s+=String.fromCharCode.apply(null,out.subarray(i,i+CH));
                    return btoa(s); }""", [sid, t, dur])
                ff.stdin.write(base64.b64decode(data)); n += 1
                if n % 48 == 0 or n == total:
                    open(prog, 'w').write('{"done": %d, "total": %d, "t": %d}' % (n, total, int(time.time() * 1000)))
        print(f'{n} frames in {time.time()-t0:.1f}s ({n/(time.time()-t0):.1f} fps)')
        b.close()
    ff.stdin.close(); ff.wait()

if __name__ == '__main__':
    main()
