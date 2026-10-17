#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Plays scenarios on the original Ri-li (tools/oracle/, run in WSL or on Linux) and on the page (tools/js-run.mjs) and compares the two after every frame.
//   node tools/oracle.mjs list                     the scenarios and their names
//   node tools/oracle.mjs check [name-prefix ...]  play them (all, or those whose name starts with one of the prefixes) and print what differs
//   node tools/oracle.mjs original name            print the original's records of one scenario (JSON lines)
// The original must have been built (tools/oracle/build.sh, README there). Where it is:
//   RILI_ORACLE   the path of rili-oracle as WSL (or Linux) sees it, if the program is not run in WSL: the path as it is;     (default: tools/oracle/build/rili-oracle)
//   RILI_WSL      the WSL distribution to run it in (default: the default one); set to "none" on Linux

import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PageRun } from './js-run.mjs';
import { sideBySide } from './png.mjs';
import { canonicalOriginal, canonicalPage, digests, THUMB, thumbnail, thumbnailToText } from './canonical.mjs';
import { idle, menuScenarios, planRoute, press, random, route, toText } from './scenarios.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export const toWsl = (p) => {
  const abs = resolve(p);
  const m = /^([A-Za-z]):[\\/](.*)$/.exec(abs);
  return m ? `/mnt/${m[1].toLowerCase()}/${m[2].split(sep).join('/').replaceAll('\\', '/')}` : abs;
};

// ---- the original -------------------------------------------------------------------------------------------------------------------------

export function runOriginal(scenario, { dump = [] } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'rili-scenario-'));
  const file = join(dir, 'scenario.txt');
  writeFileSync(file, toText(scenario) + dump.map((f) => `${scenario.timed ? 'tdump' : 'dump'} ${f} ${toWsl(join(dir, `frame-${f}.rgba`))}
`).join(''));
  const wsl = process.env.RILI_WSL ?? '';
  const bin = process.env.RILI_ORACLE ?? toWsl(join(ROOT, 'tools', 'oracle', 'build', 'rili-oracle'));
  const inner = `mkdir -p /tmp/rili-home && HOME=/tmp/rili-home SDL_VIDEODRIVER=dummy timeout -s KILL 300 '${bin}' '${wsl === 'none' ? file : toWsl(file)}'`;
  const run = () => (wsl === 'none' ? spawnSync('bash', ['-c', inner], { encoding: 'utf8', maxBuffer: 1 << 30 })
    : spawnSync('wsl.exe', [...(wsl ? ['-d', wsl] : []), '--', 'bash', '-c', inner], { encoding: 'utf8', maxBuffer: 1 << 30 }));
  // WSL's virtual machine sometimes fails to start under memory pressure ("The operation timed out ..."): shut it down and try again
  let result = run();
  for (let attempt = 0; attempt < 3 && !result.stdout.includes('{"end"') && wsl !== 'none'; attempt++) {
    spawnSync('wsl.exe', ['--shutdown']);
    result = run();
  }
  if (!result.stdout.includes('{"end"')) { rmSync(dir, { recursive: true, force: true }); throw new Error(`the original did not run (${result.status}): ${(result.stderr + result.stdout).slice(0, 500)}`); }
  const pictures = new Map(dump.map((f) => [f, readFileSync(join(dir, `frame-${f}.rgba`))]));
  rmSync(dir, { recursive: true, force: true });
  const lines = result.stdout.replaceAll('\0', '').split('\n').filter((l) => l.startsWith('{')).map((l) => JSON.parse(l));
  const end = lines.find((l) => l.end);
  return { records: lines.filter((l) => !l.end), end, pictures };
}

// ---- the page -----------------------------------------------------------------------------------------------------------------------------

export async function runPage(scenario, count) {
  const run = await PageRun.create({ language: scenario.language, seed: scenario.seed });
  try {
    run.start(scenario.level, scenario.difficulty);
    const records = [];
    let next = 0;
    const events = scenario.events;
    for (let f = 0; f < count; f++) {
      while (next < events.length && events[next].frame <= f) { const e = events[next++]; if (e.type === 'click') await run.click(); else await run.key(e.type, e.key); }
      run.frame(scenario.dt);
      records.push(run.record(f));
    }
    return records;
  } finally { run.close(); }
}

// The same frames of the page, drawn into the software canvas (800 by 600, RGBA).
export async function runPagePixels(scenario, frames) {
  const run = await PageRun.create({ language: scenario.language, seed: scenario.seed, render: true });
  try {
    run.start(scenario.level, scenario.difficulty);
    const last = Math.max(...frames), want = new Set(frames), pictures = new Map();
    let next = 0;
    for (let f = 0; f <= last; f++) {
      while (next < scenario.events.length && scenario.events[next].frame <= f) { const e = scenario.events[next++]; if (e.type === 'click') await run.click(); else await run.key(e.type, e.key); }
      run.frame(scenario.dt);
      if (want.has(f)) pictures.set(f, Uint8ClampedArray.from(run.pixels()));
    }
    return pictures;
  } finally { run.close(); }
}

// How much two pictures differ: the number of pixels in which a colour channel differs by more than `tolerance`, the largest difference, and where. SDL blends a
// translucent sprite with its own 8-bit arithmetic and a browser (or the shim of canvas-shim.mjs) rounds it another way: a channel off by up to 3 of 255, on a few pixels, is that.
export function comparePictures(a, b, tolerance = 3, ignore = []) {
  let differing = 0, max = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let i = 0; i < 800 * 600; i++) {
    if (ignore.length) { const px = i % 800, py = Math.floor(i / 800); if (ignore.some(([bx0, by0, bx1, by1]) => px >= bx0 && px <= bx1 && py >= by0 && py <= by1)) continue; }
    let d = 0;
    for (let c = 0; c < 3; c++) d = Math.max(d, Math.abs(a[i * 4 + c] - b[i * 4 + c]));
    if (d > max) max = d;
    if (d > tolerance) { differing++; const x = i % 800, y = Math.floor(i / 800); x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  }
  return { differing, max, box: differing ? [x0, y0, x1, y1] : null };
}

// A menu scenario on the page: the keys and the pictures are by the clock (see scenarios.mjs).
export async function runPageMenu(scenario, times) {
  const run = await PageRun.create({ language: scenario.language, seed: scenario.seed, render: true, maxUnlocked: scenario.niveauMax + 1 });   // the original counts levels from 0
  try {
    const want = new Set(times), pictures = new Map();
    let next = 0;
    while (run.clock < scenario.until) {
      while (next < scenario.events.length && scenario.events[next].time <= run.clock) { const e = scenario.events[next++]; if (e.type === 'click') await run.click(); else await run.key(e.type, e.key); }
      run.frame(scenario.dt);
      if (want.has(run.clock)) pictures.set(run.clock, Uint8ClampedArray.from(run.pixels()));
    }
    return pictures;
  } finally { run.close(); }
}

// the original's mouse cursor sprite (group 20 of the sprite manifest)
const CURSOR = JSON.parse(readFileSync(join(ROOT, 'public', 'data', 'sprites.json'), 'utf8')).filter((m) => m.group_name === 'curseur').map((m) => ({ width: Number(m.width), height: Number(m.height), cx: Number(m.cx), cy: Number(m.cy) }));

// ---- the recording -----------------------------------------------------------------------------------------------------------------------

export const FIXTURE = join(ROOT, 'test', 'fixtures', 'original-trace.json');

// the page's blocks of 25 frames and the thumbnails of the pictures at the frames the recording has, for the scenario as the recording stores it
export async function replayScenario(entry) {
  const scenario = entry.scenario;
  if (scenario.timed) {
    const pictures = await runPageMenu(scenario, Object.keys(entry.pictures).map(Number));
    return { thumbnails: Object.fromEntries([...pictures].map(([t, rgba]) => [t, thumbnail(rgba)])) };
  }
  const frames = (await runPage(scenario, entry.frames)).map(canonicalPage);
  const wanted = Object.keys(entry.pictures).map(Number);
  const pictures = wanted.length ? await runPagePixels(scenario, wanted) : new Map();
  return { digests: digests(frames), thumbnails: Object.fromEntries([...pictures].map(([f, rgba]) => [f, thumbnail(rgba)])) };
}

// Plays the scenarios on the original and keeps what the replay needs (see canonical.mjs).
export function recordScenario(scenario) {
  if (scenario.timed) {
    const original = runOriginal(scenario, { dump: scenario.dumps });
    const pictures = {}, ignore = {};
    for (const t of scenario.dumps) {
      pictures[t] = thumbnailToText(thumbnail(original.pictures.get(t)));
      // the original's own mouse cursor is a sprite in the picture (a browser has the system's); the blocks it covers are not compared
      const record = original.records.find((r) => r.t === t);
      const blocks = [];
      for (const [e, frame, x, y] of record?.draws ?? []) {
        if (e !== 20) continue;
        const m = CURSOR[frame], x0 = x - m.cx, y0 = y - m.cy;
        for (let by = Math.floor(y0 / THUMB.block); by <= Math.floor((y0 + m.height - 1) / THUMB.block); by++) for (let bx = Math.floor(x0 / THUMB.block); bx <= Math.floor((x0 + m.width - 1) / THUMB.block); bx++) blocks.push([bx, by]);
      }
      ignore[t] = blocks;
    }
    return { scenario: { ...scenario, dumps: undefined }, frames: original.records.length, pictures, ignore };
  }
  const first = runOriginal(scenario);
  const n = first.records.length;
  const picked = [...new Set([Math.min(40, n - 1), Math.floor(n / 2)])];
  const original = runOriginal({ ...scenario, frames: n }, { dump: picked });
  const pictures = {};
  for (const f of picked) pictures[f] = thumbnailToText(thumbnail(original.pictures.get(f)));
  return { scenario, frames: n, digests: digests(first.records.map(canonicalOriginal)), end: first.end, pictures };
}

// ---- the comparison -----------------------------------------------------------------------------------------------------------------------

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

// What is compared in each frame, in the page's terms (see js-run.mjs). `fields` maps a name to [what the original gives, what the page gives].
export function diffFrame(o, p) {
  const bad = [];
  if (o.k !== p.k) return [`the original is in a frame of kind "${o.k}", the page in "${p.k}" (${p.state ?? ''})`];
  if (o.k === 'q') return diffQuizFrame(o, p);
  const eq = (name, a, b) => { if (!same(a, b)) bad.push(`${name}: original ${JSON.stringify(a)}, page ${JSON.stringify(b)}`); };
  for (const k of ['dg', 'D', 'cell', 'exit', 'ploco', 'nw', 'rem', 'score', 'lives', 'spacing', 'speed', 'vit', 'won', 'pause', 'help', 'alonge', 'reduit', 'vitesse', 'memo', 'board']) eq(k, o[k], p[k]);
  eq('pinter', o.pinter, p.pinter);
  if (o.pinter !== -1) eq('pentree', o.pentree, p.pentree);   // the entry side is only meaningful while there is an arrow
  eq('keys', o.keys, p.keys);
  eq('types', o.types, p.types);
  eq('pw', o.pw, p.pw);
  eq('rand', o.rand, p.rand);
  if (o.draws && p.draws && !same(o.draws, p.draws)) {
    let i = 0;
    while (i < o.draws.length && i < p.draws.length && same(o.draws[i], p.draws[i])) i++;
    bad.push(`draws[${i}] of ${o.draws.length} / ${p.draws.length}: original ${JSON.stringify(o.draws[i])}, page ${JSON.stringify(p.draws[i])}`);
  }
  eq('snd', o.snd.filter((s) => s !== 'p0'), p.snd);
  eq('mort', o.mort === -1 ? null : o.mort - o.hor, p.mortLeft);
  return bad;
}

function diffQuizFrame(o, p) {
  const bad = [];
  const eq = (name, a, b) => { if (!same(a, b)) bad.push(`${name}: original ${JSON.stringify(a)}, page ${JSON.stringify(b)}`); };
  eq('score', o.score, p.score);
  eq('lives', o.lives, p.lives);
  eq('pye', o.pye, p.pye);
  eq('rand', o.rand, p.rand);
  eq('snd', o.snd.filter((s) => s !== 'p0'), p.snd);
  const plates = (list) => list.map((d) => (d[0] === 21 || d[0] === 22 ? [d[0], 0, d[2], d[3]] : d)).filter((d) => d[0] === 33 || d[0] === 21 || d[0] === 22);
  eq('draws', plates(o.draws), p.draws);
  return bad;
}

export function compareRuns(original, page) {
  const n = Math.min(original.records.length, page.length);
  const frames = [];
  for (let f = 0; f < n; f++) { const bad = diffFrame(original.records[f], page[f]); if (bad.length) frames.push({ f, bad }); }
  return { compared: n, frames };
}

// ---- the scenarios ------------------------------------------------------------------------------------------------------------------------

export async function standardScenarios({ all = false } = {}) {
  const list = [];
  for (const level of [1, 2, 7, 13, 26, 39, 50]) for (const difficulty of ['easy', 'normal', 'hard']) list.push(idle({ level, difficulty, seed: level + 3 }));
  for (const level of [1, 3, 9, 20, 33, 45]) for (const seed of [1, 2]) list.push(random({ level, difficulty: ['easy', 'normal', 'hard'][seed % 3], seed }));
  // the same with clicks of the mouse button, which turn the arrow (Jeux::TourneFleche)
  for (const level of [4, 15, 28]) list.push(random({ level, difficulty: 'normal', seed: 5, rate: 25, clicks: true, name: `clicks-L${level}` }));
  for (const level of all ? Array.from({ length: 50 }, (_, i) => i + 1) : [1, 2, 5, 10, 17, 25, 33, 41, 50]) {
    const { plan, frames } = await planRoute(level);
    list.push(route({ level, plan, frames }));
  }
  // the quiz after a won level: the route of level 1, then the keys of the quiz (choose, answer), and the next level
  for (const [name, keys] of [['left', ['left', 'return']], ['right', ['right', 'return']], ['updown', ['up', 'down', 'down', 'return']], ['escape', ['escape']]]) {
    const { plan, frames } = await planRoute(1);
    const win = frames - 60;           // the frame in which the last wagon is taken
    const events = [];
    keys.forEach((key, i) => events.push(...press(win + 210 + i * 12, key)));
    list.push(route({ level: 1, plan, frames: win + 210 + keys.length * 12 + 400, extra: events, name: `quiz-${name}-L1` }));
  }
  return list;
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  let args = rest;
  const everything = args.includes('--all');
  args = args.filter((a) => a !== '--all');
  const all = await standardScenarios({ all: everything });
  const pick = (prefixes) => (prefixes.length ? all.filter((s) => prefixes.some((p) => s.name.startsWith(p))) : all);
  if (cmd === 'list') { for (const s of all) console.log(`${s.name}: ${s.frames} frames, ${s.events.length} key events`); return; }
  if (cmd === 'record') {
    // node tools/oracle.mjs record [name-prefix ...] --all: play the scenarios on the original and write test/fixtures/original-trace.json (the other scenarios' entries are kept)
    const entries = {};
    let previous = {};
    try { previous = JSON.parse(readFileSync(FIXTURE, 'utf8')).scenarios; } catch { /* a first recording */ }
    const scenarios = [...all, ...menuScenarios()].filter((x) => !args.length || args.some((p) => x.name.startsWith(p)));
    for (const s of scenarios) {
      const t = Date.now();
      entries[s.name] = recordScenario(s);
      // the file is written after every scenario, so that a long recording that is stopped keeps what it has done
      writeFileSync(FIXTURE, JSON.stringify({ format: 1, original: 'Ri-li 2.0.1 (reference/Ri-li-2.0.1.tar.bz2), built by tools/oracle/build.sh with g++ and SDL 1.2.15', scenarios: { ...previous, ...entries } }) + '\n');
      console.log(`recorded ${s.name}: ${entries[s.name].frames} frames (${Date.now() - t} ms)`);
    }
    return;
  }
  if (cmd === 'pixels') {
    // node tools/oracle.mjs pixels name [frame ...]: the pictures of the original and of the page in some frames
    const s = all.find((x) => x.name === args[0]);
    const frames = (args.length > 1 ? args.slice(1).map(Number) : [0, 1, 2, 5, 40, 120, 300, 600, 900, 1200, 1499]).filter((f) => f < s.frames);
    const original = runOriginal({ ...s, frames: Math.max(...frames) + 1 }, { dump: frames });
    const page = await runPagePixels(s, frames);
    const png = process.env.RILI_PNG;   // a folder: write the original, the page and the differences of each frame there
    for (const f of frames) {
      console.log(`frame ${f}: ${JSON.stringify(comparePictures(original.pictures.get(f), page.get(f)))}`);
      if (png) writeFileSync(join(png, `${s.name}-${f}.png`), sideBySide(original.pictures.get(f), page.get(f)));
    }
    return;
  }
  if (cmd === 'menus') {
    // node tools/oracle.mjs menus [name-prefix ...]: the pictures of the menus, original and page, at the clock values the scenarios name
    const png = process.env.RILI_PNG;
    let bad = 0;
    for (const s of menuScenarios().filter((x) => !args.length || args.some((p) => x.name.startsWith(p)))) {
      const original = runOriginal(s, { dump: s.dumps });
      const page = await runPageMenu(s, s.dumps);
      for (const t of s.dumps) {
        // the original draws its own mouse cursor (a sprite at the pointer's place, which in a browser is the system's); that box is left out
        const record = original.records.find((r) => r.t === t);
        const cursors = (record?.draws ?? []).filter((d) => d[0] === 20).map(([, frame, x, y]) => { const m = CURSOR[frame]; return [x - m.cx, y - m.cy, x - m.cx + m.width - 1, y - m.cy + m.height - 1]; });
        const result = comparePictures(original.pictures.get(t), page.get(t), 3, cursors);
        if (result.differing) bad++;
        console.log(`${s.name} at ${t}: ${JSON.stringify(result)}`);
        if (png) writeFileSync(join(png, `${s.name}-${t}.png`), sideBySide(original.pictures.get(t), page.get(t)));
      }
    }
    process.exitCode = bad ? 1 : 0;
    return;
  }
  if (cmd === 'quiz-pictures') {
    // node tools/oracle.mjs quiz-pictures [code ...]: the screen of the quiz (the question, the text of the article, the two answers) in some languages, original and page, pixel by pixel
    const base = all.find((x) => x.name === 'quiz-left-L1');
    const first = runOriginal(base).records.findIndex((r) => r.k === 'q');
    const frames = [first + 40, first + 140];
    let bad = 0;
    for (const code of args.length ? args : ['ar', 'jp', 'de']) {
      const s = { ...base, language: code, name: `${base.name}-${code}` };
      const original = runOriginal({ ...s, frames: frames[1] + 1 }, { dump: frames });
      const page = await runPagePixels(s, frames);
      for (const f of frames) {
        const result = comparePictures(original.pictures.get(f), page.get(f));
        if (result.differing) bad++;
        console.log(`${s.name} at frame ${f}: ${JSON.stringify(result)}`);
      }
    }
    process.exitCode = bad ? 1 : 0;
    return;
  }
  if (cmd === 'original') { const s = all.find((x) => x.name === args[0]); const r = runOriginal(s); for (const rec of r.records) console.log(JSON.stringify(rec)); return; }
  if (cmd !== 'check') { console.error('usage: node tools/oracle.mjs list | check [name-prefix ...] | original name'); process.exit(2); }
  let bad = 0;
  for (const s of pick(args)) {
    const t = Date.now();
    const original = runOriginal(s);
    const page = await runPage(s, original.records.length);
    const result = compareRuns(original, page);
    const ok = result.frames.length === 0;
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${s.name}: ${result.compared} frames${original.end?.returned ? ' (the original returned to the menu)' : ''}, ${result.frames.length} with a difference (${Date.now() - t} ms)`);
    for (const fr of result.frames.slice(0, 3)) console.log(`      frame ${fr.f}: ${fr.bad.join('; ').slice(0, 600)}`);
  }
  process.exitCode = bad ? 1 : 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
