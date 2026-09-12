import {
  WORLD_WIDTH, WORLD_HEIGHT, BALL_BASE_SPEED, BALL_ACCELERATION,
  PADDLE_TARGET_SPEED, PADDLE_ACCELERATION, PADDLE_DECELERATION,
  INITIAL_PADDLE_CURRENT_SPEED, INITIAL_PADDLE_ACCELERATION,
  updateAcceleratedVelocity, vectorFromDirection,
  aabb, contestBoundingBoxInfo, resolveContestBallCollision, historicalPowerupShouldSpawn,
  historicalWeightedPowerup, POWERUP_TOTAL_WEIGHT, contestTimeBonus,
} from './core.js';
import { CONTEST_SEQUENCE, createContestMap } from './maps.js';
import { BitmapFont } from './bitmap-font.js';
import { storageGetNumber, storageSet } from './storage.js';

const BALL_W = 16, BALL_H = 16;
const PADDLE_H = 17;
const BRICK_DIMS = {
  'gray_weird_48.png': [48, 16],
};
const POWERUP_DIMS = { w: 49, h: 15 };
const MAP_INTRO_MS = 1500;
const BALL_LOST_MS = 1500;
const LEVEL_COMPLETE_MESSAGE_MS = 1500;
const TIME_BONUS_MESSAGE_MS = 1500;

const pathForSprite = (kind, sprite) => {
  if (!sprite) return null;
  if (sprite.startsWith('../powerups/')) return `./assets/powerups/${sprite.split('/').at(-1)}`;
  return `./assets/${kind}/${sprite}`;
};

class ImageBank {
  constructor() { this.cache = new Map(); }
  get(path) {
    if (!path) return null;
    if (!this.cache.has(path)) {
      const img = new Image(); img.src = path; this.cache.set(path, img);
    }
    return this.cache.get(path);
  }
}

export class YanoidGame {
  constructor(canvas, audio, callbacks = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.audio = audio;
    this.callbacks = callbacks;
    this.images = new ImageBank();
    this.bitmapFont = new BitmapFont();
    this.keys = { left: false, right: false };
    this.state = 'idle';
    this.lastFrame = 0;
    this.frameHandle = 0;
    this.stageIndex = 0;
    this.score = 0;
    this.lives = 5;
    this.highScore = Math.max(0, storageGetNumber('yanoid.highScore', 0));
    this.message = '';
    this.messageUntil = 0;
    this.pauseUntil = 0;
    this.shotMode = null;
    this.shotUntil = 0;
    this.shotCooldownUntil = 0;
    this.paddleSizeUntil = 0;
    this.levelElapsedMs = 0;
    this.transition = null;
    this.pausedAt = 0;
    this.ballBirthGameTime = 0;
    this.startLoop();
  }

  startLoop() {
    const loop = (now) => {
      const dt = this.lastFrame ? now - this.lastFrame : 0;
      this.lastFrame = now;
      this.processTransition(now);
      if (this.state === 'playing' && now >= this.pauseUntil && !this.transition) this.update(dt);
      this.render(now);
      this.frameHandle = requestAnimationFrame(loop);
    };
    this.frameHandle = requestAnimationFrame(loop);
  }

  newGame() {
    this.score = 0;
    this.lives = 5;
    this.stageIndex = 0;
    this.shotMode = null;
    this.shotUntil = 0;
    this.shotCooldownUntil = 0;
    this.transition = null;
    this.loadStage();
    this.state = 'playing';
    this.callbacks.onState?.(this.state);
  }

  pause() {
    if (this.state !== 'playing') return;
    this.pausedAt = performance.now();
    this.state = 'paused';
    this.callbacks.onState?.(this.state);
  }
  resume() {
    if (this.state !== 'paused') return;
    const now = performance.now();
    const pausedFor = this.pausedAt ? Math.max(0, now - this.pausedAt) : 0;
    if (pausedFor) {
      if (this.pauseUntil > this.pausedAt) this.pauseUntil += pausedFor;
      if (this.messageUntil > this.pausedAt) this.messageUntil += pausedFor;
      if (this.transition) {
        this.transition.bonusAt += pausedFor;
        this.transition.dueAt += pausedFor;
      }
    }
    this.pausedAt = 0;
    this.state = 'playing';
    this.lastFrame = now;
    this.callbacks.onState?.(this.state);
  }

  loadStage() {
    const mapId = CONTEST_SEQUENCE[this.stageIndex % CONTEST_SEQUENCE.length];
    const def = createContestMap(mapId);
    this.mapId = mapId;
    this.mapName = def.name;
    this.roundStart = { ...def.ball };
    this.levelElapsedMs = 0;
    this.ballBirthGameTime = 0;
    this.shotMode = null;
    this.shotUntil = 0;
    this.shotCooldownUntil = 0;
    this.entities = [];
    this.pending = [];
    this.breakableCount = 0;
    for (const src of def.entities) {
      if (src.type.startsWith('brick')) this.addBrick(src);
      else this.entities.push({ ...src, removable: false });
    }
    this.paddle = {
      type: 'paddle', x: def.paddle.x, y: def.paddle.y,
      w: 75, h: PADDLE_H, sprite: 'square2_75.png',
      // Yanoid 0.3.0 SetPaddle() explicitly starts at current velocity 2.0
      // and decelerates toward zero. It produces a short rightward launch.
      currentVelocity: INITIAL_PADDLE_CURRENT_SPEED, targetVelocity: 0, acceleration: INITIAL_PADDLE_ACCELERATION,
      minx: 900, maxx: -1,
    };
    this.entities.push(this.paddle);
    this.balls = [];
    this.powerups = [];
    this.shots = [];
    this.spawnBall(def.ball.x, def.ball.y, Math.PI / 3);
    this.paddleSizeUntil = 0;
    this.setMessage(`${this.stageIndex + 1}/${CONTEST_SEQUENCE.length} · ${this.mapName}`, MAP_INTRO_MS);
    this.pauseUntil = performance.now() + MAP_INTRO_MS;
    this.callbacks.onHud?.(this.getHud());
  }

  text(key, data = {}) {
    if (this.callbacks.text) return this.callbacks.text(key, data);
    const fallback = {
      ballLost: 'Ball lost', levelComplete: 'Level complete!',
      timeBonus: `Time bonus ${data.bonus ?? 0} points`, noTimeBonus: 'No time bonus',
      paused: 'PAUSED', gameOver: 'GAME OVER',
    };
    return fallback[key] ?? key;
  }

  processTransition(now) {
    if (this.state === 'paused') return;
    const tr = this.transition;
    if (!tr) return;
    if (tr.kind === 'stage-complete' && !tr.bonusShown && now >= tr.bonusAt) {
      tr.bonusShown = true;
      this.setMessage(tr.bonus ? this.text('timeBonus', { bonus: tr.bonus }) : this.text('noTimeBonus'), TIME_BONUS_MESSAGE_MS);
    }
    if (now >= tr.dueAt && this.state === 'playing') {
      this.transition = null;
      if (tr.kind === 'stage-complete') this.loadStage();
    }
  }

  addBrick(src) {
    const dims = BRICK_DIMS[src.sprite] || (src.sprite?.includes('../powerups/') ? [48, 15] : [75, 25]);
    const hits = src.type === 'brick-stay' ? -1 : src.type === 'brick-stay-3' ? 3 : 1;
    const b = { ...src, w: dims[0], h: dims[1], hits, countsForCompletion: hits > 0, removable: false };
    this.entities.push(b);
    if (b.countsForCompletion) this.breakableCount++;
    return b;
  }

  spawnBall(x, y, direction = Math.PI / 5) {
    const b = {
      type: 'ball', x, y, prevX: x, prevY: y, w: BALL_W, h: BALL_H,
      direction, speed: BALL_BASE_SPEED, targetSpeed: BALL_BASE_SPEED, dying: false, removable: false, lastCollision: null,
    };
    this.balls.push(b); this.entities.push(b); return b;
  }

  setMessage(text, ms = 1000) {
    this.message = text; this.messageUntil = performance.now() + ms;
  }

  setInput(direction, down) {
    this.keys[direction] = down;
    const p = this.paddle;
    if (!p) return;
    if (down && direction === 'left') {
      p.targetVelocity = -PADDLE_TARGET_SPEED; p.acceleration = -PADDLE_ACCELERATION;
      if (p.currentVelocity > 0) p.currentVelocity = 0;
    } else if (down && direction === 'right') {
      p.targetVelocity = PADDLE_TARGET_SPEED; p.acceleration = PADDLE_ACCELERATION;
      if (p.currentVelocity < 0) p.currentVelocity = 0;
    } else if (!down && direction === 'left' && p.targetVelocity < 0) {
      p.targetVelocity = 0; p.acceleration = PADDLE_DECELERATION;
    } else if (!down && direction === 'right' && p.targetVelocity > 0) {
      p.targetVelocity = 0; p.acceleration = -PADDLE_DECELERATION;
    }
  }

  fire() {
    const gameTime = this.levelElapsedMs;
    if (this.state !== 'playing' || !this.shotMode || gameTime >= this.shotUntil || gameTime < this.shotCooldownUntil) return;
    const sprite = this.shotMode === 'super' ? 'penetrating.png' : 'greenball.png';
    const w = this.shotMode === 'super' ? 12 : 8, h = this.shotMode === 'super' ? 20 : 8;
    const shot = {
      type: 'shot', x: this.paddle.x + (this.paddle.w - w) / 2, y: this.paddle.y,
      prevX: 0, prevY: 0, w, h, sprite, speed: 0.2, super: this.shotMode === 'super', removable: false,
    };
    this.shots.push(shot); this.entities.push(shot);
    this.shotCooldownUntil = gameTime + (this.shotMode === 'super' ? 3000 : 1000);
    this.audio.fire();
  }

  update(dt) {
    let remaining = dt;
    while (remaining > 0 && this.state === 'playing') {
      const step = Math.min(10, remaining); // original TClient::max_deltaticks
      this.levelElapsedMs += step;
      this.updateStep(step, this.levelElapsedMs);
      remaining -= step;
      if (this.pauseUntil > performance.now()) break;
    }
    this.callbacks.onHud?.(this.getHud());
  }

  updateStep(dt, gameTime) {
    // Native TMap::Update first inserts entities queued by the previous
    // collision pass, then moves everything, then removes entities that were
    // marked during the previous pass. Collisions happen only afterwards.
    this.flushPending();
    this.updatePaddle(dt, gameTime);
    if (!this.ballBirthGameTime) this.ballBirthGameTime = gameTime;
    const targetBallSpeed = BALL_BASE_SPEED + (gameTime - this.ballBirthGameTime) * BALL_ACCELERATION;

    for (const ball of this.balls) {
      ball.speed = ball.targetSpeed;
      ball.prevX = ball.x; ball.prevY = ball.y;
      const v = vectorFromDirection(ball.direction, ball.speed);
      ball.x += v.x * dt; ball.y += v.y * dt;
    }

    for (const p of this.powerups) p.y += 0.05 * dt;
    for (const shot of this.shots) {
      shot.prevX = shot.x; shot.prevY = shot.y;
      shot.y -= shot.speed * dt;
    }

    // MarkDying/removable entities survive until this point in the *next*
    // physics update in 0.3.0. This one-step delay affects MAPDONE/CUT timing.
    this.cleanupEntities();

    for (const ball of this.balls) {
      this.handleBallCollisions(ball, gameTime);
      if (!ball.dying) ball.targetSpeed = targetBallSpeed;
    }

    for (const p of this.powerups) {
      if (aabb(p, this.paddle)) this.collectPowerup(p, gameTime);
      for (const e of this.entities) {
        if (e.type === 'hole' && aabb(p, e)) p.removable = true;
      }
    }

    for (const shot of this.shots) this.handleShotCollisions(shot, gameTime);

    // Deliberately no cleanup here: native removals are accounted for at the
    // next TMap::Update, before the next collision pass.
    const noBalls = this.balls.length === 0;
    const noBricks = this.breakableCount === 0;
    if (noBalls && noBricks) {
      // Native TGame::Update sets CUT/DEAD first, then immediately overwrites
      // it with MAPDONE. CUT's presentation/round restart is therefore skipped.
      // The CUT branch has already decremented lives when lives > 1; DEAD does not.
      if (this.lives > 1) this.lives--;
      this.completeStage(gameTime);
    } else if (noBalls) {
      this.loseBall(gameTime);
    } else if (noBricks) {
      this.completeStage(gameTime);
    }
  }

  updatePaddle(dt, gameTime) {
    const p = this.paddle;
    p.currentVelocity = updateAcceleratedVelocity(p.currentVelocity, p.targetVelocity, p.acceleration, dt);
    p.x += p.currentVelocity * dt;

    // TPaddle::Update records extents before wall collision correction.
    p.minx = Math.min(p.minx, p.x);
    p.maxx = Math.max(p.maxx, p.x + p.w);
    if (this.paddleSizeUntil && gameTime >= this.paddleSizeUntil) this.resizePaddle('normal', 0, gameTime);

    // Both Contest playfield variants have their inner wall edges at x=1/799.
    // Native paddle/static collision stops current velocity and acceleration,
    // but leaves the target velocity untouched.
    if (p.x < 1) {
      p.x = 1;
      p.currentVelocity = 0;
      p.acceleration = 0;
    } else if (p.x + p.w > 799) {
      p.x = 799 - p.w;
      p.currentVelocity = 0;
      p.acceleration = 0;
    }
  }

  handleBallCollisions(ball, now) {
    let responseUsed = false;
    // TMap::Update keeps the native entity list ordered by y before collision checks.
    // Stable JS sorting reproduces that first-response ordering for overlaps.
    const orderedTargets = [...this.entities].sort((a, b) => a.y - b.y);
    for (const target of orderedTargets) {
      if (target === ball) continue;
      if (target.type === 'powerup' || target.type === 'shot' || target.type === 'ball') continue;
      const info = contestBoundingBoxInfo(ball, target);
      if (!info) continue;

      if (target.type === 'hole') {
        ball.removable = true;
        continue;
      }

      // In the original, LastUpdate prevents more than one ball response in
      // the same update tick, but the other colliding entity can still react.
      if (!responseUsed) {
        const resolved = resolveContestBallCollision(ball, target, info, target.currentVelocity || 0);
        ball.x = resolved.x; ball.y = resolved.y; ball.direction = resolved.direction;
        ball.dying = resolved.dying;
        if (resolved.targetSpeed != null) ball.targetSpeed = resolved.targetSpeed;
        responseUsed = true;
      }

      if (target.type?.startsWith('brick')) this.hitBrick(target, ball, now);
      else if (target.type === 'static' || target.type === 'paddle') this.audio.metal();
    }
  }

  handleShotCollisions(s, gameTime) {
    // Collision order follows the y-sorted native entity list. Entities that
    // become removable during this pass are intentionally still collidable.
    const targets = [...this.entities].sort((a, b) => a.y - b.y);
    for (const b of targets) {
      if (b === s || !aabb(s, b)) continue;
      if (b.type?.startsWith('brick')) {
        this.hitBrick(b, s, gameTime);
        if (s.super) this.forceRemoveBrick(b);
        else { s.removable = true; break; }
      } else if (b.type === 'static') {
        s.removable = true;
        break;
      }
    }
    if (s.y + s.h < 0) s.removable = true;
  }

  hitBrick(brickEntity, source, now) {
    this.runBrickCallback(brickEntity, now);
    if (brickEntity.hits > 0) {
      brickEntity.hits--;
      if (brickEntity.hits === 0) this.removeBrick(brickEntity);
    }
  }

  removeBrick(b) {
    if (b.removable || b.hits < 0) return;
    b.removable = true;
  }

  forceRemoveBrick(b) {
    if (b.removable || b.hits < 0) return; // TBrick::MarkDying refuses hitnum < 0
    b.removable = true;
  }

  runBrickCallback(b) {
    switch (b.hit) {
      case 'stay': this.audio.metal(); return;
      case 'add-ball':
        this.pending.push(() => this.spawnBall(b.x, b.y, Math.PI / 5)); return;
      case 'magic-right-chain':
        // Python hit string executes this_map_brick_hit3(...),this_map_brick_hit(...);
        // both functions call basic_brick_hit(), so one impact scores/rolls twice.
        this.basicBrickHit(b);
        this.basicBrickHit(b);
        this.pending.push(() => this.addBrick({ type: 'brick', x: 10, y: 10, sprite: 'green2_75.png', hit: 'magic-right-end' }));
        this.pending.push(() => this.addBrick({ type: 'brick', x: 10, y: 50, sprite: 'green2_75.png', hit: 'basic' }));
        return;
      case 'magic-left-chain':
        this.basicBrickHit(b);
        this.basicBrickHit(b);
        this.pending.push(() => this.addBrick({ type: 'brick', x: 715, y: 10, sprite: 'green2_75.png', hit: 'magic-left-end' }));
        this.pending.push(() => this.addBrick({ type: 'brick', x: 715, y: 50, sprite: 'green2_75.png', hit: 'basic' }));
        return;
      case 'magic-right-end':
        this.basicBrickHit(b);
        this.pending.push(() => this.addBrick({ type: 'brick', x: 715, y: 500, sprite: 'green2_75.png', hit: 'basic' })); return;
      case 'magic-left-end':
        this.basicBrickHit(b);
        this.pending.push(() => this.addBrick({ type: 'brick', x: 10, y: 500, sprite: 'green2_75.png', hit: 'basic' })); return;
      case 'magic-row':
        this.basicBrickHit(b);
        for (let x = 0; x < 800; x += 80) {
          this.pending.push(() => this.addBrick({ type: 'brick', x, y: 400, sprite: 'blue2_75.png', hit: 'basic' }));
          this.pending.push(() => this.addBrick({ type: 'brick', x, y: 430, sprite: 'yellow_stay_75.png', hit: 'basic' }));
        }
        return;
      default: this.basicBrickHit(b);
    }
  }

  basicBrickHit(b) {
    this.score += 10;
    this.audio.brick();
    if (historicalPowerupShouldSpawn(Math.floor(Math.random() * 100), 20)) {
      const weight = Math.floor(Math.random() * POWERUP_TOTAL_WEIGHT);
      const p = historicalWeightedPowerup(weight);
      this.pending.push(() => this.spawnPowerup(b.x, b.y, p));
    }
  }

  spawnPowerup(x, y, def) {
    const p = { type: 'powerup', x, y, w: def.sprite.startsWith('powerup_') ? 49 : 48, h: POWERUP_DIMS.h, def, removable: false };
    this.powerups.push(p); this.entities.push(p);
  }

  collectPowerup(p, gameTime) {
    p.removable = true;
    const id = p.def.id;
    if (id === 'ball') {
      this.pending.push(() => this.spawnBall(p.x, p.y, Math.PI / 5)); this.audio.good();
    } else if (id === 'life') { this.lives += 1; this.audio.good(); }
    else if (id === 'remove-life') { this.lives -= 1; this.audio.bad(); }
    else if (id === 'shot') {
      this.shotMode = 'normal'; this.shotUntil = gameTime + 20000; this.audio.good();
    } else if (id === 'super-shot') {
      this.shotMode = 'super'; this.shotUntil = gameTime + 12000; this.audio.good();
    } else if (id === 'normal-paddle') { this.resizePaddle('normal', 0, gameTime); this.audio.good(); }
    else if (id === 'wide-paddle') { this.resizePaddle('wide', 10, gameTime); this.audio.good(); }
    else if (id === 'narrow-paddle') { this.resizePaddle('narrow', 10, gameTime); this.audio.bad(); }
    else if (id.startsWith('score-')) {
      this.score += p.def.amount; p.def.amount < 0 ? this.audio.bad() : this.audio.good();
    }
  }

  resizePaddle(size, seconds, gameTime) {
    const p = this.paddle;
    const oldW = p.w;
    const newW = size === 'wide' ? 100 : size === 'narrow' ? 50 : 75;
    p.w = newW;
    p.sprite = `square2_${newW}.png`;
    p.x += (oldW - newW) / 2;
    p.paddleSize = size;
    this.paddleSizeUntil = seconds ? gameTime + seconds * 1000 : 0;

    // TPaddle::GoWide/GoNormal use the historically visited min/max extent.
    // GoNarrow only recenters and does not clamp. Preserve that asymmetry.
    if (size !== 'narrow') {
      if (p.x + p.w > p.maxx) p.x = p.maxx - p.w;
      if (p.x < p.minx) p.x = p.minx;
    }
  }

  loseBall() {
    if (this.state !== 'playing') return;
    if (this.lives <= 1) {
      this.lives = 0; this.gameOver(); return;
    }
    this.lives--;
    this.audio.lose();
    this.ballBirthGameTime = 0;
    this.shotMode = null;
    this.shotUntil = 0;
    this.shotCooldownUntil = 0;
    this.paddle.x = 380;
    // Native CUT calls setVelocity(0) + setAccel(0), but does not reset
    // _cur_vel. Preserve that oddity instead of normalizing it away.
    this.paddle.targetVelocity = 0;
    this.paddle.acceleration = 0;
    this.spawnBall(this.roundStart.x, this.roundStart.y, Math.PI / 3);
    this.pauseUntil = performance.now() + BALL_LOST_MS;
    this.setMessage(this.text('ballLost'), BALL_LOST_MS);
  }

  completeStage(gameTime) {
    if (this.state !== 'playing') return;
    const bonus = contestTimeBonus(gameTime);
    this.score += bonus;
    this.audio.level();
    const now = performance.now();
    this.setMessage(this.text('levelComplete'), LEVEL_COMPLETE_MESSAGE_MS);
    this.stageIndex = (this.stageIndex + 1) % CONTEST_SEQUENCE.length;
    // Native MAPDONE shows two consecutive 1500 ms text effects:
    // "Level complete!" followed by the time-bonus result.
    this.transition = {
      kind: 'stage-complete', bonus, bonusShown: false,
      bonusAt: now + LEVEL_COMPLETE_MESSAGE_MS,
      dueAt: now + LEVEL_COMPLETE_MESSAGE_MS + TIME_BONUS_MESSAGE_MS,
    };
    this.pauseUntil = this.transition.dueAt;
    // Prevent repeated completion while the transition is pending.
    this.breakableCount = Number.POSITIVE_INFINITY;
  }

  gameOver() {
    this.state = 'gameover';
    if (this.score > this.highScore) {
      this.highScore = this.score;
      storageSet('yanoid.highScore', this.highScore);
    }
    this.audio.lose();
    this.callbacks.onState?.(this.state);
    this.callbacks.onHud?.(this.getHud());
  }

  flushPending() {
    const todo = this.pending.splice(0);
    for (const fn of todo) fn();
  }

  cleanupEntities() {
    for (const e of this.entities) {
      if (e.removable && e.countsForCompletion) {
        this.breakableCount = Math.max(0, this.breakableCount - 1);
        e.countsForCompletion = false;
      }
    }
    const live = e => !e.removable;
    this.entities = this.entities.filter(live);
    this.balls = this.balls.filter(live);
    this.powerups = this.powerups.filter(live);
    this.shots = this.shots.filter(live);
  }

  getHud() {
    const remainingShotMs = this.shotMode ? Math.max(0, this.shotUntil - this.levelElapsedMs) : 0;
    return {
      score: this.score, lives: this.lives, highScore: this.highScore,
      stage: this.stageIndex + 1, totalStages: CONTEST_SEQUENCE.length, mapName: this.mapName || '',
      levelElapsedMs: this.levelElapsedMs, shotMode: remainingShotMs > 0 ? this.shotMode : null, remainingShotMs,
    };
  }

  drawImage(path, x, y, w, h) {
    const img = this.images.get(path);
    if (img?.complete && img.naturalWidth) this.ctx.drawImage(img, Math.round(x), Math.round(y), w, h);
    else {
      this.ctx.fillStyle = '#ddd'; this.ctx.fillRect(Math.round(x), Math.round(y), w, h);
    }
  }

  render(now) {
    const c = this.ctx;
    c.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    c.fillStyle = '#090b0d'; c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    if (!this.entities) return;
    for (const e of this.entities) {
      if (e.removable || e.type === 'static' || e.type === 'hole') continue;
      if (e.type?.startsWith('brick')) {
        const path = e.sprite?.includes('../powerups/') ? pathForSprite('powerups', e.sprite) : pathForSprite('bricks', e.sprite);
        this.drawImage(path, e.x, e.y, e.w, e.h);
      } else if (e.type === 'paddle') this.drawImage(pathForSprite('paddles', e.sprite), e.x, e.y, e.w, e.h);
      else if (e.type === 'ball') this.drawImage(pathForSprite('balls', 'red.png'), e.x, e.y, e.w, e.h);
      else if (e.type === 'powerup') this.drawImage(pathForSprite('powerups', e.def.sprite), e.x, e.y, e.w, e.h);
      else if (e.type === 'shot') this.drawImage(pathForSprite('shots', e.sprite), e.x, e.y, e.w, e.h);
    }

    if (this.message && now < this.messageUntil) {
      c.save();
      c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(0, 265, WORLD_WIDTH, 70);
      const drawn = this.bitmapFont.drawCentered(c, this.message, WORLD_WIDTH / 2, 289, 3);
      if (!drawn) {
        c.fillStyle = '#fff'; c.font = 'bold 22px ui-monospace, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(this.message, WORLD_WIDTH / 2, 300);
      }
      c.restore();
    }

    if (this.state === 'paused' || this.state === 'gameover') {
      c.save(); c.fillStyle = 'rgba(0,0,0,.65)'; c.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
      const overlay = this.state === 'paused' ? this.text('paused') : this.text('gameOver');
      const drawn = this.bitmapFont.drawCentered(c, overlay, 400, 273, 5);
      if (!drawn) {
        c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 36px ui-monospace, monospace';
        c.fillText(overlay, 400, 290);
      }
      c.restore();
    }
  }
}
