// Shared helpers: load the three game engines in Node, unchanged.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function loadComet() {
  const P = require(path.join(ROOT, 'comet-pinball/public/js/physics.js'));
  const win = {};
  new Function('window', fs.readFileSync(path.join(ROOT, 'comet-pinball/public/data/playfield.js'), 'utf8'))(win);
  return { P, pf: win.COMET_PLAYFIELD };
}
export async function loadMN() {
  const url = p => pathToFileURL(path.join(ROOT, 'mechanical-night-pinball/public/src', p)).href;
  const phys = await import(url('physics/docdonkeys-parity.js'));
  const cfg = await import(url('config.js'));
  const geo = await import(url('physics/docdonkeys-geometry.js'));
  return { Phys: phys.DocDonkeysParityPhysics, cfg, GEOMETRY: geo.GEOMETRY };
}
export async function loadNova() {
  const phys = await import(pathToFileURL(path.join(ROOT, 'nova-pinball/public/src/physics.js')).href);
  const table = JSON.parse(fs.readFileSync(path.join(ROOT, 'nova-pinball/public/data/table.json'), 'utf8'));
  return { ...phys, table };
}

export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const len = a => Math.hypot(a.x, a.y);
export function distToPoly(p, poly) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / d2));
    best = Math.min(best, Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy)));
  }
  return best;
}
// Put a ball of radius r on the side of a polygon given by unit normal n, just touching.
export function placeTouching(poly, at, n, r, gap = 0) {
  let lo = 0, hi = 4 * r;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const d = distToPoly({ x: at.x + n.x * mid, y: at.y + n.y * mid }, poly);
    if (d < r + gap) lo = mid; else hi = mid;
  }
  return { x: at.x + n.x * hi, y: at.y + n.y * hi };
}
export function table(rows, cols) {
  const w = cols.map(c => Math.max(c.length, ...rows.map(r => String(r[c]).length)));
  const line = r => cols.map((c, i) => String(r[c]).padStart(w[i])).join('  ');
  return [line(Object.fromEntries(cols.map(c => [c, c]))), ...rows.map(line)].join('\n');
}

export function closestOnPoly(p, poly) {
  let best = null, bd = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length];
    const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / d2));
    const q = { x: a.x + t * dx, y: a.y + t * dy }, d = Math.hypot(p.x - q.x, p.y - q.y);
    if (d < bd) { bd = d; best = q; }
  }
  return best;
}
