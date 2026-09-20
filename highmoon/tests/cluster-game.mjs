// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import { GameShot } from '../public/src/game-shot.js';
import { BodyKind } from '../public/src/galaxy.js';

const planet = { kind: BodyKind.PLANET, name: 'earth', x: 130, y: 100, width: 40, spacing: 0, weight: 300, children: [], hitVector: {x:0,y:0} };
const shot = new GameShot({ weapon: 'cluster', x: 100, y: 100, speed: 100, direction: 0 });
const result = shot.tick({ bodies: [planet], ufos: [] });
assert.equal(result.finished, false);
assert.equal(shot.parent.isActive(), false);
assert.equal(shot.fragments.length, 5);
assert.ok(shot.clusterHits >= 1);
assert.ok(Math.hypot(planet.hitVector.x, planet.hitVector.y) > 1, 'planet recoil must be queued before Cluster::hit');

// Extra collection never destroys the active projectile.
const laser = new GameShot({ weapon: 'laser', x: 20, y: 20, speed: 20, direction: 0 });
const extra = { x:20, y:20, wait:0, waiting:100 };
assert.equal(laser.hitExtra(extra), true);
assert.equal(laser.isActive(), true);
assert.equal(extra.wait, 200);
assert.equal(extra.waiting, 200);

console.log('ok cluster-game: parent collision spawns five live fragments; Extra is collectible/non-destructive');
