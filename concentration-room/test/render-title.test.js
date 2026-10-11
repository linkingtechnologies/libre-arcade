// The title screen, as the port draws it and as the original ROM does: the ROM is run from reset to its menu, the picture it would
// show is composed (tools/nes-frame.mjs) and compared pixel by pixel with the port's title renderer (run in Node over tools/canvas-shim.mjs).
// Two things differ on purpose: the original's notice at the foot of the screen ("room lite 0.02, copyright, press Select for details"),
// which the port covers with white (provenance is in the Credits instead), and the ink, which the port draws from the atlas in pure black where
// the console shows colour $0F (5, 5, 5): a tolerance of 6 per channel.
import assert from 'node:assert/strict';
import { loadRom } from '../tools/rom-oracle.mjs';
import { NesMachine } from '../tools/nes-machine.mjs';
import { renderFrame } from '../tools/nes-frame.mjs';
import { SoftCanvas, installBrowserShims } from '../tools/canvas-shim.mjs';
import { KEY } from '../public/src/input.js';

installBrowserShims();
const { TitleRenderer } = await import('../public/src/title-renderer.js');
const { TitleFlow } = await import('../public/src/title-flow.js');

const labels = {
  main: ['1 Player Story', '1 Player Solitaire', '2 Players', 'Vs. CPU'],
  difficulty: ['Preschool', 'Elementary', 'Junior High', 'High School', 'Lab Technician'],
  backHint: '',
};

const machine = new NesMachine(loadRom());
const run = (frames) => { for (let i = 0; i < frames; i++) machine.frame(); };
const tap = (key) => { machine.pad[0] = key; run(2); machine.pad[0] = 0; run(12); };

function differences(flow) {
  const canvas = new SoftCanvas();
  new TitleRenderer(canvas).render(flow, labels);
  const rom = renderFrame(machine).rgba;
  const where = [];
  for (let y = 0; y < 240; y++) {
    if (y >= 176 && y < 224) continue;                       // the notice the port covers
    for (let x = 0; x < 256; x++) {
      const o = (y * 256 + x) * 4;
      if ([0, 1, 2].some((k) => Math.abs(rom[o + k] - canvas.data[o + k]) > 6)) where.push([x, y]);
    }
  }
  return where;
}

run(400);                                                    // the title menu, with the arrow on each of its four lines
const flow = new TitleFlow();
for (let line = 0; line < 4; line++) {
  assert.deepEqual(differences(flow).slice(0, 5), [], `the main menu with the arrow on line ${line} differs from the ROM`);
  if (line < 3) { tap(KEY.DOWN); flow.move(1); }
}
tap(KEY.A); run(60); flow.activate();                        // Vs. CPU: the difficulty menu, with the arrow on each of its five lines
for (let line = 0; line < 5; line++) {
  assert.deepEqual(differences(flow).slice(0, 5), [], `the difficulty menu with the arrow on line ${line} differs from the ROM`);
  if (line < 4) { tap(KEY.DOWN); flow.move(1); }
}

console.log('All Concentration Room title-screen render checks passed (both menus, with the arrow on every line, match the ROM).');
