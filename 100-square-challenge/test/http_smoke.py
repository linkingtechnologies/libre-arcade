"""Check deployment assets over a real local HTTP server (browser navigation is separately tested)."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.error import HTTPError
from urllib.request import urlopen

root = Path(__file__).resolve().parent.parent / 'public'
base = root
assets = [
    'index.html', 'styles.css', 'src/app.js', 'src/game.js', 'src/i18n.js', 'src/sound.js',
    'licenses/AGPL-3.0.txt', 'SOURCE.md',
]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        return

server = ThreadingHTTPServer(('127.0.0.1', 0), partial(QuietHandler, directory=str(root)))
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    url = f'http://127.0.0.1:{server.server_port}/'
    for asset in assets:
        with urlopen(url + asset, timeout=5) as response:
            assert response.status == 200, asset
            assert response.read() == (base / asset).read_bytes(), asset
            if asset.endswith('.js'):
                assert 'javascript' in response.headers.get_content_type(), (asset, response.headers)
        print(f'HTTP PASS {asset}: HTTP 200 / content matches local file')
    with urlopen(url, timeout=5) as response:
        assert response.status == 200
        assert response.read() == (base / 'index.html').read_bytes()
    print('HTTP PASS /: index and separate JS modules served')
    try:
        urlopen(url + 'src/nonexistent.js', timeout=5)
        raise AssertionError('missing asset unexpectedly resolved')
    except HTTPError as exc:
        assert exc.code == 404
    print('HTTP PASS missing JavaScript file returns 404')
finally:
    server.shutdown()
    server.server_close()
