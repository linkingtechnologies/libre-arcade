// SPDX-License-Identifier: GPL-3.0-or-later
import { spawn } from 'node:child_process';

const port = 18765 + Math.floor(Math.random() * 1000);
const child = spawn(process.execPath, ['tools/serve.mjs'], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'pipe'] });
const base = `http://127.0.0.1:${port}`;
const sleep = ms => new Promise(r => setTimeout(r, ms));
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try { const r = await fetch(`${base}/`); if (r.ok) { ready = true; break; } } catch { /* server still starting */ }
    await sleep(50);
  }
  if (!ready) throw new Error('local server did not become ready');
  const checks = [
    ['/', 'text/html'],
    ['/main.js', 'text/javascript'],
    ['/assets-clean/svg/bubbles/bubble-blue.svg', 'image/svg+xml'],
    ['/assets-clean/themes/space/background.svg', 'image/svg+xml'],
    ['/data/original-levels/files/Easy.gms', 'application/xml'],
    ['/data/original-levels/files/Easy/easy-1.lvl', 'application/xml']
  ];
  for (const [url, mime] of checks) {
    const r = await fetch(`${base}${url}`);
    if (!r.ok) throw new Error(`${url}: HTTP ${r.status}`);
    const type = r.headers.get('content-type') || '';
    if (!type.startsWith(mime)) throw new Error(`${url}: expected ${mime}, got ${type}`);
    await r.arrayBuffer();
  }
  // URL normalization may legitimately resolve this inside root; server must never expose outside root.
  const traversal = await fetch(`${base}/../package.json`);
  if (traversal.ok) throw new Error('server exposed a file outside its served root');
  console.log(JSON.stringify({ served: checks.length, mimeTypes: 'ok', status: 'ok' }, null, 2));
} finally {
  child.kill('SIGTERM');
}
