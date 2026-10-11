#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Differential oracle for the JavaScript port of Bomber.
//
//   node tools/java-oracle.mjs check  [--runs N] [--iterations N] [--seed S]
//   node tools/java-oracle.mjs record [--runs N] [--iterations N] [--seed S]
//
// The preserved original game loop (reference/bomber-1.0/src/GameCanvasBomber.java)
// is compiled unmodified, with stand-ins for the MIDP API and for Thread (see
// test/java-oracle/), and run for N seeded games. After every iteration of its
// loop it reports its state; the port, driven by the same keys, must reach the
// same state, the same tones and the same waits. `record` writes what the
// original did to test/fixtures/java-oracle.json, which `npm test` replays
// against the port without Java. JAVA and JAVAC choose the tools. BOMBER_CLASS points at a
// compiled GameCanvasBomber.class to run instead of the source build, for example the
// classes/GameCanvasBomber.class of the SourceForge Bomber.zip (not kept in this repository):
// its reference to java.lang.Thread is redirected in memory, see redirectThread().

import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { BomberGame, TICK_MS, BUILDING_COUNT } from '../public/src/game-state.js';
import { AudioEngine } from '../public/src/audio.js';
import { JavaRandom } from '../public/src/rng.js';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const ORIGINAL_SOURCE = join(ROOT, 'reference', 'bomber-1.0', 'src', 'GameCanvasBomber.java');
export const ORACLE_DIR = join(ROOT, 'test', 'java-oracle');
export const FIXTURE = join(ROOT, 'test', 'fixtures', 'java-oracle.json');

export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const fileSha256 = (path) => sha256(readFileSync(path));

// ---------------------------------------------------------------------------
// What the web port plays and waits for, taken from the port's own modules
// ---------------------------------------------------------------------------
class SpyAudio extends AudioEngine {
  constructor() { super(); this.calls = []; }
  tone(note, duration = 50, volume = 100) { this.calls.push([note, duration, volume]); }
}
const melody = (name) => { const spy = new SpyAudio(); const total = spy[name](); return { tones: spy.calls, total }; };
const START = melody('startMelody');
const SUCCESS = melody('successMelody');
const CRASH = melody('crashMelody');
const STARTUP_MS = 3000;          // app.js holds the startup screen for 3000 ms
const CRASH_FLASH_STEPS = 30;     // app.js: 30 flashes
const CRASH_FLASH_MS = 100;       // ... every 100 ms

const toneText = (tones) => (tones.length ? tones.map(([n, d, v]) => `${n}:${d}:${v}`).join(',') : '-');
const STATUS = { startup: 0, title: 1, 'city-intro': 2, playing: 3 };

// ---------------------------------------------------------------------------
// The port, driven the way the original's loop drives the original
// ---------------------------------------------------------------------------
function numbers(values) { return (values ?? Array(BUILDING_COUNT).fill(0)).join(','); }

export function simulate({ seed, keys }) {
  const game = new BomberGame({ seed });
  const lines = [];
  let from = 0;
  const stats = { crashes: 0, landings: 0, impacts: 0, destroyed: 0, bombs: 0, games: 0, maxLandings: 0, maxScore: 0 };
  for (let k = 0; k < keys.length; k++) {
    const key = keys[k];
    let ms = 0;
    let tones = [];
    let record = '-';
    if (game.state === 'startup') { game.completeStartup(); ms += STARTUP_MS; }
    else if (game.state === 'title') {
      record = String(game.scoreRecord);
      if (key) { game.newGame(); stats.games += 1; }
    } else if (game.state === 'city-intro') { tones = START.tones.slice(); ms += START.total; game.beginPlay(); }
    else if (game.state === 'playing') {
      const wasBomb = game.bombStatus;
      const result = game.tick(key === 1);
      if (wasBomb === 0 && game.bombStatus === 1 && result.event !== 'impact') stats.bombs += 1;
      ms += result.blockingMs || 0;
      if (result.event === 'motor') tones.push([30, TICK_MS, 100]);
      else if (result.event === 'bomb-fall') tones.push([110 - game.bombLife, 20, 10]);
      else if (result.event === 'impact') { stats.impacts += 1; stats.destroyed += result.destroyed; for (let i = 0; i < result.destroyed; i++) tones.push([10, 25, 100]); }
      else if (result.event === 'crash') {
        for (let i = 0; i < CRASH_FLASH_STEPS; i++) game.randomCrashFrame();
        ms += CRASH_FLASH_STEPS * CRASH_FLASH_MS + CRASH.total;
        tones = CRASH.tones.slice();
        game.completeCrash();
        stats.crashes += 1;
      } else if (result.event === 'success') {
        ms += SUCCESS.total;
        tones = SUCCESS.tones.slice();
        game.completeSuccess();
        stats.landings += 1;
      }
    }
    ms += TICK_MS;
    const to = game.state === 'success' || game.state === 'crash' ? -1 : STATUS[game.state];
    stats.maxLandings = Math.max(stats.maxLandings, game.landings);
    stats.maxScore = Math.max(stats.maxScore, game.score);
    lines.push([
      'I', k, key, from, to, game.score, game.landings, record,
      game.planeX ?? 0, game.planeY ?? 0, game.bombStatus, game.bombX ?? 0, game.bombY ?? 0,
      game.bombStatus === 1 ? game.bombLife : '-', game.planeFrame ?? 0, ms,
      numbers(game.buildingHeights), numbers(game.buildingCaps), numbers(game.buildingColours), toneText(tones),
    ].join(' '));
    from = to;
  }
  return { lines, stats };
}

// ---------------------------------------------------------------------------
// What the original is known to do differently from the port, normalised away
// ---------------------------------------------------------------------------
// After a successful landing the original, still in the same iteration, takes the
// "move the bomb" branch with no bomb in flight and plays one motor tone before the
// next iteration starts the new city's melody. The port does not play it.
export function normaliseOriginal(lines) {
  let landingMotorTones = 0;
  const out = lines.map((line) => {
    const f = line.split(' ');
    if (f[3] === '3' && f[4] === '2') {
      const tones = f[19].split(',');
      if (tones[tones.length - 1] === `30:${TICK_MS}:100`) { tones.pop(); landingMotorTones += 1; f[19] = tones.length ? tones.join(',') : '-'; }
    }
    return f.join(' ');
  });
  return { lines: out, landingMotorTones };
}

const FIELDS = ['I', 'iteration', 'key', 'from', 'to', 'score', 'landings', 'record', 'planeX', 'planeY', 'bombStatus', 'bombX', 'bombY', 'bombLife', 'planeFrame', 'ms', 'heights', 'caps', 'colours', 'tones'];
export function firstDifference(a, b) {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] === b[i]) continue;
    const x = (a[i] ?? '').split(' '), y = (b[i] ?? '').split(' ');
    const field = FIELDS.find((_, j) => x[j] !== y[j]) ?? 'length';
    const j = FIELDS.indexOf(field);
    return { line: i, field, a: x[j], b: y[j], context: (a[i - 1] ?? '').split(' ').slice(0, 16).join(' ') };
  }
  return null;
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

function javaFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? javaFiles(join(dir, entry.name)) : entry.name.endsWith('.java') ? [join(dir, entry.name)] : []));
}

export function compile(outDir, javac = process.env.JAVAC || 'javac') {
  mkdirSync(outDir, { recursive: true });
  const { major } = javaMajor(javac);
  const args = ['-nowarn', '-Xlint:none', ...(major >= 9 ? ['--release', '8'] : []), '-d', outDir, ORIGINAL_SOURCE, ...javaFiles(ORACLE_DIR)];
  const result = spawnSync(javac, args, { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`${javac} failed: ${result.error?.message ?? result.stderr}`);
  if (process.env.BOMBER_CLASS) {
    const { bytes, replaced } = redirectThread(readFileSync(process.env.BOMBER_CLASS));
    writeFileSync(join(outDir, 'GameCanvasBomber.class'), bytes);
    console.log(`Compiled class ${process.env.BOMBER_CLASS}: ${replaced} constant-pool entries pointed at java.lang.Thread now point at the virtual-time Thread (the file itself is not changed).`);
  }
}

// The compiled original names java.lang.Thread in its constant pool, so the same-package trick that
// works for the source does not reach it. On a copy held in memory, the two UTF-8 entries that spell
// the class (its name and the field descriptor) are rewritten to the stand-in's name. Anything else
// that mentions Thread stops the run instead of being guessed at.
export function redirectThread(input) {
  const bytes = Buffer.from(input);
  if (bytes.readUInt32BE(0) !== 0xCAFEBABE) throw new Error('not a class file');
  const count = bytes.readUInt16BE(8);
  let offset = 10;
  const chunks = [];
  let copied = 0, replaced = 0;
  for (let index = 1; index < count; index++) {
    const tag = bytes[offset];
    if (tag === 1) {
      const length = bytes.readUInt16BE(offset + 1);
      const text = bytes.toString('latin1', offset + 3, offset + 3 + length);
      const swap = text === 'java/lang/Thread' ? 'Thread' : text === 'Ljava/lang/Thread;' ? 'LThread;' : null;
      if (swap === null && /java\/lang\/Thread/.test(text)) throw new Error(`unhandled reference to java.lang.Thread: ${text}`);
      if (swap !== null) {
        chunks.push(bytes.subarray(copied, offset));
        const entry = Buffer.alloc(3 + swap.length);
        entry[0] = 1; entry.writeUInt16BE(swap.length, 1); entry.write(swap, 3, 'latin1');
        chunks.push(entry);
        copied = offset + 3 + length;
        replaced += 1;
      }
      offset += 3 + length;
    } else if (tag === 3 || tag === 4 || tag === 9 || tag === 10 || tag === 11 || tag === 12) offset += 5;
    else if (tag === 5 || tag === 6) { offset += 9; index += 1; }
    else if (tag === 7 || tag === 8) offset += 3;
    else throw new Error(`unsupported constant pool tag ${tag}`);
  }
  chunks.push(bytes.subarray(copied));
  return { bytes: Buffer.concat(chunks), replaced };
}

export class JavaOracle {
  constructor(classDir, java = process.env.JAVA || 'java') {
    this.version = javaMajor(java).text;
    this.process = spawn(java, ['-cp', classDir, 'BomberOracle'], { stdio: ['pipe', 'pipe', 'inherit'] });
    this.lines = createInterface({ input: this.process.stdout })[Symbol.asyncIterator]();
  }

  async run(seed, iterations, policy, policySeed) {
    this.process.stdin.write(`RUN ${seed} ${iterations} ${policy} ${policySeed}\n`);
    const lines = [];
    for (;;) {
      const { value, done } = await this.lines.next();
      if (done) throw new Error('the Java oracle exited unexpectedly');
      if (value.startsWith('END')) return { lines, end: value };
      if (value.startsWith('ERR')) throw new Error(value);
      lines.push(value);
    }
  }

  async random(seed, count) {
    this.process.stdin.write(`RND ${seed} ${count}
`);
    const { value, done } = await this.lines.next();
    if (done || !value.startsWith('R')) throw new Error('the Java oracle gave no random numbers');
    return value.slice(2);
  }

  async close() {
    this.process.stdin.write('QUIT\n');
    this.process.stdin.end();
    await new Promise((done) => this.process.on('close', done));
  }
}

// java.util.Random.nextInt(bound), the sequence the harness prints for the RND command.
export const RANDOM_SEEDS = [0, 1, 12345, 20081221, 2147483647, 1099511627779, -5];
export function portRandom(seed, count) {
  const random = new JavaRandom(seed);
  return Array.from({ length: count }, (_, i) => random.nextInt(1 + (i * 7) % 100)).join(' ');
}

const keysOf = (lines) => lines.map((line) => Number(line.split(' ')[2]));
const packKeys = (keys) => { const bytes = Buffer.alloc(Math.ceil(keys.length / 8)); keys.forEach((v, i) => { if (v) bytes[i >> 3] |= 1 << (i & 7); }); return bytes.toString('base64'); };
export const unpackKeys = (text, length) => { const bytes = Buffer.from(text, 'base64'); return Array.from({ length }, (_, i) => (bytes[i >> 3] >> (i & 7)) & 1); };

// A tiny seeded generator for choosing the runs (not the game's own).
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function planRuns(count, seed) {
  const rng = mulberry32(seed);
  return Array.from({ length: count }, (_, i) => ({ seed: Math.floor(rng() * 2 ** 31) + 1, policy: i % 5, policySeed: Math.floor(rng() * 2 ** 31) }));
}

// ---------------------------------------------------------------------------
// Replay of a recorded fixture against the port (no Java needed)
// ---------------------------------------------------------------------------
export function replay(fixture) {
  for (const entry of fixture.random) {
    if (sha256(portRandom(entry.seed, entry.count)) !== entry.sha256) throw new Error(`the port's random generator differs from java.util.Random for seed ${entry.seed}`);
  }
  const totals = { runs: 0, iterations: 0, crashes: 0, landings: 0, impacts: 0, destroyed: 0, bombs: 0, maxLandings: 0, maxScore: 0, games: 0 };
  for (const [index, run] of fixture.runs.entries()) {
    const keys = unpackKeys(run.keys, run.iterations);
    const { lines, stats } = simulate({ seed: run.seed, keys });
    const digest = sha256(lines.join('\n'));
    if (digest !== run.traceSha256) throw new Error(`run ${index} (seed ${run.seed}, policy ${run.policy}) differs from what the original did; run npm run test:live for a line-by-line comparison`);
    totals.runs += 1; totals.iterations += lines.length;
    for (const name of ['crashes', 'landings', 'impacts', 'destroyed', 'bombs', 'games']) totals[name] += stats[name];
    totals.maxLandings = Math.max(totals.maxLandings, stats.maxLandings);
    totals.maxScore = Math.max(totals.maxScore, stats.maxScore);
  }
  return totals;
}

// ---------------------------------------------------------------------------
async function main() {
  const [command = 'check', ...rest] = process.argv.slice(2);
  const option = (name, fallback) => { const i = rest.indexOf(name); return i >= 0 ? Number(rest[i + 1]) : fallback; };
  const runsCount = option('--runs', 200), iterations = option('--iterations', 2000), masterSeed = option('--seed', 20081221);
  const classDir = mkdtempSync(join(tmpdir(), 'bomber-oracle-'));
  compile(classDir);
  const oracle = new JavaOracle(classDir);
  console.log(`Original loop ${process.env.BOMBER_CLASS ? `taken from ${process.env.BOMBER_CLASS}` : 'compiled from reference/bomber-1.0/src/GameCanvasBomber.java'}; running on ${oracle.version}.`);
  const recorded = [];
  const randomChecks = [];
  const totals = { iterations: 0, crashes: 0, landings: 0, impacts: 0, destroyed: 0, bombs: 0, games: 0, maxLandings: 0, maxScore: 0, landingMotorTones: 0 };
  try {
    for (const seed of RANDOM_SEEDS) {
      const java = await oracle.random(seed, 1000);
      if (java !== portRandom(seed, 1000)) throw new Error(`the port's random generator differs from java.util.Random for seed ${seed}`);
      randomChecks.push({ seed, count: 1000, sha256: sha256(java) });
    }
    console.log(`java.util.Random: ${RANDOM_SEEDS.length} seeds x 1000 values with bounds 1 to 100 (all the powers of two among them) are reproduced by the port's generator.`);
    for (const [index, plan] of planRuns(runsCount, masterSeed).entries()) {
      const java = await oracle.run(plan.seed, iterations, plan.policy, plan.policySeed);
      if (java.end !== 'END ok') throw new Error(`run ${index}: the original ended by itself (${java.end})`);
      const keys = keysOf(java.lines);
      const normal = normaliseOriginal(java.lines);
      const port = simulate({ seed: plan.seed, keys });
      const difference = firstDifference(normal.lines, port.lines);
      if (difference) {
        throw new Error(`run ${index} (seed ${plan.seed}, policy ${plan.policy}) differs at iteration ${difference.line}, field ${difference.field}: original ${difference.a}, port ${difference.b}\n  previous line: ${difference.context}`);
      }
      totals.iterations += port.lines.length; totals.landingMotorTones += normal.landingMotorTones;
      for (const name of ['crashes', 'landings', 'impacts', 'destroyed', 'bombs', 'games']) totals[name] += port.stats[name];
      totals.maxLandings = Math.max(totals.maxLandings, port.stats.maxLandings);
      totals.maxScore = Math.max(totals.maxScore, port.stats.maxScore);
      recorded.push({ ...plan, iterations: port.lines.length, keys: packKeys(keys), traceSha256: sha256(port.lines.join('\n')) });
      if ((index + 1) % 50 === 0) console.log(`  ${index + 1}/${runsCount} runs`);
    }
    console.log(`${runsCount} runs, ${totals.iterations} iterations of the original loop: ${totals.games} games started, ${totals.crashes} crashes, ${totals.landings} landings (up to ${totals.maxLandings} in one game), ${totals.impacts} bomb impacts destroying ${totals.destroyed} blocks, best score ${totals.maxScore}.`);
    console.log(`The port agrees with the original after every iteration (state, city, tones and waits). Known difference normalised away: ${totals.landingMotorTones} motor tones the original plays right after a landing.`);
    if (command === 'record') {
      const fixture = {
        oracle: 'bomber-java-loop',
        generator: { runs: runsCount, iterations, seed: masterSeed },
        sources: { 'reference/bomber-1.0/src/GameCanvasBomber.java': fileSha256(ORIGINAL_SOURCE), 'test/java-oracle/BomberOracle.java': fileSha256(join(ORACLE_DIR, 'BomberOracle.java')) },
        recordedWith: { java: oracle.version, node: process.version, platform: process.platform },
        totals,
        random: randomChecks,
        runs: recorded,
      };
      mkdirSync(dirname(FIXTURE), { recursive: true });
      writeFileSync(FIXTURE, `${JSON.stringify(fixture)}\n`);
      console.log(`Recorded ${relative(ROOT, FIXTURE)} (${statSync(FIXTURE).size} bytes).`);
    }
  } finally {
    await oracle.close();
    rmSync(classDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { console.error(error.message); process.exit(1); });
}
