const WIDTH = Object.freeze({ 1: 9, 2: 18, 3: 37, 4: 75 });

export class Ball {
  constructor({ x, y, size, flip }) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.flip = flip;
    this.state = 0;
    this.velocity = -2;
    this.width = WIDTH[size];
    // Historical comma-operator quirk means sizes 2 and 3 also rebound at -4.
    this.bounceVelocity = size === 4 ? -5 : -4;
    this.frame = 0;
    this.step = 0;
  }

  update(level, move = true) {
    if (this.state === 2) {
      this.frame = 1;
      this.step++;
      if (this.step > 10) this.state = -1;
      return;
    }
    if (move) this.#animate(level);
  }

  #animate(level) {
    this.velocity += 0.04;
    const dy = Math.trunc(this.velocity);
    const dirY = dy > 0 ? 1 : -1;
    const probeY = this.y + dy + dirY * (this.width - 8);
    this.frame = level.distanceToFloor(this.x, probeY, 16) < 15 ? 2 : 0;

    if (level.distanceToFloor(this.x, probeY, dy) !== dy) {
      if (this.velocity > 0) this.velocity = this.bounceVelocity;
      else this.velocity *= -1;
    } else {
      this.y += dy;
      if (level.distanceToWall(this.x + this.flip * (this.width - 8), this.y, this.flip) !== this.flip) {
        this.flip *= -1;
      }
    }
    this.x += this.flip;
  }

  hit() {
    if (this.state !== 0) return { children: [], score: 0 };
    this.state = 2;
    const children = this.size === 1 ? [] : [
      { x: this.x + 10, y: this.y, size: this.size - 1, flip: 1 },
      { x: this.x - 10, y: this.y, size: this.size - 1, flip: -1 }
    ];
    return { children, score: this.size };
  }
}
