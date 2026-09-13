// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadGameManifestXml, loadLevelXml, CleanAudio, translator } from '../public/src/index.js';

test('synthetic fixture campaign resolves all three data-driven levels', async () => {
  const base = new URL('./fixtures/synthetic-campaign/', import.meta.url);
  const manifest = loadGameManifestXml(await readFile(new URL('clean-room-game.gms', base), 'utf8'));
  assert.equal(manifest.length,3);
  for (const entry of manifest) {
    const level = loadLevelXml(await readFile(new URL(entry.src, base), 'utf8'));
    assert.equal(level.cannons.length,1);
    assert.ok(level.trains.length >= 1);
  }
});

test('IT/EN strings and clean synthesized audio fallback are dependency-free', () => {
  assert.equal(translator('it')('play'),'Gioca');
  assert.equal(translator('en')('play'),'Play');
  const audio = new CleanAudio({enabled:true});
  assert.doesNotThrow(()=>audio.cue('fire'), 'without AudioContext the clean audio layer is a no-op');
});
