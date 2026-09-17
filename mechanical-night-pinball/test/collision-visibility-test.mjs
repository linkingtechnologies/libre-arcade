import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const play=await readFile(new URL('../public/assets/graphics/playfield.svg',import.meta.url),'utf8');
const ramps=await readFile(new URL('../public/assets/graphics/ramps.svg',import.meta.url),'utf8');
for(const id of [
  'collider-topLeftWalls','collider-downLeftWalls','collider-downRightWalls',
  'collider-leftBumperHugger','collider-rightBumperHugger','collider-leftBumper','collider-rightBumper',
  'collider-leftKicker','collider-topPost0','collider-topPost1','collider-topPost2',
  'collider-attacherLeft','collider-attacherRight','collider-attacherKicker'
]) assert(play.includes(`id="${id}"`),`missing visible base collider ${id}`);
for(const id of ['collider-leftRampWalls','collider-rightRampWalls'])assert(ramps.includes(`id="${id}"`),`missing visible ramp collider ${id}`);
assert(play.includes('<polyline id="collider-leftBumperHugger"'),'chains must be represented as open polylines, not closed polygons');
console.log('Collision visibility audit: PASS');
