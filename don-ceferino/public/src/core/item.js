export class Item {
  constructor({ x, y, type }) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.state = 0; // 0 normal, 1 selected, 2 transparent, -1 dead
    this.life = 400;
    this.velocity = -3;
  }

  update(level) {
    if (level.distanceToFloor(this.x, this.y - 10, 1) !== 0) {
      this.y += level.distanceToFloor(this.x, this.y - 10, Math.trunc(this.velocity));
      this.velocity += 0.1;
    } else {
      this.velocity = 0;
    }

    if (this.state === 0 && this.life < 100) this.state = 2;
    else if ((this.state === 2 || this.state === 1) && this.life < 0) this.state = -1;
    this.life--;
  }

  collect() {
    if (this.state === 0 || this.state === 2) {
      this.state = 1;
      this.life = 10;
      return true;
    }
    return false;
  }

  get frame() {
    if (this.state === 1) return this.type + 7;
    if (this.state === 2) return this.type + 14;
    return this.type;
  }
}
