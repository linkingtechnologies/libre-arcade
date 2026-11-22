// Experiment 0: put the three tables on one scale (everything in ball radii and seconds).
import fs from 'node:fs';
import { loadComet, loadMN, loadNova, table, sub, len } from './lib.mjs';

const { P } = loadComet();
const MN = await loadMN();
const N = await loadNova();

const m = new MN.Phys({});
const piv = m.flippers.left.pivot, vv = m.flipperVertices('left');
const mnL = Math.max(...vv.map(p => len(sub(p, piv))));
const novaFlipper = N.table.components.find(c => c.type === 'flipper');

const games = [
  { game: 'comet', R: P.constants.BALL_R, unit: 'm', g: Math.abs(P.constants.G), H: P.constants.H, L: 0.11, omega: 50, dt: '1/60 (frame time)' },
  { game: 'mech_night', R: 9, unit: 'px', g: MN.cfg.PARITY.gravityPixelsPerSecond2, H: MN.cfg.LOGICAL_HEIGHT, L: mnL, omega: 25, dt: '1/60, 4 substeps' },
  { game: 'nova', R: 15, unit: 'px', g: 768, H: N.table.size.height, L: novaFlipper.w, omega: 13.5, dt: '1/240' },
];
const rows = games.map(x => {
  const vH = Math.sqrt(2 * x.g * x.H);
  return {
    game: x.game,
    table_height_in_radii: Math.round(x.H / x.R),
    gravity_radii_per_s2: +(x.g / x.R).toFixed(1),
    fall_time_s: +Math.sqrt(2 * x.H / x.g).toFixed(2),
    flipper_len_in_radii: +(x.L / x.R).toFixed(1),
    flipper_omega_rad_s: x.omega,
    tip_speed_over_vH: +(x.omega * x.L / vH).toFixed(2),
    timestep: x.dt,
  };
});
console.log(table(rows, Object.keys(rows[0])));
console.log('\nv_H = sqrt(2 g H): the speed gained falling one table height. A tip speed above v_H could, in principle, throw a ball the whole way up.');
fs.mkdirSync(new URL('./results', import.meta.url), { recursive: true });
fs.writeFileSync(new URL('./results/00-scales.json', import.meta.url), JSON.stringify(rows, null, 2));
