// What must ship, what must not, and the licence and provenance files that go with it.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STRINGS } from '../public/src/i18n.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const read = (file) => readFileSync(join(root, file), 'utf8');
const walk = (dir) => readdirSync(join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));

// --- the browser build -----------------------------------------------------
const publicFiles = walk('public');
assert(publicFiles.includes(join('public', 'index.html')), 'public/index.html is the game');
assert(!publicFiles.some((f) => /\.(png|gif|jpe?g|webp|bmp|ico|jar|class|zip)$/i.test(f)), 'no original resource, binary or archive may be redistributed in public/');
const html = read('public/index.html');
const code = publicFiles.filter((f) => f.endsWith('.js')).map(read).join('\n');
assert(!/res\/|\.png|Bomber\.jar|loadscreen|buildings\.png/i.test(html + code), 'the build must not load the original images');
assert(html.includes('<script data-goatcounter="https://grugnetto.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>'), 'GoatCounter snippet');
assert(html.includes('https://linkingtechnologies.github.io/libre-arcade/'), 'link to Libre Arcade in the credits');
assert(html.includes('<title>Bomber</title>'));
assert(!/localhost|127\.0\.0\.1|TODO|FIXME/i.test(html + code), 'development residue');

// --- the two languages keep the same keys ------------------------------------
assert.deepEqual(Object.keys(STRINGS.en).sort(), Object.keys(STRINGS.it).sort(), 'English and Italian must define the same strings');
for (const key of ['originalBy', 'adaptationBy']) assert(STRINGS.en[key] && STRINGS.it[key], `title credit ${key}`);

// --- the preserved original -------------------------------------------------
const dir = 'reference/bomber-1.0';
const sha = (file) => createHash('sha256').update(readFileSync(join(root, dir, file))).digest('hex');
const archive = new Map(read(`${dir}/ARCHIVE_SHA256.txt`).trim().split('\n').map((line) => { const [hash, name] = line.split(/\s+/); return [name.replace(/^\*/, ''), hash]; }));
assert.equal(archive.size, 12, 'the manifest lists the 12 files of Bomber.zip');
for (const line of read(`${dir}/CHECKSUMS.txt`).trim().split('\n')) {
  const [hash, rawName] = line.split(/\s+/);
  const name = rawName.replace(/^\*/, '');
  assert.equal(sha(name), hash, `${dir}/${name} no longer matches CHECKSUMS.txt`);
  assert.equal(archive.get(name), hash, `${dir}/${name} is not the file in the archive manifest`);
}
for (const name of ['src/Bomber.java', 'src/GameCanvasBomber.java']) {
  const source = read(`${dir}/${name}`);
  assert(source.includes('Juan Jose Luna Espinosa'), `${name} author`);
  assert(source.includes('the Free Software Foundation, version 3 of the License.'), `${name} must carry the "version 3 of the License" grant`);
  assert(!/any later version|or \(at your option\)/i.test(source), `${name} must not be read as granting "or later": it does not`);
}
assert.equal(JSON.parse(read('package.json')).license, 'GPL-3.0-only', 'the licence is GPL-3.0-only, as the original header says');
assert(read('LICENSE').includes('Version 3, 29 June 2007'));

// --- documents ----------------------------------------------------------------
for (const file of ['README.md', 'PROVENANCE.md', 'THIRD_PARTY_NOTICES.md', 'SOFTWARE_ARCHAEOLOGY.md', 'STORY.md', 'AGENTS.md', 'CHANGELOG.md', 'specs/port-map.md']) assert(existsSync(join(root, file)), `missing ${file}`);
assert(read('README.md').includes('[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/bomber/public/index.html)'), 'Play here link');
console.log('PRODUCTION CONTRACT PASS');
