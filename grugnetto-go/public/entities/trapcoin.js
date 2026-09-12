import * as me from "../vendor/melonjs-19.9.1.esm.js";

// Source art is 128x128, same canvas/scale as the plain coin (see coin.js) — an earlier version
// used a bigger 160x160 canvas with longer spikes, reported live as reaching far enough to hit
// the player just walking underneath one, not only when jumping for it. Shorter spikes now fit
// the coin's own 128px canvas with room to spare.
const FRAME_SIZE = 128;
const SCALE = 0.5;

// A slow, continuous opacity pulse (setOpacity is absolute — confirmed against the pinned
// 19.9.1 renderable.js source — unlike scale(), which multiplies the *current* transform each
// call and would compound into a runaway size if driven every frame the same naive way) so a
// disguised hazard among real coins still reads as "something's off" even before the player
// consciously notices the spikes. Timer starts at a random offset so several trap coins in the
// same level don't all pulse in lockstep.
const PULSE_PERIOD_MS = 700;
const PULSE_MIN_OPACITY = 0.55;

// A hazard disguised as a coin — same me.Collectable overlap-detection CoinEntity uses, but
// touching it calls the player's own hurt() (life lost + level reload, same consequence as
// enemy contact) instead of granting points. collisionType is deliberately ENEMY_OBJECT, not a
// new type: PlayerEntity.onCollision already branches on that type and only skips straight to
// hurt() when the other object has no stomp() method (see player.js) — this entity intentionally
// has none, so landing on top "kills" the player exactly like a side hit does, never the enemy
// entities' stomp-to-defeat exception (jumping on a coin shouldn't destroy it). Removes itself
// after triggering once, same "consumed on contact" convention as a real coin — unlike
// EnemyEntity this isn't a patrolling, ever-present threat, just a single gotcha sitting among
// the real coins.
class TrapCoinEntity extends me.Collectable {
  constructor(x, y, settings) {
    // No Tiled top-left -> bottom-center conversion needed, same as CoinEntity: Collectable's
    // default (0, 0) anchor already matches Tiled's own top-left convention for `pos`.
    super(x, y, Object.assign({
      image: me.loader.getImage("trapcoin"),
      framewidth: FRAME_SIZE,
      frameheight: FRAME_SIZE,
    }, settings, {
      // found live (see coin.js/goal.js/player.js): Tiled's object factory auto-fills
      // settings.shapes with a top-left-relative default Rect(0,0,width,height); merged in
      // the other order that silently overrides our own shape below. Force it last so ours
      // always wins. Smaller than coin.js's own 40x40, deliberately: unlike a normal hitbox
      // (sized to match, not exceed, the visible art) this is a punishing mechanic, so erring
      // toward *more* forgiving than the art strictly implies is the right direction — reported
      // live that the previous, bigger hitbox caught the player just walking near one.
      shapes: [new me.Ellipse(32, 32, 34, 34)],
    }));
    this.scale(SCALE);
    this.bodyDef.collisionType = me.collision.types.ENEMY_OBJECT;
    this.bodyDef.collisionMask = me.collision.types.PLAYER_OBJECT;
    this.pulseTimer = Math.random() * PULSE_PERIOD_MS;
  }

  onResetEvent(x, y) {
    this.shift(x, y);
    this.body.setCollisionMask(me.collision.types.PLAYER_OBJECT);
  }

  update(dt) {
    this.pulseTimer = (this.pulseTimer + dt) % PULSE_PERIOD_MS;
    const wave = (1 - Math.cos((this.pulseTimer / PULSE_PERIOD_MS) * Math.PI * 2)) / 2; // 0->1->0
    this.setOpacity(1 - wave * (1 - PULSE_MIN_OPACITY));
    return super.update(dt);
  }

  onCollision(response, other) {
    if (other.body.collisionType === me.collision.types.PLAYER_OBJECT && typeof other.hurt === "function") {
      other.hurt();
    }
    this.body.setCollisionMask(me.collision.types.NO_OBJECT);
    me.game.world.removeChild(this);
    return false;
  }
}

export default TrapCoinEntity;
