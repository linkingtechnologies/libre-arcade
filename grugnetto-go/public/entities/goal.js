import * as me from "../vendor/melonjs-19.9.1.esm.js";
import game, { playSound, stopMusic, TIME_BONUS_MAX, TIME_BONUS_DECAY_PER_SEC, NO_DAMAGE_BONUS, COIN_CLEAR_BONUS } from "../game.js?v=11";

// Rendered size of the flag sprite (framewidth/frameheight below) — used for the position
// conversion instead of Tiled's own declared object width/height (48x96 in world1-level1.json).
// Found live: using Tiled's height (96) put the flag's anchor 32px below the actual sprite's
// true bottom (64), sinking it that far into the ground once the top-left conversion below
// was applied — Tiled's declared height just doesn't match this flag's actual art size.
const FLAG_SIZE = 64;
// Noticeably slower than enemy.js's WALK_FRAME_MS (220) — a gentle wave, not a fast flap.
const WAVE_FRAME_MS = 300;

// Which color to use comes from the Tiled object's own `type` field (settings.type — see
// tools/compile-level.py's WORLD_FLAG, one color per world) — same KINDS-table pattern as
// bonus.js/enemy.js. DEFAULT_KIND keeps the original green as the fallback for a missing/
// unrecognized value instead of erroring.
const KINDS = {
  green:  { a: "flag-green-a",  b: "flag-green-b" },
  blue:   { a: "flag-blue-a",   b: "flag-blue-b" },
  red:    { a: "flag-red-a",    b: "flag-red-b" },
  yellow: { a: "flag-yellow-a", b: "flag-yellow-b" },
};
const DEFAULT_KIND = "green";

// Reaching this ends the level — a flag, using the same me.Collectable overlap-detection
// mechanism as CoinEntity, just with a different reaction (set "won", don't remove itself).
class GoalEntity extends me.Collectable {
  constructor(x, y, settings) {
    const kind = KINDS[settings.type] ? settings.type : DEFAULT_KIND;
    // Same Tiled top-left -> bottom-center conversion as PlayerEntity (see its comments for
    // the full explanation): Collectable's own default anchor is (0, 0), matching Tiled's
    // convention directly, which is why CoinEntity below needs no such conversion — but this
    // entity overrides the anchor to bottom-center (so the flag's base sits on the ground),
    // so `pos` has to represent that bottom-center point too, not Tiled's raw top-left (x, y).
    super(x + FLAG_SIZE / 2, y + FLAG_SIZE, Object.assign({
      image: me.loader.getImage(KINDS[kind].a),
      framewidth: 64,
      frameheight: 64,
    }, settings, {
      // found live (see player.js): Tiled's object factory auto-fills settings.shapes with a
      // top-left-relative default Rect(0,0,width,height); merged in the other order that
      // silently overrides our own shape below. Force it last so ours always wins. Offset
      // relative to the new bottom-center pos above (a vertical strip for the flag pole,
      // centered horizontally, spanning the full 64px sprite height upward from the anchor).
      shapes: [new me.Rect(-16, -64, 32, 64)],
    }));
    this.anchorPoint.set(0.5, 1.0);
    this.kind = kind;
    this.waveFrame = 0;
    this.waveTimer = 0;
    // See tools/compile-level.py's own comment on the "coinGoal" Tiled property — settings.type
    // is a native Tiled object field, this is a custom one, but both reach here the same way.
    this.coinGoal = !!settings.coinGoal;
    // Cooldown so standing on a still-locked flag doesn't replay the "denied" cue every single
    // frame of contact (sensor collisions re-fire on continued overlap, same reason hurt()/
    // stomp() need their own guards elsewhere) — 600ms is long enough to not spam, short enough
    // to still respond promptly to "ok, I grabbed the last coin, now touch it again".
    this.deniedTimer = 0;
  }

  onResetEvent(x, y) {
    this.shift(x, y);
    this.body.setCollisionMask(me.collision.types.PLAYER_OBJECT);
  }

  // Alternates the a/b frames on a timer — previously static (only the "a" frame was ever
  // registered/loaded at all, despite a matching "b" wave frame already sitting on disk).
  update(dt) {
    this.waveTimer += dt;
    if (this.waveTimer > WAVE_FRAME_MS) {
      this.waveTimer = 0;
      this.waveFrame = 1 - this.waveFrame;
      const frames = KINDS[this.kind];
      const image = me.loader.getImage(this.waveFrame === 0 ? frames.a : frames.b);
      if (image) {
        this.image = image;
      }
    }
    if (this.deniedTimer > 0) {
      this.deniedTimer -= dt;
    }
    // A locked coinGoal flag still waves (feels alive, not broken) but sits visibly dimmed so
    // "touching it does nothing yet" reads as a deliberate lock, not a bug — full brightness the
    // instant the last coin is collected, no need to wait for another touch.
    if (this.coinGoal) {
      this.setOpacity(this.isUnlocked() ? 1 : 0.45);
    }
    return super.update(dt);
  }

  isUnlocked() {
    return !this.coinGoal || game.data.coins >= game.data.totalCoins;
  }

  onCollision() {
    if (game.data.status !== "playing") {
      this.body.setCollisionMask(me.collision.types.NO_OBJECT);
      return false;
    }
    if (!this.isUnlocked()) {
      if (this.deniedTimer <= 0) {
        this.deniedTimer = 600;
        playSound("sfx_bump");
      }
      return false;
    }
    // Level-completion bonuses — evaluated once, together, right here (see game.js's own comment
    // on TIME_BONUS_MAX/NO_DAMAGE_BONUS/COIN_CLEAR_BONUS for what each rewards and why they're
    // NOT routed through addComboScore(), unlike CoinEntity/BonusEntity/EnemyEntity's own
    // pickups). Stashed on game.data so app.js's LevelCompleteOverlay() can show a breakdown
    // instead of the score just silently jumping by their combined total.
    const elapsedSec = (Date.now() - game.data.levelStartedAt) / 1000;
    const timeBonus = Math.max(0, Math.round(TIME_BONUS_MAX - elapsedSec * TIME_BONUS_DECAY_PER_SEC));
    const noDamageBonus = game.data.tookDamageThisAttempt ? 0 : NO_DAMAGE_BONUS;
    const coinsBonus = game.data.totalCoins > 0 && game.data.coins >= game.data.totalCoins ? COIN_CLEAR_BONUS : 0;
    game.data.lastTimeBonus = timeBonus;
    game.data.lastNoDamageBonus = noDamageBonus;
    game.data.lastCoinsBonus = coinsBonus;
    game.data.score += timeBonus + noDamageBonus + coinsBonus;
    game.data.status = "won";
    game.notify();
    stopMusic();
    playSound("win");
    this.body.setCollisionMask(me.collision.types.NO_OBJECT);
    return false;
  }
}

export default GoalEntity;
