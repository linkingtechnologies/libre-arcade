import assert from 'node:assert/strict';
import { ArtificialIdiocy, AI_STATE } from '../public/src/ai.js';
import { CroomPRNG } from '../public/src/prng.js';
import { faceDownValue, FIELD_SIZE } from '../public/src/layouts.js';
import { FrameGame, NTSC, PLAY_STATE } from '../public/src/state-machine.js';
import { MODE } from '../public/src/rules.js';
import { STORY_STAGES, storyOutcome, storyScene, storyStageConfig } from '../public/src/story.js';

function boardWithPairs() {
  const b = new Uint8Array(FIELD_SIZE);
  b[0] = faceDownValue(0x1c); b[1] = faceDownValue(0x1c);
  b[8] = faceDownValue(0x1d); b[9] = faceDownValue(0x1d);
  b[16] = faceDownValue(0x1e); b[17] = faceDownValue(0x1e);
  return b;
}

function finishFlip(g) {
  g.tick(NTSC.flipFrames);
  g.tick(1);
}

// AI START -> FORGET consumes exactly noiseLevel forget frames.
{
  const remember = new Uint8Array(FIELD_SIZE); remember.fill(1);
  const ai = new ArtificialIdiocy({ noiseLevel: 3, rememberState: remember });
  const p = new CroomPRNG();
  const board = boardWithPairs();
  let d = ai.tick({ board, selected: [-1, -1], curTurn: 1, prng: p });
  assert.equal(d.action, 'start');
  assert.equal(ai.state, AI_STATE.FORGET);
  assert.equal(ai.timer, 3);
  for (let expected = 2; expected >= 0; expected -= 1) {
    d = ai.tick({ board, selected: [-1, -1], curTurn: 1, prng: p });
    assert.equal(d.action, 'forget');
    assert.equal(ai.timer, expected);
  }
}

// A fully remembered pair is deliberately exploited. After the first card,
// the original waits 30 whole STILL frames and selects on the following one.
{
  const p = new CroomPRNG();
  const g = new FrameGame({ board: boardWithPairs(), mode: MODE.VS_CPU, prng: p, aiNoiseLevel: 0 });
  g.curTurn = 1;
  g.rememberState[0] = 1;
  g.rememberState[1] = 1;

  g.tick(1); // START -> FORGET(0)
  assert.equal(g.state, PLAY_STATE.STILL);
  g.tick(1); // fall through FIND_KNOWN_PAIR and select lower member
  assert.equal(g.state, PLAY_STATE.FLIPPING);
  assert.equal(g.selected[0], 0);
  finishFlip(g);
  assert.equal(g.state, PLAY_STATE.STILL);
  assert.equal(g.selected[1], 0);
  assert.equal(g.ai.state, AI_STATE.FIND_MATCH_FOR);
  assert.equal(g.ai.timer, 30);

  g.tick(30);
  assert.equal(g.state, PLAY_STATE.STILL);
  assert.equal(g.ai.timer, 0);
  g.tick(1);
  assert.equal(g.state, PLAY_STATE.FLIPPING);
  assert.equal(g.selected[0], 1);
}

// CPU observes cards flipped by the human because rememberState is shared
// with the game state, just as in memorygame.s/aidiocy.s.
{
  const p = new CroomPRNG();
  const g = new FrameGame({ board: boardWithPairs(), mode: MODE.VS_CPU, prng: p, aiNoiseLevel: 0 });
  g.select(8); finishFlip(g);
  assert.equal(g.rememberState[8], 1);
  assert.equal(g.ai.remember[8], 1);
}

// Human mismatch passes to CPU without A+B acknowledgement; AI starts on the
// following STILL frame, matching the original PASS_CONTROLLER special case.
{
  const p = new CroomPRNG();
  const g = new FrameGame({ board: boardWithPairs(), mode: MODE.VS_CPU, prng: p, aiNoiseLevel: 0 });
  g.select(0); finishFlip(g);
  g.select(8); finishFlip(g);
  assert.equal(g.state, PLAY_STATE.UNFLIPPING);
  g.tick(84 + 1 + 5 + 1 + 6 + 1); // complete both unflips and reach pass
  assert.equal(g.state, PLAY_STATE.PASS_CONTROLLER);
  assert.equal(g.curTurn, 1);
  g.tick(1);
  assert.equal(g.state, PLAY_STATE.STILL);
  assert.equal(g.ai.state, AI_STATE.START);
  g.tick(1);
  assert.equal(g.ai.state, AI_STATE.FORGET);
}

// Standalone Vs CPU and story share the same PRNG instance with the board.
{
  const p = new CroomPRNG();
  const g = new FrameGame({ board: boardWithPairs(), mode: MODE.VS_CPU, prng: p, aiNoiseLevel: 8 });
  assert.equal(g.prng, p);
  assert.equal(g.ai.noiseLevel, 8);
}

// Story table is the exact ten-stage 0.02 progression.
{
  assert.equal(STORY_STAGES.length, 10);
  assert.deepEqual(STORY_STAGES.map(s => s.difficulty), [0,0,1,1,2,2,3,3,4,4]);
  assert.deepEqual(STORY_STAGES.map(s => s.aiNoiseLevel), [-1,16,-1,12,-1,8,-1,8,-1,8]);
  assert.equal(storyStageConfig(0).mode, MODE.SOLITAIRE);
  assert.equal(storyStageConfig(1).mode, MODE.VS_CPU);
  assert.equal(storyStageConfig(1).opponent, 'Lillie');
  assert.equal(storyStageConfig(9).opponent, 'Susan');
}

// Original branch rule: in a CPU stage, equal score is a loss; player 1 must
// finish strictly ahead. Scene IDs select the matching opponent text.
{
  const win = storyOutcome(1, { score: [3,2], winner: 0 });
  assert.deepEqual(win, { won: true, sceneId: 65, nextStage: 2 });
  const tieLoss = storyOutcome(1, { score: [2,2], winner: 1 });
  assert.deepEqual(tieLoss, { won: false, sceneId: 66, nextStage: 0 });
  assert.equal(storyScene(64, 'en').speaker, 'Lillie');
  assert.equal(storyScene(77, 'en').speaker, 'Susan');
}

console.log('All Concentration Room AI/story tests passed.');
