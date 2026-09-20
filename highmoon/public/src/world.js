// SPDX-License-Identifier: GPL-3.0-or-later
import { HistoricalProjectile, highMoonDamage, sphereCollision } from "./simulation.js";
import { BodyKind, bodyCollision, applyPlanetRecoil, advanceGalaxyDrawDynamics } from "./galaxy.js";

export const HISTORICAL_WIDTH = Object.freeze({ laser: 17, heavy: 20, cluster: 17, ufo: 48 });

export function collideProjectileWithBody(projectile, body, shotWidth) {
  return bodyCollision(body, projectile.x, projectile.y, shotWidth, false);
}

/**
 * Apply the side effect of Spaceobject::hit() for the subset implemented in M2.
 * Returns whether the projectile was destroyed.
 */
export function applyBodyHit(projectile, body, trace = null) {
  if (body.kind === BodyKind.WORMHOLE) {
    const fromX = projectile.x;
    const fromY = projectile.y;
    projectile.x = body.x + body.exitX;
    projectile.y = body.y + body.exitY;
    trace?.({ event: "wormhole_teleport", from_x: fromX, from_y: fromY, to_x: projectile.x, to_y: projectile.y, speed: projectile.speed, direction: projectile.direction });
    return false;
  }
  if (body.kind === BodyKind.STORM) {
    // Blackhole::hit(Spaceobject*) is intentionally empty in 1.2.4.
    return false;
  }
  // Planet::hit() stores recoil that Planet::draw() applies on later frames,
  // then invokes projectile->hit(this), destroying a Laser/Heavy.
  applyPlanetRecoil(body, projectile);
  projectile.movingTime = 0;
  return true;
}

export function collideProjectileWithUfo(projectile, ufo, shotWidth, trace = null) {
  if (!sphereCollision(projectile.x, projectile.y, shotWidth, ufo.x, ufo.y, ufo.width)) return false;
  const damage = highMoonDamage(projectile.speed, projectile.weight);
  const before = ufo.shield;
  ufo.shield = Math.max(0, ufo.shield - damage);
  projectile.movingTime = 0;
  trace?.({ event: "ufo_hit", damage, shield_before: before, shield_after: ufo.shield });
  return true;
}

/**
 * One Laser/Heavy gameplay tick after a settled galaxy. Collision order is
 * top-level galaxy objects in array order, then UFOs in array order.
 */
export function tickProjectileWorld({ projectile, bodies, ufos = [], shotWidth, trace = null }) {
  if (!(projectile instanceof HistoricalProjectile)) throw new TypeError("projectile must be HistoricalProjectile");
  const result = projectile.tick(bodies, trace);
  if (result.finished) return result;

  for (let i = 0; i < bodies.length; i += 1) {
    const body = bodies[i];
    if (collideProjectileWithBody(projectile, body, shotWidth)) {
      const destroyed = applyBodyHit(projectile, body, trace);
      trace?.({ event: "collision", kind: "galaxy_object", index: i, body_kind: body.kind, shot_x: result.position.x, shot_y: result.position.y, collider_x: body.x, collider_y: body.y, collider_width: body.width });
      if (destroyed) return { finished: true, reason: "body_collision", bodyIndex: i };
      // Historical Galaxy::has_collision returns immediately at first body hit.
      return { finished: false, reason: body.kind === BodyKind.WORMHOLE ? "wormhole" : "storm", bodyIndex: i };
    }
  }

  for (let i = 0; i < ufos.length; i += 1) {
    if (collideProjectileWithUfo(projectile, ufos[i], shotWidth, trace)) {
      return { finished: true, reason: "ufo_collision", ufoIndex: i };
    }
  }

  return { finished: false, reason: "flying", position: result.position, velocity: result.velocity };
}

/** One historical gameplay-frame ordering for the state covered by M2. */
export function tickHighMoonFrame(args) {
  const result = tickProjectileWorld(args);
  advanceGalaxyDrawDynamics({ bodies: args.bodies });
  return result;
}
