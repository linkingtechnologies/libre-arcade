// Experiment 1: a ball at rest on a resting flipper, flipper fires.
// How fast does the ball leave, as a function of where along the flipper it sits?
//
// For each game the ball is placed touching the upper edge of the resting flipper at a
// given fraction of its length, with zero velocity, then the flip key is pressed.
// We record the ball's velocity at the first step where it is clear of the flipper
// (centre more than 1.5 radii from the polygon). "Rise" is the height the ball would
// climb in free flight with that vertical velocity, ignoring every other obstacle,
// expressed in table heights.
import fs from 'node:fs';
import { loadComet, loadMN, loadNova, placeTouching, distToPoly, closestOnPoly, table, sub, len } from './lib.mjs';

const FRACS = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9];
const out = {};

// A game adapter: build(frac) -> { r, press(), poly(), pivot(), ball, omega() , g, H, up(vy) }
function run(adapter, cmdOmega, unit) {
  const rows = [];
  for (const fr of FRACS) {
    const s = adapter.build(fr);
    const q = closestOnPoly(s.ball, s.poly());
    const rc = len(sub(q, s.pivot()));
    let res = null;
    for (let i = 0; i < 600 && !res; i++) {
      s.press();
      if (distToPoly(s.ball, s.poly()) > 1.5 * s.r) res = { vx: s.ball.vx, vy: s.ball.vy, w: s.omega() };
    }
    res ??= { vx: s.ball.vx, vy: s.ball.vy, w: s.omega() };
    const v = Math.hypot(res.vx, res.vy), up = s.up(res.vy);
    rows.push({
      along: fr,
      r_contact: +(rc * unit.k).toFixed(unit.d),
      surface_speed: +(cmdOmega * rc * unit.k).toFixed(unit.d),
      v_out: +(v * unit.k).toFixed(unit.d),
      angle_deg: Math.round(Math.atan2(up, Math.abs(res.vx)) * 180 / Math.PI),
      omega_at_release: +res.w.toFixed(1),
      rise_in_table_heights: +((up > 0 ? up * up / (2 * s.g) : 0) / s.H).toFixed(2),
    });
  }
  return rows;
}

// ---- Comet (SI units, y up) ----
const { P, pf } = loadComet();
out.comet = run({
  build(fr) {
    const e = new P.Engine(pf), f = e.flippers.left, L = 0.11, R = P.constants.BALL_R;
    const poly = P.flipperWorldShape(f).poly, o = P.flipperOrigin(f), a = f.bodyAngle;
    const at = { x: o.x + Math.cos(a) * L * fr, y: o.y + Math.sin(a) * L * fr };
    const pos = placeTouching(poly, at, { x: -Math.sin(a), y: Math.cos(a) }, R, 1e-5);
    e.ball.x = pos.x; e.ball.y = pos.y; e.ball.vx = e.ball.vy = 0;
    let n = 0;
    return {
      r: R, ball: e.ball, g: Math.abs(P.constants.G), H: P.constants.H, up: vy => vy,
      press: () => e.step(1 / 60, (n++) * 1000 / 60, { left: true, right: false, plunge: false }),
      poly: () => P.flipperWorldShape(e.flippers.left).poly,
      pivot: () => e.flippers.left.pivot, omega: () => e.flippers.left.omega,
    };
  },
}, 50, { k: 1000, d: 0 });
console.log('\nCOMET  (commanded omega 50 rad/s; lengths in mm, speeds in mm/s; g_eff 1.196 m/s^2; H 1.4 m)\n' + table(out.comet, Object.keys(out.comet[0])));

// ---- Mechanical Night (px, y down) ----
const MN = await loadMN();
for (const profile of ['docdonkeys', 'flash-enhanced']) {
  out['mn_' + profile] = run({
    build(fr) {
      const m = new MN.Phys({ flipperProfile: profile });
      const piv = m.flippers.left.pivot, poly0 = m.flipperVertices('left');
      const tip = poly0.reduce((b, p) => len(sub(p, piv)) > len(sub(b, piv)) ? p : b);
      const L = len(sub(tip, piv)), u = { x: (tip.x - piv.x) / L, y: (tip.y - piv.y) / L };
      let nrm = { x: -u.y, y: u.x }; if (nrm.y > 0) nrm = { x: -nrm.x, y: -nrm.y };
      const pos = placeTouching(poly0, { x: piv.x + u.x * L * fr, y: piv.y + u.y * L * fr }, nrm, m.ball.r, 0.02);
      m.ball.x = pos.x; m.ball.y = pos.y; m.ball.vx = m.ball.vy = 0;
      return {
        r: m.ball.r, ball: m.ball, g: MN.cfg.PARITY.gravityPixelsPerSecond2, H: MN.cfg.LOGICAL_HEIGHT, up: vy => -vy,
        press: () => m.update(1 / 60, { down: { left: true, right: false, launch: false } }, {}, {}),
        poly: () => m.flipperVertices('left'), pivot: () => m.flippers.left.pivot,
        omega: () => Math.abs(m.flippers.left.omega),
      };
    },
  }, 25, { k: 1, d: 0 });
  console.log(`\nMECHANICAL NIGHT [${profile}]  (commanded omega 25 rad/s; px and px/s; g 350 px/s^2; H 822 px)\n` + table(out['mn_' + profile], Object.keys(out['mn_' + profile][0])));
}

// ---- Nova (px, y down): updateFlippers / collideFlipper / updateBall copied from public/src/app.js ----
const N = await loadNova();
const def = N.table.components.find(c => c.type === 'flipper' && c.orientation === 'left');
out.nova = run({
  build(fr) {
    const clamp = N.clamp, dt = 1 / 240, g = 768, rest = 30 * Math.PI / 180, active = -5 * Math.PI / 180;
    const f = { ...def, angle: rest, omega: 0 };
    const { pivot, verts } = N.transformedFlipper(f, f.angle);
    const tip = verts.reduce((b, p) => len(sub(p, pivot)) > len(sub(b, pivot)) ? p : b);
    const L = len(sub(tip, pivot)), u = { x: (tip.x - pivot.x) / L, y: (tip.y - pivot.y) / L };
    let nrm = { x: -u.y, y: u.x }; if (nrm.y > 0) nrm = { x: -nrm.x, y: -nrm.y };
    const pos = placeTouching(verts, { x: pivot.x + u.x * L * fr, y: pivot.y + u.y * L * fr }, nrm, 15, 0.02);
    const ball = { x: pos.x, y: pos.y, vx: 0, vy: 0, r: 15 };
    return {
      r: 15, ball, g, H: N.table.size.height, up: vy => -vy,
      press() {
        const desired = clamp((active - f.angle) * 45, -13.5, 13.5);
        f.omega += (desired - f.omega) * Math.min(1, dt * 45);
        const prev = f.angle; f.angle += f.omega * dt;
        if ((active - prev) * (active - f.angle) <= 0) { f.angle = active; f.omega = 0; }
        ball.vy += g * dt;
        ball.vx = clamp(ball.vx, -1000, 1000); ball.vy = clamp(ball.vy, -1000, 1000);
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        const tf = N.transformedFlipper(f, f.angle), vv = [...tf.verts, tf.verts[0]];
        for (let k = 0; k < vv.length - 1; k++) {
          const a = vv[k], b = vv[k + 1], q = N.closestOnSegment(ball.x, ball.y, a.x, a.y, b.x, b.y);
          N.circleSegment(ball, a, b, 0.05, { x: -f.omega * (q.y - tf.pivot.y), y: f.omega * (q.x - tf.pivot.x) });
        }
      },
      poly: () => N.transformedFlipper(f, f.angle).verts,
      pivot: () => N.transformedFlipper(f, f.angle).pivot, omega: () => Math.abs(f.omega),
    };
  },
}, 13.5, { k: 1, d: 0 });
console.log(`\nNOVA  (omega capped at 13.5 rad/s; ball speed clamp 1000 px/s; g 768 px/s^2; H ${N.table.size.height} px)\n` + table(out.nova, Object.keys(out.nova[0])));

fs.mkdirSync(new URL('./results', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./results/01-flipper-shot.json', import.meta.url), JSON.stringify(out, null, 2));
