import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { World } from '../public/js/engine.mjs';
import { TOTAL_LEVELS, clampUnlocked, unlockAfterCompletion, clampPlayableLevel } from '../public/js/progress.mjs';

if (TOTAL_LEVELS !== 17) throw new Error(`expected 17 active levels, got ${TOTAL_LEVELS}`);

// Persistent progression must be monotonic and reach all active levels.
let unlocked = 1;
for (let level = 0; level < TOTAL_LEVELS - 1; level++) {
  unlocked = unlockAfterCompletion(unlocked, level);
  if (unlocked !== level + 2) throw new Error(`unlock chain failed after level ${level + 1}: ${unlocked}`);
}
if (unlocked !== TOTAL_LEVELS) throw new Error('full progression does not unlock all levels');
if (unlockAfterCompletion(TOTAL_LEVELS, 0) !== TOTAL_LEVELS) throw new Error('replaying an early level relocked progress');
if (clampUnlocked('not-a-number') !== 1 || clampUnlocked(999) !== TOTAL_LEVELS) throw new Error('unlock storage clamping failed');
if (clampPlayableLevel(16, 3, false) !== 2 || clampPlayableLevel(16, 3, true) !== 16) throw new Error('playable-level clamping failed');

// Every active level must instantiate cleanly and expose a valid completion predicate.
for (let level = 0; level < TOTAL_LEVELS; level++) {
  const w = new World(level, { randomizeDodge: false });
  if (!w.disks.length) throw new Error(`level ${level + 1}: no disk`);
  if (!w.winPos.every(Number.isFinite)) throw new Error(`level ${level + 1}: invalid goal`);
  if (!w.checkVictoryForDisk(w.winPos)) throw new Error(`level ${level + 1}: goal predicate rejects goal center`);
  for (const d of w.disks) d.finished = true;
  w.checkVictory();
  if (!w.finished) throw new Error(`level ${level + 1}: world completion failed`);
}

// Public deployment must not contain quarantined historical assets or reference payload.
const here = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(here, '../public');
const forbidden = [/MAKISUPA/i, /tradeyourkid/i, /thud\d*\.ogg$/i, /\.wav$/i, /reference[\\/]/i];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else {
      const rel = path.relative(publicDir, full);
      if (forbidden.some(re => re.test(rel))) throw new Error(`quarantined asset in public payload: ${rel}`);
      if (/\.(?:html|css|mjs|js|json|md)$/i.test(ent.name)) {
        const text = fs.readFileSync(full, 'utf8');
        for (const re of forbidden.slice(0, 4)) if (re.test(text)) throw new Error(`public source references quarantined asset: ${rel}`);
      }
    }
  }
}
walk(publicDir);

console.log('PASS: monotonic progression unlocks all 17 levels');
console.log('PASS: all 17 levels instantiate and expose a valid completion path');
console.log('PASS: public payload is free of quarantined historical assets');
