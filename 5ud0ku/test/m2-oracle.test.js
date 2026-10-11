import fs from 'node:fs';
import assert from 'node:assert/strict';
import { Grid, GridCreator, GridSolver, BruteForceSolver, AlwaysRunningTask, selectBestHardCandidate } from '../public/src/core/index.js';

const expected = JSON.parse(fs.readFileSync(new URL('./oracles.json', import.meta.url), 'utf8'));
const generatorOnly = process.argv.includes('--generator-only');
const solverOnly = process.argv.includes('--solver-only');
const task = new AlwaysRunningTask();
let passed = 0, failed = 0;

function check(label, actual, wanted) {
  try { assert.deepEqual(actual, wanted); console.log(`PASS ${label}`); passed++; }
  catch (e) { console.error(`FAIL ${label}`); console.error('  actual  ', actual); console.error('  expected', wanted); failed++; }
}

function generateRecord(entry) {
  const creator = new GridCreator(BigInt(entry.creatorSeed), task);
  let g, attempts = 1, found = 1;
  if (entry.name === 'hard') {
    const selected = selectBestHardCandidate(creator, 3, 200);
    g = selected.grid; attempts = selected.attempts; found = selected.found;
  } else {
    g = null; let internalTries = 0;
    while (!g && internalTries < 100) { g = creator.createNewUniqueGame(entry.name === 'easy' ? GridCreator.EASY_GAME : GridCreator.NORMAL_GAME); internalTries++; }
    // M2's historical harness exposed attempts=1 for non-Hard cases.
    attempts = 1; found = 1;
  }
  if (!g) throw new Error(`generation failed for ${entry.name}`);
  const prePuzzle = g.shownString(), preSolution = g.answerString();
  const givens = g.getNumberOfGiven();
  g.setupPossibleDigits();
  const singles = g.getNumberOfSingles(), btDepth = g.getBackTrackingDepth();
  const solutions = new GridSolver(task).searchSolutions(g).length;
  Grid.setRandomSeed(BigInt(entry.digitSeed));
  g.randomizeDigits();
  return {
    kind: 'generated', name: entry.name, creatorSeed: entry.creatorSeed, digitSeed: entry.digitSeed,
    attempts, found, givens, singles, btDepth, solutions,
    prePuzzle, preSolution, finalPuzzle: g.shownString(), finalSolution: g.answerString()
  };
}

function fixtureRecord(entry) {
  const g = Grid.fromPuzzle(entry.puzzle);
  const rules = g.checkForRules();
  const sols = rules ? new BruteForceSolver(task, false).searchSolutions(g) : [];
  return {
    kind: 'fixture', name: entry.name, rules, givens: g.getNumberOfGiven(), solutions: sols.length,
    puzzle: entry.puzzle,
    solution1: sols.length > 0 ? sols[0].shownString() : '',
    solution2: sols.length > 1 ? sols[1].shownString() : ''
  };
}

if (!solverOnly) {
  for (const entry of expected.generated) {
    const start = performance.now();
    const actual = generateRecord(entry);
    const wanted = { ...entry };
    // Expected JSON has no runtime-only fields beyond these; compare whole record.
    check(`generator:${entry.name}`, actual, wanted);
    console.log(`  ${(performance.now()-start).toFixed(1)} ms`);
  }
}

if (!generatorOnly) {
  for (const entry of expected.solver_fixtures) {
    const start = performance.now();
    const actual = fixtureRecord(entry);
    const { ms: _ms, ...wanted } = entry;
    check(`solver:${entry.name}`, actual, wanted);
    console.log(`  ${(performance.now()-start).toFixed(1)} ms`);
  }
}

console.log(`SUMMARY pass=${passed} fail=${failed}`);
if (failed) process.exit(1);
