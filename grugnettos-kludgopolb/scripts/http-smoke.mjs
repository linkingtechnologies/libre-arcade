import { spawn } from 'node:child_process';
import process from 'node:process';

const port = Number(process.env.SMOKE_PORT || 8137);
const base = `http://127.0.0.1:${port}`;
const checks = [
  ['/', 'text/html'],
  ['/src/ui/app.js', 'text/javascript'],
  ['/src/ui/app.css', 'text/css'],
  ['/boards/index.json', 'application/json'],
  ['/boards/grugnetto-32-v1.4/board.json', 'application/json'],
  ['/boards/grugnetto-32-v1.4/i18n/it.json', 'application/json'],
  ['/boards/layouts/grugnetto-islands/layout.json', 'application/json'],
  ['/boards/layouts/grugnetto-islands/board_blank_tiles.webp', 'image/webp'],
  ['/boards/layouts/grugnetto-islands/world-banner.svg', 'image/svg+xml'],
  ['/boards/layouts/grugnetto-islands/tile-outlines.json', 'application/json'],
  ['/config/pawns.json', 'application/json'],
  ['/assets/grugnetto/grugnetto_idle.png', 'image/png']
];

const server = spawn(process.execPath, ['scripts/serve.mjs'], {
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

let ready = false;
let stderr = '';
server.stderr.on('data', chunk => { stderr += chunk; });
server.stdout.on('data', chunk => {
  if (String(chunk).includes(`http://127.0.0.1:${port}/`)) ready = true;
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
try {
  for (let i = 0; i < 40 && !ready; i += 1) await sleep(50);
  if (!ready) throw new Error(`Server did not start. ${stderr}`);
  for (const [path, expectedType] of checks) {
    const response = await fetch(base + path, { cache: 'no-store' });
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    const actual = response.headers.get('content-type') || '';
    if (!actual.toLowerCase().startsWith(expectedType)) {
      throw new Error(`${path}: expected ${expectedType}, got ${actual || '(missing)'}`);
    }
    await response.arrayBuffer();
    console.log(`OK ${response.status} ${actual} ${path}`);
  }
  // A malformed percent-escape must be rejected without taking the server down.
  const malformed = await fetch(`${base}/%E0%A4%A`, { cache: 'no-store' });
  if (malformed.status !== 400) throw new Error(`/%E0%A4%A: expected HTTP 400, got ${malformed.status}`);
  const afterMalformed = await fetch(`${base}/`, { cache: 'no-store' });
  if (!afterMalformed.ok) throw new Error(`server did not survive a malformed URL: HTTP ${afterMalformed.status}`);
  console.log('OK 400 malformed percent-escape, server still up');
} finally {
  server.kill('SIGTERM');
}
