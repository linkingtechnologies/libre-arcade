// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ART_PROVENANCE } from '../public/src/presentation-art.js';
const moduleText = readFileSync(fileURLToPath(new URL('../public/src/presentation-art.js', import.meta.url)), 'utf8');
const appText = readFileSync(fileURLToPath(new URL('../public/src/game-app.js', import.meta.url)), 'utf8');
assert.deepEqual(ART_PROVENANCE, {origin:'procedural-canvas',historicalPixels:false,historicalAudio:false,usesHistoricalRng:false});
for (const planet of ['earth','mars','venus','jupiter','saturn']) {
  assert.ok(moduleText.includes(`${planet}:`), `Missing ${planet} procedural palette`);
}
assert.ok(!/\b(?:Math\.random|rand|srand|\.rng|\.random)\s*\(/.test(moduleText),'Art must never advance RNG');
assert.ok(!/fetch\s*\(|new\s+Image\s*\(|\.src\s*=/.test(moduleText),'Art must not load any third-party asset');
assert.ok(!moduleText.includes('import '),'Art must not import physical model or sound');
assert.ok(appText.includes('drawPlanetArt(ctx,body,x,y)') && appText.includes('drawUfoArt(ctx,p,index,active'), 'Presentation art must be wired into playable UI');
console.log('ok art-contract: 5 original procedural palette families, independent artwork, no historical pixels/RNG/network');
