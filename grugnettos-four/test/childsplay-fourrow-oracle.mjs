import {
  chooseHistoricalMove,
  _test,
} from '../public/src/players/childsplay-fourrow.js';

function boardFromRows(rows) {
  if (rows.length !== 6 || rows.some((row) => row.length !== 7)) {
    throw new Error('Expected six strings of seven cells.');
  }
  const board = Array.from({ length: 7 }, () => Array(6).fill(null));
  for (let y = 0; y < 6; y += 1) {
    for (let x = 0; x < 7; x += 1) {
      const ch = rows[y][x];
      board[x][y] = ch === 'R' ? 'red' : ch === 'B' ? 'black' : null;
    }
  }
  return board;
}

function scriptedRng(values) {
  let index = 0;
  return () => {
    const value = values[Math.min(index, values.length - 1)];
    index += 1;
    return value;
  };
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

function assertDeepEqual(actual, expected, message) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) throw new Error(`${message}: expected ${e}, got ${a}`);
}

// Oracle 1: first CPU move on levels 3-6 is restricted to zero-based 3 or 4.
const empty = boardFromRows([
  '.......', '.......', '.......', '.......', '.......', '.......',
]);
assertEqual(
  chooseHistoricalMove(empty, { level: 6, firstMove: true, rng: () => 0.0 }),
  3,
  'L6 first move, low RNG',
);
assertEqual(
  chooseHistoricalMove(empty, { level: 6, firstMove: true, rng: () => 0.999999 }),
  4,
  'L6 first move, high RNG',
);

// Oracle 2: level 1 is purely random among legal columns.
assertEqual(
  chooseHistoricalMove(empty, { level: 1, firstMove: false, rng: () => 0.999999 }),
  6,
  'L1 random move can choose last column',
);

// Oracle 3: immediate black win is column 4 (zero-based 3) in AI branch.
const immediateWin = boardFromRows([
  '.......',
  '.......',
  '.......',
  '.......',
  '......R',
  'BBB..RR',
]);
assertEqual(
  chooseHistoricalMove(immediateWin, { level: 5, firstMove: false, rng: () => 0.5 }),
  3,
  'L5 takes immediate win',
);
assertEqual(
  chooseHistoricalMove(immediateWin, { level: 6, firstMove: false, rng: () => 0.5 }),
  3,
  'L6 takes immediate win',
);

// Oracle 4: immediate red win is blocked at column 4 (zero-based 3).
const immediateBlock = boardFromRows([
  '.......',
  '.......',
  '.......',
  '.......',
  '......B',
  'RRR..BB',
]);
assertEqual(
  chooseHistoricalMove(immediateBlock, { level: 5, firstMove: false, rng: () => 0.5 }),
  3,
  'L5 blocks immediate loss',
);

// Oracle 5: Childsplay levels 3 and 4 are behaviorally identical.
for (const r of [0.01, 0.2, 0.55, 0.99]) {
  const m3 = chooseHistoricalMove(immediateBlock, {
    level: 3,
    firstMove: false,
    rng: scriptedRng([r, 0.73]),
  });
  const m4 = chooseHistoricalMove(immediateBlock, {
    level: 4,
    firstMove: false,
    rng: scriptedRng([r, 0.73]),
  });
  assertEqual(m3, m4, `L3/L4 same policy at RNG ${r}`);
}

// Oracle 6: Python 2 integer division changes the level-6 recursive fitness.
// This legal mid-game position is reached, for example, by alternating
// R:7, B:5, R:7, B:5, R:1 (1-based columns), leaving Black to move.
const py2DepthCase = boardFromRows([
  '.......',
  '.......',
  '.......',
  '.......',
  '....B.R',
  'R...B.R',
]);
assertDeepEqual(
  _test.getPotentialMoves(py2DepthCase, 'black', 2, 6),
  [-1, -1, -1, -1, -1, -1, 0],
  'L6 Python2-depth fitness vector',
);
assertEqual(
  chooseHistoricalMove(py2DepthCase, { level: 6, firstMove: false, rng: () => 0.01 }),
  6,
  'L6 selects the only best depth-2 column',
);
// L5 sees all seven moves as tied at depth 1; tie-breaking remains random.
assertEqual(
  chooseHistoricalMove(py2DepthCase, { level: 5, firstMove: false, rng: () => 0.01 }),
  0,
  'L5 depth-1 tie can choose first column',
);

// Oracle 7: exact random-branch probabilities are encoded by randrange(n)==0.
// L2: 1/4. L3/L4: 1/7. L5/L6: no forced-random branch (but ties remain random).
// Trigger L2 random branch (0.0 -> randrange(4) == 0), then choose last column.
assertEqual(
  chooseHistoricalMove(immediateWin, {
    level: 2,
    firstMove: false,
    rng: scriptedRng([0.0, 0.999999]),
  }),
  6,
  'L2 25% random branch can ignore an immediate win',
);
// Avoid L2 random branch; the AI then takes the immediate win.
assertEqual(
  chooseHistoricalMove(immediateWin, {
    level: 2,
    firstMove: false,
    rng: scriptedRng([0.5, 0.2]),
  }),
  3,
  'L2 AI branch takes immediate win',
);

console.log('Childsplay Fourrow oracle: all tests passed.');
