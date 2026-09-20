// SPDX-License-Identifier: GPL-3.0-or-later
import { SHOOT_INTERVAL_MS, MAX_SHOOT_RUN } from "./constants.js";
import { Vector2, VectorType } from "./vector2.js";

/**
 * One literal HighMoon 1.2.4 gravity/integration operation.
 * Bodies are processed in array order, as in Galaxy::calculate_nextPos().
 */
export function calculateNextPos(position, direction, bodies, trace = null, step = 0) {
  const gravitySum = new Vector2(0, 0, VectorType.K);

  for (let i = 0; i < bodies.length; i += 1) {
    const body = bodies[i];
    const bodyPos = new Vector2(body.x, body.y, VectorType.K);
    const distance = bodyPos.distance(position);
    let contribution = bodyPos.minus(position);
    contribution = contribution.newLength(body.weight / distance);
    gravitySum.addInPlace(contribution);

    trace?.({
      event: "gravity",
      step,
      body_index: i,
      body_x: body.x,
      body_y: body.y,
      weight: body.weight,
      distance,
      delta_v: { x: contribution.x, y: contribution.y },
    });
  }

  direction.addInPlace(gravitySum);
  position.addInPlace(direction.newLength(direction.length * SHOOT_INTERVAL_MS / 1000));
}

/**
 * Historical projectile state. HighMoon stores speed+direction after a tick,
 * then rebuilds Cartesian velocity from polar values on the next tick.
 * Keeping this round-trip is required for oracle fidelity.
 */
export class HistoricalProjectile {
  constructor({ x, y, speed, direction, weight = 1, movingTime = MAX_SHOOT_RUN }) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.direction = direction;
    this.weight = weight;
    this.movingTime = movingTime;
    this.step = 0;
  }

  isActive() {
    return this.movingTime > 0;
  }

  tick(bodies, trace = null) {
    if (!this.isActive()) return { finished: true, reason: "inactive" };

    this.movingTime -= 1;
    if (this.movingTime === 0) return { finished: true, reason: "timeout" };

    const position = new Vector2(this.x, this.y, VectorType.K);
    // Intentional HighMoon polar round-trip.
    const velocity = new Vector2(this.speed, this.direction, VectorType.P);

    trace?.({ event: "step_begin", step: this.step, position: { x: position.x, y: position.y }, velocity: { x: velocity.x, y: velocity.y } });
    calculateNextPos(position, velocity, bodies, trace, this.step);
    trace?.({ event: "step_end", step: this.step, position: { x: position.x, y: position.y }, velocity: { x: velocity.x, y: velocity.y } });

    this.x = position.x;
    this.y = position.y;
    this.speed = velocity.length;
    this.direction = velocity.angle;
    this.step += 1;

    return { finished: false, position, velocity };
  }
}

export function simulateTicks({ bodies, shot, ticks, trace = null }) {
  const projectile = shot instanceof HistoricalProjectile ? shot : new HistoricalProjectile(shot);
  const output = [];
  const sink = trace ?? ((e) => output.push(e));
  for (let i = 0; i < ticks; i += 1) {
    const result = projectile.tick(bodies, sink);
    if (result.finished) break;
  }
  return { projectile, events: output };
}

export function sphereCollision(ax, ay, aw, bx, by, bw) {
  const dx = ax - bx;
  const dy = ay - by;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance <= (aw + bw) / 2;
}

export function highMoonDamage(projectileSpeed, projectileWeight) {
  // C++ int conversion truncates toward zero; values here are non-negative.
  return Math.trunc(projectileSpeed / 10 * projectileWeight);
}
