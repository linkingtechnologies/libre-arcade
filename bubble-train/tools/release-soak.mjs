// SPDX-License-Identifier: GPL-3.0-or-later
import { readFile } from 'node:fs/promises';
import { loadGameManifestXml, loadLevelXml, resolveOriginalLevelPath, ORIGINAL_CAMPAIGNS, LevelModel, SeededRng } from '../public/src/index.js';

const root = new URL('../public/data/original-levels/', import.meta.url);
const unique = new Map();
for (const campaign of ORIGINAL_CAMPAIGNS) {
  const xml = await readFile(new URL(`files/${campaign.manifest}`, root), 'utf8');
  for (const entry of loadGameManifestXml(xml)) unique.set(entry.src, entry);
}

let ticks = 0;
let attempts = 0;
let terminal = 0;
for (const [src] of unique) {
  const path = resolveOriginalLevelPath(src);
  const def = loadLevelXml(await readFile(new URL(path, root), 'utf8'));
  for (let attempt = 0; attempt < 3; attempt++) {
    attempts++;
    const level = new LevelModel(def, new SeededRng((0x42540000 + attempts * 7919) >>> 0), { frameMs: 40 });
    for (let frame = 0; frame < 800 && level.state === 'playing'; frame++) {
      const cannon = level.cannons[0];
      if (cannon) {
        const sweep = ((frame % 121) / 120 - 0.5) * Math.PI;
        cannon.setAngle(sweep);
        if (frame % 17 === 0) level.fireCannon(0);
      }
      level.tick();
      ticks++;
      for (const station of level.stations) {
        for (let i = 0; i < station.train.carriages.length; i++) {
          const p = station.train.positionOf(i);
          if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error(`${src}: non-finite carriage position at frame ${frame}`);
        }
      }
      for (const b of level.bullets) {
        if (!Number.isFinite(b.position.x) || !Number.isFinite(b.position.y)) throw new Error(`${src}: non-finite bullet position at frame ${frame}`);
      }
    }
    if (level.state !== 'playing') terminal++;
  }
}
console.log(JSON.stringify({ levels: unique.size, attempts, ticks, terminalAttempts: terminal }, null, 2));
