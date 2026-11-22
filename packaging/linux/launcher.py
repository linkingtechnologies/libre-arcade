#!/usr/bin/python3
"""Launch an isolated Chromium app backed by an ephemeral loopback-only web server."""
# SPDX-License-Identifier: GPL-3.0-or-later

from __future__ import annotations

import functools
import http.server
import os
from pathlib import Path
import shutil
import subprocess
import sys
import fcntl
import threading

ROOT = Path('/usr/share/libre-arcade')


class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


def main() -> int:
    if not (ROOT / 'index.html').is_file():
        print('Libre Arcade data not found: ' + str(ROOT), file=sys.stderr)
        return 1

    browser = shutil.which('chromium') or shutil.which('chromium-browser')
    if not browser:
        print('Chromium is required to run Libre Arcade.', file=sys.stderr)
        return 1

    handler = functools.partial(Handler, directory=str(ROOT))
    server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), handler)
    server.daemon_threads = True
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    url = f'http://127.0.0.1:{server.server_port}/'

    # Keep localStorage (scores/settings) across sessions in an isolated profile.
    # A lock avoids Chromium handing a second app request to an existing process,
    # which would otherwise leave the browser talking to a stopped web server.
    data_home = Path(os.environ.get('XDG_DATA_HOME', Path.home() / '.local/share'))
    app_home = data_home / 'libre-arcade'
    app_home.mkdir(parents=True, exist_ok=True, mode=0o700)
    profile = app_home / 'chromium-profile'
    lock_path = app_home / 'launcher.lock'
    try:
        with lock_path.open('w') as lock:
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError:
                print('Libre Arcade is already running.', file=sys.stderr)
                return 0
            proc = subprocess.Popen([
                browser, '--no-first-run', '--no-default-browser-check',
                '--user-data-dir=' + str(profile),
                '--app=' + url,
            ])
            return proc.wait()
    except (OSError, subprocess.SubprocessError) as exc:
        print(f'Cannot launch Libre Arcade: {exc}', file=sys.stderr)
        return 1
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


if __name__ == '__main__':
    sys.exit(main())
