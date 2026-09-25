"""M3 smoke test: serve the deployable tree over loopback, GET every web asset."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.request import urlopen

root = Path(__file__).resolve().parents[1]
assets = [
    ("/", root / "public/index.html", "text/html"),
    ("/style.css", root / "public/style.css", "text/css"),
    ("/js/app.js", root / "public/js/app.js", "javascript"),
    ("/js/engine.js", root / "public/js/engine.js", "javascript"),
    ("/js/audio.js", root / "public/js/audio.js", "javascript"),
    ("/js/shapes.js", root / "public/js/shapes.js", "javascript"),
]

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

server = ThreadingHTTPServer(
    ("127.0.0.1", 0), partial(QuietHandler, directory=str(root / "public"))
)
thread = Thread(target=server.serve_forever, daemon=True)
thread.start()
try:
    for path, local, mime in assets:
        with urlopen(f"http://127.0.0.1:{server.server_port}{path}", timeout=5) as response:
            body = response.read()
            assert response.status == 200, (path, response.status)
            assert mime in response.headers["Content-Type"], (path, response.headers["Content-Type"])
            assert body == local.read_bytes(), f"body mismatch: {path}"
            print(f"PASS HTTP 200 {path}: {len(body)} bytes ({mime})")
finally:
    server.shutdown()
    server.server_close()
    thread.join(timeout=3)