// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {
  ORIGINAL_CAMPAIGNS, originalManifestPath, resolveOriginalLevelPath,
  loadGameManifestXml, loadLevelXml, LevelModel, SeededRng
} from '../public/src/index.js';

const dataRoot = new URL('../public/data/original-levels/', import.meta.url);
const filesRoot = new URL('files/', dataRoot);

async function hash(url) {
  const bytes = await readFile(url);
  return createHash('sha256').update(bytes).digest('hex');
}

async function historicalFiles() {
  const out = [];
  async function walk(url, rel = '') {
    for (const entry of await readdir(url, { withFileTypes: true })) {
      const childRel = rel ? `${rel}/${entry.name}` : entry.name;
      const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, url);
      if (entry.isDirectory()) await walk(child, childRel);
      else out.push(childRel);
    }
  }
  await walk(filesRoot);
  return out.sort();
}

test('historical data freeze contains exactly 61 lvl + 5 gms files', async () => {
  const files = await historicalFiles();
  assert.equal(files.filter(f => f.endsWith('.lvl')).length, 61);
  assert.equal(files.filter(f => f.endsWith('.gms')).length, 5);
  assert.equal(files.length, 66);
});

test('representative original XML hashes match the audited OS4 extraction', async () => {
  assert.equal(await hash(new URL('files/Easy.gms', dataRoot)), '2f17d920d046c298ee2d992b5fc92ec00c25bd294a4afe740225239b3199b4f4');
  assert.equal(await hash(new URL('files/Easy/easy-1.lvl', dataRoot)), 'dc3151bdd33d24fb6b33db10cbed00c1b76fd5d737ba7e2228a53c827b8fc1c6');
  assert.equal(await hash(new URL('files/Everything.gms', dataRoot)), '87fa1d290a691c58b345ea3c109a44c7b39f16991cf104712c416e78d1cb2602');
});

test('all five original game manifests resolve on case-sensitive web paths', async () => {
  const expected = new Map([['easy',10],['normal',20],['hard',20],['bubbletrain',11],['everything',50]]);
  const uniqueLevels = new Set();
  for (const campaign of ORIGINAL_CAMPAIGNS) {
    const manifest = loadGameManifestXml(await readFile(new URL(originalManifestPath(campaign.id), dataRoot), 'utf8'));
    assert.equal(manifest.length, expected.get(campaign.id));
    for (const entry of manifest) {
      const actual = resolveOriginalLevelPath(entry.src);
      const xml = await readFile(new URL(actual, dataRoot), 'utf8');
      const def = loadLevelXml(xml);
      assert.equal(def.cannons.length, 1);
      assert.ok(def.trains.length >= 1 && def.trains.length <= 3);
      uniqueLevels.add(actual);
    }
  }
  assert.equal(uniqueLevels.size, 61);
});

test('all 61 original levels instantiate and execute a source-order frame', async () => {
  const files = (await historicalFiles()).filter(f => f.endsWith('.lvl'));
  let multiTrain = 0;
  for (let i = 0; i < files.length; i++) {
    const def = loadLevelXml(await readFile(new URL(`files/${files[i]}`, dataRoot), 'utf8'));
    if (def.trains.length > 1) multiTrain++;
    const model = new LevelModel(def, new SeededRng(0x42540000 + i));
    assert.doesNotThrow(() => model.tick(), files[i]);
  }
  assert.equal(multiTrain, 18);
});
