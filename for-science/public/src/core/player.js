export const ASSETS = Object.freeze([
  { id: 'shield', name: 'Shield UP!', cost: 10 },
  { id: 'cow', name: 'Orbital Cow!', cost: 30 },
  { id: 'meteorite', name: 'Meteor Burst!', cost: 20 },
  { id: 'rocket', name: 'Rocket!', cost: 10 },
  { id: 'laser', name: 'Laser Beam!', cost: 5 },
]);

/** Faithful model of the original Player class. */
export class PlayerState {
  constructor(who) {
    this.who = who;
    this.shield = 100;
    // money, shield, cow, meteorite, rocket, laser
    this.score = [0, 0, 0, 0, 0, 0];
  }

  canUse(assetIndex) {
    const scoreIndex = assetIndex + 1;
    return this.score[scoreIndex] > 0 && this.score[0] >= ASSETS[assetIndex].cost;
  }

  use(assetIndex) {
    if (!this.canUse(assetIndex)) return null;
    const scoreIndex = assetIndex + 1;
    this.score[0] -= ASSETS[assetIndex].cost;
    this.score[scoreIndex] -= 1;
    return ASSETS[assetIndex].name;
  }

  /**
   * Port of Player.add_score(). A match of a non-money tile grants one item
   * per tile type per scoring event, even if score records repeat. Money score
   * records are multiplied by 5 exactly as in the Python original.
   */
  addScore(scoreRecords) {
    const accounted = new Set();
    for (const record of scoreRecords) {
      const { tile, amount } = record;
      if (tile === 0) {
        this.score[0] += amount * 5;
      } else if (!accounted.has(tile)) {
        accounted.add(tile);
        this.score[tile] += 1;
      }
    }
  }

  /**
   * Faithful quirk: the original set_shield() only clamped the drawn line,
   * not Player.shield itself. Therefore repairs can raise shield above 100.
   */
  applyShieldDelta(value) {
    this.shield -= value;
    return Math.max(0, Math.min(100, this.shield));
  }
}

export function attackDamage(assetIndex, rng) {
  switch (assetIndex) {
    case 1: return 15 + rng.randint(0, 15); // cow: 15..30
    case 2: return 10 + rng.randint(0, 15); // meteorite: 10..25
    case 3: return 10 + rng.randint(0, 5);  // rocket: 10..15
    case 4: return 5 + rng.randint(0, 5);   // laser: 5..10
    default: return 0;
  }
}

/**
 * Preserve the exact RNG consumption order in GameControl.on_use_asset():
 * damage is rolled first, then the target receives a -10..10 vertical jitter.
 * The jitter has no gameplay effect, but consuming it is essential because it
 * changes all subsequent board/AI randomness.
 */
export function attackRoll(assetIndex, rng) {
  if (assetIndex === 0) return { damage: 0, targetJitter: 0 };
  const damage = attackDamage(assetIndex, rng);
  const targetJitter = rng.randint(-10, 10);
  return { damage, targetJitter };
}
