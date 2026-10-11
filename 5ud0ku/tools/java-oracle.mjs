#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later

// Differential oracle for the JavaScript port of 5ud0ku.
//
//   node tools/java-oracle.mjs check  [--easy N] [--normal N] [--hard N] [--solve N] [--state N] [--seed S]
//   node tools/java-oracle.mjs record [same options]
//
// The preserved original (reference/5ud0ku-1.8/source/src/de/wintermute/sudoku/) is compiled
// unmodified, next to three small stand-ins for the phone-only classes it imports (see
// test/java-oracle/), and driven by test/java-oracle/de/wintermute/sudoku/Oracle.java over a line
// protocol. The port runs the same command lines; every answer must be identical. `record` keeps
// what the original answered (as digests) in test/fixtures/java-oracle.json, which `npm test`
// replays against the port without Java. JAVA and JAVAC choose the tools.
//
// Families of commands:
//   rnd         java.util.Random streams (including a seed whose first value is Integer.MIN_VALUE)
//   gen-*       the original CreatorTask (candidates, selection, digit relabelling) for seeded games
//   solve       the sequence of the original SolverTask (checkForRules, then BruteForceSolver) on given, altered and invalid puzzles
//   state       Grid, GridSlot, MoveStack and the save format, in seeded random sequences of moves

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { Grid, JavaRandom, MoveStack, Position, gridFromBytes, gridToBytes } from '../public/src/core/index.js';
import { handleWorkerRequest } from '../public/src/workers/worker-handler.js';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE_DIR = join(ROOT, 'reference', '5ud0ku-1.8', 'source', 'src', 'de', 'wintermute', 'sudoku');
export const ORIGINAL_CLASSES = ['AbortableTask', 'BruteForceSolver', 'CreatorTask', 'Grid', 'GridCreator', 'GridSlot', 'GridSolver', 'MoveStack', 'Position', 'Solver'];
export const ORIGINAL_FILES = ORIGINAL_CLASSES.map((name) => join(SOURCE_DIR, `${name}.java`));
export const ORACLE_DIR = join(ROOT, 'test', 'java-oracle');
export const HARNESS_DIR = join(ORACLE_DIR, 'de', 'wintermute', 'sudoku');
export const HARNESS_FILES = ['Oracle.java', 'SudokuMidlet.java', 'SudokuStateControl.java', 'res/Dict.java'].map((name) => ({ name, path: join(HARNESS_DIR, name) }));
export const FIXTURE = join(ROOT, 'test', 'fixtures', 'java-oracle.json');
export const ORACLES_JSON = join(ROOT, 'test', 'oracles.json');

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fileSha256 = (path) => sha256(readFileSync(path));
const rel = (path) => relative(ROOT, path).split('\\').join('/');

// ---------------------------------------------------------------------------
// The port, driven by the same command lines as the harness
// ---------------------------------------------------------------------------
const hexOf = (bytes) => Buffer.from(bytes).toString('hex');
const textOf = (s) => (s.length === 0 ? '-' : [...Array(s.length).keys()].map((i) => s.charCodeAt(i).toString(16).padStart(4, '0')).join(''));
export const untext = (hex) => (hex === '-' ? '' : hex.match(/.{4}/g).map((u) => String.fromCharCode(parseInt(u, 16))).join(''));
const positionsText = (list) => (list === null ? 'null' : list.length === 0 ? 'empty' : list.map((p) => `${p.row},${p.col}`).join(';'));
const positionText = (p) => (p === null ? 'null' : `${p.row},${p.col}`);
const at = (f, i) => new Position(Number(f[i]), Number(f[i + 1]));

function generate(level, creatorSeed, digitSeed) {
  const { result } = handleWorkerRequest({ version: 1, op: 'generate', payload: { level, creatorSeed, digitSeed } });
  const r = result.record;
  const type = gridFromBytes(result.gridBytes).getType();
  return `G ${level} ${creatorSeed} ${digitSeed} ${r.finalPuzzle} ${r.finalSolution} ${r.givens} ${r.singles} ${r.btDepth} ${textOf(type)} ${r.solutions} ${hexOf(result.gridBytes)}`;
}

function solve(puzzle) {
  const { result: r } = handleWorkerRequest({ version: 1, op: 'solve', payload: { puzzle } });
  return ['S', r.rules ? 1 : 0, r.solutions, ...[r.solution1, r.solution2].filter((s) => s !== '')].join(' ');
}

function dump(grid) {
  const masks = [];
  let originals = '';
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) { masks.push(grid.getSlot(r, c).getPencilMarks()); originals += grid.getSlot(r, c).isOriginalDigit() ? '1' : '0'; }
  return `D ${textOf(grid.getType())} ${grid.getElapsedTime()} ${grid.shownString()} ${grid.answerString()} ${originals} ${masks.join(',')} ${hexOf(gridToBytes(grid))}`;
}

export class PortOracle {
  constructor() { this.grid = new Grid('easy'); this.moves = new MoveStack(); }

  run(line) {
    const f = line.split(' ');
    const g = this.grid;
    const n = (i) => Number(f[i]);
    switch (f[0]) {
      case 'GEN': return generate(f[1], f[2], f[3]);
      case 'SOLVE': return solve(f[1]);
      case 'RND': { const r = new JavaRandom(BigInt(f[1])); return ['R', ...Array.from({ length: n(2) }, () => r.nextInt())].join(' '); }
      case 'NEW': {
        this.grid = new Grid(untext(f[1]));
        this.moves = new MoveStack();
        for (let i = 0; i < 81; i++) {
          const slot = this.grid.getSlot(Math.trunc(i / 9), i % 9);
          slot.setAnswer(Number(f[3][i]));
          const shown = Number(f[2][i]);
          slot.setShown(shown);
          slot.setOriginalDigit(shown !== 0);
        }
        return 'OK';
      }
      case 'SHOW': g.getSlot(n(1), n(2)).setShown(n(3)); return 'OK';
      case 'MASK': g.getSlot(n(1), n(2)).setPencilMarks(n(3)); return 'OK';
      case 'PENCIL': g.getSlot(n(1), n(2)).setPencilMark(n(3), f[4] === '1'); return 'OK';
      case 'SETUP': return `V ${g.setupPossibleDigits()}`;
      case 'INITPM': g.intializePencilMarks(g.allEmptyPositions()); return 'OK';
      case 'PROMOTE': g.promote(n(1), n(2)); return 'OK';
      case 'HIDE': return `V ${g.hideNumber(at(f, 1)) ? 1 : 0}`;
      case 'CLEARPENCIL': g.clearPencilMarks(); return 'OK';
      case 'CLEARDIGITS': g.clearDigits(); return 'OK';
      case 'CONF': return `C ${positionsText(g.getConflictPositions(n(1), n(2), n(3)))}`;
      case 'SINGLE': return `V ${g.isSingle(at(f, 1))}`;
      case 'HSINGLE': return `V ${g.isHiddenSingle(at(f, 1))}`;
      case 'HSINGLE2': return `V ${g.isHiddenSingle(at(f, 1), n(3)) ? 1 : 0}`;
      case 'RULES': return `V ${g.checkForRules() ? 1 : 0}`;
      case 'COUNTS': return `V ${g.getDigitCounts().join(' ')}`;
      case 'SOLVED': return `V ${g.isSolved() ? 1 : 0}`;
      case 'FULL': return `V ${g.isCompletelyFilled() ? 1 : 0}`;
      case 'VALID': return `V ${g.isValidSolution() ? 1 : 0}`;
      case 'GIVEN': return `V ${g.getNumberOfGiven()}`;
      case 'SINGLES': return `V ${g.getNumberOfSingles()}`;
      case 'BT': return `V ${g.getBackTrackingDepth()}`;
      case 'SOLVEDDIGIT': g.setSolvedDigit(at(f, 1), n(3), g.allEmptyPositions()); return 'OK';
      case 'COPYSHOWN': g.copyShownToAnswer(); return 'OK';
      case 'RESETEDIT': g.resetForEdit(); return 'OK';
      case 'ORIGINAL': g.setAllShownDigitsAsOriginal(); return 'OK';
      case 'ELAPSED': g.setElapsedTime(n(1)); return 'OK';
      case 'DUMP': return dump(g);
      case 'CLONE': this.grid = g.clone(); return dump(this.grid);
      case 'SETBT': g.setBackTrackingDepth(n(1)); return 'OK';
      case 'ROUNDTRIP': this.grid = gridFromBytes(gridToBytes(g)); return dump(this.grid);
      case 'FROMBYTES': this.grid = gridFromBytes(Uint8Array.from(Buffer.from(f[1], 'hex'))); return dump(this.grid);
      case 'MSADD': this.moves.addMove(n(1), n(2), n(3), n(4), f[5] === '1'); return 'OK';
      case 'MSBACK': return `P ${positionText(this.moves.stepBack(g))}`;
      case 'MSFWD': return `P ${positionText(this.moves.stepForward(g))}`;
      case 'MSNEXT': return `P ${positionText(this.moves.getNextUndoPosition())}`;
      case 'MSRESET': this.moves.resetStack(); return 'OK';
      default: return `ERR unknown command ${f[0]}`;
    }
  }
}

export function runPort(commands) {
  const port = new PortOracle();
  return commands.map((line) => port.run(line));
}

// ---------------------------------------------------------------------------
// Command generation (seeded, so a recording can be replayed without Java)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (rng, list) => list[Math.floor(rng() * list.length)];
const below = (rng, n) => Math.floor(rng() * n);

// The first value of new Random(seed).nextInt() is Integer.MIN_VALUE, the one value for which
// Math.abs() stays negative: a state of 0x800000000000 one step ahead, scrambled back.
export function minValueSeed() {
  const M = 0x5DEECE66Dn, B = 0xBn, MASK = (1n << 48n) - 1n;
  let inverse = 1n;
  for (let i = 0; i < 48; i++) inverse = (inverse * (2n - M * inverse)) & MASK;
  const before = ((0x800000000000n - B) * inverse) & MASK;
  return (before ^ M).toString();
}
export const RANDOM_SEEDS = ['0', '1', '12345', '20081221', '2147483647', '1099511627779', '-5', '-9223372036854775808', '9223372036854775807', minValueSeed()];

function loadBases() {
  const oracles = JSON.parse(readFileSync(ORACLES_JSON, 'utf8'));
  const bases = new Set(oracles.generated.map((entry) => entry.finalSolution));
  for (const entry of oracles.solver_fixtures) if (entry.solution1 !== '' && !entry.solution1.includes('0')) bases.add(entry.solution1);
  return [...bases].filter((text) => text.length === 81 && Grid.fromPuzzle(text, 'check').isValidSolution());
}

// A new valid solution: a base grid with its digits renamed, its bands, rows, stacks and columns
// permuted, and possibly transposed (all of which keep a Sudoku solution a solution).
function randomSolution(rng, bases) {
  const base = pick(rng, bases);
  const names = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = 8; i > 0; i--) { const j = below(rng, i + 1); [names[i], names[j]] = [names[j], names[i]]; }
  const order = () => {
    const bands = [0, 1, 2];
    for (let i = 2; i > 0; i--) { const j = below(rng, i + 1); [bands[i], bands[j]] = [bands[j], bands[i]]; }
    return bands.flatMap((band) => {
      const inner = [0, 1, 2];
      for (let i = 2; i > 0; i--) { const j = below(rng, i + 1); [inner[i], inner[j]] = [inner[j], inner[i]]; }
      return inner.map((k) => band * 3 + k);
    });
  };
  const rows = order(), cols = order(), flip = rng() < 0.5;
  let out = '';
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const [rr, cc] = flip ? [cols[c], rows[r]] : [rows[r], cols[c]];
      out += names[Number(base[rr * 9 + cc]) - 1];
    }
  }
  return out;
}

function withGivens(rng, solution, givens) {
  const keep = new Set();
  while (keep.size < givens) keep.add(below(rng, 81));
  return [...solution].map((d, i) => (keep.has(i) ? d : '0')).join('');
}

export const sampleSeeds = (family, count, master) => {
  const rng = mulberry32(master + family.length * 7919);
  return Array.from({ length: count }, () => [1 + below(rng, 2 ** 31 - 1), 1 + below(rng, 2 ** 31 - 1)]);
};

export function genCommands(level, count, master) {
  return sampleSeeds(level, count, master).map(([c, d]) => `GEN ${level} ${c} ${d}`);
}

export function solveCommands(count, master) {
  const oracles = JSON.parse(readFileSync(ORACLES_JSON, 'utf8'));
  const bases = loadBases();
  const rng = mulberry32(master + 31337);
  const puzzles = oracles.solver_fixtures.map((entry) => entry.puzzle);
  for (let i = 0; i < count; i++) {
    const solution = randomSolution(rng, bases);
    const kind = i % 8;
    if (kind <= 3) puzzles.push(withGivens(rng, solution, 22 + below(rng, 38)));                // mostly unique or a few solutions
    else if (kind === 4) puzzles.push(withGivens(rng, solution, 55 + below(rng, 26)));          // nearly complete: many givens
    else if (kind === 5) {                                                                      // one given changed: usually a direct conflict
      const text = [...withGivens(rng, solution, 30 + below(rng, 30))];
      const filled = text.map((d, k) => (d !== '0' ? k : -1)).filter((k) => k >= 0);
      text[pick(rng, filled)] = String(1 + below(rng, 9));
      puzzles.push(text.join(''));
    } else if (kind === 6) {                                                                    // two cells swapped in a full grid: invalid, no clash found by pencil marks
      const text = [...solution];
      const a = below(rng, 81); let b = below(rng, 81);
      if (b === a) b = (a + 1) % 81;
      [text[a], text[b]] = [text[b], text[a]];
      puzzles.push(withGivens(rng, text.join(''), 40 + below(rng, 30)));
    } else puzzles.push(withGivens(rng, solution, below(rng, 12)));                             // very few givens: the solver stops at the second solution
  }
  puzzles.push('0'.repeat(81), `5${'0'.repeat(80)}`, `${'1'.repeat(9)}${'0'.repeat(72)}`, `${'0'.repeat(72)}${'123456789'}`);
  return puzzles.map((p) => `SOLVE ${p}`);
}

const TYPES = ['-', textOf('easy'), textOf('normal'), textOf('hard'), textOf('user'), textOf('custom'), textOf('caf\u00e9 \u20ac'), textOf('a\u0000b'), textOf('\ud83c\udfb2')];
const ELAPSED = [0, 1, 255, 256, 65535, 65536, 5 * 3600 * 1000, 2 ** 31, 2 ** 40 + 7, 2 ** 52 + 3, -1, -123456789];
const OPS = [
  ['SHOW', 14], ['PENCIL', 12], ['MASK', 3], ['SETUP', 3], ['INITPM', 2], ['PROMOTE', 3], ['HIDE', 5], ['CLEARPENCIL', 1], ['CLEARDIGITS', 1],
  ['COPYSHOWN', 0.4], ['RESETEDIT', 0.4], ['ORIGINAL', 1], ['ELAPSED', 1], ['SOLVEDDIGIT', 2],
  ['CONF', 7], ['SINGLE', 5], ['HSINGLE', 5], ['HSINGLE2', 5], ['RULES', 2], ['COUNTS', 2], ['SOLVED', 1], ['FULL', 1], ['VALID', 1], ['GIVEN', 1], ['SINGLES', 2], ['BT', 1],
  ['DUMP', 4], ['ROUNDTRIP', 2], ['CLONE', 2], ['SETBT', 1], ['MSADD', 14], ['MSBACK', 9], ['MSFWD', 6], ['MSNEXT', 3], ['MSRESET', 0.5],
];
const OP_TOTAL = OPS.reduce((sum, [, w]) => sum + w, 0);

function msAdd(rng) {
  const r = below(rng, 9), c = below(rng, 9);
  return rng() < 0.3 ? `MSADD ${r} ${c} ${1 + below(rng, 9)} ${1 + below(rng, 9)} 1` : `MSADD ${r} ${c} ${below(rng, 10)} ${below(rng, 10)} 0`;
}

function stateOp(rng) {
  let x = rng() * OP_TOTAL;
  let op = OPS[0][0];
  for (const [name, weight] of OPS) { if (x < weight) { op = name; break; } x -= weight; }
  const r = below(rng, 9), c = below(rng, 9);
  switch (op) {
    case 'SHOW': return `SHOW ${r} ${c} ${below(rng, 10)}`;
    case 'PENCIL': return `PENCIL ${r} ${c} ${below(rng, 9)} ${below(rng, 2)}`;
    case 'MASK': return `MASK ${r} ${c} ${below(rng, 512)}`;
    case 'PROMOTE': case 'HIDE': case 'SINGLE': case 'HSINGLE': return `${op} ${r} ${c}`;
    case 'HSINGLE2': return `HSINGLE2 ${r} ${c} ${below(rng, 9)}`;
    case 'SOLVEDDIGIT': return `SOLVEDDIGIT ${r} ${c} ${1 + below(rng, 9)}`;
    case 'CONF': return `CONF ${r} ${c} ${below(rng, 10)}`;
    case 'ELAPSED': return `ELAPSED ${pick(rng, ELAPSED)}`;
    case 'SETBT': return `SETBT ${below(rng, 40)}`;
    case 'MSADD': return msAdd(rng);
    default: return op;
  }
}

export function stateCommands(count, master) {
  const bases = loadBases();
  const rng = mulberry32(master + 424242);
  const lines = [];
  for (let s = 0; s < count; s++) {
    const solution = randomSolution(rng, bases);
    lines.push(`NEW ${pick(rng, TYPES)} ${withGivens(rng, solution, 17 + below(rng, 50))} ${solution}`);
    const kind = s % 10;
    if (kind === 8) {
      // a finished board: every empty cell filled with its answer, then tested, then spoiled with one digit
      const shown = lines.at(-1).split(' ')[2];
      for (let i = 0; i < 81; i++) if (shown[i] === '0') lines.push(`SHOW ${Math.trunc(i / 9)} ${i % 9} ${solution[i]}`);
      lines.push('FULL', 'VALID', 'SOLVED', 'COUNTS', 'GIVEN', 'SINGLES', 'DUMP');
      const spoiled = below(rng, 81);
      lines.push(`SHOW ${Math.trunc(spoiled / 9)} ${spoiled % 9} ${1 + below(rng, 9)}`, 'FULL', 'VALID', 'SOLVED', `CONF ${Math.trunc(spoiled / 9)} ${spoiled % 9} ${1 + below(rng, 9)}`, 'DUMP', 'ROUNDTRIP');
    } else if (kind === 9) {
      // a long history: more moves than the ring holds, then all the way back and forward again
      const moves = 100 + below(rng, 40);
      for (let i = 0; i < moves; i++) lines.push(msAdd(rng));
      for (let i = 0; i < moves + 5; i++) lines.push(i % 7 === 0 ? 'MSNEXT' : 'MSBACK');
      for (let i = 0; i < moves + 5; i++) lines.push('MSFWD');
      lines.push('MSNEXT', 'DUMP');
    } else {
      const steps = 30 + below(rng, 170);
      for (let i = 0; i < steps; i++) lines.push(stateOp(rng));
      lines.push('DUMP', 'ROUNDTRIP');
    }
  }
  return lines;
}

export function fixedCommands() {
  const hex = readFileSync(join(ROOT, 'test', 'fixtures', 'm3-java-save-normal.hex'), 'utf8').trim();
  return [`FROMBYTES ${hex}`, 'DUMP', 'ROUNDTRIP', 'RULES', 'GIVEN', 'SINGLES', 'COUNTS'];
}

export const GEN_DELIVERED = [['easy', 1801, 91801], ['normal', 1802, 91802], ['hard', 1803, 91803]];

export function planFamilies({ easy, normal, hard, solve: solveCount, state, seed }) {
  return [
    { name: 'rnd', commands: RANDOM_SEEDS.map((s) => `RND ${s} 1000`) },
    { name: 'delivered-generated', commands: GEN_DELIVERED.map(([level, c, d]) => `GEN ${level} ${c} ${d}`) },
    { name: 'gen-easy', commands: genCommands('easy', easy, seed) },
    { name: 'gen-normal', commands: genCommands('normal', normal, seed) },
    { name: 'gen-hard', commands: genCommands('hard', hard, seed) },
    { name: 'solve', commands: solveCommands(solveCount, seed) },
    { name: 'save-of-the-original', commands: fixedCommands() },
    { name: 'state', commands: stateCommands(state, seed) },
  ];
}

export const DEFAULTS = { easy: 500, normal: 500, hard: 300, solve: 500, state: 600, seed: 20061018 };

// ---------------------------------------------------------------------------
// The delivered fixtures (test/oracles.json) against what the original answered
// ---------------------------------------------------------------------------
export function checkDelivered(javaGenerated, javaSolver) {
  const oracles = JSON.parse(readFileSync(ORACLES_JSON, 'utf8'));
  oracles.generated.forEach((entry, i) => {
    const f = javaGenerated[i].split(' ');
    const expected = [entry.name, String(entry.creatorSeed), String(entry.digitSeed), entry.finalPuzzle, entry.finalSolution, String(entry.givens), String(entry.singles), String(entry.btDepth)];
    if (f.slice(1, 9).join(' ') !== expected.join(' ') || f[10] !== String(entry.solutions)) throw new Error(`the delivered generated fixture "${entry.name}" differs from what the original produced`);
  });
  oracles.solver_fixtures.forEach((entry, i) => {
    const f = javaSolver[i].split(' ');
    const expected = ['S', entry.rules ? '1' : '0', String(entry.solutions), ...[entry.solution1, entry.solution2].filter((s) => s !== '')];
    if (f.join(' ') !== expected.join(' ')) throw new Error(`the delivered solver fixture "${entry.name}" differs from what the original produced`);
  });
  return { generated: oracles.generated.length, solver: oracles.solver_fixtures.length };
}

// ---------------------------------------------------------------------------
// Java side
// ---------------------------------------------------------------------------
function javaMajor(command) {
  const result = spawnSync(command, ['-version'], { encoding: 'utf8' });
  const text = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const match = /version "(\d+)(?:\.(\d+))?/.exec(text) ?? /javac (\d+)(?:\.(\d+))?/.exec(text);
  const major = match ? (match[1] === '1' ? Number(match[2]) : Number(match[1])) : 0;
  return { major, text: text.split('\n')[0].trim() };
}

export function compile(outDir, javac = process.env.JAVAC || 'javac') {
  mkdirSync(outDir, { recursive: true });
  const { major } = javaMajor(javac);
  const args = ['-nowarn', '-Xlint:none', ...(major >= 9 ? ['--release', '8'] : []), '-d', outDir, ...ORIGINAL_FILES, ...HARNESS_FILES.map((file) => file.path)];
  const result = spawnSync(javac, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${javac} failed: ${result.error?.message ?? result.stderr}`);
}

export class JavaOracle {
  constructor(classDir, java = process.env.JAVA || 'java') {
    this.version = javaMajor(java).text;
    this.process = spawn(java, ['-cp', classDir, 'de.wintermute.sudoku.Oracle'], { stdio: ['pipe', 'pipe', 'inherit'] });
    this.lines = createInterface({ input: this.process.stdout })[Symbol.asyncIterator]();
    this.process.stdin.on('error', () => {});
    this.exited = new Promise((resolveExit) => this.process.on('close', resolveExit));
  }

  async run(commands) {
    this.process.stdin.write(`${commands.join('\n')}\n`);
    const out = [];
    while (out.length < commands.length) {
      const { value, done } = await this.lines.next();
      if (done) throw new Error('the Java oracle exited unexpectedly');
      out.push(value);
    }
    return out;
  }

  async close() {
    this.process.stdin.write('QUIT\n');
    this.process.stdin.end();
    await this.exited;
  }
}

export function firstDifference(commands, a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] !== b[i]) {
      const x = (a[i] ?? '').split(' '), y = (b[i] ?? '').split(' ');
      const k = x.findIndex((v, j) => v !== y[j]);
      return { index: i, command: commands[i]?.slice(0, 120), field: k, original: (x[k] ?? '').slice(0, 100), port: (y[k] ?? '').slice(0, 100), before: commands.slice(Math.max(0, i - 3), i).map((c) => c.slice(0, 80)) };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// What the commands exercised (reported, and checked for being a meaningful sample)
// ---------------------------------------------------------------------------
export function summarise(families, answers) {
  const stats = { commands: 0, gen: { easy: 0, normal: 0, hard: 0 }, solve: { puzzles: 0, rulesBroken: 0, none: 0, one: 0, two: 0 }, state: { scripts: 0, ops: {} }, saveBytes: 0 };
  for (const family of families) {
    const out = answers[family.name];
    stats.commands += family.commands.length;
    family.commands.forEach((command, i) => {
      const word = command.split(' ')[0];
      if (family.name.startsWith('gen-')) stats.gen[family.name.slice(4)] += 1;
      if (word === 'SOLVE') {
        const f = out[i].split(' ');
        stats.solve.puzzles += 1;
        if (f[1] === '0') stats.solve.rulesBroken += 1;
        else if (f[2] === '0') stats.solve.none += 1;
        else if (f[2] === '1') stats.solve.one += 1;
        else stats.solve.two += 1;
      }
      if (family.name === 'state') {
        stats.state.ops[word] = (stats.state.ops[word] ?? 0) + 1;
        if (word === 'NEW') stats.state.scripts += 1;
        if (word === 'DUMP') stats.saveBytes = Math.max(stats.saveBytes, out[i].split(' ').at(-1).length / 2);
      }
    });
  }
  return stats;
}

// ---------------------------------------------------------------------------
// Replay of a recorded fixture against the port (no Java needed)
// ---------------------------------------------------------------------------
export function replay(fixture) {
  const families = planFamilies(fixture.generator);
  const digests = {};
  for (const family of families) {
    const recorded = fixture.families.find((entry) => entry.name === family.name);
    if (!recorded) throw new Error(`family ${family.name} is missing from the recording`);
    if (sha256(family.commands.join('\n')) !== recorded.commandsSha256 || family.commands.length !== recorded.commands) {
      throw new Error(`the commands of family ${family.name} are not the ones that were recorded: run node tools/java-oracle.mjs record`);
    }
    const answers = runPort(family.commands);
    digests[family.name] = answers;
    if (sha256(answers.join('\n')) !== recorded.answersSha256) {
      throw new Error(`family ${family.name} differs from what the original answered; run npm run test:live for a command-by-command comparison`);
    }
  }
  const delivered = checkDelivered(fixture.delivered.generated, fixture.delivered.solver);
  return { families, answers: digests, delivered };
}

// ---------------------------------------------------------------------------
async function main() {
  const [command = 'check', ...rest] = process.argv.slice(2);
  const option = (name) => { const i = rest.indexOf(name); return i >= 0 ? Number(rest[i + 1]) : DEFAULTS[name.slice(2)]; };
  const parameters = { easy: option('--easy'), normal: option('--normal'), hard: option('--hard'), solve: option('--solve'), state: option('--state'), seed: option('--seed') };
  const classDir = mkdtempSync(join(tmpdir(), 'sudoku-oracle-'));
  compile(classDir);
  const oracle = new JavaOracle(classDir);
  console.log(`Original sources compiled from reference/5ud0ku-1.8/source (${ORIGINAL_CLASSES.length} classes, unmodified) with ${HARNESS_FILES.length} harness files; running on ${oracle.version}.`);
  const families = planFamilies(parameters);
  const recorded = [];
  const answers = {};
  try {
    for (const family of families) {
      const started = Date.now();
      const java = await oracle.run(family.commands);
      const port = runPort(family.commands);
      const difference = firstDifference(family.commands, java, port);
      if (difference) {
        throw new Error(`family ${family.name}, command ${difference.index} (${difference.command}), field ${difference.field}: original ${difference.original}, port ${difference.port}\n  preceding commands: ${difference.before.join(' | ')}`);
      }
      answers[family.name] = java;
      recorded.push({ name: family.name, commands: family.commands.length, commandsSha256: sha256(family.commands.join('\n')), answersSha256: sha256(java.join('\n')) });
      console.log(`  ${family.name.padEnd(22)} ${String(family.commands.length).padStart(6)} commands agree (${((Date.now() - started) / 1000).toFixed(1)} s)`);
    }
    const byName = (name) => families.find((family) => family.name === name);
    const delivered = {
      generated: answers['delivered-generated'],
      solver: answers.solve.slice(0, JSON.parse(readFileSync(ORACLES_JSON, 'utf8')).solver_fixtures.length),
    };
    const matched = checkDelivered(delivered.generated, delivered.solver);
    console.log(`The delivered fixtures (test/oracles.json) are what the original produces: ${matched.generated} generated games and ${matched.solver} solver puzzles.`);
    const minimum = answers.rnd[RANDOM_SEEDS.length - 1].split(' ')[1];
    if (minimum !== '-2147483648') throw new Error('the crafted seed does not start with Integer.MIN_VALUE');
    const stats = summarise(families, answers);
    console.log(`java.util.Random: ${RANDOM_SEEDS.length} seeds x 1000 values agree, including a seed whose first value is Integer.MIN_VALUE.`);
    console.log(`Generation: ${stats.gen.easy} easy, ${stats.gen.normal} normal and ${stats.gen.hard} hard games, each run through the original CreatorTask (Hard: best of three by the original's own rules).`);
    console.log(`Solver: ${stats.solve.puzzles} puzzles (${stats.solve.rulesBroken} breaking the rules, ${stats.solve.none} without solution, ${stats.solve.one} with one, ${stats.solve.two} with two or more).`);
    console.log(`State: ${stats.state.scripts} move sequences (${Object.values(stats.state.ops).reduce((a, b) => a + b, 0)} commands), saves up to ${stats.saveBytes} bytes; ${byName('save-of-the-original').commands.length} commands on a save written by the original classes.`);
    if (command === 'record') {
      const fixture = {
        oracle: '5ud0ku-1.8-java',
        generator: parameters,
        sources: Object.fromEntries([
          ...ORIGINAL_FILES.map((path) => [rel(path), fileSha256(path)]),
          ...HARNESS_FILES.map((file) => [rel(file.path), fileSha256(file.path)]),
          [rel(ORACLES_JSON), fileSha256(ORACLES_JSON)],
          ['test/fixtures/m3-java-save-normal.hex', fileSha256(join(ROOT, 'test', 'fixtures', 'm3-java-save-normal.hex'))],
        ]),
        recordedWith: { java: oracle.version, node: process.version, platform: process.platform },
        stats,
        delivered,
        families: recorded,
      };
      mkdirSync(dirname(FIXTURE), { recursive: true });
      writeFileSync(FIXTURE, `${JSON.stringify(fixture)}\n`);
      console.log(`Recorded ${rel(FIXTURE)} (${statSync(FIXTURE).size} bytes).`);
    }
  } finally {
    await oracle.close();
    rmSync(classDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
