function step(value, target) {
  const d = target - value;
  if (Math.abs(d) < 10 && d !== 0) return value + Math.sign(d);
  return value + Math.trunc(d / 10);
}

export class MenuTitleAnimation {
  constructor() { this.reset(); }
  reset() {
    this.sprites = [
      { x:-594, y:616, tx:90,  ty:8 },
      { x:830,  y:616, tx:230, ty:0 },
      { x:-500, y:750, tx:204, ty:87 }
    ];
  }
  update() {
    for (const s of this.sprites) {
      s.x = step(s.x, s.tx);
      s.y = step(s.y, s.ty);
    }
  }
  get done() { return this.sprites.every(s => s.x === s.tx && s.y === s.ty); }
}
