import assert from 'node:assert/strict';
import { CroomPRNG } from '../public/src/prng.js';
import { dealBoard } from '../public/src/shuffle.js';
import { MODE } from '../public/src/rules.js';
import { FrameGame, NTSC } from '../public/src/state-machine.js';
import { CroomMusicModel, HistoricalAudio } from '../public/src/audio.js';
import {
  AUDIO_NTSC, SOUND_ID, MUSIC_ID, SFX, MUSIC_PATTERNS,
  expandSfx, sfxDurationFrames, pitchPeriod, pitchHz,
} from '../public/src/audio-data.js';

assert.equal(AUDIO_NTSC.framesPerMinute, 3606);
assert.equal(AUDIO_NTSC.fps, 60.1);
assert.equal(NTSC.fps, 60.1);
assert.equal(SFX.length, 11);
assert.deepEqual(
  Array.from({length:11}, (_, id) => sfxDurationFrames(id)),
  [6,2,8,2,15,25,6,68,68,8,8],
);
assert.deepEqual(expandSfx(SOUND_ID.FLIP)[0], {frame:0,frames:1,channel:0,control:0x4f,pitch:0x24});
assert.deepEqual(expandSfx(SOUND_ID.GAME_OVER_NOISE).at(-1), {frame:64,frames:4,channel:12,control:0x01,pitch:0x0e});
assert.equal(pitchPeriod(0), 2033);
assert.ok(Math.abs(pitchHz(0) - 54.9954746581) < 1e-9);
// Ensure the historically low A# in intro_sq1 stays low (N_AS, not N_ASH).
assert.equal(MUSIC_PATTERNS[0][8] >>> 3, 10);

// Intro conductor: first row occurs immediately; channel 1 joins after one
// WAITROWS row, matching music.s + musicseq.s.
const intro = new CroomMusicModel();
intro.start(MUSIC_ID.INTRO);
intro.tick(1);
let ev = intro.drainEvents();
assert.deepEqual(ev.map(e => [e.type,e.channel,e.pitch]), [
  ['music-rest',0,undefined],
  ['music-note',2,30],
]);
intro.tick(16);
ev = intro.drainEvents();
assert.ok(ev.some(e => e.type === 'music-note' && e.channel === 0 && e.pitch === 25));
intro.tick(16);
ev = intro.drainEvents();
assert.ok(ev.some(e => e.type === 'music-note' && e.channel === 1 && e.pitch === 33));
assert.equal(intro.playing, true);

// Cleared tune reaches CON_FINE on row 12, 121 model frames including frame 0.
const cleared = new CroomMusicModel();
cleared.start(MUSIC_ID.CLEARED);
let stopFrame = -1;
for (let f=0; f<500; f+=1) {
  cleared.tick(1); cleared.drainEvents();
  if (!cleared.playing) { stopFrame = f; break; }
}
assert.equal(stopFrame, 120);
assert.equal(cleared.row, 12);

// Event-to-SFX mapping is deterministic even without Web Audio (Node).
const audio = new HistoricalAudio();
audio.handleGameEvents([
  {type:'flip-start'},
  {type:'pair-mismatch'},
  {type:'unflip-start'},
  {type:'pair-match', combo:false},
  {type:'pair-match', combo:true},
  {type:'pass-acknowledged'},
  {type:'game-over'},
]);
assert.deepEqual(audio.sfxLog, [0,2,3,4,5,1,7,8]);

// Integration: first match must emit MATCH, consecutive match COMBO; a miss
// resets the combo flag in the state machine just like memorygame.s.
const prng = new CroomPRNG([0x26,0x25,0x24,0x23]);
const {board} = dealBoard({difficulty:1, prng, dealNmis:0x33});
const game = new FrameGame({board, mode:MODE.TWO_PLAYER, difficulty:1});
const byId = new Map();
for (let i=0;i<game.board.length;i+=1) {
  const v = game.board[i] & 0x3f;
  if (!v) continue;
  if (!byId.has(v)) byId.set(v, []);
  byId.get(v).push(i);
}
const pairs = [...byId.values()].filter(v => v.length===2);
assert.ok(pairs.length >= 3);

function selectAndResolve(a,b) {
  game.select(a); game.tick(NTSC.flipFrames + 1);
  game.select(b); game.tick(NTSC.flipFrames + 1);
  return game.drainEvents();
}
let events = selectAndResolve(...pairs[0]);
assert.equal(events.find(e => e.type==='pair-match')?.combo, false);
game.tick(NTSC.compareFrames + 2); game.drainEvents();
events = selectAndResolve(...pairs[1]);
assert.equal(events.find(e => e.type==='pair-match')?.combo, true);
game.tick(NTSC.compareFrames + 4); game.drainEvents();

// Find two remaining cards from different identities for a mismatch.
const live = [];
for (let i=0;i<game.board.length;i+=1) if ((game.board[i] & 0x80) && (game.board[i] & 0x3f)) live.push(i);
let miss = null;
for (let i=0;i<live.length && !miss;i+=1) for (let j=i+1;j<live.length;j+=1) {
  if ((game.board[live[i]]&0x3f)!==(game.board[live[j]]&0x3f)) { miss=[live[i],live[j]]; break; }
}
assert.ok(miss);
events = selectAndResolve(...miss);
assert.ok(events.some(e => e.type==='pair-mismatch'));
assert.equal(game.isCombo, false);

console.log('All Concentration Room historical-audio tests passed.');
