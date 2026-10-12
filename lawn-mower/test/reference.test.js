// The preserved originals: each kept file is the file of the archive it came from (CHECKSUMS.txt against ARCHIVE_SHA256.txt and
// against the bytes), the two archives' own hashes are what the records say, and the licence statements the records quote are in the files.
import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = (path) => Object.fromEntries(readFileSync(here(path), 'utf8').split(/\r?\n/).filter(Boolean).map((line) => { const [hash, ...name] = line.split('  '); return [name.join('  '), hash]; }));

for (const folder of ['competition', 'release-v1.12', 'source-v1.12']) {
  test(`${folder}: every kept file hashes to its entry in CHECKSUMS.txt, and to the archive's own list`, () => {
    const kept = manifest(`../reference/${folder}/CHECKSUMS.txt`), archive = manifest(`../reference/${folder}/ARCHIVE_SHA256.txt`);
    assert.ok(Object.keys(kept).length >= 1);
    for (const [name, hash] of Object.entries(kept)) {
      assert.equal(sha(readFileSync(here(`../reference/${folder}/${name}`))), hash, `${name} is not the file that was recorded`);
      assert.equal(archive[name], hash, `${name} is not the file of the archive`);
    }
  });
}

test('the archives are what the records say (24,592-byte ROM; 30 files of source with the hashes the Internet Archive lists for the zip)', () => {
  const rom = readFileSync(here('../reference/competition/Lawn_Mower.nes'));
  assert.equal(rom.length, 24592);
  assert.equal(sha(rom), '942f36376246dbdff99a0b94aad930b2cccf1f534e5390468ac9c0d50752d7dd');
  assert.equal(Object.keys(manifest('../reference/competition/ARCHIVE_SHA256.txt')).length, 5);
  assert.equal(Object.keys(manifest('../reference/source-v1.12/ARCHIVE_SHA256.txt')).length, 30);
  assert.match(readFileSync(here('../reference/source-v1.12/SOURCE.md'), 'utf8'), /5928c65eb48429e8f61fd9b85bed5680/);
  assert.equal(manifest('../reference/source-v1.12/ARCHIVE_SHA256.txt')['game.asm'], 'fbc9678a1192fb79d3210a5041169867dbd95bf7e49dd21b87efa4ed4fe2f997');
});

test('the licence statements that the source record quotes are in the files, in the author\'s words', () => {
  const game = readFileSync(here('../reference/source-v1.12/game.asm'), 'latin1').split(/\r?\n/);
  assert.equal(game[3], ';The game and its source code are released into Public Domain');
  const tune = readFileSync(here('../reference/source-v1.12/famitone.asm'), 'latin1').split(/\r?\n/);
  assert.equal(tune[3], ';Feel free to do anything you want with this code, consider it Public Domain');
  assert.match(game[1], /Shiru/);
});

test('the data files of the page are the author\'s: the character memory is the source\'s, and the ROM\'s (checked in rom-data.test.js)', () => {
  const asset = (name) => readFileSync(here(`../public/assets/${name}`));
  for (const name of ['patterns.chr', 'title.rle', 'done.rle']) assert.deepEqual(asset(name), readFileSync(here(`../reference/source-v1.12/${name}`)), name);
});

test("the author's own v1.12 build (the Internet Archive's zip) is what its record says, and is not the competition ROM", () => {
  const release = readFileSync(here('../reference/release-v1.12/Lawn_Mower.nes')), competition = readFileSync(here('../reference/competition/Lawn_Mower.nes'));
  assert.equal(release.length, 24592);
  assert.equal(sha(release), '181ef3ff1769a85ae98736e02809e65e5d758b453ebb43ec4b9fe60c93ad224c');
  assert.deepEqual(release.subarray(0, 16), competition.subarray(0, 16), 'the same iNES header: NROM-128, vertical mirroring');
  assert.match(release.toString('latin1'), /Lawn Mower v1\.12 01\.07\.11/);
  assert.match(competition.toString('latin1'), /Lawn Mower v1\.1 30\.05\.11/);
  assert.notEqual(sha(release), sha(competition));
  // the zip holds five files; two of them are the competition archive's own, byte for byte
  const zip = manifest('../reference/release-v1.12/ARCHIVE_SHA256.txt'), entry = manifest('../reference/competition/ARCHIVE_SHA256.txt');
  assert.equal(Object.keys(zip).length, 5);
  assert.equal(zip['notes.txt'], entry['notes.txt']);
  assert.equal(zip['label_nes.png'], entry['label.png']);
  assert.notEqual(zip['manual.pdf'], entry['manual.pdf']);
  const record = readFileSync(here('../reference/release-v1.12/SOURCE.md'), 'utf8');
  assert.match(record, /af7378b522a7d11efd0306aebf15c193a2de31f5a7b130919699d4f1e7219f70/);
  assert.match(record, /cbff8bb3935a963c087db4d4071d5c69/);
});
