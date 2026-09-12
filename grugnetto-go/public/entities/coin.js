import * as me from "../vendor/melonjs-19.9.1.esm.js";
import game, { playSound, addComboScore } from "../game.js?v=11";

class CoinEntity extends me.Collectable {
  constructor(x, y, settings) {
    // No Tiled top-left -> bottom-center conversion needed here, unlike GoalEntity: this
    // entity keeps Collectable's default (0, 0) anchor, which already matches Tiled's own
    // top-left convention for `pos`.
    super(x, y, Object.assign({
      image: me.loader.getImage("coin"),
      framewidth: 128,
      frameheight: 128,
    }, settings, {
      // found live (see player.js / goal.js): Tiled's object factory auto-fills
      // settings.shapes with a top-left-relative default Rect(0,0,width,height); merged in
      // the other order that silently overrides our own shape below. Force it last.
      shapes: [new me.Ellipse(32, 32, 40, 40)],
    }));
    // The new coin art is a 128x128 source (2x the in-game size — see resources.js for why);
    // scale() brings it down to match this level's 64px tile grid, same pattern as the
    // player's art. Collision shape/anchor math is untouched: the ellipse above and
    // Collectable's default (0,0) anchor were already sized/positioned for a 64x64 result.
    this.scale(0.5);
  }

  onResetEvent(x, y) {
    this.shift(x, y);
    this.body.setCollisionMask(me.collision.types.PLAYER_OBJECT);
  }

  onCollision() {
    playSound("sfx_coin");
    // addComboScore() (not a flat game.data.score += 100) — routes this through the combo
    // multiplier, see game.js's own comment. It calls game.notify() itself, so the extra
    // game.data.coins bump right after still needs its own notify() to actually reach the HUD.
    addComboScore(100);
    game.data.coins += 1;
    game.notify();
    this.body.setCollisionMask(me.collision.types.NO_OBJECT);
    me.game.world.removeChild(this);
    return false;
  }
}

export default CoinEntity;
