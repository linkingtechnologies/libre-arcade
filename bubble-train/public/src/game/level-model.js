// SPDX-License-Identifier: GPL-3.0-or-later
import { Cannon } from './cannon.js';
import { BulletFactory } from './bullet-factory.js';
import { CarriageFactory } from './carriage-factory.js';
import { TrainStation } from './train-station.js';

export class LevelModel {
  constructor(definition, rng, { frameMs = 40 } = {}) {
    this.definition = definition;
    this.rng = rng;
    this.frameMs = frameMs;
    this.nowMs = 0;
    this.bullets = [];
    this.state = 'playing';
    this.frame = 0;
    this.lastEvents = [];

    // Original load order constructs cannons/magazines before train stations.
    this.cannons = definition.cannons.map(c => {
      const bulletFactory = new BulletFactory(c.bullets, rng);
      return new Cannon({ ...c, bulletFactory });
    });

    this.stations = definition.trains.map(t => new TrainStation({
      track: t.track,
      speed: t.speed,
      factory: new CarriageFactory(t.carriages, rng)
    }));
  }

  canFireBullet() {
    // Source code says "one" in its comment but actually allows Size() <= 10.
    return this.bullets.length <= 10;
  }

  fireCannon(index = 0) {
    const cannon = this.cannons[index];
    if (!cannon || !this.canFireBullet()) return null;
    const bullet = cannon.fireLoaded(this.nowMs);
    if (bullet) this.bullets.push(bullet);
    return bullet;
  }

  tick() {
    if (this.state !== 'playing') return this.state;
    const nowMs = this.nowMs;
    const events = [];

    // Level::animate order from the original source.
    for (const cannon of this.cannons) cannon.animate(nowMs, this.rng);

    for (let i = 0; i < this.stations.length; i++) {
      const result = this.stations[i].tick({ nowMs, rng: this.rng });
      if (result.removed.length) events.push({ type: 'match', station: i, count: result.removed.length });
      if (result.spawned) events.push({ type: 'spawn', station: i });
      if (result.returnedBubble) events.push({ type: 'returned', station: i });
      if (this.stations[i].train.status === 'crashed') events.push({ type: 'crash', station: i });
    }

    for (const bullet of this.bullets) {
      bullet.tick({ nowMs, rng: this.rng });
      if (!bullet.intersectsScreen()) bullet.alive = false;
    }

    // Collision checks happen after trains have already resolved matches.
    for (const bullet of this.bullets) {
      if (!bullet.alive) continue;
      for (let i = 0; i < this.stations.length; i++) {
        const hit = this.stations[i].train.resolveProjectile(bullet.position, bullet.bubble, nowMs);
        if (hit.hit) {
          bullet.alive = false;
          events.push({ type: hit.kind, station: i, removed: hit.removed.length });
          break;
        }
      }
    }
    this.bullets = this.bullets.filter(b => b.alive);

    if (this.stations.some(s => s.train.status === 'crashed')) this.state = 'gameover';
    else if (this.stations.every(s => s.empty)) this.state = 'won';

    this.lastEvents = events;
    this.frame += 1;
    this.nowMs += this.frameMs;
    return this.state;
  }
}
