export class Bomb {
  constructor({ x, y, flip }) {
    this.x = x;
    this.y = y - 40;
    this.state = 0;
    this.flip = flip;
    this.velocity = -4;
    this.initialVelocity = -4;
    this.frame = 0;
  }

  update(level) {
    this.x += this.flip * 4;
    this.y += level.distanceToFloor(this.x, this.y, Math.trunc(this.velocity));
    this.velocity += 0.1;

    if (level.distanceToFloor(this.x, this.y, 1) === 0) {
      this.initialVelocity += 1;
      this.velocity = this.initialVelocity;
      this.y -= 1;
      if (this.initialVelocity < 0) this.velocity = this.initialVelocity;
    }
    this.frame = (this.frame + 1) % 4;
    return this.x > 620 || this.x < 20;
  }
}
