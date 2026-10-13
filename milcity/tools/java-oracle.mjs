#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

// Differential oracle for the JavaScript port of MilCity - Blue Edition.
//
//   node tools/java-oracle.mjs check  [scenario ...] [--slots N]      play the scenarios on the original and on the port and compare
//   node tools/java-oracle.mjs record [scenario ...]                  the same, and write what the original did to test/fixtures/
//   node tools/java-oracle.mjs list
//
// The original's classes (reference/milcity-blue-1.0.5/src, core and the model and views of gui) are compiled unmodified, with
// stand-ins for the handset's API (test/java-oracle/javax) and, at run time, three names in their constant pools redirected to
// stand-ins for the clock, the threads and `new Random()` (test/java-oracle/oracle/launch/RewritingLoader.java). They run in virtual
// time. JAVA and JAVAC choose the tools.
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runPort } from './oracle-port.mjs';
import { SCENARIOS, writeScenario } from './oracle-scenarios.mjs';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const FIXTURE = join(ROOT, 'test', 'fixtures', 'java-oracle.json');
const ORIGINAL = join(ROOT, 'reference', 'milcity-blue-1.0.5', 'src', 'fr', 'uha', 'ensisa', 'ir', 'walther', 'milcityblue');
const HARNESS = join(ROOT, 'test', 'java-oracle');

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

// What of the original is compiled: the core without the Bluetooth player, and the model, the views and the engine of the GUI.
function originalFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.java') && entry.name !== 'RemotePlayer.java') files.push(path);
    }
  };
  walk(join(ORIGINAL, 'core'));
  for (const name of ['GameModel', 'GameView', 'MilCityModel', 'GridView', 'CursorView', 'MenuView', 'ImageDrawer', 'GameEngine']) files.push(join(ORIGINAL, 'gui', `${name}.java`));
  return files;
}

function harnessFiles() {
  const files = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name.endsWith('.java')) files.push(path);
    }
  };
  walk(HARNESS);
  return files;
}

export function sourcesHash() {
  const hash = createHash('sha256');
  for (const file of [...originalFiles(), ...harnessFiles()].sort()) hash.update(relative(ROOT, file).replaceAll('\\', '/')).update(readFileSync(file));
  return hash.digest('hex');
}

const tool = (name, env) => process.env[env] ?? name;

function javacMajor(javac) {
  const out = spawnSync(javac, ['-version'], { encoding: 'utf8' });
  const text = `${out.stdout}${out.stderr}`;
  const match = /javac (?:1\.)?(\d+)/.exec(text);
  if (!match) throw new Error(`cannot tell the version of ${javac}: ${text}`);
  return Number(match[1]);
}

/** Compiles the original and the harness once per content, into the temporary directory. */
export function build() {
  const hash = sourcesHash();
  const out = join(tmpdir(), `milcity-oracle-${hash.slice(0, 16)}`);
  const classes = join(out, 'classes');
  if (!existsSync(join(classes, 'oracle', 'launch', 'Main.class'))) compile(out, classes);
  return withDeployedClasses(out, classes);
}

function compile(out, classes) {
  mkdirSync(out, { recursive: true });
  const javac = tool('javac', 'JAVAC');
  const files = [...originalFiles(), ...harnessFiles()];
  const args = ['-encoding', 'ISO-8859-1', '-nowarn', '-d', classes];
  if (javacMajor(javac) >= 9) args.push('--release', '8');
  const result = spawnSync(javac, [...args, ...files], { encoding: 'utf8' });
  if (result.status !== 0) throw new Error(`javac failed:\n${result.stdout}${result.stderr}`);
}

// MILCITY_CLASSES: a directory holding the classes of the author's deployed MilCity-Blue.jar (unzipped). The oracle then runs those in
// place of the classes compiled here from the source, to show that the binary he published does what the source does.
function withDeployedClasses(out, classes) {
  if (!process.env.MILCITY_CLASSES) return classes;
  const given = resolve(process.env.MILCITY_CLASSES);
  const merged = join(out, `classes-${sha256(given).slice(0, 8)}`);
  if (!existsSync(merged)) {
    cpSync(classes, merged, { recursive: true });
    cpSync(join(given, 'fr'), join(merged, 'fr'), { recursive: true });
  }
  return merged;
}

function scenarioText(scenario, dumps = []) {
  const lines = [
    `mode ${scenario.mode}`, `water ${scenario.water}`, `maxScore ${scenario.maxScore}`, `money ${scenario.money}`, `seed ${scenario.seed}`,
    `slots ${scenario.slots}`, `keys ${scenario.keys.join(' ')}`,
  ];
  for (const act of scenario.acts) lines.push(`act ${act.join(' ')}`);
  for (const slot of dumps) lines.push(`dump ${slot}`);
  return `${lines.join('\n')}\n`;
}

/** Runs the scenario on the original. Resolves to { crcs, texts, seeds }. */
export function runOriginal(scenario, dumps = []) {
  const classes = build();
  return new Promise((resolvePromise, reject) => {
    const child = spawn(tool('java', 'JAVA'), ['-Xmx256m', '-Xss512k', '-cp', classes, 'oracle.launch.Main', classes], { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', (chunk) => { out += chunk; });
    child.stderr.on('data', (chunk) => { err += chunk; });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code !== 0) { reject(new Error(`the original exited with ${code}\n${err}`)); return; }
      const crcs = [], texts = new Map();
      let seeds = null;
      for (const line of out.split(/\r?\n/)) {
        if (line.startsWith('S ')) crcs[Number(line.split(' ')[1])] = line.split(' ')[2];
        else if (line.startsWith('D ')) {
          const first = line.indexOf(' ', 2);
          texts.set(Number(line.slice(2, first)), line.slice(first + 1).replaceAll('|', '\n'));
        } else if (line.startsWith('END ')) seeds = Number(line.split(' ')[2]);
      }
      if (err.trim()) reject(new Error(`the original wrote to stderr:\n${err}`));
      else resolvePromise({ crcs, texts, seeds });
    });
    child.stdin.end(scenarioText(scenario, dumps));
  });
}

// A recorded scenario, in a form that is small in the repository: the keys that are not zero as [slot, value], the checksums of
// all the slots as one string of 8 hexadecimal digits each.
export function pack(scenario, crcs) {
  const { keys, ...rest } = scenario;
  return { ...rest, keys: keys.flatMap((k, slot) => (k ? [[slot, k]] : [])), crcs: crcs.join('') };
}

export function unpack(entry) {
  const keys = new Array(entry.slots).fill(0);
  for (const [slot, value] of entry.keys) keys[slot] = value;
  return { ...entry, keys, crcs: entry.crcs.match(/.{8}/g) };
}

/** The first line on which two state texts differ, and what differs on it (for a long line, the first cells that differ). */
export function describeDifference(original, port) {
  const a = original.split('\n'), b = port.split('\n');
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i] === b[i]) continue;
    const label = (a[i] ?? b[i] ?? '').split(' ')[0];
    const left = (a[i] ?? '').split(/[ ,]/), right = (b[i] ?? '').split(/[ ,]/);
    const diffs = [];
    for (let k = 0; k < Math.max(left.length, right.length) && diffs.length < 8; k++) if (left[k] !== right[k]) diffs.push(`#${k}: original ${left[k]} / port ${right[k]}`);
    return `line ${label}: ${diffs.join('; ')}`;
  }
  return 'no difference in the texts';
}

async function compare(scenario, { quiet = false } = {}) {
  const t0 = Date.now();
  const port = runPort(scenario);
  const original = await runOriginal(scenario);
  let first = -1;
  for (let slot = 0; slot < scenario.slots; slot++) if (original.crcs[slot] !== port.crcs[slot]) { first = slot; break; }
  const summary = `${scenario.name}: ${scenario.slots} slots, ${scenario.acts.length} actions, the original took ${original.seeds} seeds, ${((Date.now() - t0) / 1000).toFixed(1)} s`;
  if (first < 0) {
    if (!quiet) console.log(`ok   ${summary}`);
    return { ok: true, original };
  }
  const detail = await runOriginal(scenario, [first]);
  const text = runPort(scenario, { textAt: new Set([first]) }).texts.get(first);
  console.log(`FAIL ${summary}\n     first difference at slot ${first} (${(first / 10).toFixed(1)} s): ${describeDifference(detail.texts.get(first), text)}`);
  return { ok: false, slot: first };
}

const args = process.argv.slice(2);
const command = args[0];
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  // the names of scenarios: the words that are not options and not the values of options
  const names = args.slice(1).filter((a, i) => !a.startsWith('--') && !(args[i].startsWith('--')));
  const slotsOption = args.indexOf('--slots');
  const slots = slotsOption >= 0 ? Number(args[slotsOption + 1]) : null;
  const seedsOption = args.indexOf('--seeds');
  const rounds = seedsOption >= 0 ? Number(args[seedsOption + 1]) : 1;
  // with --seeds N, each scenario is played N times, with other seeds and with the water in other steps of 5% (a coast can only come out
  // differently when the target does not fall at the end of a round of ten walkers, which depends on it)
  const chosen = [];
  for (let round = 0; round < rounds; round++) {
    for (const spec of SCENARIOS.filter((s) => names.length === 0 || names.includes(s.name))) {
      chosen.push({ ...spec, name: round ? `${spec.name}#${round}` : spec.name, seed: spec.seed + 1000 * round, water: round ? 5 + ((spec.water / 5 + 3 * round) % 19) * 5 : spec.water, slots: slots ? Math.min(spec.slots, slots) : spec.slots });
    }
  }
  if (command === 'list') {
    for (const s of SCENARIOS) console.log(`${s.name.padEnd(18)} mode ${s.mode}, ${s.slots} slots, ${s.policy}`);
  } else if (command === 'check' || command === 'record') {
    // a check that checks nothing must not succeed
    if (chosen.length === 0) { console.log(`no scenario matches: ${names.join(' ')}`); process.exit(2); }
    let failed = 0;
    const recorded = [];
    for (const spec of chosen) {
      const scenario = writeScenario(spec);
      const result = await compare(scenario);
      if (!result.ok) failed++;
      else recorded.push({ scenario, crcs: result.original.crcs });
    }
    if (command === 'record') {
      if (failed) { console.log('nothing recorded: the port and the original disagree'); process.exit(1); }
      mkdirSync(dirname(FIXTURE), { recursive: true });
      writeFileSync(FIXTURE, `${JSON.stringify({ sources: sourcesHash(), scenarios: recorded.map((r) => pack(r.scenario, r.crcs)) })}\n`);
      console.log(`recorded ${recorded.length} scenarios in ${relative(ROOT, FIXTURE)} (${(statSync(FIXTURE).size / 1024).toFixed(0)} KiB)`);
    }
    console.log(failed ? `${failed} scenario(s) differ from the original` : 'everything agrees with the original');
    process.exit(failed ? 1 : 0);
  } else {
    console.log('usage: node tools/java-oracle.mjs check|record|list [scenario ...] [--slots N]');
  }
}

export { sha256 };
