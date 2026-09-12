import { createHash } from 'node:crypto';
import { existsSync, createReadStream } from 'node:fs';
import { basename, resolve } from 'node:path';

const candidates = [
  {
    path: 'reference/warboats-0.51/warboats-0.51-ascii.tar.gz',
    expectedSha256: 'a6e09b4b291621c47b449810fe49b8880a86277e9135263a4d59e72149dac174',
    label: 'Warboats 0.51-ascii (GPLv3-compatible source port)'
  },
  {
    path: 'reference/bataille-navale-os4-2009/bataillenavale.lha',
    expectedSha256: null,
    label: 'Bataille Navale OS4 (GPLv3 preservation reference)'
  }
];

function digest(path, algorithm) {
  return new Promise((resolvePromise, reject) => {
    const h = createHash(algorithm);
    const s = createReadStream(path);
    s.on('data', chunk => h.update(chunk));
    s.on('error', reject);
    s.on('end', () => resolvePromise(h.digest('hex')));
  });
}

let found = 0;
for (const c of candidates) {
  const abs = resolve(c.path);
  if (!existsSync(abs)) {
    console.log(`MISSING  ${c.label}`);
    console.log(`         ${c.path}`);
    continue;
  }
  found += 1;
  const md5 = await digest(abs, 'md5');
  const sha256 = await digest(abs, 'sha256');
  console.log(`FOUND    ${c.label}`);
  console.log(`         ${basename(abs)}`);
  console.log(`MD5      ${md5}`);
  console.log(`SHA256   ${sha256}${c.expectedSha256 ? (sha256 === c.expectedSha256 ? '  OK' : `  EXPECTED ${c.expectedSha256}`) : ''}`);
}

console.log('\nLicence policy:');
console.log('- Warboats 0.51 passed source-level review: GPL-2.0-or-later headers permit the GPLv3 port.');
console.log('- Bataille Navale OS4 is preserved separately under its supplied GPLv3 materials.');
console.log('- Rejected candidates are documented in specs/candidates.md and are not bundled as source references.');
if (!found) console.log('- No historical source archive is currently embedded.');
