// Native and Python parity oracles are expensive to compile or interpret and
// need toolchains that most machines (Windows in particular) do not have. This
// helper runs an oracle live when CONNECTLAB_LIVE_ORACLES=1, and otherwise
// replays the stdout recorded by an earlier live run from test/fixtures/.
//
//   CONNECTLAB_LIVE_ORACLES=1                          run the oracle for real
//   CONNECTLAB_LIVE_ORACLES=1 CONNECTLAB_RECORD_ORACLES=1   ...and re-record it
//
// A recorded output carries the SHA-256 of the inputs it answered, so a changed
// vector set or changed weights makes the replay fail loudly instead of passing
// against a stale answer.

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.join(here, 'fixtures');
const win = process.platform === 'win32';

export const live = process.env.CONNECTLAB_LIVE_ORACLES === '1';
const record = process.env.CONNECTLAB_RECORD_ORACLES === '1';
export const PYTHON = process.env.PYTHON ?? (win ? 'python' : 'python3');
export const CC = process.env.CC ?? (win ? 'gcc' : 'cc');
export const CXX = process.env.CXX ?? 'g++';

export const binaryPath = (name) => path.join(os.tmpdir(), `connectlab-${name}${win ? '.exe' : ''}`);

const sha256 = (value) => crypto.createHash('sha256').update(typeof value === 'string' ? value : JSON.stringify(value)).digest('hex');

function toolVersion(command, args = ['--version']) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return `${result.stdout ?? ''}${result.stderr ?? ''}`.split('\n')[0].trim() || 'unknown';
}

export function compile(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  assert.equal(result.status, 0, `${command} failed: ${result.error?.message ?? result.stderr}`);
}

export function oracleOutput(name, input, produce, tool) {
  const file = path.join(fixtureDir, `${name}.json`);
  const inputSha256 = sha256(input);
  if (live) {
    const stdout = produce();
    if (record) {
      fs.mkdirSync(fixtureDir, { recursive: true });
      const recordedWith = { platform: process.platform, arch: process.arch, node: process.version, tool: tool ? toolVersion(...tool) : undefined };
      fs.writeFileSync(file, `${JSON.stringify({ oracle: name, inputSha256, recordedWith, stdout }, null, 2)}\n`);
    }
    return stdout;
  }
  if (!fs.existsSync(file)) {
    const error = new Error(`No recorded output for oracle "${name}". Run it once with CONNECTLAB_LIVE_ORACLES=1 CONNECTLAB_RECORD_ORACLES=1 on a machine with the required toolchain.`);
    error.code = 'NO_RECORDED_ORACLE';
    throw error;
  }
  const recorded = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(recorded.inputSha256, inputSha256, `Recorded output for "${name}" answers different inputs; re-record it with CONNECTLAB_LIVE_ORACLES=1 CONNECTLAB_RECORD_ORACLES=1.`);
  return recorded.stdout;
}
