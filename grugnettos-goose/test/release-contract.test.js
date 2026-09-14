import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicRoot = path.join(root, 'public');
const specs = ['rules.md', 'archaeology.md', 'parity.md', 'assets.md', 'accessibility.md', 'release-checklist.md', 'reference-audit.md', 'ui-v0.11.md', 'ui-v0.12.md', 'ui-v0.13.md', 'ui-v0.14.md'];
const refs = ['goose-game', 'game-of-the-goose', 'snakes-ladders', 'glparchis', 'ludox', 'tibetan-sho', 'ganzenbord-pd', 'ganzenbordspel'];

test('release-candidate documentation set is present', () => {
  for (const file of specs) {
    assert.ok(fs.existsSync(path.join(root, 'specs', file)), `Missing spec: ${file}`);
  }
});

test('each planned historical reference has a provenance/status record', () => {
  for (const name of refs) {
    assert.ok(fs.existsSync(path.join(root, 'reference', name, 'PROVENANCE.md')), `Missing provenance: ${name}`);
  }
});

test('public reference tree contains no quarantined historical archives', () => {
  const forbidden = /\.(zip|rar|7z|tar|tgz|gz|bz2|exe|jar)$/i;
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
  const files = walk(path.join(root, 'reference'));
  assert.deepEqual(files.filter((file) => forbidden.test(file)), []);
});

test('runtime code does not use Math.random', () => {
  const files = [
    path.join(publicRoot, 'index.html'),
    ...fs.readdirSync(path.join(publicRoot, 'src', 'core')).map((name) => path.join(publicRoot, 'src', 'core', name)),
    ...fs.readdirSync(path.join(publicRoot, 'src', 'ui')).map((name) => path.join(publicRoot, 'src', 'ui', name)),
    ...fs.readdirSync(path.join(publicRoot, 'src', 'ai')).map((name) => path.join(publicRoot, 'src', 'ai', name)),
    ...fs.readdirSync(path.join(publicRoot, 'src', 'audio')).map((name) => path.join(publicRoot, 'src', 'audio', name))
  ];
  for (const file of files) {
    assert.ok(!fs.readFileSync(file, 'utf8').includes('Math.random'), `Math.random found in ${file}`);
  }
});

test('runtime board artwork is fully local with no HTTP dependency', () => {
  const runtimeRoots = [
    path.join(publicRoot, 'index.html'),
    path.join(publicRoot, 'src'),
    path.join(publicRoot, 'data')
  ];
  const walk = (target) => {
    const stat = fs.statSync(target);
    if (stat.isFile()) return [target];
    return fs.readdirSync(target, { withFileTypes: true }).flatMap((entry) => walk(path.join(target, entry.name)));
  };
  const allowedExt = new Set(['.html', '.js', '.css', '.json']);
  const files = runtimeRoots.flatMap(walk).filter((file) => allowedExt.has(path.extname(file)));
  for (const file of files) {
    // The only permitted remote reference across every game in this collection
    // is the site-wide, cookie-free GoatCounter analytics beacon; see AGENTS.md.
    const withoutAnalytics = fs.readFileSync(file, 'utf8')
      .replace(/https:\/\/grugnetto\.goatcounter\.com(\/count)?/g, '')
      .replace(/https:\/\/gc\.zgo\.at/g, '');
    assert.equal(/https?:\/\//.test(withoutAnalytics), false, `runtime URL found in ${file}`);
  }
});

test('historical board originals are bundled and generated substitutes are absent', () => {
  for (const name of ['fetch-original-boards.sh', 'fetch-original-boards.ps1', 'fetch-original-boards.cmd']) {
    assert.ok(fs.existsSync(path.join(root, 'tools', name)), `Missing board fetcher: ${name}`);
  }
  assert.ok(fs.existsSync(path.join(publicRoot, 'assets', 'boards', 'original', 'README.md')));
  assert.ok(fs.existsSync(path.join(publicRoot, 'assets', 'boards', 'original', 'Ganzenbord_pd.svg')));
  assert.ok(fs.existsSync(path.join(publicRoot, 'assets', 'boards', 'original', 'Ganzenbordspel.jpg')));
  assert.ok(fs.existsSync(path.join(publicRoot, 'assets', 'boards', 'original', 'SHA256SUMS.txt')));
  assert.equal(fs.existsSync(path.join(publicRoot, 'assets', 'boards', 'local')), false);
  assert.equal(fs.existsSync(path.join(publicRoot, 'assets', 'boards', 'ganzenbordspel-inspired.svg')), false);
});

test('reference manifest records all audited reference families', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'reference', 'manifest.json'), 'utf8'));
  const ids = new Set(manifest.references.map((item) => item.id));
  for (const id of ['goose-game', 'game-of-the-goose', 'snakes-ladders', 'ludox-2.2', 'ludox-2.1', 'glparchis-20181125', 'tibetan-sho', 'ganzenbord-pd', 'ganzenbordspel']) {
    assert.ok(ids.has(id), `Missing manifest reference: ${id}`);
  }
});

test('locally audited archives have SHA-256 fingerprints in the manifest', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'reference', 'manifest.json'), 'utf8'));
  const local = manifest.references.filter((item) => item.localArchive);
  assert.ok(local.length >= 5);
  for (const item of local) {
    assert.match(item.sha256, /^[a-f0-9]{64}$/, `Invalid SHA-256 for ${item.id}`);
    assert.equal(item.sourceBundled, false, `${item.id} must remain unbundled while quarantined`);
  }
});
