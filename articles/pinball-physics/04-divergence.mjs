// Experiment 4: sensitivity to initial conditions.
// Drop the same ball twice onto the bumpers, the second time shifted sideways by a tiny
// fraction of a ball radius, with no flipper input. How long until the two balls are a
// whole ball radius apart? (Simulations are deterministic: a repeat with shift 0 is identical.)
import fs from 'node:fs';
import { loadComet, loadMN, loadNova, table } from './lib.mjs';

const T_MAX = 40;                       // seconds of simulated time
const EPS = [1e-1, 1e-2, 1e-3, 1e-4, 1e-6, 1e-9, 1e-12];   // shift, in ball radii
const { P, pf } = loadComet();
const MN = await loadMN();
const N = await loadNova();

// Each runner returns [{t,x,y}] sampled every step, until drained or T_MAX.
function runComet(dx, x0 = 0.355) {
  const e = new P.Engine(pf);
  e.ball.x = x0 + dx; e.ball.y = 1.30; e.ball.vx = e.ball.vy = 0;
  const tr = [], dt = 1 / 60;
  for (let i = 0; i < T_MAX / dt; i++) {
    e.step(dt, i * dt * 1000, { left: false, right: false, plunge: false });
    tr.push({ t: (i + 1) * dt, x: e.ball.x, y: e.ball.y });
    if (e.drainLatched) break;
  }
  return tr;
}
function runMN(dx, x0 = 215) {
  const m = new MN.Phys({});
  m.ball.x = x0 + dx; m.ball.y = 140; m.ball.vx = m.ball.vy = 0;
  const tr = [], dt = 1 / 60;
  for (let i = 0; i < T_MAX / dt; i++) {
    m.update(dt, { down: { left: false, right: false, launch: false } }, {}, {});
    tr.push({ t: (i + 1) * dt, x: m.ball.x, y: m.ball.y });
    if (!m.ball.active) break;
  }
  return tr;
}
// Nova: walls, gates, bumpers, kickers and flippers exactly as in updateBall() of public/src/app.js.
const comps = N.table.components;
const poly = c => { const o = []; for (let i = 0; i < c.vertices.length; i += 2) o.push({ x: c.vertices[i] + c.x, y: c.vertices[i + 1] + c.y }); return o; };
const segs = p => { const r = []; for (let i = 0; i < p.length - 1; i++) r.push([p[i], p[i + 1]]); return r; };
const walls = comps.filter(c => c.type === 'wall').map(c => ({ ...c, poly: poly(c) }));
const gates = comps.filter(c => c.type === 'gate').map(c => ({ ...c, poly: poly(c) }));
const bumpers = comps.filter(c => c.type === 'bumper');
const kickers = comps.filter(c => c.type === 'kicker').map(c => ({ ...c, poly: poly(c) }));
const flippers = comps.filter(c => c.type === 'flipper').map(c => {
  const rest = (c.orientation === 'left' ? 30 : -30) * Math.PI / 180;
  return { ...c, angle: rest, omega: 0 };
});
function chain(ball, p, e, surface, action) {
  for (const [a, b] of segs(p)) {
    if (action === 'left' && ball.vx < 0) continue;
    if (action === 'right' && ball.vx > 0) continue;
    N.circleSegment(ball, a, b, e, surface);
  }
}
function runNova(dx, x0 = 330) {
  const ball = { x: x0 + dx, y: 60, vx: 0, vy: 0, r: 15 }, dt = 1 / 240, clamp = N.clamp;
  const tr = [];
  for (let i = 0; i < T_MAX / dt; i++) {
    ball.vy += 768 * dt;
    ball.vx = clamp(ball.vx, -1000, 1000); ball.vy = clamp(ball.vy, -1000, 1000);
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    for (const w of walls) chain(ball, w.poly, 0.4, { x: 0, y: 0 });
    for (const g of gates) chain(ball, g.poly, 0.25, { x: 0, y: 0 }, g.action);
    for (const b of bumpers) N.circleCircle(ball, b.x, b.y, b.r, clamp(b.r / 10, 1, 4));
    for (const k of kickers) chain(ball, k.poly, 4, { x: 0, y: 0 });
    for (const f of flippers) {
      const tf = N.transformedFlipper(f, f.angle), vv = [...tf.verts, tf.verts[0]];
      for (let k = 0; k < vv.length - 1; k++) {
        const a = vv[k], b = vv[k + 1], q = N.closestOnSegment(ball.x, ball.y, a.x, a.y, b.x, b.y);
        N.circleSegment(ball, a, b, 0.05, { x: 0, y: 0 });
      }
    }
    if (i % 4 === 3) tr.push({ t: (i + 1) * dt, x: ball.x, y: ball.y });     // sample at 60 Hz
    if (ball.y > N.table.size.y2 + 200) break;
  }
  return tr;
}

const games = [
  { name: 'comet', run: runComet, R: P.constants.BALL_R, starts: [0.30, 0.315, 0.33, 0.345, 0.36, 0.375, 0.39, 0.405, 0.42] },
  { name: 'mech_night', run: runMN, R: 9, starts: [130, 150, 170, 190, 210, 230, 250, 270, 290] },
  { name: 'nova', run: runNova, R: 15, starts: [300, 307, 314, 321, 328, 335, 342, 349, 356] },
];
const median = a => { const b = [...a].sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };
const rows = [], saved = {}, slopes = [];
for (const g of games) {
  const bases = g.starts.map(x0 => g.run(0, x0));
  const lifetimes = bases.map(b => b[b.length - 1].t);
  console.log(g.name + ': ball lifetimes (s) ' + lifetimes.map(t => t.toFixed(1)).join(' '));
  saved[g.name] = { R: g.R, starts: g.starts, base0: bases[0] };
  const perEps = {};
  for (const eps of EPS) {
    const ts = g.starts.map((x0, k) => {
      const base = bases[k], alt = g.run(eps * g.R, x0), n = Math.min(base.length, alt.length);
      for (let i = 0; i < n; i++) if (Math.hypot(base[i].x - alt[i].x, base[i].y - alt[i].y) > g.R) return base[i].t;
      return null;                      // never separated before one of the balls drained
    });
    const got = ts.filter(t => t !== null);
    perEps[eps] = got;
    rows.push({ game: g.name, shift_in_ball_radii: eps, diverged: got.length + '/' + ts.length, median_seconds: got.length ? median(got).toFixed(2) : '-' });
    if (eps === 1e-6 && g.name === 'comet') saved.comet.alt0 = g.run(eps * g.R, g.starts[0]);
  }
  // seconds gained per factor-10 reduction of the initial shift (least squares on the medians)
  const pts = EPS.filter(e => perEps[e].length >= 6 && e <= 1e-1).map(e => [Math.log10(e), median(perEps[e])]);
  if (pts.length >= 3) {
    const n = pts.length, sx = pts.reduce((a, p) => a + p[0], 0), sy = pts.reduce((a, p) => a + p[1], 0);
    const sxy = pts.reduce((a, p) => a + p[0] * p[1], 0), sxx = pts.reduce((a, p) => a + p[0] * p[0], 0);
    slopes.push({ game: g.name, seconds_per_decade: (-(n * sxy - sx * sy) / (n * sxx - sx * sx)).toFixed(2), points_used: n });
  }
}
console.log('\n' + table(rows, ['game', 'shift_in_ball_radii', 'diverged', 'median_seconds']));
console.log('\nExtra seconds before the paths separate for every factor 10 smaller in the initial error:\n' + table(slopes, ['game', 'seconds_per_decade', 'points_used']));
fs.mkdirSync(new URL('./results', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./results/04-divergence.json', import.meta.url), JSON.stringify({ rows, slopes, trajectories: saved }));
