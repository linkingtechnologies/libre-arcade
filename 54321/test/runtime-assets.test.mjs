import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const runtimeDir = resolve('public/src/assets/original');
const referenceDir = resolve('reference/54321-1.0.2001.11.16/images');
const required = [
  'on', 'off', 'covered', 'uncovered', 'flagged', 'bomb',
  'unmarked', 'marked', 'goal', 'me',
  'wall0', 'wall1', 'wall2', 'wall3', 'wall4', 'wall5', 'wall6', 'wall7',
  'peg', 'hole', 'empty', 'selected', 'centers', 'borders',
  'panel', 'dimOn', 'dimOff', 'setOn', 'setOff', 'actOn', 'actOff',
  'helpOn', 'helpOff', 'victory', 'defeat',
].map((name) => `${name}.png`);

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

test('every runtime original asset required by the UI exists', async () => {
  for (const name of required) {
    const bytes = await readFile(resolve(runtimeDir, name));
    assert.ok(bytes.length > 0, `${name} must not be empty`);
  }
});

test('runtime original PNGs are byte-identical copies of the preserved 2001 files', async () => {
  for (const name of required) {
    const runtime = await readFile(resolve(runtimeDir, name));
    const reference = await readFile(resolve(referenceDir, name));
    assert.equal(sha256(runtime), sha256(reference), `${name} diverged from /reference`);
  }
});
