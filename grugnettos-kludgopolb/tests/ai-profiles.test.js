import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'public/config/players/ai-profiles.json'), 'utf8'));
const locales = Object.fromEntries(manifest.locales.map(code => [code, JSON.parse(fs.readFileSync(path.join(root, 'public/config/players/i18n', `${code}.json`), 'utf8'))]));
const pawns = JSON.parse(fs.readFileSync(path.join(root, 'public/config/pawns.json'), 'utf8'));

const expected = ['Zilla','Queen','Wallace','Hans','Mimrock','Lost Soul','Pazifik','Lemming'];

test('all configured friends have a localized Grugnetto friend card', () => {
  assert.deepEqual(manifest.players.map(p => p.id), expected);
  assert.deepEqual(manifest.locales, ['it','en','fr','de']);
  for (const code of manifest.locales) {
    const content = locales[code];
    assert.ok(content.title);
    assert.ok(content.subtitle);
    assert.deepEqual(Object.keys(content.players), expected);
    for (const player of manifest.players) {
      const copy = content.players[player.id];
      assert.ok(copy.label, `${code}:${player.id} missing label`);
      assert.ok(copy.description, `${code}:${player.id} missing description`);
      assert.ok(copy.bestFor, `${code}:${player.id} missing recommendation`);
      for (const tag of player.tags) assert.ok(content.tags[tag], `${code}:${player.id} missing tag ${tag}`);
    }
  }
});

test('friend cards are tied to the current frozen board and keep benchmark provenance', () => {
  const board = JSON.parse(fs.readFileSync(path.join(root, 'public/boards/grugnetto-32-v1.4/board.json'), 'utf8'));
  assert.equal(manifest.sourceBoardId, board.id);
  assert.equal(manifest.sourceBoardContentVersion, board.contentVersion);
  assert.equal(manifest.simulationBasis.kind, 'empirical');
  assert.ok(manifest.simulationBasis.headToHeadGamesPerAi >= 100);
  assert.ok(manifest.simulationBasis.allSevenVerificationGames >= 50);
});

test('every friend card has a configured pawn', () => {
  for (const id of expected) assert.ok(pawns.cpu[id]?.asset, `${id} missing pawn asset`);
});

test('player-facing friend copy avoids internal AI level labels', () => {
  const all = JSON.stringify(locales);
  assert.doesNotMatch(all, /AI L[012]|CPU L[012]|level [012]/i);
});


test('Pazifik profile records clean historical provenance and requested ratings', () => {
  const p = manifest.players.find(x => x.id === 'Pazifik');
  assert.equal(p.type, 'historical-reimplementation');
  assert.equal(p.source, 'JAtlantik r36 SimpleAI');
  assert.equal(p.year, 2007);
  assert.equal(p.difficulty, 'easy');
  assert.equal(p.deterministic, true);
  assert.equal(p.provenance, 'Historical AI reimplementation based on the documented behavior of JAtlantik r36 SimpleAI.');
  assert.deepEqual(p.ratings, { buying:4, building:5, auctions:2, cashManagement:1, trading:0, prudence:1, predictability:5 });
  for (const code of manifest.locales) {
    assert.ok(locales[code].ratingsTitle);
    for (const key of Object.keys(p.ratings)) assert.ok(locales[code].ratings[key], `${code}: missing rating label ${key}`);
  }
});
