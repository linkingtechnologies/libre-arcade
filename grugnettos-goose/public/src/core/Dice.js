export class Dice {
  constructor({ count = 2, sides = 6 } = {}) {
    if (!Number.isInteger(count) || count < 1) throw new RangeError('count must be >= 1');
    if (!Number.isInteger(sides) || sides < 2) throw new RangeError('sides must be >= 2');
    this.count = count;
    this.sides = sides;
  }

  roll(rng) {
    if (!rng || typeof rng.nextInt !== 'function') {
      throw new TypeError('Dice.roll requires a compatible RNG');
    }

    const values = Array.from({ length: this.count }, () => rng.nextInt(1, this.sides));
    return {
      values,
      total: values.reduce((sum, value) => sum + value, 0)
    };
  }
}
