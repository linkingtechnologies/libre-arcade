// SPDX-License-Identifier: GPL-3.0-or-later
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GlibcRand } from '../public/src/rng.js';
import { createHistoricalRuntime, settleHistoricalRuntime } from '../public/src/historical-runtime.js';
import { createHistoricalUfos, runComputerTurn } from '../public/src/ai.js';

const fixture = JSON.parse(fs.readFileSync(new URL('../oracle/m3-native-ai-fixture.json', import.meta.url), 'utf8'));
const rng = new GlibcRand(1);
const runtime = createHistoricalRuntime({ rng, startupSeed: fixture.startup_seed, galaxySeed: fixture.galaxy_seed, objects: fixture.objects });
settleHistoricalRuntime(runtime);
const ufos = createHistoricalUfos();
const events = [];
const result = runComputerTurn({ runtime, ufos, factor: fixture.factor, maxFrames: 1000, trace: (e) => {
  if (e.event === 'fire_command' || e.event === 'shot_activate' || e.event === 'ufo_hit') events.push(e);
} });

assert.equal(result.state.attempts.length, 7);
assert.equal(result.fireFrame, fixture.fire.frame_zero_based);
assert.equal(result.totalFrames, fixture.total_frames_after_settle);
assert.equal(result.physicsSteps, fixture.actual_shot.physics_steps);
assert.equal(result.finish.reason, 'ufo_collision');
assert.equal(result.finish.ufoIndex, 1);
assert.equal(ufos[1].shield, fixture.actual_shot.shield_after);
assert.equal(rng.index, fixture.rng_calls_after_galaxy_seed_through_final_render);

const fire = events.find((e) => e.event === 'fire_command');
assert.ok(fire);
assert.equal(fire.power, fixture.fire.power);
assert.equal(fire.angle, fixture.fire.angle);
assert.equal(fire.start.x, fixture.fire.start.x);
assert.equal(fire.start.y, fixture.fire.start.y);

assert.ok(Math.abs(result.projectile.x - fixture.actual_shot.impact.x) < 2e-12, 'impact x drift too large');
assert.ok(Math.abs(result.projectile.y - fixture.actual_shot.impact.y) < 2e-12, 'impact y drift too large');
assert.ok(Math.abs(result.projectile.speed - fixture.actual_shot.impact_speed) < 1e-12, 'impact speed drift too large');
console.log('ok ai-turn: fire frame=342; physics=225; shield 100->80; full shared RNG count=12585');
