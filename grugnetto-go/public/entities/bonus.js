import * as me from "../vendor/melonjs-19.9.1.esm.js";
import game, { playSound, INVINCIBILITY_MS, addComboScore } from "../game.js?v=11";

// One shared entity for all 4 extra pickups (apple/acorn/heart/key) instead of 4 near-identical
// classes — which sprite/point-value to use comes from the Tiled object's own `type` field
// (settings.type), matched against this table. Every kind grants the same reward: points, plus
// a temporary immunity to enemy contact (see game.js's INVINCIBILITY_MS and
// entities/player.js's hurt()) — no per-kind mechanic (key unlocking the goal, etc.) yet.
const KINDS = {
  apple: { image: "bonus-apple", points: 150 },
  acorn: { image: "bonus-acorn", points: 100 },
  heart: { image: "bonus-heart", points: 300 },
  key:   { image: "bonus-key",   points: 200 },
};
const DEFAULT_KIND = "apple";

class BonusEntity extends me.Collectable {
  constructor(x, y, settings) {
    const kind = KINDS[settings.type] ? settings.type : DEFAULT_KIND;
    const { image } = KINDS[kind];
    // Same 128x128-source-scaled-to-64 pattern as CoinEntity — see its comments.
    super(x, y, Object.assign({
      image: me.loader.getImage(image),
      framewidth: 128,
      frameheight: 128,
    }, settings, {
      // found live (see coin.js / player.js / goal.js): Tiled's object factory auto-fills
      // settings.shapes with a top-left-relative default Rect(0,0,width,height); merged in
      // the other order that silently overrides our own shape below. Force it last.
      shapes: [new me.Ellipse(32, 32, 40, 40)],
    }));
    this.scale(0.5);
    this.kind = kind;
  }

  onResetEvent(x, y, settings = {}) {
    // Poolable (see the true 3rd arg to me.pool.register("BonusEntity", ...)) — same gap as
    // EnemyEntity's own onResetEvent (see its comment): melonJS's pool.get() forwards the exact
    // same (x, y, settings) it would give the constructor into this method on reuse instead of
    // calling the constructor again, so `this.kind`/this.image (set only in the constructor
    // before this fix) kept whatever a recycled instance's PREVIOUS life had — a slot last used
    // for a "key" pickup reused for an "apple" object would still show the key art and grant its
    // 200 points. Re-deriving kind/image here from the same `settings` the constructor uses
    // closes that gap.
    const kind = KINDS[settings.type] ? settings.type : DEFAULT_KIND;
    this.kind = kind;
    this.shift(x, y);
    this.image = me.loader.getImage(KINDS[kind].image);
    this.body.setCollisionMask(me.collision.types.PLAYER_OBJECT);
  }

  onCollision() {
    playSound("sfx_coin");
    // addComboScore(), not a flat game.data.score += points — chains into the combo multiplier
    // same as CoinEntity/EnemyEntity's own pickups (see game.js's own comment); it calls
    // game.notify() itself, so the invincibility write right after still needs its own.
    addComboScore(KINDS[this.kind].points);
    // Extends (not stacks with) any immunity already running, rather than adding on top — a
    // player chain-grabbing several bonuses back to back gets one long window measured from the
    // *last* pickup, simpler to reason about than an ever-growing stacked total.
    game.data.invincibleUntil = Date.now() + INVINCIBILITY_MS;
    game.notify();
    this.body.setCollisionMask(me.collision.types.NO_OBJECT);
    me.game.world.removeChild(this);
    return false;
  }
}

export default BonusEntity;
