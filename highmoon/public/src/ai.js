// SPDX-License-Identifier: GPL-3.0-or-later
import { PI, SCREEN_HEIGHT, SHOOT_POWER_FACTOR } from './constants.js';
import { Vector2, VectorType } from './vector2.js';
import { calculateNextPos, sphereCollision, HistoricalProjectile } from './simulation.js';
import { bodyCollision } from './galaxy.js';
import { tickProjectileWorld, HISTORICAL_WIDTH } from './world.js';
import { advanceHistoricalFrame, advanceBackgroundVisualRng, advanceGalaxyHistoricalDraw } from './historical-runtime.js';

export const MAX_COMPUTER_SEARCH = 150;

function galaxyCheckCollision(bodies, x, y, width = 0) {
  for (const body of bodies) if (bodyCollision(body, x, y, width, false)) return true;
  return false;
}

/** Exact Shoot::calculate_ShootPath semantics for the base Shoot used by AI. */
export function calculateAiShootPath(startInput, velocityInput, bodies, trace = null) {
  const start = new Vector2(startInput.x, startInput.y, VectorType.K);
  const direction = new Vector2(velocityInput.x, velocityInput.y, VectorType.K);
  const points = [];
  for (let i = 0; i < 700; i += 1) {
    calculateNextPos(start, direction, bodies, trace, i);
    if (!galaxyCheckCollision(bodies, start.x, start.y, 0)) {
      // C++ assignment to int truncates toward zero.
      points.push({ x: Math.trunc(start.x), y: Math.trunc(start.y) });
    } else {
      break;
    }
  }
  return points;
}

export function willAiHit({ playerId = 0, factor, start, velocity, bodies, ufos, trace = null }) {
  const points = calculateAiShootPath(start, velocity, bodies, trace);
  const targetWidth = 8 * factor;
  for (const p of points) {
    for (let i = 0; i < ufos.length; i += 1) {
      if (i === playerId) continue;
      const u = ufos[i];
      if (sphereCollision(u.x, u.y, u.width, p.x, p.y, targetWidth)) return true;
    }
  }
  return false;
}

export function createHistoricalUfos() {
  return [
    { playerId: 0, x: 70, y: 384, width: 48, shield: 100, bonus: 0, boughtWeapon: 'laser', shootAngle: 0, shootPower: 0, active: true, locked: false },
    { playerId: 1, x: 954, y: 384, width: 48, shield: 100, bonus: 0, boughtWeapon: 'laser', shootAngle: PI, shootPower: 0, active: false, locked: false },
  ];
}

export function createComputerSearchState() {
  return { found: false, searches: MAX_COMPUTER_SEARCH, candidate: null, attempts: [] };
}

/** One call to Ufo::calculate_Computer_Move while it is still searching. */
export function computerSearchAttempt({ runtime, state, ufos, playerId = 0, factor = 3, trace = null }) {
  const ufo = ufos[playerId];
  if (state.found || ufo.locked) return state.candidate;

  // Canonical M3 scenario starts with bonus=0. Preserve random purchase rules.
  if (ufo.bonus === 1 && ufo.shield < 40) { ufo.shield += 5; ufo.bonus = 0; }
  if (ufo.bonus === 2 && runtime.rng.random(10, 0, trace, 'AI.bonus.heavy') < 2) { ufo.boughtWeapon = 'heavy'; ufo.bonus = 0; }
  if (ufo.bonus === 3 && runtime.rng.random(10, 0, trace, 'AI.bonus.cluster') < 8) { ufo.boughtWeapon = 'cluster'; ufo.bonus = 0; }

  const y = Math.trunc(runtime.rng.random(SCREEN_HEIGHT - 200, 100, trace, 'AI.y'));
  const power = Math.trunc(runtime.rng.random(100, 10, trace, 'AI.power'));
  const angle = runtime.rng.random(2 * PI, 0, trace, 'AI.angle');

  const start = new Vector2(ufo.x, y, VectorType.K).plus(new Vector2(60, angle, VectorType.P));
  const velocity = new Vector2(power * SHOOT_POWER_FACTOR, angle, VectorType.P);
  const foundByPath = willAiHit({ playerId, factor, start, velocity, bodies: runtime.galaxy.bodies, ufos, trace });

  const candidate = { playerId, factor, searchesRemaining: state.searches, y, power, angle, found: foundByPath, start: { x: start.x, y: start.y }, velocity: { x: velocity.x, y: velocity.y } };
  state.attempts.push(candidate);
  state.candidate = candidate;
  state.found = foundByPath;
  state.searches -= 1;
  if (state.searches < 0) state.found = true;
  return candidate;
}

/**
 * Canonical headless AI loop: one candidate before each visual/game frame,
 * matching native_runner.cpp. Stops as soon as a candidate is accepted.
 */
export function searchUntilFound({ runtime, ufos = createHistoricalUfos(), factor = 3, maxFrames = 700, trace = null }) {
  const state = createComputerSearchState();
  for (let frame = 0; frame < maxFrames && !state.found; frame += 1) {
    computerSearchAttempt({ runtime, state, ufos, factor, trace });
    if (!state.found) advanceHistoricalFrame(runtime, trace);
  }
  return { state, ufos };
}

/** One exact Ufo::calculate_Computer_Move call for the state used by M3. */
export function computerMoveFrame({ runtime, state, ufos, playerId = 0, factor = 3, trace = null }) {
  const ufo = ufos[playerId];
  let canshoot = false;

  if (!state.found && !ufo.locked) {
    computerSearchAttempt({ runtime, state, ufos, playerId, factor, trace });
  }

  if (state.found && !canshoot) {
    canshoot = true;
    const c = state.candidate;

    if (Math.trunc(c.y) < ufo.y) {
      canshoot = false;
      if (ufo.y > 70) ufo.y -= 2;
      if (Math.trunc(c.y) > ufo.y) ufo.y = Math.trunc(c.y);
    }
    if (Math.trunc(c.y) > ufo.y) {
      canshoot = false;
      if (ufo.active && ufo.y < 768 - 70) ufo.y += 2;
      if (Math.trunc(c.y) < ufo.y) ufo.y = Math.trunc(c.y);
    }

    if (c.angle > ufo.shootAngle) {
      canshoot = false;
      if (ufo.active) ufo.shootAngle += PI / 180;
      if (c.angle < ufo.shootAngle) ufo.shootAngle = c.angle;
    }
    if (c.angle < ufo.shootAngle) {
      canshoot = false;
      if (ufo.active) ufo.shootAngle -= PI / 180;
      if (c.angle > ufo.shootAngle) ufo.shootAngle = c.angle;
    }

    if (canshoot && c.power > ufo.shootPower) {
      canshoot = false;
      if (ufo.active) {
        ufo.shootPower += 1;
        if (ufo.shootPower > 100) ufo.shootPower = 100;
      }
    }
  }

  if (canshoot) {
    const c = state.candidate;
    ufo.shootPower = c.power;
    state.searches = MAX_COMPUTER_SEARCH;
    state.found = false;
    ufo.locked = true;
    const start = new Vector2(ufo.x, ufo.y, VectorType.K).plus(new Vector2(60, ufo.shootAngle, VectorType.P));
    const velocity = new Vector2(ufo.shootPower * SHOOT_POWER_FACTOR, ufo.shootAngle, VectorType.P);
    trace?.({ event: 'fire_command', player: playerId, weapon: ufo.boughtWeapon, power: ufo.shootPower, angle: ufo.shootAngle, start: { x: start.x, y: start.y }, velocity: { x: velocity.x, y: velocity.y } });
    return { fired: true, start, velocity, candidate: c };
  }

  return { fired: false, candidate: state.candidate };
}

export function consumeLaserDrawRng(projectile, rng, trace = null) {
  if (!projectile?.isActive()) return;
  if (projectile.movingTime > 100 || Math.trunc(rng.random(100, 0, trace, 'Laser.draw.gate')) < projectile.movingTime / 2 + 25) {
    rng.random(2, -2, trace, 'Laser.draw.x_anim');
    rng.random(2, -2, trace, 'Laser.draw.y_anim');
    rng.random(10, -10, trace, 'Laser.draw.alpha');
  }
}

/** Full canonical native_runner CPU turn, including shared rendering RNG. */
export function runComputerTurn({ runtime, ufos = createHistoricalUfos(), factor = 3, maxFrames = 1000, trace = null }) {
  const state = createComputerSearchState();
  let fired = false;
  let projectile = null;
  let fireFrame = null;
  let physicsSteps = 0;
  let finish = null;

  for (let frame = 0; frame < maxFrames; frame += 1) {
    if (!fired) {
      const move = computerMoveFrame({ runtime, state, ufos, factor, trace });
      if (move.fired) {
        fired = true;
        fireFrame = frame;
        projectile = new HistoricalProjectile({
          x: move.start.x,
          y: move.start.y,
          speed: move.velocity.length,
          direction: move.velocity.angle,
          weight: 1,
        });
        trace?.({ event: 'shot_activate', x: projectile.x, y: projectile.y, speed: projectile.speed, direction: projectile.direction, weight: projectile.weight });
      }
    }

    if (fired && projectile?.isActive()) {
      finish = tickProjectileWorld({ projectile, bodies: runtime.galaxy.bodies, ufos, shotWidth: HISTORICAL_WIDTH.laser, trace });
      physicsSteps += 1;
    }

    // Native runner ordering after Galaxy::animate()/extra collision.
    advanceBackgroundVisualRng(runtime.visual, runtime.rng, trace);
    advanceGalaxyHistoricalDraw(runtime.galaxy, runtime.visual, runtime.rng, trace);
    consumeLaserDrawRng(projectile, runtime.rng, trace);
    runtime.frames += 1;

    if (fired && finish?.finished) {
      return { state, ufos, projectile, fired, fireFrame, totalFrames: frame + 1, physicsSteps, finish };
    }
  }

  return { state, ufos, projectile, fired, fireFrame, totalFrames: maxFrames, physicsSteps, finish: finish ?? { finished: false, reason: 'frame_limit' } };
}
