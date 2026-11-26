import sys, threading, time, http.server, socketserver, functools, io
from playwright.sync_api import sync_playwright
from PIL import Image
PORT=8798; ROOT='/home/claude/dp'
def serve():
    h=functools.partial(http.server.SimpleHTTPRequestHandler,directory=ROOT); h.log_message=lambda *a:None
    socketserver.TCPServer.allow_reuse_address=True
    with socketserver.TCPServer(('127.0.0.1',PORT),h) as s: s.serve_forever()
W,H=int(sys.argv[1]),int(sys.argv[2])
threading.Thread(target=serve,daemon=True).start(); time.sleep(0.4)
with sync_playwright() as pw:
    b=pw.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=b.new_page(viewport={'width':W,'height':H}); pg.goto(f'http://127.0.0.1:{PORT}/engine/index.html?w={W}&h={H}'); pg.wait_for_function('window.DP&&window.DP.ready',timeout=20000)
    for spec in sys.argv[3:]:
        sid,d,t,out=spec.split(':'); d=float(d); t=float(t)
        pg.evaluate("([id,t,d])=>{ for(let k=0;k<=8;k++) DP.frame(id,t*k/8,d); }",[sid,t,d])
        Image.open(io.BytesIO(pg.locator('canvas').screenshot())).save(out)
    b.close()
