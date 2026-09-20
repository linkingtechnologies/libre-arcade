// SPDX-License-Identifier: GPL-3.0-or-later
// Clean JavaScript implementation of HighMoon 1.2.4 vector_2 semantics.

export const VectorType = Object.freeze({ P: "P", K: "K", U: "U" });

export class Vector2 {
  constructor(a, b, type = VectorType.K) {
    switch (type) {
      case VectorType.P:
        this.length = a;
        this.angle = b;
        this.x = this.length * Math.cos(this.angle);
        this.y = this.length * Math.sin(this.angle);
        this.infinite = false;
        break;
      case VectorType.K:
        this.x = a;
        this.y = b;
        this.length = Math.sqrt(this.x * this.x + this.y * this.y);
        this.angle = Math.atan2(this.y, this.x);
        this.infinite = false;
        break;
      case VectorType.U:
        this.x = 0;
        this.y = 0;
        this.length = undefined;
        this.angle = undefined;
        this.infinite = true;
        break;
      default:
        throw new TypeError(`Unknown Vector2 type: ${type}`);
    }
  }

  clone() {
    if (this.infinite) return new Vector2(0, 0, VectorType.U);
    return new Vector2(this.x, this.y, VectorType.K);
  }

  addInPlace(v) {
    this.x += v.x;
    this.y += v.y;
    this.length = Math.sqrt(this.x * this.x + this.y * this.y);
    this.angle = Math.atan2(this.y, this.x);
    return this;
  }

  subInPlace(v) {
    this.x -= v.x;
    this.y -= v.y;
    this.length = Math.sqrt(this.x * this.x + this.y * this.y);
    this.angle = Math.atan2(this.y, this.x);
    return this;
  }

  plus(v) {
    return this.clone().addInPlace(v);
  }

  minus(v) {
    return this.clone().subInPlace(v);
  }

  multiplyInPlace(f) {
    this.length *= f;
    this.x *= f;
    this.y *= f;
    return this;
  }

  times(f) {
    return this.clone().multiplyInPlace(f);
  }

  distance(v) {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  newLength(len) {
    return len === 0
      ? new Vector2(0, 0, VectorType.K)
      : new Vector2(this.x / this.length * len, this.y / this.length * len, VectorType.K);
  }

  newVectorTo(len, angle) {
    return new Vector2(this.x + len * Math.cos(angle), this.y + len * Math.sin(angle), VectorType.K);
  }
}
