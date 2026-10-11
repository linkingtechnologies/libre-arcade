import assert from 'node:assert/strict';
import { CroomPRNG } from '../public/src/prng.js';
import { activePositions, CARD_SETS, EXPECTED_CARD_COUNTS, cardIdentity } from '../public/src/layouts.js';
import { dealBoard } from '../public/src/shuffle.js';
import { ArtificialIdiocy } from '../public/src/ai.js';
import { MODE, RuleCore, solitaireInitialMisses } from '../public/src/rules.js';

// Layout and card-set archaeology.
for (let d = 0; d < 5; d += 1) {
  assert.equal(activePositions(d).length, EXPECTED_CARD_COUNTS[d]);
  assert.equal(CARD_SETS[d].length * 2, EXPECTED_CARD_COUNTS[d]);
  assert.equal(new Set(CARD_SETS[d]).size, CARD_SETS[d].length);
}
assert.deepEqual([0, 1, 2, 3, 4].map(solitaireInitialMisses), [20, 40, 60, 80, 100]);

// PRNG vector from reset seed.
{
  const p = new CroomPRNG();
  const seen = [];
  for (const bits of [1, 1, 2, 6, 8, 6]) {
    seen.push(p.randomBits(bits));
  }
  assert.deepEqual(seen, [0x46, 0x8c, 0x5e, 0x26, 0x9b, 0x9d]);
}

// Frozen 0.02 deal vectors. These use reset seed, title mode 2 (2 Players),
// title nmis 0x11, and per-deal nmis 0x5d. A fresh reset seed is used for
// each difficulty so each vector is independently reproducible.
const expectedDeals = [
  [32,30,29,28,28,29,31,30,31,32],
  [31,31,35,29,35,36,30,30,37,33,32,29,37,32,28,34,36,33,28,34],
  [48,45,49,38,62,61,60,39,61,49,38,51,47,44,54,48,60,44,50,46,47,45,50,39,51,55,52,63,46,54,52,63,53,55,53,62],
  [56,45,57,46,50,54,41,44,50,45,55,58,38,40,61,63,52,49,61,38,47,49,56,62,44,42,54,62,41,48,60,55,40,53,63,59,60,53,47,39,51,43,51,39,57,42,52,48,59,43,46,58],
  [48,49,42,34,42,47,35,46,32,54,54,61,51,39,39,53,45,56,33,63,30,31,50,32,36,47,41,57,36,31,45,58,55,52,59,52,38,56,61,28,55,51,40,57,44,29,50,48,41,28,46,33,58,59,49,35,60,53,62,29,37,43,37,62,44,30,38,34,63,43,40,60],
];

for (let d = 0; d < 5; d += 1) {
  const p = new CroomPRNG();
  p.mixTitleSelection(2, 0x11);
  const { board } = dealBoard({ difficulty: d, prng: p, dealNmis: 0x5d });
  const active = activePositions(d);
  const ids = active.map(i => cardIdentity(board[i]));
  assert.deepEqual(ids, expectedDeals[d]);
  const counts = new Map();
  for (const id of ids) counts.set(id, (counts.get(id) ?? 0) + 1);
  for (const count of counts.values()) assert.equal(count, 2);
}

// 2P: match keeps turn; mismatch passes; score increments on match.
{
  const p = new CroomPRNG();
  p.mixTitleSelection(2, 3);
  const { board } = dealBoard({ difficulty: 0, prng: p, dealNmis: 7 });
  const core = new RuleCore({ board, mode: MODE.TWO_PLAYER, difficulty: 0 });
  const pos = activePositions(0);
  let pair;
  outer: for (let i = 0; i < pos.length; i += 1) {
    for (let j = i + 1; j < pos.length; j += 1) {
      if (cardIdentity(board[pos[i]]) === cardIdentity(board[pos[j]])) {
        pair = [pos[i], pos[j]];
        break outer;
      }
    }
  }
  assert.equal(core.flip(pair[0]).result, 'first');
  assert.equal(core.flip(pair[1]).result, 'match');
  core.resolvePair();
  assert.equal(core.score[0], 1);
  assert.equal(core.curTurn, 0);

  const remaining = pos.filter(i => core.board[i] !== 0);
  let mismatch;
  outer2: for (let i = 0; i < remaining.length; i += 1) {
    for (let j = i + 1; j < remaining.length; j += 1) {
      if (cardIdentity(core.board[remaining[i]]) !== cardIdentity(core.board[remaining[j]])) {
        mismatch = [remaining[i], remaining[j]];
        break outer2;
      }
    }
  }
  assert.equal(core.flip(mismatch[0]).result, 'first');
  assert.equal(core.flip(mismatch[1]).result, 'mismatch');
  const r = core.resolvePair();
  assert.equal(r.passTo, 1);
  assert.equal(core.curTurn, 1);
  assert.equal(core.phase, 'pass');
  assert.equal(core.acknowledgePass(), true);
  assert.equal(core.phase, 'ready');
}

// AI: a fully remembered face-down pair is preferred.
{
  const p = new CroomPRNG();
  p.mixTitleSelection(3, 9);
  const { board } = dealBoard({ difficulty: 1, prng: p, dealNmis: 12 });
  const ai = new ArtificialIdiocy({ noiseLevel: 0 });
  const pos = activePositions(1);
  let pair;
  outer3: for (let i = 0; i < pos.length; i += 1) {
    for (let j = i + 1; j < pos.length; j += 1) {
      if (board[pos[i]] === board[pos[j]]) {
        pair = [pos[i], pos[j]];
        break outer3;
      }
    }
  }
  ai.observe(pair[0]);
  ai.observe(pair[1]);
  const known = ai.findKnownPair(board);
  assert.ok(known);
  assert.equal(board[known[0]], board[known[1]]);
}

console.log('All Concentration Room behavioral-oracle tests passed.');
