// Experiment 2: what comes out when a ball hits a wall, and when it hits a bumper?
// Impact speeds are expressed as a fraction of v_H = sqrt(2 g H), the speed a ball
// gains falling one full table height, so that the three games (metres vs pixels,
// 1.2 m/s^2 vs 350 px/s^2) can be compared on one axis.
import fs from 'node:fs';
import { loadComet, loadMN, loadNova, distToPoly, table } from './lib.mjs';

const FR = [0.02, 0.05, 0.1, 0.25, 0.5, 1.0];
const out = { walls: {}, bumpers: {} };
const { P } = loadComet();
const MN = await loadMN();
const N = await loadNova();

const gC = Math.abs(P.constants.G), HC = P.constants.H, vHC = Math.sqrt(2 * gC * HC);
const gM = MN.cfg.PARITY.gravityPixelsPerSecond2, HM = MN.cfg.LOGICAL_HEIGHT, vHM = Math.sqrt(2 * gM * HM);
const gN = 768, HN = N.table.size.height, vHN = Math.sqrt(2 * gN * HN);
console.log(`v_H  Comet ${vHC.toFixed(2)} m/s | Mechanical Night ${vHM.toFixed(0)} px/s | Nova ${vHN.toFixed(0)} px/s`);

// ------------------------------------------------------------------ walls
function cometWall(v) {
  const { pf } = loadComet();
  const e = new P.Engine(pf);
  e.geometry.polygons = e.geometry.polygons.filter(p => p.kind === 'left-wall');
  e.geometry.circles = []; e.geometry.reactiveSlings = [];
  e.flippers.left.pivot = { x: 9, y: 9 }; e.flippers.right.pivot = { x: 9, y: 9 };
  e.ball.x = 0.04; e.ball.y = 0.7; e.ball.vx = -v; e.ball.vy = 0;
  for (let i = 0; i < 300; i++) {
    e.step(1 / 60, i * 1000 / 60, { left: false, right: false, plunge: false });
    if (e.ball.vx > 0) return e.ball.vx / v;
  }
  return 0;
}
function mnWall(v) {
  const m = new MN.Phys({});
  m.ball.x = 22; m.ball.y = 300; m.ball.vx = -v; m.ball.vy = 0;
  for (let i = 0; i < 300; i++) {
    m.update(1 / 60, { down: { left: false, right: false, launch: false } }, {}, {});
    if (m.ball.vx > 0) return m.ball.vx / v;
  }
  return 0;
}
function novaWall(v) {
  const ball = { x: 20, y: 300, vx: -v, vy: 0, r: 15 };
  const a = { x: 0, y: -5000 }, b = { x: 0, y: 5000 };
  for (let i = 0; i < 2000; i++) {
    ball.vy += 768 / 240; ball.x += ball.vx / 240; ball.y += ball.vy / 240;
    N.circleSegment(ball, a, b, 0.4);
    if (ball.vx > 0) return ball.vx / v;
  }
  return 0;
}
{
  const rows = FR.map(f => ({
    v_over_vH: f,
    comet: cometWall(f * vHC).toFixed(3),
    mech_night: mnWall(f * vHM).toFixed(3),
    nova: novaWall(f * vHN).toFixed(3),
  }));
  out.walls = rows;
  console.log('\nEFFECTIVE WALL RESTITUTION (|v_after|/|v_before|, normal component) vs impact speed\n' + table(rows, Object.keys(rows[0])));
}

// ---------------------------------------------------------------- bumpers
// Head-on case: the ball falls (or is thrown) straight onto the bumper along the
// direction of gravity, so it stays head-on. v_in is the ball speed one step before
// first contact, v_out the speed once clear of the bumper.
const speed = b => Math.hypot(b.vx, b.vy);
function cometBumper(v0, dt) {
  const pf = { bumpers: [{ id: 1, x: 0.38, y: 0.70, r: 0.03 }], slingshots: [], obstacles: [], scores: {} };
  const e = new P.Engine(pf), R = P.constants.BALL_R, contact = 0.03 + R;
  e.flippers.left.pivot = { x: 9, y: 9 }; e.flippers.right.pivot = { x: 9, y: 9 };
  e.ball.x = 0.38; e.ball.y = 0.70 + contact + 0.004; e.ball.vx = 0; e.ball.vy = -v0;
  let prev = v0, vin = null, kicked = false;
  for (let i = 0; i < 4000; i++) {
    const before = speed(e.ball);
    e.step(dt, i * dt * 1000, { left: false, right: false, plunge: false }, { onHit: () => { kicked = true; } });
    const dist = Math.hypot(e.ball.x - 0.38, e.ball.y - 0.70);
    if (vin === null && dist <= contact + 0.002 + 1.5 * before * dt) vin = before;
    if (kicked && dist > contact + 0.02) return { vin, vout: speed(e.ball) };
    prev = before;
  }
  return { vin: vin ?? v0, vout: NaN };
}
function mnBumper(v0) {
  const m = new MN.Phys({});
  const chain = MN.GEOMETRY.leftBumper.map(([x, y]) => ({ x, y }));
  const a = chain[0], b = chain[1], dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
  const n = { x: dy / L, y: -dx / L }, mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  m.ball.x = mid.x + n.x * 16; m.ball.y = mid.y + n.y * 16; m.ball.vx = -n.x * v0; m.ball.vy = -n.y * v0;
  let hit = false, vin = null;
  for (let i = 0; i < 300; i++) {
    const before = speed(m.ball);
    m.update(1 / 60, { down: { left: false, right: false, launch: false } }, {}, { onScore: () => { hit = true; vin = before; } });
    if (hit && distToPoly(m.ball, chain) > m.ball.r + 6) return { vin, vout: speed(m.ball) };
  }
  return { vin, vout: NaN };
}
function novaBumper(v0) {
  const bc = { x: 300, y: 400, r: 21.5622 }, e = Math.max(1, Math.min(4, bc.r / 10));
  const ball = { x: bc.x, y: bc.y - bc.r - 15 - 4, vx: 0, vy: v0, r: 15 };
  let hit = false, vin = null;
  for (let i = 0; i < 4000; i++) {
    const before = speed(ball);
    ball.vy += 768 / 240;
    ball.vx = Math.max(-1000, Math.min(1000, ball.vx)); ball.vy = Math.max(-1000, Math.min(1000, ball.vy));
    ball.x += ball.vx / 240; ball.y += ball.vy / 240;
    if (N.circleCircle(ball, bc.x, bc.y, bc.r, e) && !hit) { hit = true; vin = before; }
    if (hit && Math.hypot(ball.x - bc.x, ball.y - bc.y) > bc.r + ball.r + 6) return { vin, vout: speed(ball) };
  }
  return { vin, vout: NaN };
}
{
  const rows = [];
  for (const f of FR) {
    const c60 = cometBumper(f * vHC, 1 / 60), c144 = cometBumper(f * vHC, 1 / 144), c240 = cometBumper(f * vHC, 1 / 240);
    const m = mnBumper(f * vHM), n = novaBumper(f * vHN);
    rows.push({
      v0_over_vH: f,
      comet_60Hz: `${c60.vin?.toFixed(2)} -> ${c60.vout.toFixed(2)} m/s`,
      comet_144Hz: `${c144.vin?.toFixed(2)} -> ${c144.vout.toFixed(2)} m/s`,
      comet_240Hz: `${c240.vin?.toFixed(2)} -> ${c240.vout.toFixed(2)} m/s`,
      mech_night: `${m.vin?.toFixed(0)} -> ${m.vout.toFixed(0)} px/s`,
      nova: `${n.vin?.toFixed(0)} -> ${n.vout.toFixed(0)} px/s`,
    });
  }
  out.bumpers = rows;
  console.log('\nBUMPER HEAD-ON: speed in -> speed out\n' + table(rows, Object.keys(rows[0])));
}
fs.mkdirSync(new URL('./results', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./results/02-walls-and-bumpers.json', import.meta.url), JSON.stringify(out, null, 2));
