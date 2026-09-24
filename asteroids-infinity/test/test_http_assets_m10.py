"""HTTP static-asset smoke only: this does not launch a browser or certify ES-module execution."""
from pathlib import Path
from contextlib import contextmanager
from functools import partial
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from threading import Thread
from urllib.request import urlopen
import re
ROOT=Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
@contextmanager
def server():
    httpd=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(PUBLIC)))
    thread=Thread(target=httpd.serve_forever,daemon=True);thread.start()
    try:yield f'http://127.0.0.1:{httpd.server_port}'
    finally:httpd.shutdown();httpd.server_close();thread.join()
files={'/':'text/html','/style.css':'text/css'}
for file in (PUBLIC/'src').glob('*.js'):
    files['/src/'+file.name]='javascript'
with server() as base:
    for path,mime in files.items():
        with urlopen(base+path,timeout=3) as r:
            payload=r.read()
            assert r.status==200 and payload
            assert mime in r.headers['Content-Type'],(path,r.headers['Content-Type'])
    index=(PUBLIC/'index.html').read_text(encoding='utf-8')
    assert 'src="./src/app.js"' in index
    for module in (PUBLIC/'src').glob('*.js'):
        for match in re.findall(r'''\bfrom\s*['"](\./[^'"]+\.js)['"]''',module.read_text(encoding='utf-8')):
            assert (module.parent/match).is_file(),(module.name,match)
    print(f'STATIC HTTP M10: PASS {len(files)} assets; native ES-module MIME and all import paths exist (Chromium HTTP execution not verified)')
