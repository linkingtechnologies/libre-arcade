// SPDX-License-Identifier: GPL-3.0-or-later
import { HistoricalProjectile, highMoonDamage, sphereCollision } from './simulation.js';
import { BodyKind, bodyCollision, applyPlanetRecoil } from './galaxy.js';
import { HISTORICAL_WIDTH, tickProjectileWorld } from './world.js';
import { spawnClusterFragments } from './weapons.js';
import { consumeLaserDrawRng } from './ai.js';

const WIDTH_BY_WEAPON = Object.freeze({
  laser: HISTORICAL_WIDTH.laser,
  heavy: HISTORICAL_WIDTH.heavy,
  cluster: HISTORICAL_WIDTH.cluster,
});

function projectileFrom({ x, y, speed, direction, weight = 1 }) {
  return new HistoricalProjectile({ x, y, speed, direction, weight });
}

function collideUfoAndDamage(projectile, ufo, width, trace = null) {
  if (!sphereCollision(projectile.x, projectile.y, width, ufo.x, ufo.y, ufo.width)) return false;
  const damage = highMoonDamage(projectile.speed, projectile.weight);
  const before = ufo.shield;
  ufo.shield = Math.max(0, ufo.shield - damage);
  trace?.({ event: 'ufo_hit', damage, shield_before: before, shield_after: ufo.shield, player: ufo.playerId });
  return true;
}

/**
 * Stateful historical shot used by the playable controller.
 * Laser/Heavy delegate to the already-oracled world code. Cluster preserves
 * the original parent + five Laser fragments lifecycle.
 */
export class GameShot {
  constructor({ weapon = 'laser', x, y, speed, direction }) {
    this.weapon = weapon;
    this.parent = projectileFrom({ x, y, speed, direction, weight: weapon === 'heavy' ? 2 : 1 });
    this.fragments = [];
    this.clusterHits = 0;
    this.finished = false;
    this.finishReason = null;
    this.lastCollision = null;
  }

  isActive() {
    if (this.finished) return false;
    if (this.weapon !== 'cluster') return this.parent.isActive();
    return this.parent.isActive() || this.fragments.some((p) => p.isActive());
  }

  getPrimaryPosition() {
    if (this.parent.isActive() || this.fragments.length === 0) return { x: this.parent.x, y: this.parent.y };
    const active = this.fragments.find((p) => p.isActive());
    return active ? { x: active.x, y: active.y } : { x: this.parent.x, y: this.parent.y };
  }

  activeProjectiles() {
    if (this.weapon !== 'cluster') return this.parent.isActive() ? [this.parent] : [];
    const out = [];
    if (this.parent.isActive()) out.push(this.parent);
    for (const p of this.fragments) if (p.isActive()) out.push(p);
    return out;
  }

  #spawnCluster(collider, trace = null) {
    if (this.fragments.length > 0) return;
    const spawned = spawnClusterFragments({ x: this.parent.x, y: this.parent.y, speed: this.parent.speed }, collider);
    this.fragments = spawned.map(projectileFrom);
    this.parent.movingTime = 0;
    trace?.({ event: 'cluster_spawn', count: this.fragments.length, x: this.parent.x, y: this.parent.y });
  }

  #tickClusterParent(bodies, ufos, trace) {
    if (!this.parent.isActive()) return { ended: false };
    const moved = this.parent.tick(bodies, trace);
    if (moved.finished) {
      // Historical Cluster::move returns immediately when the parent times out.
      this.finished = true;
      this.finishReason = moved.reason;
      return { ended: true, reason: moved.reason };
    }

    for (let i = 0; i < bodies.length; i += 1) {
      const body = bodies[i];
      if (!bodyCollision(body, this.parent.x, this.parent.y, HISTORICAL_WIDTH.cluster, false)) continue;

      this.lastCollision = { kind: 'body', index: i, bodyKind: body.kind };
      trace?.({ event: 'collision', kind: 'galaxy_object', index: i, body_kind: body.kind });
      // Galaxy::has_collision() returns true for every body collision, even
      // non-destructive Storm/Wormhole hits, and Cluster::move increments its
      // shared laser_hits counter unconditionally.
      this.clusterHits += 1;
      if (body.kind === BodyKind.WORMHOLE) {
        const fromX = this.parent.x; const fromY = this.parent.y;
        this.parent.x = body.x + body.exitX;
        this.parent.y = body.y + body.exitY;
        trace?.({ event: 'wormhole_teleport', from_x: fromX, from_y: fromY, to_x: this.parent.x, to_y: this.parent.y, speed: this.parent.speed, direction: this.parent.direction });
        return { ended: false };
      }
      if (body.kind === BodyKind.STORM) return { ended: false };

      // Planet::hit computes recoil, then invokes Cluster::hit(planet).
      applyPlanetRecoil(body, this.parent);
      this.#spawnCluster(body, trace);
      return { ended: false };
    }

    for (let i = 0; i < ufos.length; i += 1) {
      const ufo = ufos[i];
      if (!collideUfoAndDamage(this.parent, ufo, HISTORICAL_WIDTH.cluster, trace)) continue;
      this.lastCollision = { kind: 'ufo', index: i };
      this.#spawnCluster(ufo, trace);
      this.clusterHits += 1;
      return { ended: false };
    }

    return { ended: false };
  }

  #tickClusterFragments(bodies, ufos, trace) {
    // Newly spawned fragments move in the same Cluster::move call historically.
    for (let i = 0; i < this.fragments.length; i += 1) {
      const fragment = this.fragments[i];
      if (!fragment.isActive()) continue;
      const result = tickProjectileWorld({ projectile: fragment, bodies, ufos, shotWidth: HISTORICAL_WIDTH.laser, trace });
      if (result.finished) {
        this.clusterHits += 1;
        trace?.({ event: 'cluster_fragment_end', fragment: i, reason: result.reason });
      }
    }
  }

  tick({ bodies, ufos, trace = null }) {
    if (this.finished) return { finished: true, reason: this.finishReason ?? 'inactive' };

    if (this.weapon !== 'cluster') {
      const result = tickProjectileWorld({
        projectile: this.parent,
        bodies,
        ufos,
        shotWidth: WIDTH_BY_WEAPON[this.weapon],
        trace,
      });
      if (result.finished) {
        this.finished = true;
        this.finishReason = result.reason;
      }
      return result;
    }

    const parent = this.#tickClusterParent(bodies, ufos, trace);
    if (parent.ended) return { finished: true, reason: parent.reason };
    this.#tickClusterFragments(bodies, ufos, trace);

    if (this.clusterHits >= 6) {
      this.finished = true;
      this.finishReason = 'cluster_complete';
      return { finished: true, reason: 'cluster_complete' };
    }
    return { finished: false, reason: this.fragments.length ? 'cluster_fragments' : 'flying' };
  }

  /** Extra collision is checked after movement and before draw, and does not end a shot. */
  hitExtra(extra, trace = null) {
    if (!this.isActive() || extra.wait > 50 || !Number.isFinite(extra.x) || !Number.isFinite(extra.y)) return false;

    // Historical quirk: Cluster checks its stale parent center while any fragment
    // keeps Cluster::is_active() true, even after parent moving_time reaches zero.
    if (this.weapon === 'cluster') {
      if (sphereCollision(this.parent.x, this.parent.y, HISTORICAL_WIDTH.cluster, extra.x, extra.y, 36)) {
        extra.wait = 200; extra.waiting = 200;
        trace?.({ event: 'extra_hit', projectile: 'cluster_parent' });
        return true;
      }
      for (let i = 0; i < this.fragments.length; i += 1) {
        const p = this.fragments[i];
        if (p.isActive() && sphereCollision(p.x, p.y, HISTORICAL_WIDTH.laser, extra.x, extra.y, 36)) {
          extra.wait = 200; extra.waiting = 200;
          trace?.({ event: 'extra_hit', projectile: `cluster_fragment_${i}` });
          return true;
        }
      }
      return false;
    }

    const width = WIDTH_BY_WEAPON[this.weapon];
    if (!sphereCollision(this.parent.x, this.parent.y, width, extra.x, extra.y, 36)) return false;
    extra.wait = 200; extra.waiting = 200;
    trace?.({ event: 'extra_hit', projectile: this.weapon });
    return true;
  }

  /** Consume only the random calls caused by the historical shot draw routine. */
  consumeDrawRng(rng, trace = null) {
    if (this.weapon !== 'cluster') {
      consumeLaserDrawRng(this.parent, rng, trace);
      return;
    }
    consumeLaserDrawRng(this.parent, rng, trace);
    for (const p of this.fragments) consumeLaserDrawRng(p, rng, trace);
  }
}
