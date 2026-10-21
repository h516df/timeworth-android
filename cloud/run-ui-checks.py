#!/usr/bin/env python3
"""Run existing browser checks against an owned temporary cloud-only server."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import os
from pathlib import Path
import subprocess
import tempfile
from threading import Thread

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    environment = os.environ.copy()
    environment.setdefault('ARTIFACT_DIR', str(Path(tempfile.gettempdir()) / 'timeworth-ui-qa'))
    Path(environment['ARTIFACT_DIR']).mkdir(parents=True, exist_ok=True)
    handler = partial(QuietHandler, directory=str(ROOT / 'ui-preview/dist'))
    # Port 0 prevents interfering with another task's server. Only bind loopback.
    with ThreadingHTTPServer(('127.0.0.1', 0), handler) as server:
        thread = Thread(target=server.serve_forever, daemon=True)
        thread.start()
        environment['PREVIEW_URL'] = f'http://127.0.0.1:{server.server_port}'
        try:
            for script in ['check-v4.cjs', 'focused-v4.cjs']:
                print('RUN browser check:', script, flush=True)
                result = subprocess.run(['node', 'ui-preview/qa/' + script], cwd=ROOT,
                                        env=environment, timeout=240)
                if result.returncode:
                    return result.returncode
        finally:
            server.shutdown()
            thread.join(timeout=5)
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
