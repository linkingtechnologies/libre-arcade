// SPDX-License-Identifier: GPL-3.0-or-later
import { Bullet } from './bullet.js';

export const CANNON_LENGTH = 45;
export const ROTATION_STEP = Math.PI / 60;

export class Cannon {
  constructor({ position, bulletSpeed = 10, reloadMs = 500, angle = 0, bulletFactory = null } = {}) {
    this.position = { ...position };
    this.bulletSpeed = bulletSpeed;
    this.reloadMs = reloadMs;
    this.angle = angle;
    this.lastShotMs = -Infinity;
    this.bulletFactory = bulletFactory;
    this.loadedBubble = null;
    this.nextBubble = null;
    if (bulletFactory) this.loadInitialMagazine();
  }

  loadInitialMagazine() {
    this.loadedBubble = this.bulletFactory.nextBubble();
    this.nextBubble = this.bulletFactory.nextBubble();
  }

  rotate(delta) {
    this.angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.angle + delta));
  }

  setAngle(angle) {
    this.angle = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle));
  }

  barrelPosition() {
    return {
      x: this.position.x - CANNON_LENGTH * Math.sin(this.angle),
      y: this.position.y - CANNON_LENGTH * Math.cos(this.angle)
    };
  }

  nextPreviewPosition(height = 600) {
    return { x: this.position.x + 40, y: height - 15 };
  }

  canFire(nowMs = 0) {
    if (this.bulletFactory) return this.loadedBubble != null;
    return nowMs - this.lastShotMs >= this.reloadMs;
  }

  animate(nowMs, rng) {
    if (this.bulletFactory && this.loadedBubble == null && (nowMs - this.lastShotMs > this.reloadMs)) {
      this.loadedBubble = this.nextBubble;
      this.nextBubble = this.bulletFactory.nextBubble({ nowMs });
    }
    this.loadedBubble?.animate({ nowMs, rng });
    this.nextBubble?.animate({ nowMs, rng });
  }

  fireLoaded(nowMs = 0) {
    if (!this.loadedBubble) return null;
    this.lastShotMs = nowMs;
    const bubble = this.loadedBubble;
    this.loadedBubble = null;
    return this.createBullet(bubble);
  }

  /** Low-level helper retained for tests/diagnostics without a magazine. */
  fire(bubble, nowMs = 0) {
    if (this.bulletFactory) return this.fireLoaded(nowMs);
    if (!this.canFire(nowMs)) return null;
    this.lastShotMs = nowMs;
    return this.createBullet(bubble);
  }

  createBullet(bubble) {
    const position = this.barrelPosition();
    const sx = Math.sin(this.angle);
    const cx = Math.cos(this.angle);
    return new Bullet({
      position,
      bubble,
      velocity: {
        x: Math.abs(sx) < 1e-15 ? 0 : -sx * this.bulletSpeed,
        y: Math.abs(cx) < 1e-15 ? 0 : -cx * this.bulletSpeed
      }
    });
  }
}
