// Properties of the game logic that are stated here in words and checked on their own, apart from the comparison with the ROM (which
// is where the logic is shown to be the original's): how the title and the pad behave, the cheat, the pause, the start of a level, the
// picture unit's routines on small cases, the bands of a picture, and a long run that must never leave the numbers' ranges.
import assert from 'node:assert/strict';
import test from 'node:test';
import { LawnSession } from '../public/src/session.js';
import { LawnMowerKernel } from '../public/src/kernel.js';
import { PAD, FUEL_MAX, LEVEL_SETUP_FRAMES } from '../public/src/constants.js';
import { Ppu, PAL_BRIGHT_TABLE, PAL_FADE_IN } from '../public/src/ppu.js';
import { decodeShiruRle } from '../public/src/rle.js';
import { bandsFor, composeDisplay, FIELD_SPLIT } from '../public/src/display.js';
import { LawnRng, sourceModulo } from '../public/src/rng.js';
import { chaos } from '../tools/bots.mjs';
import { loadScreens } from '../tools/rom-oracle.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const screens = loadScreens();
const chr = new Uint8Array(readFileSync(fileURLToPath(new URL('../public/assets/patterns.chr', import.meta.url))));
const run = (session, frames, pad = 0) => { for (let i = 0; i < frames; i++) session.tick(typeof pad === 'function' ? pad(i) : pad); };
const tapStart = (session, hold = 8, gap = 8) => { run(session, hold, PAD.START); run(session, gap, 0); };

function startGame(session) {
  tapStart(session);
  let guard = 0;
  while (session.game.mode !== 'intro' && guard++ < 400) session.tick(0);
  return session;
}

test('the random generator: an 8-bit Galois register with $CF, seeded with 1, and the repeated subtraction of max', () => {
  const rng = new LawnRng(1);
  assert.deepEqual([rng.next(), rng.next(), rng.next(), rng.next(), rng.next(), rng.next(), rng.next(), rng.next()], [2, 4, 8, 16, 32, 64, 128, 0xCF]);
  assert.equal(sourceModulo(37, 14), 9);
  assert.equal(sourceModulo(255, 11), 2);
  assert.throws(() => sourceModulo(1, 0), RangeError);
  const seen = new Set();
  const loop = new LawnRng(1);
  for (let i = 0; i < 255; i++) seen.add(loop.next());
  assert.equal(seen.size, 255, 'the register visits every value but zero before it repeats');
});

test('the title: START has to go down after the pad was last read, and the exit takes 49 processed ticks', () => {
  const session = new LawnSession({ screens });
  const game = session.game;
  assert.equal(game.mode, 'title');
  const before = game.frameCount;
  run(session, 10, PAD.START);                                   // held from the first NMI: the first poll sees it go down
  assert.equal(game.titleStartCounter > 0, true, 'START started the exit');
  while (game.mode === 'title') session.tick(PAD.START);
  assert.equal(game.mode, 'setup');
  assert.equal(game.levelIndex, 0);
  const nmis = (game.frameCount - before) & 255;
  assert.ok(nmis >= 58 && nmis <= 66, `49 processed ticks and the NMIs the pacing skips: ${nmis}`);
});

test('a held START is one press: it pauses once, not again until it has been let go', () => {
  const session = startGame(new LawnSession({ screens }));
  while (session.game.mode !== 'playing') session.tick(0);
  const game = session.game;
  run(session, 20, 0);                                            // the pad is read (with START up) before it is pressed
  run(session, 10, PAD.START);                                    // down and held
  assert.equal(game.paused, true);
  run(session, 30, PAD.START);                                    // still held: no second press
  assert.equal(game.paused, true);
  run(session, 10, 0);
  run(session, 10, PAD.START);
  assert.equal(game.paused, false, 'pressed again: the game goes on');
});

test('unpausing needs START alone: START together with a direction that was just pressed is not a START', () => {
  const session = startGame(new LawnSession({ screens }));
  while (session.game.mode !== 'playing') session.tick(0);
  const game = session.game;
  run(session, 20, 0);
  run(session, 6, PAD.START); run(session, 12, 0);
  assert.equal(game.paused, true);
  run(session, 10, PAD.START | PAD.LEFT);                         // both newly pressed at the same poll
  assert.equal(game.paused, true, 'the original compares the whole byte');
  run(session, 10, 0);
  run(session, 10, PAD.START);
  assert.equal(game.paused, false);
});

test('the cheat code RIGHT, UP, LEFT, LEFT on the title switches the level skip on, in that order only', () => {
  const press = (session, button) => { run(session, 6, button); run(session, 6, 0); };
  const wrong = new LawnSession({ screens });
  for (const b of [PAD.RIGHT, PAD.UP, PAD.RIGHT, PAD.LEFT, PAD.LEFT]) press(wrong, b);
  assert.equal(wrong.game.levelSkip, false);
  const right = new LawnSession({ screens });
  for (const b of [PAD.RIGHT, PAD.UP, PAD.LEFT, PAD.LEFT]) press(right, b);
  assert.equal(right.game.levelSkip, true);
  assert.ok(right.game.drainEvents().some((e) => e.type === 'cheat-on'));
});

test('a level starts with an empty tank that fills four units per processed tick, and the mower waits 80 of them', () => {
  const session = startGame(new LawnSession({ screens }));
  const game = session.game;
  assert.equal(game.fuel, 0);
  assert.equal(game.width, 14);
  assert.equal(game.doneCount, 96);
  let ticks = 0;
  while (game.mode === 'intro') { const before = game.delay; session.tick(0); if (game.delay !== before) ticks++; }
  assert.equal(ticks, 80);
  assert.equal(game.fuel, FUEL_MAX);
  assert.equal(game.mode, 'playing');
});

test('every screen set-up keeps the display off for as many NMIs as were measured on the ROM', () => {
  assert.deepEqual([...LEVEL_SETUP_FRAMES], [10, 10, 10, 9, 9, 9, 9, 9, 9, 9]);
  const session = startGame(new LawnSession({ screens }));
  assert.equal(session.game.mode, 'intro');
});

test('the picture unit: updateTile writes a large tile as four small ones and merges its attribute bits without touching the others', () => {
  const ppu = new Ppu();
  const map = new Uint8Array(512);
  map[0] = 10;                                                    // a cut-grass tile: [0x80, 0x81, 0x90, 0x91] with attribute bits $aa
  ppu.write(0x23C0, 0x55);
  ppu.updateTile(map, 0, 0);
  assert.deepEqual([ppu.read(0x2000), ppu.read(0x2001), ppu.read(0x2020), ppu.read(0x2021)], [0x80, 0x81, 0x90, 0x91]);
  assert.equal(ppu.read(0x23C0), 0x55 & ~0x03 | 0xaa & 0x03, 'the top left quarter only');
  map[16 + 3 * 32] = 10;                                          // column 16 is in the second nametable
  ppu.updateTile(map, 16, 3);
  assert.equal(ppu.read(0x2400 + 3 * 64), 0x80);
});

test('the picture unit: numbers are two rows of tiles, and an RLE stream decodes with its tag byte', () => {
  const ppu = new Ppu();
  ppu.putNumber(0x205a, 7, 3);
  assert.deepEqual([ppu.read(0x205a), ppu.read(0x205b), ppu.read(0x205c)], [0xd0, 0xd0, 0xd7]);
  assert.deepEqual([ppu.read(0x207a), ppu.read(0x207b), ppu.read(0x207c)], [0xe0, 0xe0, 0xe7]);
  // tag 0xFF, bytes 1 2, then (tag, 3) repeats the last byte 3 times, then (tag, 0) ends
  assert.deepEqual(Array.from(decodeShiruRle(Uint8Array.from([0xFF, 1, 2, 0xFF, 3, 5, 0xFF, 0]))), [1, 2, 2, 2, 2, 5]);
});

test('the fade: four steps of brightness, taken every fourth NMI, to black and back, and the table maps white down one step per level', () => {
  const ppu = new Ppu();
  ppu.palReset();
  assert.equal(ppu.palBright, 192);
  ppu.palSetup(0, [0x0f, 0x30, 0x21, 0x11]);
  ppu.palSetFadeIn();
  assert.equal(ppu.palMode, PAL_FADE_IN);
  const seen = [];
  for (let frame = 0; frame < 20; frame++) { ppu.palUpdate(frame); if (frame % 4 === 0) seen.push(ppu.palBright); }
  assert.deepEqual(seen.slice(0, 5), [128, 64, 0, 0, 0]);
  assert.equal(ppu.palette[1], 0x30, 'at full brightness white is white');
  assert.equal(PAL_BRIGHT_TABLE[64 + 0x30], 0x20);
  assert.equal(PAL_BRIGHT_TABLE[128 + 0x30], 0x10);
  assert.equal(PAL_BRIGHT_TABLE[192 + 0x30], 0x00);
  assert.equal(PAL_BRIGHT_TABLE[64 + 0x0d], 0x0f, 'below black is black');
});

test('the picture is made of bands where the original changes the scroll, and a screen being set up is the backdrop colour', () => {
  const field = bandsFor({ kind: 'field', camX: 0x0123, chrAnim: 0x98 });
  assert.deepEqual(field[0], [0, FIELD_SPLIT, 0, 0, 0], 'the status bar does not scroll');
  assert.deepEqual(field[1], [FIELD_SPLIT + 1, 239, 0x123 & 0xff | 256, 0x1000, 0x1000], 'the lawn scrolls and uses the pattern tables the animation says');
  assert.equal(bandsFor({ kind: 'done', chrAnim: 0x80 }).length, 1);
  const session = new LawnSession({ screens });
  const first = composeDisplay(session.game, chr);
  assert.equal(first.length, 256 * 240 * 4);
  startGame(session);
  session.game.mode = 'setup';
  const black = composeDisplay(session.game, chr);
  assert.ok(black.every((v, i) => (i % 4 === 3 ? v === 255 : v === black[i % 4])), 'one colour all over');
});

test('a long run with random buttons never leaves the ranges of the original\'s variables', () => {
  const session = new LawnSession({ screens });
  const bot = chaos({ seed: 9, cheat: true });
  const game = session.game;
  for (let frame = 0; frame < 120000; frame++) {
    session.tick(bot({ frame, session }));
    game.drainEvents();
    assert.ok(game.frameCount >= 0 && game.frameCount <= 255);
    assert.ok(game.levelIndex >= 0 && game.levelIndex <= 10);
    if (game.fuel !== undefined) {
      assert.ok(game.fuel >= 0 && game.fuel <= FUEL_MAX);
      assert.ok(game.speed >= 0 && game.speed <= 255);
      assert.ok(game.playerXRaw >= 0 && game.playerXRaw <= 0xffff && game.playerYRaw >= 0 && game.playerYRaw <= 0xffff);
      assert.ok(game.doneCount >= 0 && game.doneCount <= 330);
    }
    assert.ok(game.oam.every((v) => v >= 0 && v <= 255));
  }
});

test('a kernel made without the screens still plays (they are only for the two pictures)', () => {
  const game = new LawnMowerKernel();
  for (let i = 0; i < 400 && game.mode === 'title'; i++) game.titleFlowPhysicalTick(i < 30 ? PAD.START : 0);
  assert.equal(game.mode, 'setup');
});

test('the one place the two versions differ: a mower finishing a lawn while it moves rests less than a pixel apart in the two', () => {
  // The cheat finishes the first lawn while the mower runs in one direction; 60 frames later it is at rest. The positions are in 12:4
  // fixed point, so 256 is one tile and 16 is one pixel.
  const code = [PAD.RIGHT, PAD.UP, PAD.LEFT, PAD.LEFT];
  const restingPlace = (clearsDirection, hold, moment) => {
    const session = new LawnSession({ seed: 1, checkPadClearsDirection: clearsDirection, screens });
    const game = session.game;
    let playStart = -1;
    for (let t = 0; t < 1500; t++) {
      let pad = 0;
      if (t >= 5 && t < 5 + code.length * 12 && (t - 5) % 12 < 6) pad |= code[Math.floor((t - 5) / 12)];
      if (t >= 70 && t < 80) pad |= PAD.START;
      if (playStart >= 0) pad |= hold;
      if (playStart >= 0 && t >= playStart + moment && t < playStart + moment + 2) pad |= PAD.SELECT;
      session.tick(pad);
      if (playStart < 0 && game.mode === 'playing') playStart = t + 1;
      if (playStart >= 0 && t === playStart + moment + 60) return [game.playerXRaw, game.playerYRaw];
    }
    return null;
  };
  let apart = 0, largest = 0;
  for (const hold of [PAD.LEFT, PAD.RIGHT, PAD.UP, PAD.DOWN]) {
    for (let moment = 0; moment < 150; moment++) {
      const v112 = restingPlace(false, hold, moment), v11 = restingPlace(true, hold, moment);
      assert.ok(v112 && v11, 'the lawn was finished');
      const gap = Math.max(Math.abs(v112[0] - v11[0]), Math.abs(v112[1] - v11[1]));
      if (gap) apart++;
      largest = Math.max(largest, gap);
    }
  }
  assert.ok(apart > 0, 'the switch does change where the mower rests');
  assert.equal(largest, 14, 'the largest gap, in sixteenths of a pixel');
});
