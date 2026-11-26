import sys, threading, time, http.server, socketserver, functools, base64, io, json
from playwright.sync_api import sync_playwright
from PIL import Image
PORT=8799; ROOT='/home/claude/dp'
def serve():
    h=functools.partial(http.server.SimpleHTTPRequestHandler,directory=ROOT); h.log_message=lambda *a:None
    socketserver.TCPServer.allow_reuse_address=True
    with socketserver.TCPServer(('127.0.0.1',PORT),h) as s: s.serve_forever()
W,H=int(sys.argv[2]),int(sys.argv[3]); out=sys.argv[1]; specs=[a.split(':') for a in sys.argv[4:]]
threading.Thread(target=serve,daemon=True).start(); time.sleep(0.4)
tiles=[]
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':W,'height':H}); errs=[]
    pg.on('pageerror',lambda e: errs.append(str(e))); pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None)
    pg.goto(f'http://127.0.0.1:{PORT}/engine/index.html?w={W}&h={H}'); pg.wait_for_function('window.DP&&window.DP.ready',timeout=20000)
    for sid,d in specs:
        d=float(d)
        for f in (0.12,0.5,0.88):
            pg.evaluate("([id,t,d])=>{ for(let k=0;k<=6;k++) DP.frame(id,t*k/6,d); }",[sid,d*f,d])
            png=pg.locator('canvas').screenshot(); tiles.append(Image.open(io.BytesIO(png)).convert('RGB'))
    b.close()
print('errors',errs[:5])
cols=3; rows=(len(tiles)+cols-1)//cols; tw,th=tiles[0].size
sheet=Image.new('RGB',(cols*tw,rows*th))
for i,t in enumerate(tiles): sheet.paste(t,((i%cols)*tw,(i//cols)*th))
sheet.save(out)
