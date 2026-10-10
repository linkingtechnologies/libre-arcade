#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';

// Differential oracle for the JavaScript port of XO World.
//
//   node tools/java-oracle.js record [--games N] [--seed S]
//       Compiles the preserved original applet (reference/javagames-1.0/
//       xoworld.java), plays N games against it and against the port in
//       lockstep, fails on the first difference, and writes the transcript to
//       test/fixtures/java-oracle.json.
//   node tools/java-oracle.js check [--games N] [--seed S]
//       The same lockstep run, without writing anything.
//
// The test suite replays the recorded transcript against the port, so it needs
// no Java. Set JAVA / JAVAC to choose the runtime (default: java, javac on PATH).
// The original extends java.applet.Applet, whose constructor refuses to run
// headless: on a machine without a display use xvfb-run.

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const { spawn, spawnSync } = require('child_process');
const { XOWorldGame } = require('../src/game-model');

const ROOT = path.resolve(__dirname, '..');
const JAVA_SOURCE = path.join(ROOT, 'reference', 'javagames-1.0', 'xoworld.java');
const HARNESS_SOURCE = path.join(ROOT, 'test', 'java-oracle', 'XOWorldOracle.java');
const FIXTURE = path.join(ROOT, 'test', 'fixtures', 'java-oracle.json');

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const digest = (file) => sha256(file);

// ---------------------------------------------------------------------------
// The 22 positions of the delivered behavioural oracle: [id, label, potez,
// stones "index:value,...", x, y, expected CPU move]. A null x means "the
// coordinates of the first X on the board", as the original harness did.
// ---------------------------------------------------------------------------
const CASES = [
  ['O-01', 'opening upper', 1, '', 4, 2, 35], ['O-02', 'opening lower', 1, '', 4, 7, 63],
  ['O-03', 'cpu immediate horiz', 6, '42:2,43:2,44:2,45:2', 0, 0, 41], ['O-04', 'block human horiz', 6, '42:1,43:1,44:1,45:1', 0, 0, 41],
  ['O-05', 'cpu immediate vert', 6, '14:2,24:2,34:2,44:2', 0, 0, 4], ['O-06', 'block human diag', 6, '22:1,33:1,44:1,55:1', 0, 0, 11],
  ['O-07', 'X_X bridge', 2, '32:1,34:1', 0, 0, 33], ['O-08', 'cross block', 4, '22:1,24:1,42:1,44:1', 0, 0, 33],
  ['O-09', 'human open4', 8, '2:2,3:2,4:1,13:2,25:1,29:2,31:1,36:1,48:1,51:1,53:2,61:1,62:1,63:2,77:2', null, null, 41],
  ['O-10', 'cpu open4', 8, '5:1,14:1,15:2,29:1,30:2,33:2,42:2,44:1,45:2,52:1,54:1,61:2,69:2,89:1,95:1', null, null, 24],
  ['O-11', 'cpu make o4c', 7, '0:1,12:1,19:2,40:1,46:1,52:1,54:2,74:2,75:2,80:1,85:2,93:2,95:1', null, null, 73],
  ['O-12', 'human box', 6, '5:1,10:2,23:1,27:2,32:2,45:1,54:1,55:1,57:2,79:1,90:2', null, null, 44],
  ['O-13', 'cpu c4+o3', 9, '2:2,5:2,6:2,14:1,17:1,20:1,28:2,37:2,43:1,56:1,66:1,67:1,69:2,78:1,80:1,90:2,94:2', null, null, 4],
  ['O-14', 'human c4+o3', 10, '4:2,7:1,21:1,23:1,30:2,33:1,35:2,42:1,52:1,55:2,58:2,59:2,60:1,71:2,74:2,82:2,84:1,91:1,99:1', null, null, 24],
  ['O-15', 'close human c4', 6, '1:2,2:1,26:2,34:2,42:1,47:1,51:2,57:1,67:1,77:2,86:1', null, null, 27],
  ['O-16', 'human double-o3', 10, '2:2,10:1,11:2,12:1,13:1,23:2,26:2,50:2,54:1,56:1,59:2,60:1,70:1,73:1,79:1,82:1,83:2,88:2,96:2', null, null, 55],
  ['O-17', 'cpu double-o3', 8, '1:1,14:1,26:2,27:2,31:1,35:2,38:2,45:2,60:1,61:2,76:2,82:1,85:1,92:1,95:1', null, null, 25],
  ['O-18', 'human serie', 10, '1:1,12:1,14:2,16:2,21:1,32:2,33:2,34:1,36:1,49:2,50:1,51:2,61:2,65:2,66:1,75:1,78:1,80:2,85:1', null, null, 45],
  ['O-19', 'human double-c4', 10, '12:2,26:1,28:2,36:2,38:2,42:2,45:1,48:1,51:2,56:1,58:1,59:1,65:2,66:1,79:2,84:1,88:2,94:1,97:1', null, null, 57],
  ['O-20', 'cpu serie', 8, '9:1,20:2,21:1,26:1,31:2,32:1,34:1,41:2,42:2,45:2,54:2,59:1,80:2,83:1,98:1', null, null, 44],
  ['O-21', 'cpu double-c4', 10, '18:2,25:1,35:1,36:1,42:1,46:1,50:2,51:1,59:2,63:1,68:2,77:2,78:2,85:2,87:2,89:2,91:1,92:1,97:1', null, null, 86],
  ['O-22', 'serie depth cap', 11, '2:1,5:2,9:2,14:2,15:2,23:1,27:1,43:1,44:2,45:2,51:1,55:1,64:1,70:2,71:2,75:1,85:1,86:2,87:1,91:2,92:1', null, null, 65],
];

function caseBoard(stones) {
  const board = Array(100).fill(0);
  if (stones) for (const entry of stones.split(',')) { const [i, v] = entry.split(':').map(Number); board[i] = v; }
  return board;
}

function caseCoordinates(board, x, y) {
  if (x !== null) return [x, y];
  for (let i = 0; i < 100; i++) if (board[i] === 1) return [i % 10, Math.trunc(i / 10)];
  return [0, 0];
}

// ---------------------------------------------------------------------------
// Java side
// ---------------------------------------------------------------------------
function javaMajor(command) {
  const result = spawnSync(command, ['-version'], { encoding: 'utf8' });
  const text = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const match = /version "(\d+)(?:\.(\d+))?/.exec(text) ?? /javac (\d+)(?:\.(\d+))?/.exec(text);
  if (!match) return { major: 0, text: text.split('\n')[0].trim() };
  const major = match[1] === '1' ? Number(match[2]) : Number(match[1]);
  return { major, text: text.split('\n')[0].trim() };
}

function compile(outDir, javac = process.env.JAVAC || 'javac') {
  fs.mkdirSync(outDir, { recursive: true });
  const { major } = javaMajor(javac);
  const args = ['-nowarn', '-Xlint:none', ...(major >= 9 ? ['--release', '8'] : []), '-d', outDir, JAVA_SOURCE, HARNESS_SOURCE];
  const result = spawnSync(javac, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${javac} failed: ${result.error?.message ?? result.stderr}`);
}

class JavaOracle {
  constructor(classDir, java = process.env.JAVA || 'java') {
    this.java = java;
    this.version = javaMajor(java).text;
    this.queue = [];
    this.waiters = [];
    this.closed = false;
    this.process = spawn(java, ['-cp', classDir, 'XOWorldOracle'], { stdio: ['pipe', 'pipe', 'inherit'] });
    this.process.on('error', (error) => this.fail(error));
    this.process.on('close', () => { this.closed = true; this.fail(new Error('the Java oracle exited unexpectedly')); });
    readline.createInterface({ input: this.process.stdout }).on('line', (line) => {
      const waiter = this.waiters.shift();
      if (waiter) waiter.resolve(line); else this.queue.push(line);
    });
  }

  fail(error) { for (const waiter of this.waiters.splice(0)) waiter.reject(error); this.error = error; }

  ask(command) {
    return new Promise((resolve, reject) => {
      if (this.error && !this.closing) { reject(this.error); return; }
      const line = this.queue.shift();
      this.process.stdin.write(`${command}\n`);
      if (line !== undefined) { resolve(line); return; }
      this.waiters.push({ resolve, reject });
    });
  }

  async close() {
    this.closing = true;
    this.process.stdin.write('Q\n');
    this.process.stdin.end();
    if (!this.closed) await new Promise((resolve) => this.process.on('close', resolve));
  }
}

// ---------------------------------------------------------------------------
// The port, with the original's random fallback made answerable
// ---------------------------------------------------------------------------
function makeGame() {
  const state = { inject: null, calls: 0 };
  const randomFn = () => {
    state.calls += 1;
    if (state.inject === null) throw new Error('the port reached the random fallback where the original did not');
    if (state.calls > 100) throw new Error('the port never accepted the original random move');
    return (state.inject + 0.5) / 100;
  };
  return { game: new XOWorldGame({ randomFn }), state };
}

function parseMoveReply(line) {
  const f = line.split(' ');
  if (f[0] !== 'R' || f.length !== 7) throw new Error(`unexpected oracle reply: ${line}`);
  return { legal: f[1] === '1', status: Number(f[2]), potez: Number(f[3]), last: Number(f[4]), fallback: f[5] === '1', board: f[6] };
}

// Plays one click on the port and compares it with the original's reply.
// `empty` is the number of empty squares before the click. When at most three
// squares remain, the original's random fallback has so few possible outcomes
// that sixteen copies of it can all agree by chance; in that case the port is
// allowed to take the fallback while the original looked deterministic, and the
// reply is then recorded as a fallback one.
function compareClick(js, index, java, where, empty) {
  js.state.inject = java.legal && java.status !== 2 ? java.last : null;
  js.state.calls = 0;
  let result;
  try { result = js.game.playHuman(index); } catch (error) { throw new Error(`${where}: ${error.message}`); }
  const fail = (what, a, b) => { throw new Error(`${where}: ${what}: port ${a}, original ${b}`); };
  if (result.ok !== java.legal) fail('legality', result.ok, java.legal);
  if (!java.legal) return result;
  if (result.status !== java.status) fail('status', result.status, java.status);
  if (result.turn !== java.potez) fail('turn counter', result.turn, java.potez);
  if (result.board.join('') !== java.board) fail('board', result.board.join(''), java.board);
  if (java.status !== 2) {
    if (result.cpuMove !== java.last) fail('CPU move', result.cpuMove, java.last);
    if (java.fallback && js.state.calls === 0) fail('random fallback', 'not reached', 'reached');
    if (!java.fallback && js.state.calls > 0) {
      if (empty > 3) fail('random fallback', 'reached', 'not reached');
      java.fallback = true;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Human behaviour used to provoke the CPU: four styles, seeded
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];

function potential(board, index, who) {
  const r = Math.trunc(index / 10), c = index % 10;
  let total = 0;
  for (const [dr, dc] of DIRECTIONS) {
    for (let offset = -4; offset <= 0; offset++) {
      let count = 0, usable = true;
      for (let k = 0; k < 5 && usable; k++) {
        const rr = r + dr * (offset + k), cc = c + dc * (offset + k);
        if (rr < 0 || rr > 9 || cc < 0 || cc > 9) { usable = false; break; }
        const value = board[rr * 10 + cc];
        if (rr === r && cc === c) count += 1;
        else if (value === who) count += 1;
        else if (value !== 0) usable = false;
      }
      if (usable) total += count * count * count;
    }
  }
  return total;
}

function nearStone(board, index, distance) {
  const r = Math.trunc(index / 10), c = index % 10;
  for (let rr = Math.max(0, r - distance); rr <= Math.min(9, r + distance); rr++)
    for (let cc = Math.max(0, c - distance); cc <= Math.min(9, c + distance); cc++)
      if (board[rr * 10 + cc] !== 0) return true;
  return false;
}

function pickMove(board, rng, style) {
  const empty = [];
  for (let i = 0; i < 100; i++) if (board[i] === 0) empty.push(i);
  if (!empty.length) return -1;
  const any = () => empty[Math.floor(rng() * empty.length)];
  if (style === 0) return any();
  if (style === 1) {
    const near = empty.filter((i) => nearStone(board, i, 2));
    return near.length ? near[Math.floor(rng() * near.length)] : any();
  }
  if (rng() < 0.12) return any();
  const weight = style === 2 ? 0 : 0.9;     // style 2 builds its own lines, style 3 also blocks the CPU
  let best = -1, bestScore = -1, ties = 0;
  for (const i of empty) {
    const score = potential(board, i, 1) + weight * potential(board, i, 2);
    if (score > bestScore) { best = i; bestScore = score; ties = 1; }
    else if (score === bestScore) { ties += 1; if (rng() * ties < 1) best = i; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Lockstep run: the original drives, the port must follow
// ---------------------------------------------------------------------------
async function lockstep(oracle, { games, seed, log = () => {} }) {
  const rng = mulberry32(seed);
  const transcript = [];
  const stats = { games, steps: 0, illegal: 0, fallback: 0, humanWins: 0, cpuWins: 0, draws: 0, abandoned: 0, depth: {} };
  for (let g = 0; g < games; g++) {
    const style = g % 4;
    const js = makeGame();
    const reply = await oracle.ask('N');
    if (reply !== 'OK 0 0') throw new Error(`game ${g}: unexpected new-game reply ${reply}`);
    js.game.newGame();
    const steps = [];
    let board = '0'.repeat(100).split('').map(Number), status = 0, potez = 0, ended = false;
    const finish = () => { ended = true; };
    while (!ended) {
      const roll = rng();
      if (steps.length > 2 && roll < 0.012) { stats.abandoned += 1; break; }       // "New game" in the middle of a game
      let index = pickMove(board, rng, style);
      if (index < 0 || status !== 0) {                                              // finished game: one more click must be refused
        const empty = board.findIndex((v) => v === 0);
        index = empty >= 0 ? empty : 0;
      } else if (roll < 0.04) {                                                     // click on an occupied square
        const taken = board.findIndex((v) => v !== 0);
        if (taken >= 0) index = taken;
      }
      const java = parseMoveReply(await oracle.ask(`M ${index % 10} ${Math.trunc(index / 10)}`));
      try { compareClick(js, index, java, `game ${g}, click ${steps.length + 1} on square ${index}`, board.filter((v) => v === 0).length); }
      catch (error) { throw new Error(`${error.message}
  turn ${potez}, board before the click: ${board.join('')}`); }
      stats.steps += 1;
      if (!java.legal) {
        steps.push([index]);
        stats.illegal += 1;
        if (status !== 0 || potez >= 50) finish();
        continue;
      }
      board = java.board.split('').map(Number);
      status = java.status; potez = java.potez;
      if (java.fallback && java.status !== 2) stats.fallback += 1;
      steps.push([index, java.status === 2 ? null : java.last, java.fallback ? 1 : 0]);
      if (status !== 0 || potez >= 50) {
        // the game is over: the next click must be refused
        const empty = board.findIndex((v) => v === 0);
        const after = parseMoveReply(await oracle.ask(`M ${empty >= 0 ? empty % 10 : 0} ${Math.trunc((empty >= 0 ? empty : 0) / 10)}`));
        compareClick(js, empty >= 0 ? empty : 0, after, `game ${g}, click after the end`, 0);
        steps.push([empty >= 0 ? empty : 0]);
        stats.illegal += 1;
        stats.steps += 1;
        finish();
      }
    }
    if (status === 2) stats.humanWins += 1; else if (status === 3) stats.cpuWins += 1; else if (potez >= 50) stats.draws += 1;
    const depth = js.game.engine.maxDepthObserved;
    stats.depth[depth] = (stats.depth[depth] ?? 0) + 1;
    transcript.push({ s: steps, st: status });
    if ((g + 1) % 100 === 0) log(`  ${g + 1}/${games} games`);
  }
  return { transcript, stats };
}

async function runCases(oracle) {
  const out = [];
  for (const [id, label, potez, stones, x0, y0, expected] of CASES) {
    const board = caseBoard(stones);
    const [x, y] = caseCoordinates(board, x0, y0);
    const reply = (await oracle.ask(`P ${potez} ${x} ${y} ${board.join('')}`)).split(' ');
    if (reply[0] !== 'R') throw new Error(`${id}: unexpected oracle reply ${reply.join(' ')}`);
    out.push({ id, label, potez, x, y, expected, java: Number(reply[1]), fallback: reply[2] === '1' });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Replay of a recorded transcript against the port (no Java needed)
// ---------------------------------------------------------------------------
function replay(fixture) {
  let steps = 0, fallback = 0;
  fixture.games.forEach((entry, g) => {
    const js = makeGame();
    js.game.newGame();
    let status = 0;
    entry.s.forEach((step, n) => {
      const where = `game ${g}, click ${n + 1} on square ${step[0]}`;
      const [index, cpu, flag] = step;
      js.state.calls = 0;
      js.state.inject = flag === 1 ? cpu : null;
      let result;
      try { result = js.game.playHuman(index); } catch (error) { throw new Error(`${where}: ${error.message}`); }
      steps += 1;
      if (step.length === 1) {
        if (result.ok) throw new Error(`${where}: the port accepted a click the original refused`);
        return;
      }
      if (!result.ok) throw new Error(`${where}: the port refused a click the original accepted`);
      status = result.status;
      if (cpu === null) {
        if (result.status !== 2) throw new Error(`${where}: the original recorded a win for X, the port did not`);
      } else {
        if (result.cpuMove !== cpu) throw new Error(`${where}: CPU move: port ${result.cpuMove}, original ${cpu}`);
        if (flag === 1) { fallback += 1; if (js.state.calls === 0) throw new Error(`${where}: the port did not reach the random fallback`); }
      }
    });
    if (status !== entry.st) throw new Error(`game ${g}: final status: port ${status}, original ${entry.st}`);
  });
  const cases = fixture.cases.map((c) => {
    const { game } = makeGame();
    game.engine.reset();
    game.engine.potez = c.potez;
    const board = caseBoard(CASES.find((row) => row[0] === c.id)[3]);
    board.forEach((v, i) => { game.engine.t[0][i] = v; });
    return { id: c.id, port: game.engine.igraj(c.x, c.y), original: c.java, expected: c.expected };
  });
  return { steps, fallback, cases };
}

// ---------------------------------------------------------------------------
async function main() {
  const [command = 'check', ...rest] = process.argv.slice(2);
  const option = (name, fallback) => { const i = rest.indexOf(name); return i >= 0 ? Number(rest[i + 1]) : fallback; };
  const games = option('--games', 600), seed = option('--seed', 20070101);
  const classDir = fs.mkdtempSync(path.join(os.tmpdir(), 'xoworld-oracle-'));
  compile(classDir);
  if (process.env.XOWORLD_CLASS) fs.copyFileSync(process.env.XOWORLD_CLASS, path.join(classDir, 'xoworld.class'));   // e.g. the 2007 binary shipped in the archive
  const oracle = new JavaOracle(classDir);
  try {
    console.log(process.env.XOWORLD_CLASS ? `Original applet taken from ${process.env.XOWORLD_CLASS}; running on ${oracle.version}.` : `Original applet compiled from reference/javagames-1.0/xoworld.java; running on ${oracle.version}.`);
    const cases = await runCases(oracle);
    for (const c of cases) {
      if (c.fallback) throw new Error(`${c.id}: the original answered at random`);
      if (c.java !== c.expected) throw new Error(`${c.id}: the original answers ${c.java}, the delivered expectation is ${c.expected}`);
    }
    console.log(`${cases.length} delivered positions: the original agrees with every delivered expectation.`);
    const { transcript, stats } = await lockstep(oracle, { games, seed, log: console.log });
    console.log(`${games} games, ${stats.steps} clicks, ${stats.fallback} random-fallback replies, ${stats.illegal} refused clicks; ` +
      `X won ${stats.humanWins}, O won ${stats.cpuWins}, ${stats.draws} full boards, ${stats.abandoned} abandoned; search depth reached per game: ${JSON.stringify(stats.depth)}.`);
    console.log('The port agrees with the original on every click.');
    if (command === 'record') {
      const fixture = {
        oracle: 'xoworld-java-lockstep',
        generator: { seed, games },
        sources: { 'reference/javagames-1.0/xoworld.java': digest(JAVA_SOURCE), 'test/java-oracle/XOWorldOracle.java': digest(HARNESS_SOURCE) },
        recordedWith: { java: oracle.version, node: process.version, platform: process.platform },
        stats,
        cases: cases.map(({ id, potez, x, y, expected, java }) => ({ id, potez, x, y, expected, java })),
        games: transcript,
      };
      fs.mkdirSync(path.dirname(FIXTURE), { recursive: true });
      fs.writeFileSync(FIXTURE, `${JSON.stringify(fixture)}\n`);
      console.log(`Recorded ${path.relative(ROOT, FIXTURE)} (${fs.statSync(FIXTURE).size} bytes).`);
    }
  } finally {
    await oracle.close();
    fs.rmSync(classDir, { recursive: true, force: true });
  }
}

module.exports = { CASES, FIXTURE, JAVA_SOURCE, HARNESS_SOURCE, compile, JavaOracle, lockstep, runCases, replay, sha256 };

if (require.main === module) main().catch((error) => { console.error(error.message); process.exit(1); });
