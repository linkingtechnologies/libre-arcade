import * as me from "../vendor/melonjs-19.9.1.esm.js";
import game, { playSound, HIT_GRACE_MS, SUPERJUMP_MAX, COMBO_TIMEOUT_MS } from "../game.js?v=11";

// Extends me.Sprite + me.Body directly, per melonJS's own migration guide (me.Entity is
// deprecated since 18.1.0 — it combined a Body with an internal child renderable behind its
// own anchor-point handling, which is exactly what caused a real, visible bug here: the player
// was present in the world (confirmed via me.game.world.children) but never actually drawn on
// screen, because Entity's preDraw() double-applies anchor offsets — once against the body
// bounds, once again inside the child renderable's own preDraw(). Sprite + Body (no wrapper
// layer) doesn't have that indirection.
//
// Player art is "Grugnetto" — 5 poses (idle/walk_a/walk_b/jump/hit) cropped out of a
// user-supplied illustrated sheet, background removed with rembg, each padded onto a shared
// square canvas with the character bottom-aligned (see resources.js and the scratchpad crop
// script), THEN downsampled once offline with PIL's LANCZOS filter from that 345x345 padded
// canvas to 173x173 — leaving the full 345px art for the engine's own runtime
// scale(SPRITE_SIZE/FRAME_SIZE) to shrink by itself (a ~4x reduction) read as grainy/jagged,
// because the engine's antiAlias option is only a simple bilinear filter, far
// weaker at preserving fine brushwork than a proper offline Lanczos resize. Pre-shrinking most
// of the way here means the engine only has a gentle ~2x reduction left to do at runtime.
// All 5 frames MUST share identical pixel dimensions for the same reason the original Kenney
// frames did: "animation" here is just reassigning `this.image` to a different loaded
// HTMLImageElement with framewidth/frameheight fixed at construction — melonJS draws that
// fixed-size region regardless of which image is currently assigned, so a differently-sized
// frame would either crop or misalign the moment it's swapped in.
const FRAME_SIZE = 173;
// Rendered size of the player sprite after scale(SPRITE_SIZE / FRAME_SIZE) — the physics body
// is sized to match THIS, not Tiled's originally-declared object height (64x96), or the
// invisible hitbox extends above the visible sprite (a real bug with the previous Kenney art;
// see git history for that bug's full story — same principle applies to any future art swap).
// 110, not 64 (a full tile): even the previous 84 read as too small — since
// idle/walk only fill about a third of the shared canvas (the rest is headroom padding needed to
// fit the taller jump pose without cropping it, see HEAD_MARGIN below), scaling that whole
// canvas down leaves the actual standing character much shorter than SPRITE_SIZE itself. 110
// brings idle's rendered height up to ~70px — slightly over one 64px tile, so the character
// reads as the protagonist next to platforms/coins instead of shrinking beside them.
const SPRITE_SIZE = 110;

// Grugnetto's art has transparent headroom baked into the shared canvas — mostly because the
// canvas height is dictated by the tallest pose (jump, arms/ears extending upward), so shorter
// poses like idle sit lower with more empty space above. Checked directly via pixel alpha on
// the final 173x173 frames: jump/walk-b (same source file — see resources.js) has the least
// headroom among the poses actually in use at 60px (idle/walk-a 63, hit 95); a since-retired
// walk-b candidate measured 57px, which is why this constant reads 57 rather than 60 — still
// safely conservative (a *smaller* margin only shrinks the hitbox a few px further than
// strictly necessary, never causes clipping) so it was left alone rather than re-tuned for 3px.
// Feet sit EXACTLY on the canvas's bottom row (0px margin, previously ~2-3px of leftover
// transparent padding there made the feet hover visibly above the ground, as if the character
// were flying). A full SPRITE_SIZE square hitbox would reach into the headroom above,
// touching a platform's underside before the visibly-drawn head does (this exact bug happened
// with the Kenney art too — see HEAD_MARGIN's git history). Using the
// smallest margin across all frames, scaled by the same SPRITE_SIZE/FRAME_SIZE ratio as the
// art itself, keeps the hitbox from ever clipping into whichever frame's head is drawn highest.
const HEAD_MARGIN = Math.round(57 * (SPRITE_SIZE / FRAME_SIZE));
const BODY_HEIGHT = SPRITE_SIZE - HEAD_MARGIN;

// Same "invisible padding vs. hitbox" bug as HEAD_MARGIN above, but sideways — reported live:
// jumping bonked on a platform's edge while there was still clearly visible empty space beside
// the character. Grugnetto's round, compact silhouette leaves wide transparent margins on
// both sides of the shared canvas: checked directly via pixel alpha, content spans only
// 91-95px of the 173px-wide canvas (idle/walk-b/jump: 91px, hit: 95px), symmetric left/right
// since every pose was horizontally centered when padded onto the canvas. Using the narrowest
// content width across frames keeps the hitbox from ever extending past a frame's actual edge.
const HITBOX_WIDTH = Math.round(91 * (SPRITE_SIZE / FRAME_SIZE));

// A tapered me.Polygon (wide at the head, narrow at the feet) was tried here briefly, to fix a
// real cosmetic issue: a plain rectangle sized to HITBOX_WIDTH (the character's WIDEST point)
// left the hitbox visibly wider than the actual feet, making the character look like it was
// floating when standing near a platform's edge. REVERTED — it broke something worse: no longer
// able to stand on bridge platforms at all. Root
// cause (reasoned from how SAT collision resolution works, not directly observed): a rectangle
// only ever has 2 candidate separating axes (horizontal, vertical), so landing always resolves
// straight up — but a trapezoid's two slanted side edges add 2 MORE candidate axes, and against a
// shallow overlap (bridges deliberately have a thin 27px collision band, see
// tools/compile-level.py's PLATFORM_COLLISION_HEIGHT — the thinnest platform type in the game),
// the projected overlap along one of those diagonal edges could read as smaller than the vertical
// one, making SAT resolve the collision by pushing the player off at an angle instead of resting
// them on top. A functional regression (blocks progress on bridge levels) outweighs the cosmetic
// one it was fixing, so back to a plain rectangle — see HITBOX_WIDTH above, used directly, no
// separate feet-width value needed anymore.

// Walk cycle: walk-a -> idle -> walk-b -> idle -> repeat. idle sits between each stride pose
// as its own explicit step (not just the "not moving" state below) — requested live after the
// direct walk-a/walk-b alternation felt too abrupt with only 2 poses.
const WALK_FRAMES = ["player-walk-a", "player-idle", "player-walk-b", "player-idle"];

// See isStomp()/onCollision() below for how these are used.
const STOMP_BUFFER = 10;
const STOMP_BOUNCE_VEL = 8;

class PlayerEntity extends me.Sprite {
  constructor(x, y, settings) {
    const width = settings.width || SPRITE_SIZE;
    const height = settings.height || SPRITE_SIZE;
    // Tiled object rects give (x, y) as the TOP-LEFT corner, but me.Body has no anchor
    // awareness of its own — it adds each shape's local offset straight onto `pos`, and our
    // anchorPoint below (bottom-center) makes the *renderable* read `pos` the same way. So
    // `pos` has to already be that agreed-upon bottom-center point, found live by comparing
    // Tiled's rect (x=128,y=384,w=64,h=96 → bottom=480) against the live body/renderable
    // bounds, which were sitting at the raw, unconverted Tiled (x, y) instead. This is only
    // used to place that bottom-center spawn point (the character's feet) — the body's own
    // shape below is always SPRITE_SIZE, regardless of what Tiled declared here.
    super(x + width / 2, y + height, {
      image: "player-idle",
      framewidth: FRAME_SIZE,
      frameheight: FRAME_SIZE,
      anchorPoint: { x: 0.5, y: 1.0 },
    });
    // found live (with the original Kenney art): Sprite's resize() sets an ABSOLUTE pixel
    // size, not a ratio — scale() is the ratio-based method that actually brings the raw art
    // down to this level's 64px tile grid.
    this.scale(SPRITE_SIZE / FRAME_SIZE);
    // unlike me.Entity, me.Sprite doesn't auto-copy settings.name — set it explicitly (useful
    // for the same kind of live world.children debugging that helped find the bugs above).
    this.name = settings.name || "";

    // Declarative body — same pattern melonJS's own Collectable class uses (see coin.js /
    // goal.js, which get this via `extends Collectable`): `Container.addChild` auto-registers
    // `this.bodyDef` with the active physics adapter once this entity is actually attached to
    // the world tree, via its internal `registerChildBody()`. That same function also
    // auto-registers a raw `this.body = new me.Body(...)` (the legacy path this used to use),
    // so the manual `me.game.world.addBody(...)` call this had before was redundant — always
    // build our own shape here, though: found live that Tiled's object factory already fills
    // in `settings.shapes` itself (a default top-left-relative Rect(0,0,width,height)), which
    // would conflict with our bottom-center `pos` convention (see comment above) if used as-is.
    // HITBOX_WIDTH instead of SPRITE_SIZE horizontally — see its comment above — and
    // BODY_HEIGHT instead of SPRITE_SIZE vertically — see HEAD_MARGIN above. Bottom stays at
    // 0 (the feet), so only the top shrinks; centered horizontally, so both sides shrink
    // equally, matching every frame's symmetric left/right margins. Plain me.Rect, not a
    // tapered me.Polygon — see the comment right after HITBOX_WIDTH's own declaration above for
    // why a non-rectangular shape was tried here and reverted.
    this.bodyDef = {
      type: "dynamic",
      shapes: [new me.Rect(-HITBOX_WIDTH / 2, -BODY_HEIGHT, HITBOX_WIDTH, BODY_HEIGHT)],
      collisionType: me.collision.types.PLAYER_OBJECT,
      // portable-field names for the imperative Body calls this used to make: BuiltinAdapter
      // maps `maxVelocity` -> `body.setMaxVelocity()` and `frictionAir` -> `body.setFriction()`
      // (found by reading builtin-adapter.ts — its own `friction` field is contact-based and
      // explicitly documented as ignored by the builtin SAT adapter, unlike `frictionAir`).
      // y was 15 — raised to 18 so a platform 2 tiles up becomes reliably reachable in one hop
      // (tools/generate_level.py's MAX_JUMP_HEIGHT_TILES, mirrored from this exact value), not
      // just 1. Keep these two in sync: generate_level.py's own physics header explains why.
      maxVelocity: { x: 3, y: 18 },
      frictionAir: { x: 0.4, y: 0 },
    };
    this.alwaysUpdate = true;

    // How many times "jump" has been pressed since this entity was last confirmed grounded —
    // see update() below for how this drives super-jump consumption. Replaces a never-actually-
    // read `multipleJump` field that sat here unused since before this feature.
    this.jumpsSinceGround = 0;
    // Consecutive frames spent "onGround with ~zero vertical velocity" — see update() below for
    // why the reset that zeroes jumpsSinceGround needs this instead of a single onGround read.
    this.groundedFrames = 0;
    this.hurtTimer = 0;
    this.walkFrame = 0;
    this.walkTimer = 0;
    // Tracks the previous frame's invincible/not-invincible state purely so update() can call
    // game.notify() exactly on the edge (immunity granted, or naturally expired) instead of
    // every single frame — see update() below.
    this.wasInvincible = false;
    // Guards loseLife() against firing more than once per fall/hit — see its own comment.
    this.isRespawning = false;

    // NO_DAMAGE_BONUS's own tracking flag (see game.js's own comment on that constant) — reset
    // here, in the constructor, not in screens/play.js's loadLevel(): a mid-level death's own
    // me.level.reload() does NOT go through loadLevel() again (same reasoning as the
    // score/coins/superJumps resets in loseLife() below), but it DOES always construct a brand
    // new PlayerEntity — so resetting it here, instead of coordinating two separate reset call
    // sites, covers every fresh-attempt path (first load AND every mid-level reload) for free.
    game.data.tookDamageThisAttempt = false;
    game.notify();

    me.game.viewport.follow(this, me.game.viewport.AXIS.BOTH, 0.1);

    me.input.bindKey(me.input.KEY.LEFT, "left");
    me.input.bindKey(me.input.KEY.RIGHT, "right");
    me.input.bindKey(me.input.KEY.A, "left");
    me.input.bindKey(me.input.KEY.D, "right");
    me.input.bindKey(me.input.KEY.UP, "jump", true);
    me.input.bindKey(me.input.KEY.W, "jump", true);
    me.input.bindKey(me.input.KEY.SPACE, "jump", true);
    // me.input.preventDefault (default true) makes melonJS call event.preventDefault() for any
    // KEY bound via bindKey() — confirmed live and by reading keyboard.ts — but only for keys
    // that are actually bound. DOWN was never bound to anything (no duck/crouch move exists), so
    // melonJS never touched it and the browser's own default action (scrolling the page) fired
    // unimpeded whenever the game had focus — reported live. Binding it to an unused "down"
    // action (never read via isKeyPressed) is enough to make melonJS swallow it like every other
    // bound key; S is bound the same way purely for symmetry with the existing WASD pairs above.
    me.input.bindKey(me.input.KEY.DOWN, "down");
    me.input.bindKey(me.input.KEY.S, "down");

    // USB/Bluetooth gamepad support — melonJS maps gamepad buttons/axes onto the SAME virtual
    // keycodes bound above, so isKeyPressed("left")/("jump") in update() below already reacts
    // to a pad with zero extra code; only the bindings themselves are needed here. Bound on
    // gamepad indices 0-3 so it works regardless of which USB port slot the browser assigns
    // (indices with no controller connected are simply inert, never fire).
    for (let padIndex = 0; padIndex < 4; padIndex++) {
      me.input.bindGamepad(padIndex, { type: "buttons", code: me.input.GAMEPAD.BUTTONS.LEFT }, me.input.KEY.LEFT);
      me.input.bindGamepad(padIndex, { type: "buttons", code: me.input.GAMEPAD.BUTTONS.RIGHT }, me.input.KEY.RIGHT);
      me.input.bindGamepad(padIndex, { type: "axes", code: me.input.GAMEPAD.AXES.LX, threshold: -0.5 }, me.input.KEY.LEFT);
      me.input.bindGamepad(padIndex, { type: "axes", code: me.input.GAMEPAD.AXES.LX, threshold: 0.5 }, me.input.KEY.RIGHT);
      // FACE_1 (bottom face button — A on Xbox pads, Cross on PlayStation pads) and FACE_2
      // (right face button — B / Circle) both jump, so either a "primary action" or
      // "secondary action" press works without needing to know the pad's exact layout.
      me.input.bindGamepad(padIndex, { type: "buttons", code: me.input.GAMEPAD.BUTTONS.FACE_1 }, me.input.KEY.SPACE);
      me.input.bindGamepad(padIndex, { type: "buttons", code: me.input.GAMEPAD.BUTTONS.FACE_2 }, me.input.KEY.SPACE);
    }
  }

  setFrame(name) {
    const image = me.loader.getImage(name);
    if (image && this.image !== image) {
      this.image = image;
    }
  }

  update(dt) {
    if (game.data.status !== "playing") {
      return super.update(dt);
    }

    // Invincibility (bonus pickup or post-hit grace — both just push out the same
    // game.data.invincibleUntil timestamp, see game.js) gets a blinking sprite so it actually
    // reads as "can't be hurt right now" rather than looking like a rendering glitch. notify()
    // only fires on the true/false edge (granted, or naturally expired) — the pickup itself
    // already notifies when it grants immunity, so this mainly exists to tell the HUD the moment
    // it wears off, without spamming a re-render every single frame while it's active.
    const invincible = game.data.invincibleUntil > Date.now();
    if (invincible !== this.wasInvincible) {
      this.wasInvincible = invincible;
      game.notify();
    }
    this.setOpacity(invincible ? (Math.floor(Date.now() / 100) % 2 === 0 ? 1 : 0.35) : 1);

    // Combo decay — see game.js's own COMBO_TIMEOUT_MS comment. Checked here (the only thing that
    // runs every single frame while playing) rather than via a setTimeout/setInterval per pickup,
    // which would need canceling and re-arming on every single extension instead of one plain
    // comparison. Guarded on combo > 0 so this is a no-op (no pointless notify() spam) the vast
    // majority of frames, when no streak is even active.
    if (game.data.combo > 0 && Date.now() - game.data.lastComboAt > COMBO_TIMEOUT_MS) {
      game.data.combo = 0;
      game.notify();
    }

    const onGround = !this.body.falling && !this.body.jumping;
    // Reset jumpsSinceGround only after several CONSECUTIVE frames of "onGround with ~zero
    // vertical velocity" — not on a single onGround read, which is unreliable for exactly one
    // frame after every jump. Root-caused by reading melonJS's own Body.update() source
    // (confirmed against the vendored 19.9.1 bundle): falling is computed as
    // `vel.y * Math.sign(force.y) > 0`, using THAT FRAME's force.y — and this codebase's jump
    // code (both the normal jump and the super jump below) applies its kick as `body.force.y =
    // -maxVel.y`, a NEGATIVE value. On the very first physics step after a jump, force.y is
    // still jump-dominated (negative) rather than gravity's usual positive sign, so
    // vel.y(negative, ascending) * sign(force.y)(negative) computes POSITIVE — `falling` reads
    // true for that one frame even though the player is clearly still rising. The ternary right
    // after (`jumping = falling ? false : jumping`) then permanently clears `jumping` back to
    // false on that same glitch frame — and since force.y returns to gravity's own (positive)
    // sign on every later frame, nothing ever sets `jumping` true again until the next real jump.
    // The net effect: `onGround` (`!falling && !jumping`) spuriously reads true again just 1-2
    // frames into ANY jump, mid-ascent, well before actually landing. This was always a latent
    // bug in the interaction between this codebase's force-based jump and melonJS's own flags,
    // and harmless before now (worst case a 1-frame sprite flicker) — but reading `onGround`
    // directly for jumpsSinceGround made it a real, reliably-reproducing one: the spurious reset
    // was firing on essentially every frame after the first jump, so a genuine super-jump press
    // almost never survived to see jumpsSinceGround still >0. Requiring several consecutive
    // grounded-AND-near-zero-velocity frames filters this out: the glitch's false "grounded"
    // reading coincides with vel.y still being large (mid-ascent, far from zero) for most of the
    // arc, and even right at the apex (the one point vel.y legitimately nears zero mid-air) it
    // only stays there for a frame or two, not GROUNDED_FRAMES_THRESHOLD's worth — while a real
    // landing keeps both conditions true indefinitely (the player just stands there).
    const GROUNDED_FRAMES_THRESHOLD = 6;
    if (onGround && Math.abs(this.body.vel.y) < 1) {
      this.groundedFrames += 1;
    } else {
      this.groundedFrames = 0;
    }
    if (this.groundedFrames >= GROUNDED_FRAMES_THRESHOLD) {
      this.jumpsSinceGround = 0;
    }
    let moving = false;

    if (me.input.isKeyPressed("left")) {
      this.body.force.x = -this.body.maxVel.x;
      this.flipX(true);
      moving = true;
    } else if (me.input.isKeyPressed("right")) {
      this.body.force.x = this.body.maxVel.x;
      this.flipX(false);
      moving = true;
    } else {
      this.body.force.x = 0;
    }

    // isKeyPressed("jump") is called EXACTLY ONCE per frame, into a local — not inline in each
    // branch's own `if` — because it's edge-triggered with a side effect (bindKey's "lock" flag,
    // set on UP/W/SPACE — see the constructor): the first call in a frame that returns true also
    // marks that physical press as "consumed", so a second, separate isKeyPressed("jump") call
    // later in the SAME frame would always see it already consumed and return false, even for a
    // genuinely fresh press. Capturing it once and branching on the boolean is what lets both the
    // ground-jump and the super-jump checks below see the same real press.
    const jumpPressed = me.input.isKeyPressed("jump");
    if (jumpPressed && this.jumpsSinceGround === 0) {
      this.body.force.y = -this.body.maxVel.y;
      this.body.jumping = true;
      this.jumpsSinceGround = 1;
      playSound("sfx_jump");
    } else if (jumpPressed && game.data.superJumps > 0) {
      // Super jump: every jump press AFTER the first since last landing
      // spends one charge for a full extra ascent. Gated on jumpsSinceGround (this entity's own
      // press count, only reset via the debounced ground+near-zero-velocity check above — see
      // its own long comment for why a plain onGround read isn't trustworthy here) rather than
      // re-deriving "am I airborne right now" fresh on every single press. Once
      // game.data.superJumps hits 0 this branch simply stops matching (the "if depleted,
      // disabled" ask) — a jump press with jumpsSinceGround>0 and no charges left falls through
      // to nothing: no force, no sound, no third condition needed. Same force as a ground jump
      // (melonJS's Body.update() hard-clamps vel.y to maxVel.y every frame regardless of the
      // force applied, so a literally STRONGER single kick isn't possible here — see game.js's
      // SUPERJUMP_MAX comment) — the "super" part is stacking a second/third full ascent before
      // ever landing, reaching well past a single jump's own height, not exceeding one jump's
      // peak speed.
      this.body.force.y = -this.body.maxVel.y;
      this.body.jumping = true;
      this.jumpsSinceGround += 1;
      game.data.superJumps -= 1;
      game.notify();
      playSound("sfx_jump");
    }

    if (this.hurtTimer > 0) {
      this.hurtTimer -= dt;
      this.setFrame("player-hit");
    } else if (!onGround) {
      this.setFrame("player-jump");
    } else if (moving) {
      this.walkTimer += dt;
      if (this.walkTimer > 150) {
        this.walkTimer = 0;
        this.walkFrame = (this.walkFrame + 1) % WALK_FRAMES.length;
      }
      this.setFrame(WALK_FRAMES[this.walkFrame]);
    } else {
      this.setFrame("player-idle");
    }

    // fell into a pit
    if (!this.inViewport && this.getBounds().top > me.video.renderer.height) {
      this.respawn();
      return true;
    }

    return super.update(dt);
  }

  // Shared by respawn() (pit fall) and hurt() (enemy contact) below — either way, losing a life
  // sends the player back to the level's own start (me.level.reload(), same as before this was
  // split out), unless that was the last life, in which case it's "gameover" instead: see
  // game.js's STARTING_LIVES. app.js's game.onChange listener watches for that
  // status and switches to the game-over overlay (retry / back to level-select), same as it
  // already does for "won" — this entity only ever flips the status flag, it has no idea what a
  // "screen" is.
  //
  // isRespawning guards against calling this more than once for the same fall/hit: reported
  // live as losing several lives (sometimes straight to "gameover") from a single pit fall.
  // Root cause — me.level.reload() only actually runs ~200ms later, inside the fadeIn callback,
  // and nothing was stopping the pit-fall check in update() from seeing the player still
  // "off-screen, below the viewport" (unchanged — this entity isn't removed or repositioned
  // until the reload fires) on every one of the ~12 frames in between, calling respawn() -> here
  // again each time. hurt() happened to already be safe (its own invincibility-window check
  // blocks a same-frame re-entry), which is why only the pit-fall path ever showed the bug. The
  // flag is per-entity-instance, so it needs no manual reset: me.level.reload() replaces this
  // entity with a fresh PlayerEntity (isRespawning starts false again) or, on the final life,
  // game.data.status flips away from "playing" before another frame's update() can even reach
  // the pit-fall check.
  //
  // coins/superJumps are reset here too, not just in screens/play.js's loadLevel() —
  // me.level.reload() (below) is melonJS's own "reload the current level" call, it does NOT go
  // through loadLevel() again, so without this the HUD kept showing coins collected before the
  // death across the reload. A life lost already means this whole attempt restarts from the
  // level's own start (me.level.reload() below puts every CoinEntity back), so coins/superJumps
  // need to match that same fresh-attempt reset, same as a brand new loadLevel() call already
  // does — coins in particular isn't a scoring choice, see loadLevel()'s own comment on why it
  // always resets regardless of mode.
  //
  // score is the one exception, gated on game.data.mode (see game.js's own comment on why that
  // field lives there instead of only in app.js's uiState): Arcade mode's score is meant to
  // survive the WHOLE run, including a life lost mid-level, not just level-to-level transitions (which
  // screens/play.js's loadLevel() already handles via its own resetScore option). Practice mode
  // keeps the original always-reset-on-death behavior — a life lost there has always meant "this
  // attempt's score is gone", unchanged.
  loseLife() {
    if (this.isRespawning) {
      return;
    }
    this.isRespawning = true;
    this.hurtTimer = 300;
    game.data.lives -= 1;
    if (game.data.mode !== "arcade") {
      game.data.score = 0;
    }
    game.data.coins = 0;
    game.data.superJumps = SUPERJUMP_MAX;
    // Combo always resets on a life lost, regardless of mode — see game.js's own comment: it's a
    // moment-to-moment streak, not a persistent resource like the Arcade-mode score above.
    // tookDamageThisAttempt marks NO_DAMAGE_BONUS as forfeit for THIS attempt (moot the instant
    // it's set, since the level is about to reload anyway) — the constructor is what resets it
    // back to false for the attempt that's about to start.
    game.data.combo = 0;
    game.data.tookDamageThisAttempt = true;
    game.notify();
    if (game.data.lives <= 0) {
      game.data.status = "gameover";
      game.notify();
      return;
    }
    me.game.viewport.fadeIn("#fff", 200, () => {
      me.level.reload();
    });
  }

  // fell into a pit
  respawn() {
    this.loseLife();
  }

  // Enemy contact — used by EnemyEntity on collision. Unless the player is currently invincible
  // (a bonus pickup, or the brief self-granted grace this sets below — see game.js's
  // HIT_GRACE_MS/INVINCIBILITY_MS), this costs a life and reloads the level exactly like
  // respawn() above. The invincibility check doubles as what stops a sensor enemy (no physical
  // push-out — see EnemyEntity) from draining more than one life per encounter: the grace window
  // set here outlasts the ~200ms fade-to-reload, so any further contact during that fade is a
  // no-op, and it carries the player a moment past their own respawn point too.
  hurt() {
    if (game.data.invincibleUntil > Date.now()) {
      return;
    }
    playSound("sfx_hurt");
    game.data.invincibleUntil = Date.now() + HIT_GRACE_MS;
    this.loseLife();
  }

  // Landing on top of an enemy defeats it instead of hurting the player — the classic "stomp".
  // Deliberately NOT read off melonJS's own collision `response` (its overlapV/overlapN sign
  // convention isn't something this codebase has verified against the pinned 19.9.1 source, and
  // EnemyEntity is a sensor besides, which may not even get a physically-resolved response) —
  // instead this compares real positions/velocity directly, which is unambiguous: vel.y > 0 means
  // currently falling (see game.js/generate_level.py's own verified GRAVITY/jump-force sign
  // notes), and STOMP_TOLERANCE covers the up-to-maxVelocity.y=18px of penetration the collision
  // can already have on the very first frame it's detected (collisions are only caught *after*
  // that frame's movement is applied). A jump into an enemy's underside (vel.y < 0, moving up)
  // correctly falls through to hurt() instead, same as a side hit while grounded.
  isStomp(enemy) {
    if (this.body.vel.y <= 0) {
      return false;
    }
    // Tolerance scales with the player's OWN current fall speed instead of a flat guess (an
    // earlier version used a fixed 20px, sized for a single frame at the then-current
    // maxVelocity.y) — reported live as landing on an enemy after a long fall reliably hurting
    // instead of stomping. Falling from higher up doesn't raise the *speed* at impact past
    // maxVelocity.y (terminal velocity caps it either way), but a flat constant sized for "one
    // frame at max speed" leaves zero margin for dt ever running slightly long (a lag spike, a
    // dropped frame) — exactly the kind of one-off hiccup a LONGER fall gives more opportunities
    // for simply by lasting more frames. Using this frame's actual vel.y as the tolerance is
    // correct by construction (it IS how far the player could have moved to cause this overlap
    // in the first place) regardless of what maxVelocity.y ends up tuned to later. STOMP_BUFFER
    // is a little extra slack on top — generous stomp detection is the actual goal here (a
    // "that should have been a stomp" hurt reads as far more unfair than an occasional lenient
    // stomp would).
    return this.getBounds().bottom <= enemy.getBounds().top + this.body.vel.y + STOMP_BUFFER;
  }

  onCollision(response, other) {
    if (other.body.collisionType === me.collision.types.WORLD_SHAPE) {
      return true;
    }
    if (other.body.collisionType === me.collision.types.ENEMY_OBJECT) {
      if (this.isStomp(other) && typeof other.stomp === "function") {
        other.stomp();
        // A small automatic hop off the now-defeated enemy — half a normal jump's kick (see
        // me.input "jump" handling above), enough to clear its former spot without feeling like
        // a full extra jump was granted for free.
        this.body.vel.y = -STOMP_BOUNCE_VEL;
      } else {
        this.hurt();
      }
    }
    return false;
  }
}

export default PlayerEntity;
