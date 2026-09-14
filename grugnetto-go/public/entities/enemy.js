import * as me from "../vendor/melonjs-19.9.1.esm.js";
import game, { playSound, addComboScore } from "../game.js?v=11";

const ENEMY_SIZE = 64;
// Kenney's enemy frames are already 64x64 natively (see Sprites/Enemies/Default in the New
// Platformer Pack) — unlike the player's 128x128 character art, no scale() is needed here.
const WALK_FRAME_MS = 220;

// Which sprite set to use comes from the Tiled object's own `type` field (settings.type — world1
// levels use "snail"/"ladybug", see worlds/world1-prato-di-casa.json's enemies list), matched
// against this table — same pattern as bonus.js's KINDS. Previously every kind rendered as
// "slime" regardless of `type` (that field was accepted by the level format/compiler but never
// actually read here); DEFAULT_KIND keeps that as the fallback for a missing/unrecognized value
// instead of erroring.
//
// `hitbox: {w, h}` overrides the sensor shape's size (see constructor below) — measured directly
// against each kind's actual PNGs (rest/walkA/walkB alpha-channel bounding box, same
// pixel-inspection method used for player.js's HITBOX_WIDTH/BODY_HEIGHT), taking the UNION of
// content across all 3 frames (tallest/widest of the three) so the fixed-size box always fully
// contains whichever frame happens to be showing, never clipping past it. Touching an enemy costs
// a life and reloads the level (see player.js's hurt()), and the ground-crawlers' full 64x64
// tile-sized sensor (no override = ENEMY_SIZE default, still true for frog/saw below) made
// clearing them with a jump practically impossible — a running jump only rises above a 64px-tall
// box for a ~54px-wide slice of its ~90px total horizontal travel, well short of the ~122px
// (enemy+player hitbox width) needed to cross clean. The actual creature art for slime/snail/
// ladybug/worm/mouse/bee/fly/barnacle/fish sits well below the tile's top edge (their real
// silhouette leaves 3-40px of transparent headroom, checked directly on disk) — the oversized box
// was never a deliberate difficulty choice, just an unmeasured default nobody had reason to shrink
// back when contact was harmless. frog and saw both genuinely fill their whole tile (checked the
// same way, 0px margin on every frame) — frog is left at the full ENEMY_SIZE default (an upright
// frog reads as something you're meant to route around, not hop over), but saw got its own
// override below anyway: with the full-tile box (sensor top flush with the tile's own top edge,
// zero headroom), isStomp()'s own geometry math leaves only a ~28px-tall sliver of the full 64px
// tile — right at the very top — where a landing reads as a stomp instead of a hurt, functionally
// impossible in practice. h:50 isn't measured off the art (the circular sawblade art genuinely has
// no headroom) — it's the same deliberate "err toward more forgiving than the art strictly
// implies" call trapcoin.js's own hitbox already makes, just enough headroom (14px) to make
// stomping reliably possible without making a spinning blade as forgiving as a soft ground-crawler.
// `behavior` (default "patrol" — see BEHAVIOR_PATROL etc. below) comes from each world manifest's
// own free-form descriptive prose ("behavior" field in assets/worlds/*.json), NOT auto-derived
// from it — that text is written for humans, not a machine-readable enum. Previously ignored
// entirely: every kind fell through to the same generic left-right patrol regardless of what its
// manifest said, so saw and barnacle both paced back and forth exactly like mouse's own
// explicitly-patrolling entry, and frog walked with a smooth continuous slide instead of discrete
// jumps. See update()'s own per-behavior methods below for what each mode actually does.
const BEHAVIOR_PATROL = "patrol";
const BEHAVIOR_STATIONARY = "stationary";
const BEHAVIOR_JUMP = "jump";

const KINDS = {
  slime:    { rest: "enemy-slime-rest",    walkA: "enemy-slime-walk-a",    walkB: "enemy-slime-walk-b",    hitbox: { w: 64, h: 42 } },
  snail:    { rest: "enemy-snail-rest",    walkA: "enemy-snail-walk-a",    walkB: "enemy-snail-walk-b",    hitbox: { w: 64, h: 53 } },
  ladybug:  { rest: "enemy-ladybug-rest",  walkA: "enemy-ladybug-walk-a",  walkB: "enemy-ladybug-walk-b",  hitbox: { w: 63, h: 52 } },
  // World2 (Squirrel Forest).
  worm:     { rest: "enemy-worm-rest",     walkA: "enemy-worm-walk-a",     walkB: "enemy-worm-walk-b",     hitbox: { w: 64, h: 28 } },
  // frog: hops at regular intervals — see BEHAVIOR_JUMP / updateJump() below.
  frog:     { rest: "enemy-frog-rest",     walkA: "enemy-frog-walk-a",     walkB: "enemy-frog-walk-b",     behavior: BEHAVIOR_JUMP },
  bee:      { rest: "enemy-bee-rest",      walkA: "enemy-bee-walk-a",      walkB: "enemy-bee-walk-b",  flying: true, hitbox: { w: 62, h: 58 } },
  fly:      { rest: "enemy-fly-rest",      walkA: "enemy-fly-walk-a",      walkB: "enemy-fly-walk-b",  flying: true, hitbox: { w: 60, h: 61 } },
  // World3 (Golden Dunes).
  mouse:    { rest: "enemy-mouse-rest",    walkA: "enemy-mouse-walk-a",    walkB: "enemy-mouse-walk-b",    hitbox: { w: 64, h: 49 } },
  // saw: oscillates/spins in place — stationary, not a patroller; the existing walkA/walkB frame
  // swap already reads as the blade spinning in place once it no longer also slides sideways.
  saw:      { rest: "enemy-saw-rest",      walkA: "enemy-saw-walk-a",      walkB: "enemy-saw-walk-b",      hitbox: { w: 64, h: 50 }, behavior: BEHAVIOR_STATIONARY },
  // World4 (Stone Mine).
  // barnacle: fixed in place, attacks when approached — "fixed" is BEHAVIOR_STATIONARY below; the
  // "attacks when approached" part is already what touching its sensor does once it's no longer
  // chasing/patrolling toward the player (see PlayerEntity.onCollision's hurt() call) — a wider
  // proximity-detection radius with its own aggro range is a bigger behavioral feature (it'd need
  // this entity to query the player's live position, which nothing here does today), out of scope
  // for fixing "stuck patrolling like every other enemy" specifically.
  // h:50, not the measured 61 (checked directly on disk: attack_rest/a/b's alpha bbox tops sit at
  // y=22/8/3 respectively — its "rearing up to strike" attack_b frame genuinely reaches to within
  // 3px of the tile's top edge). Same call as saw's own override below and for the same reason —
  // this elongated, lunging-attack creature was the hardest to stomp in the roster: 3px of real
  // headroom is, in practice, the same practically-impossible stomp window saw had at 0px — err
  // toward more forgiving (14px) than the art's own worst-case frame implies.
  barnacle: { rest: "enemy-barnacle-rest", walkA: "enemy-barnacle-walk-a", walkB: "enemy-barnacle-walk-b", hitbox: { w: 56, h: 50 }, behavior: BEHAVIOR_STATIONARY },
  fish:     { rest: "enemy-fish-rest",     walkA: "enemy-fish-walk-a",     walkB: "enemy-fish-walk-b",     hitbox: { w: 64, h: 57 } },
};
const DEFAULT_KIND = "slime";

// Patrol speed, in px/ms — same value the old hardcoded `this.direction * 0.05 * dt` used, just
// named now that a second, faster speed (JUMP_SPEED below) exists alongside it.
const PATROL_SPEED = 0.05;

// frog's jump-interval behavior (BEHAVIOR_JUMP): alternates a pause (REST, showing the rest
// frame) with a quick burst of horizontal movement (HOPPING, showing the walkB/"jump" frame) —
// see updateJump() below. JUMP_REST_MS (how long it sits between hops) is deliberately much
// longer than WALK_FRAME_MS's 220ms walk-cycle cadence so each hop reads as a distinct, timed
// jump at regular intervals, not just a faster walk animation. JUMP_SPEED is well above
// PATROL_SPEED so the short HOP_MS burst still covers a visible distance (~57px per hop) instead
// of a barely-perceptible twitch.
const JUMP_REST_MS = 700;
const JUMP_HOP_MS = 260;
const JUMP_SPEED = 0.22;

// World2's own manifest describes bee/fly as flying, not ground-crawling like worm/snail/slime/
// etc — but compile-level.py places every enemy object the same way (bottom-flush with the
// ground, same convention as GoalEntity/CoinEntity), so without this a bee/fly spawned exactly
// like a snail reads as sitting half-buried in the ground tile. Kept as a simple static hover height, not an
// actual flight pattern (no up/down bobbing) — that's a bigger behavioral feature, out of scope
// for fixing the ground-clipping specifically.
const FLY_HEIGHT = ENEMY_SIZE * 2;

// Reward for a successful stomp (see PlayerEntity.onCollision, which decides "stomp vs hurt" —
// this entity just carries out the "stomp" half once asked). Deliberately smaller than a coin
// (100) — it's a bonus for a skillful landing, not the game's main way to score.
const STOMP_POINTS = 50;

// A harmless obstacle (patrolling by default, but see the `behavior` field on KINDS above for
// the stationary/jump-interval exceptions) — extends me.Collectable (like Coin/Goal) rather than
// me.Sprite + Body (like PlayerEntity): this entity never needs real physics (gravity,
// force-based movement), just a sensor shape that detects the player overlapping it, so the
// same declarative sensor pattern Collectable already provides is a better fit than building
// a full dynamic body by hand.
class EnemyEntity extends me.Collectable {
  constructor(x, y, settings) {
    const kind = KINDS[settings.type] ? settings.type : DEFAULT_KIND;
    const spawnY = KINDS[kind].flying ? y - FLY_HEIGHT : y;
    // hitbox (see KINDS' own comment) defaults to the full tile for kinds that genuinely fill
    // it (frog, saw) — bottom-flush with the ground/tile either way, only the top edge and
    // horizontal centering move inward for the smaller kinds.
    const { w: hitW, h: hitH } = KINDS[kind].hitbox || { w: ENEMY_SIZE, h: ENEMY_SIZE };
    super(x, spawnY, Object.assign({
      image: KINDS[kind].rest,
      framewidth: ENEMY_SIZE,
      frameheight: ENEMY_SIZE,
    }, settings, {
      // found live (see player.js / coin.js / goal.js): Tiled's object factory auto-fills
      // settings.shapes with a top-left-relative default; merged in the other order that
      // silently overrides our own shape below. Force it last so ours always wins.
      shapes: [new me.Rect((ENEMY_SIZE - hitW) / 2, ENEMY_SIZE - hitH, hitW, hitH)],
    }));
    this.kind = kind;
    this.name = settings.name || "";

    // Patrol range: how far this slime walks from its own spawn point before turning around.
    // Driven by the Tiled object's own `width` (defaults to a 3-tile / 192px patrol lane if
    // not set), NOT by the sensor shape's width (which stays a fixed ENEMY_SIZE above) — the
    // same "declared object size used only for placement, not the physics shape" split as
    // GoalEntity's FLAG_SIZE.
    this.minX = x;
    this.maxX = x + (settings.width || 192) - ENEMY_SIZE;
    this.direction = 1;
    this.walkFrame = 0;
    this.walkTimer = 0;
    // BEHAVIOR_JUMP-only state (see updateJump() below) — harmless to set on every kind, same as
    // walkFrame/walkTimer above are also set (and unused) for stationary kinds.
    this.jumping = false;
    this.jumpTimer = 0;
    // Confirmed against melonJS 19.9.1's Container#update() source: a child's own update(dt)
    // only runs when `child.inViewport || child.alwaysUpdate` — without this, an enemy that
    // scrolls off-screen has its patrol/animation frozen (update() simply never called) until
    // the camera brings it back into view, at which point it resumes instantly — reported live
    // as enemies seeming to "appear out of nowhere" instead of having been patrolling the whole
    // time. Same fix PlayerEntity already needed, for the identical reason (see its own
    // alwaysUpdate).
    this.alwaysUpdate = true;

    // A sensor toward the world in general, but specifically only meant to detect the player —
    // gravityScale: 0 keeps it from ever needing to physically rest on the ground the way the
    // player's body does, since its own vertical position never changes (only x, in update()
    // below); isSensor true means overlapping it never physically pushes anything (found live,
    // see PlayerEntity — the sensor flag is what makes "harmless" actually harmless: touching
    // it triggers onCollision below without shoving the player around).
    this.bodyDef.type = "kinematic";
    this.bodyDef.gravityScale = 0;
    this.bodyDef.collisionType = me.collision.types.ENEMY_OBJECT;
    this.bodyDef.collisionMask = me.collision.types.PLAYER_OBJECT;
  }

  onResetEvent(x, y, settings = {}) {
    // Poolable (see the true 3rd arg to me.pool.register("EnemyEntity", ...)): the FIRST time a
    // given slot needs an EnemyEntity, melonJS's pool constructs one fresh (constructor above),
    // but on every reuse afterward — confirmed against the pinned 19.9.1 source, pool.get()
    // forwards the exact same (x, y, settings) it would give the constructor into this method
    // instead — it calls THIS, not the constructor. `this.kind` (and everything derived from it:
    // spawnY's flying offset, the walk-frame image, minX/maxX's patrol width) used to be set
    // ONLY in the constructor, so a recycled instance kept whatever kind/width its PREVIOUS life
    // had — an enemy would sometimes stand correctly on the ground and sometimes appear sunk into
    // it, specifically after leaving and re-entering a level (exactly when a pooled instance gets
    // reused instead of freshly constructed). Re-deriving kind/spawnY/image/minX/maxX here from
    // the same `settings` the constructor uses closes that gap.
    const kind = KINDS[settings.type] ? settings.type : DEFAULT_KIND;
    this.kind = kind;
    this.name = settings.name || "";
    const spawnY = KINDS[kind].flying ? y - FLY_HEIGHT : y;
    this.shift(x, spawnY);
    this.image = me.loader.getImage(KINDS[kind].rest);
    this.minX = x;
    this.maxX = x + (settings.width || 192) - ENEMY_SIZE;
    this.direction = 1;
    this.walkFrame = 0;
    this.walkTimer = 0;
    // Re-derived on every reuse for the same reason walkFrame/walkTimer above are — a pool slot
    // last used as a jumping frog reused for e.g. a stationary saw would otherwise start it
    // mid-hop-cycle instead of at rest.
    this.jumping = false;
    this.jumpTimer = 0;
    // Sensor shape sizing (hitbox) now rebuilt here too — the gap this method's own earlier fix
    // (see above) knowingly left open: a recycled instance kept whatever kind's hitbox its
    // PREVIOUS life had, only the position/sprite/kind label were actually corrected, so a stomp
    // stopped registering on a worm — a pool slot last constructed as a taller kind (or the
    // full-tile default) reused for a worm keeps that stale, differently-shaped sensor, so
    // isStomp()'s geometry no longer matches
    // what's actually drawn. Turns out resizing a live me.Body's shapes IS a simple, supported
    // call after all — melonJS's BuiltinAdapter.addBody() throws with "Use adapter.updateShape()
    // ... if you need to change the body" for exactly this case (confirmed by reading the
    // vendored bundle directly, not guessed); same hitW/hitH computation as the constructor.
    const { w: hitW, h: hitH } = KINDS[kind].hitbox || { w: ENEMY_SIZE, h: ENEMY_SIZE };
    me.game.world.adapter.updateShape(this, [
      new me.Rect((ENEMY_SIZE - hitW) / 2, ENEMY_SIZE - hitH, hitW, hitH),
    ]);
  }

  update(dt) {
    const behavior = KINDS[this.kind].behavior || BEHAVIOR_PATROL;
    if (behavior === BEHAVIOR_PATROL) {
      this.moveWithinBounds(PATROL_SPEED, dt);
    } else if (behavior === BEHAVIOR_JUMP) {
      this.updateJump(dt);
    }
    // BEHAVIOR_STATIONARY (saw/barnacle): position/facing never change here — see KINDS' own
    // comment for why that alone already matches each kind's documented behavior text.

    // Generic walkA/walkB frame toggle — BEHAVIOR_JUMP drives its own frames directly in
    // updateJump() below instead (a steady toggle here would fight its rest/hop image swap).
    if (behavior !== BEHAVIOR_JUMP) {
      this.walkTimer += dt;
      if (this.walkTimer > WALK_FRAME_MS) {
        this.walkTimer = 0;
        this.walkFrame = 1 - this.walkFrame;
        const frames = KINDS[this.kind];
        const image = me.loader.getImage(this.walkFrame === 0 ? frames.walkA : frames.walkB);
        if (image) {
          this.image = image;
        }
      }
    }

    return super.update(dt);
  }

  // Shared by BEHAVIOR_PATROL and BEHAVIOR_JUMP's own hop burst (updateJump() below) — moves
  // along x at `speed` px/ms within [minX, maxX], reversing `direction` at either edge.
  moveWithinBounds(speed, dt) {
    this.pos.x += this.direction * speed * dt;
    if (this.pos.x <= this.minX) {
      this.pos.x = this.minX;
      this.direction = 1;
    } else if (this.pos.x >= this.maxX) {
      this.pos.x = this.maxX;
      this.direction = -1;
    }
    // The Kenney art (snail/ladybug/slime) faces LEFT by default — checked directly against the
    // source frames — so flipping is needed when moving RIGHT, not left. Got this backward
    // originally (flipX(direction < 0)): harmless with the old slime-only art (its highlight dot
    // is nearly symmetric, no obvious facing direction), but reported live as enemies visually
    // walking backward (facing away from their own direction of travel) once snail/ladybug —
    // which do have a clear head/face — were wired in.
    this.flipX(this.direction > 0);
  }

  // BEHAVIOR_JUMP (frog): pauses at rest for JUMP_REST_MS, then moves at JUMP_SPEED for
  // JUMP_HOP_MS before pausing again — a timed, discrete hop cycle instead of a continuous walk.
  // Swaps images directly here (rest frame while paused, walkB/"jump" frame mid-hop) rather than
  // sharing the generic walkA/walkB toggle above, which is a steady walk-cycle cadence — exactly
  // the "smooth continuous walk" this behavior exists to replace with distinct, timed jumps.
  updateJump(dt) {
    this.jumpTimer += dt;
    if (this.jumping) {
      this.moveWithinBounds(JUMP_SPEED, dt);
      if (this.jumpTimer >= JUMP_HOP_MS) {
        this.jumping = false;
        this.jumpTimer = 0;
        this.image = me.loader.getImage(KINDS[this.kind].rest);
      }
    } else if (this.jumpTimer >= JUMP_REST_MS) {
      this.jumping = true;
      this.jumpTimer = 0;
      this.image = me.loader.getImage(KINDS[this.kind].walkB);
    }
  }

  // Always returns false so the (sensor) body never physically pushes the player around — the
  // actual consequence of touching the player is decided entirely on PlayerEntity's own
  // onCollision (it has the position/velocity info needed to tell "landed on top" apart from a
  // side/bottom hit; this entity doesn't), which calls back into either stomp() below or its own
  // hurt() as appropriate. Nothing to do here for that side of it.
  onCollision() {
    return false;
  }

  // A successful stomp (PlayerEntity.onCollision decides when this applies) instantly defeats
  // this enemy — same "collect and remove" pattern CoinEntity/BonusEntity already use, just
  // triggered by landing on it instead of merely touching it.
  stomp() {
    playSound("sfx_bump");
    // addComboScore(), not a flat game.data.score += STOMP_POINTS — chains into the combo
    // multiplier same as CoinEntity/BonusEntity's own pickups (see game.js's own comment); it
    // calls game.notify() itself.
    addComboScore(STOMP_POINTS);
    this.body.setCollisionMask(me.collision.types.NO_OBJECT);
    me.game.world.removeChild(this);
  }
}

export default EnemyEntity;
