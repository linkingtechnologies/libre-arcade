const assert = require('assert');
const G = require('../src/game.js');

function rngFrom(seed){
  let s = seed >>> 0;
  return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; };
}

for (const size of [3,4,5]) {
  const count = size * size;
  const expected = Array.from({length:count},(_,i)=>i).join(',');
  for (let seed=1; seed<=250; seed++) {
    const state = G.mix(size, rngFrom(seed));
    assert.equal(state.size, size);
    assert.equal(state.board.length, count);
    assert.equal([...state.board].sort((a,b)=>a-b).join(','), expected);
    assert(state.blank >= 0 && state.blank < count);
    assert.equal(state.solved, false);

    // Exercise 80 legal moves and ensure topology/permutation never corrupts.
    for (let step=0; step<80; step++) {
      const candidates = [];
      for (let i=0;i<count;i++) if (G.areAdjacent(i,state.blank,size)) candidates.push(i);
      const target = candidates[step % candidates.length];
      const moved = G.slide(state,target);
      assert.equal(moved,true);
      assert.equal([...state.board].sort((a,b)=>a-b).join(','), expected);
      assert(state.blank >= 0 && state.blank < count);
      // If an incidental solved state is reached, start another shuffled state.
      if (state.solved) Object.assign(state, G.mix(size, rngFrom(seed + step + 10000)));
    }
  }

  // Explicit completion path: one legal slide restores the solved permutation.
  const board = Array.from({length:count},(_,i)=>i);
  [board[count-2],board[count-1]] = [board[count-1],board[count-2]];
  const near = {size, board, blank:count-2, solved:false};
  assert.equal(G.slide(near,count-1),true);
  assert.equal(near.solved,true);
  assert.equal(G.isSolved(near.board),true);
}

console.log('state-regression: ok');
