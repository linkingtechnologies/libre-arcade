// Experiment 3: how fast can a ball go before it passes through a wall?
// The ball is fired straight at a wall in each game's own engine at 1, 2, 3 ... times
// v_H (the speed gained falling a whole table height). "T" = it ended up on the far side.
import fs from 'node:fs';
import { loadComet, loadMN, loadNova, table } from './lib.mjs';

const MULT = [1, 2, 3, 5, 8, 12, 20, 40, 80];
const { P } = loadComet();
const MN = await loadMN();
const N = await loadNova();
const vHC = Math.sqrt(2 * Math.abs(P.constants.G) * P.constants.H);
const vHM = Math.sqrt(2 * MN.cfg.PARITY.gravityPixelsPerSecond2 * MN.cfg.LOGICAL_HEIGHT);
const vHN = Math.sqrt(2 * 768 * N.table.size.height);

function comet(v, dt) {
  const { pf } = loadComet();
  const e = new P.Engine(pf);
  e.geometry.polygons = e.geometry.polygons.filter(p => p.kind === 'left-wall');
  e.geometry.circles = []; e.geometry.reactiveSlings = [];
  e.flippers.left.pivot = { x: 9, y: 9 }; e.flippers.right.pivot = { x: 9, y: 9 };
  e.ball.x = 0.1; e.ball.y = 0.7; e.ball.vx = -v; e.ball.vy = 0;
  for (let i = 0; i < 60; i++) {
    e.step(dt, i * dt * 1000, { left: false, right: false, plunge: false });
    if (e.ball.x < 0) return true;
    if (e.ball.vx > 0) return false;
  }
  return false;
}
function mn(v) {
  const m = new MN.Phys({});
  m.ball.x = 100; m.ball.y = 300; m.ball.vx = -v; m.ball.vy = 0;
  for (let i = 0; i < 60; i++) {
    m.update(1 / 60, { down: { left: false, right: false, launch: false } }, {}, {});
    if (m.ball.x < 3) return true;
    if (m.ball.vx > 0) return false;
  }
  return false;
}
function nova(v, clampOn) {
  const ball = { x: 100, y: 300, vx: -v, vy: 0, r: 15 };
  const a = { x: 0, y: -5000 }, b = { x: 0, y: 5000 };
  for (let i = 0; i < 4000; i++) {
    ball.vy += 768 / 240;
    if (clampOn) { ball.vx = Math.max(-1000, Math.min(1000, ball.vx)); ball.vy = Math.max(-1000, Math.min(1000, ball.vy)); }
    ball.x += ball.vx / 240; ball.y += ball.vy / 240;
    N.circleSegment(ball, a, b, 0.4);
    if (ball.x < 0) return true;
    if (ball.vx > 0) return false;
  }
  return false;
}
const mark = b => (b ? 'TUNNELS' : 'ok');
const rows = MULT.map(k => ({
  v_over_vH: k,
  comet_60Hz: `${(k * vHC).toFixed(1)} m/s ${mark(comet(k * vHC, 1 / 60))}`,
  comet_240Hz: `${mark(comet(k * vHC, 1 / 240))}`,
  mech_night: `${(k * vHM).toFixed(0)} px/s ${mark(mn(k * vHM))}`,
  nova_with_clamp: `${(k * vHN).toFixed(0)} px/s ${mark(nova(k * vHN, true))}`,
  nova_no_clamp: mark(nova(k * vHN, false)),
}));
console.log(`v_H  Comet ${vHC.toFixed(2)} m/s | Mechanical Night ${vHM.toFixed(0)} px/s | Nova ${vHN.toFixed(0)} px/s`);
console.log('\nFIRING A BALL AT A WALL\n' + table(rows, Object.keys(rows[0])));
fs.mkdirSync(new URL('./results', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./results/03-tunnelling.json', import.meta.url), JSON.stringify(rows, null, 2));
