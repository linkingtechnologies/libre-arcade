// The rules that the oracle compares with the ROM (tests/rom-oracle.test.mjs replays what the ROM did), written out as small cases: the program's
// pause, and its front end (the title screen's hidden code, the sound test, the choice of the level).
import assert from 'node:assert/strict';
import test from 'node:test';
import { BUTTON, PadPoll } from '../public/src/input.js';
import { Frontend, LEVELS_ALL, TEST_CODE, TRANSITION_PASSES, stepCode, stepLevelSelect, stepSoundTest } from '../public/src/frontend.js';
import { Rng8 } from '../public/src/rng.js';
import { Simulation } from '../public/src/simulation.js';
import { makeDay1Stage } from '../public/web/stage-day1.js';

const { A, B, SELECT, START, UP, DOWN, LEFT, RIGHT } = BUTTON;

test('a read of the pad gives the buttons that are down now and were not down at the previous read', () => {
  const pad = new PadPoll();
  assert.equal(pad.poll(A), A);
  assert.equal(pad.poll(A | B), B);
  assert.equal(pad.poll(A | B), 0);
  assert.equal(pad.poll(0), 0);
  assert.equal(pad.poll(A), A);
  assert.equal(new PadPoll(START).poll(START), 0, 'a button that was down at the read before the first is not a press');
});

test('the title screen\'s code is B A B A LEFT UP B A, one new button at a time, and any other press starts it again', () => {
  assert.deepEqual([...TEST_CODE], [B, A, B, A, LEFT, UP, B, A]);
  let index = 0, entered = false;
  for (const button of TEST_CODE) ({ index, entered } = stepCode(index, button));
  assert.equal(index, 255);
  assert.equal(entered, true);
  assert.deepEqual(stepCode(255, B), { index: 255, entered: false }, 'once entered it stays entered');
  assert.equal(stepCode(3, B | SELECT).index, 0, 'two buttons at once are not the next one');
  assert.equal(stepCode(3, B).index, 0, 'the wrong button');
  assert.equal(stepCode(0, B).index, 1);
  assert.equal(stepCode(5, 0).index, 5, 'a pass in which nothing was pressed changes nothing');
  assert.equal(stepCode(2, B).index, 3);
  assert.equal(stepCode(2, A).index, 0);
});

test('the choice of the level: LEFT and RIGHT between 0 and 8, and START, A or B go on', () => {
  assert.deepEqual(stepLevelSelect(0, LEFT), { level: 0, done: false });
  assert.deepEqual(stepLevelSelect(0, RIGHT), { level: 1, done: false });
  assert.deepEqual(stepLevelSelect(7, RIGHT), { level: LEVELS_ALL, done: false });
  assert.deepEqual(stepLevelSelect(LEVELS_ALL, RIGHT), { level: LEVELS_ALL, done: false });
  assert.deepEqual(stepLevelSelect(3, LEFT | RIGHT), { level: 3, done: false }, 'both in one pass is one of each');
  assert.deepEqual(stepLevelSelect(3, LEFT | RIGHT).level, 3);
  assert.deepEqual(stepLevelSelect(0, LEFT | RIGHT), { level: 1, done: false });
  for (const button of [START, A, B]) assert.deepEqual(stepLevelSelect(5, button | RIGHT), { level: 5, done: true }, 'leaving comes before the direction');
});

test('the sound test: LEFT and RIGHT choose the column, UP and DOWN the number, B plays, A stops the tune, START leaves', () => {
  const test = { column: 0, effect: 0, tune: 0 };
  assert.deepEqual(stepSoundTest(test, DOWN), []);
  assert.equal(test.effect, 0, 'not below 0');
  for (let n = 0; n < 30; n++) stepSoundTest(test, UP);
  assert.equal(test.effect, 20, 'not above 20');
  assert.deepEqual(stepSoundTest(test, B), [{ type: 'EFFECT', number: 20 }]);
  assert.deepEqual(stepSoundTest(test, RIGHT), []);
  assert.equal(test.column, 1);
  for (let n = 0; n < 30; n++) stepSoundTest(test, UP);
  assert.equal(test.tune, 6, 'not above 6');
  assert.deepEqual(stepSoundTest(test, B), [{ type: 'TUNE', number: 6 }]);
  assert.deepEqual(stepSoundTest(test, A), [{ type: 'TUNE_STOP' }]);
  assert.deepEqual(stepSoundTest(test, LEFT | A | B), [{ type: 'TUNE_STOP' }, { type: 'EFFECT', number: 20 }]);
  assert.deepEqual(stepSoundTest(test, START | UP), [{ type: 'LEAVE' }]);
  const page = { column: 0, effect: 0, tune: 0 };
  stepSoundTest(page, RIGHT, { effects: 16, tunes: 0 });
  assert.equal(page.column, 0, 'with no tunes there is no second column');
});

// A front end run with the buttons for each pass; returns what each pass did and the model at the end.
function run(frontend, passes) {
  const events = [];
  for (const buttons of passes) events.push(...frontend.tick(buttons));
  return events;
}
const tap = (button) => [button, 0];
const code = TEST_CODE.flatMap(tap);

test('the title screen takes two random numbers in each pass but the one that START ends', () => {
  const frontend = new Frontend();
  const reference = new Rng8(1);
  run(frontend, [0, 0, 0]);
  for (let n = 0; n < 3; n++) reference.rand16();
  assert.equal(frontend.rng.state, reference.state);
  assert.deepEqual(run(frontend, [START]), [{ type: 'START' }]);
  assert.equal(frontend.rng.state, reference.state, 'the pass of START does not take them');
  assert.equal(frontend.phase, 'transition');
});

test('the front end goes through its screens in the program\'s number of passes, and the code makes it ask for the level', () => {
  const plain = new Frontend();
  run(plain, [0, START]);
  let passes = 0;
  while (!plain.done) { plain.tick(0); passes++; }
  assert.equal(passes, TRANSITION_PASSES + 1 + 150 + 1, 'the wait, the screen cleared, the number shown, the screen cleared');

  const frontend = new Frontend();
  const events = run(frontend, [...code, START, ...Array(TRANSITION_PASSES + 1).fill(0)]);
  assert.deepEqual(events.map((e) => e.type), ['CODE', 'START']);
  assert.equal(frontend.testMode, true);
  assert.equal(frontend.phase, 'level');
  run(frontend, [...tap(RIGHT), ...tap(RIGHT), ...tap(LEFT), ...tap(RIGHT)]);
  assert.equal(frontend.level, 2);
  run(frontend, [B]);
  assert.equal(frontend.phase, 'shown');
  assert.equal(frontend.level, 2);
});

test('the sound test opens if A, B, SELECT and START were all down at the pass in which START was pressed, and not otherwise', () => {
  const three = A | B | SELECT;
  const open = new Frontend();
  run(open, [three, three, three | START, ...Array(TRANSITION_PASSES).fill(0)]);
  assert.equal(open.phase, 'sound');

  const together = new Frontend();
  run(together, [0, three | START, ...Array(TRANSITION_PASSES).fill(0)]);
  assert.equal(together.phase, 'sound', 'all four newly pressed in the same pass');

  const missing = new Frontend();
  run(missing, [A | B, A | B | START, ...Array(TRANSITION_PASSES).fill(0)]);
  assert.notEqual(missing.phase, 'sound');

  const late = new Frontend();
  run(late, [START, ...Array(TRANSITION_PASSES - 1).fill(0), three | START]);
  assert.notEqual(late.phase, 'sound', 'the four buttons down at the end of the wait are not read: the program does not read the pad then');

  const leaving = new Frontend();
  run(leaving, [three | START, ...Array(TRANSITION_PASSES).fill(0), 0, START]);
  assert.notEqual(leaving.phase, 'sound');
  assert.equal(leaving.phase, 'change');
});

// ---- the program's pause -------------------------------------------------------------------------------------------------------------

function stage() { return new Simulation(makeDay1Stage(), { seed: 7 }); }
const pauseOf = (sim, buttons) => { sim.tick(buttons); return sim.pause; };

test('START pauses the game: the pass does nothing else, the pause counts down from 50 to 25 and waits there', () => {
  const sim = stage();
  sim.tick(0);
  const frame = sim.frameCnt, tick = sim.player.xFp;
  const events = sim.tick(START);
  assert.deepEqual(events.map((e) => e.type), ['PAUSE']);
  assert.equal(sim.pause, 50);
  assert.equal(sim.frameCnt, frame + 1, 'the pass that reads START has counted its frame');
  assert.equal(sim.player.xFp, tick, '...and moved nothing');
  const seen = [];
  for (let n = 0; n < 30; n++) { sim.tick(RIGHT); seen.push(sim.pause); }
  assert.deepEqual(seen.slice(0, 25), Array.from({ length: 25 }, (_, n) => 49 - n), 'from 49 down to 25');
  assert.ok(seen.slice(24).every((p) => p === 25), 'and it waits at 25');
  assert.equal(sim.frameCnt, frame + 1, 'no frame is counted while it is paused');
  assert.equal(sim.player.xFp, tick, 'and the pad does nothing');
});

test('START ends the pause only after it has been let go (a read of the pad that was already down is not a press), then it is 24 passes before START does anything', () => {
  const sim = stage();
  sim.tick(0); sim.tick(START);
  for (let n = 0; n < 30; n++) sim.tick(START);                  // held through the whole pause
  assert.equal(sim.pause, 25, 'a START that is still down does not end it');
  sim.tick(0);
  assert.equal(sim.pause, 25);
  const events = sim.tick(START);
  assert.equal(sim.pause, 25, 'the read of the pad at the top of the loop sees what the pass before it left');
  assert.deepEqual(events, []);
  sim.tick(START);
  assert.equal(sim.pause, 24, 'ended: the next iteration runs at once');
  const frame = sim.frameCnt;
  sim.tick(START);
  assert.equal(sim.frameCnt, frame + 1, 'the game is running');
  assert.equal(sim.pause, 23);
  for (let n = 0; n < 22; n++) assert.ok(pauseOf(sim, n % 2 ? START : 0) < 24, 'START does nothing in these passes');
  assert.equal(sim.pause, 1);
  assert.equal(pauseOf(sim, 0), 0);
  assert.equal(pauseOf(sim, 0), 0);
  assert.equal(pauseOf(sim, START), 50, 'START pauses again once the 24 passes are over');
});

test('a START pressed while the game is not paused but in the 24 passes after a pause does not pause it', () => {
  const sim = stage();
  sim.tick(0); sim.tick(START);
  for (let n = 0; n < 30; n++) sim.tick(0);
  sim.tick(START); sim.tick(START);                              // ended
  assert.equal(sim.pause, 24);
  for (let n = 0; n < 11; n++) { sim.tick(0); sim.tick(START); assert.ok(sim.pause < 24 && sim.pause > 0, `pause ${sim.pause}`); }
});

test('a START that is still down when a stage begins is not a press', () => {
  const sim = new Simulation(makeDay1Stage(), { seed: 7, padPolled: START });
  sim.tick(START);
  assert.equal(sim.pause, 0);
  const fresh = new Simulation(makeDay1Stage(), { seed: 7 });
  fresh.tick(START);
  assert.equal(fresh.pause, 50);
});
