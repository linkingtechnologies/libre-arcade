import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';
import { oracleOutput, compile, binaryPath, CXX } from './oracle-fixtures.mjs';
import { PonsSolver, _test, pascalPonsPlayer } from '../public/src/players/pascal-pons-bitboard.js';

const binary = binaryPath('pons-oracle');

const sequences = [
  '4537234444277126616157746733321555',
  '3152753527377226117517221163336646',
  '7614234426524153265117741221476766',
  '2234765447512334242211157514671773',
  '3266444242374334313126656167777722',
];

try {
  const stdout = oracleOutput('pons', sequences, () => {
    compile(CXX, ['-std=c++17', '-O2', 'test/pons-native-oracle.cpp', 'reference/pascal-pons-connect4/original/Solver.cpp', '-o', binary]);
    const native = spawnSync(binary, [], { input: `${sequences.join('\n')}\n`, encoding: 'utf8' });
    assert.equal(native.status, 0, native.stderr);
    return native.stdout;
  }, [CXX]);
  const lines = stdout.trim().split('\n');
  assert.equal(lines.length, sequences.length);
  for (let index = 0; index < sequences.length; index += 1) {
    const position = _test.fromMoves([...sequences[index]].map((digit) => Number(digit) - 1));
    const parts = lines[index].split(' ');
    assert.equal(Number(parts[0]), position.moves);
    assert.equal(BigInt(parts[1]), position.key());
    assert.equal(parts[2] === '1', position.canWinNext());
    const expectedScores = parts.slice(3, 10).map((part) => Number(part.split(':')[2]));
    for (let column = 0; column < 7; column += 1) {
      const [playable, winning] = parts[3 + column].split(':').map(Number);
      assert.equal(Boolean(playable), position.canPlay(column));
      assert.equal(Boolean(winning), position.isWinningMove(column));
    }
    const solver = new PonsSolver({ nodeLimit: 2_000_000 });
    assert.deepEqual(solver.analyze(position, false), expectedScores.map((score) => score === -1000 ? null : score));
  }

  const tactical = pascalPonsPlayer.create({ nodes: 1000 }).chooseMove({ moves: [0, 1, 0, 1, 0, 2] });
  assert.equal(tactical.column, 0);
  assert.equal(tactical.exact, true);
  console.log('Pascal Pons C++/JS bitboard and exact endgame parity: all tests passed.');
} finally {
  try { unlinkSync(binary); } catch {}
}
