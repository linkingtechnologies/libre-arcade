/*
 * Netrok 0.95 browser port - gameplay core
 * SPDX-License-Identifier: GPL-3.0-or-later
 *
 * This file is a clean JavaScript port of behavior recovered from the original
 * GPL-2.0-or-later C++ sources. See reference/netrok-0.95-pandora-source/.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.NetrokCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const TILE = 16;
  const ROWS = 13;
  const COLS = 400;
  const SCREEN_W = 320;
  const SCREEN_H = 200;
  const PLAYER_SCREEN_X = 144;
  const MAX_SCROLL = 6080;
  const DIR = Object.freeze({ LEFT: 1, RIGHT: 2, UP: 3, DOWN: 4 });
  const UPGRADE = Object.freeze({ NORMAL: 0, SHOES: 1, SHIRT: 2 });
  const PLATFORM = Object.freeze({ SMALL: 0, MEDIUM: 1, LARGE: 2, VERTICAL: 0, HORIZONTAL: 1 });
  const PLATFORM_LENGTH = Object.freeze([16, 48, 80]);

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function abs(v) { return v < 0 ? -v : v; }
  function idx(r, c) { return r * COLS + c; }

  class Game {
    constructor(levels, hooks = {}) {
      this.levels = levels;
      this.hooks = hooks;
      this.input = {
        left: false, right: false, up: false, down: false,
        run: false, jump: false,
        jumpPressed: false, flagPressed: false,
        shieldPressed: 0, confirmPressed: false
      };
      this.state = 'playing';
      this.levelNo = 1;
      this.score = 0;
      this.oneUpScore = 0;
      this.lives = 5;
      this.coins = 0;
      this.shields = [0, 2, 2, 1, 1]; // LEFT,RIGHT,UP,DOWN indexes follow original DIR constants.
      this.upgrade = UPGRADE.NORMAL;
      this.shieldSelection = null;
      this.collectedCoinsByLevel = new Map();
      this.flag = null;
      this.blockingSequence = null;
      this.checkpointCraneY = null;
      this.cheats = { enabled: false, infiniteLives: false, invulnerable: false, freezeTime: false, infiniteShields: false };
      this.runCheated = false;
      this.resetRun();
    }

    emit(name, detail) {
      if (typeof this.hooks[name] === 'function') this.hooks[name](detail, this);
    }

    sound(name) { this.emit('sound', name); }

    resetRun() {
      this.runCheated = !!(this.cheats && this.cheats.enabled);
      this.state = 'playing';
      this.levelNo = 1;
      this.score = 0;
      this.oneUpScore = 0;
      this.lives = 5;
      this.coins = 0;
      this.shields = [0, 2, 2, 1, 1];
      this.upgrade = UPGRADE.NORMAL;
      this.shieldSelection = null;
      this.collectedCoinsByLevel.clear();
      this.flag = null;
      this.loadLevel(1, { preserveMeta: true });
    }

    rawLevel(n) {
      const entry = this.levels[String(n)] || this.levels[n];
      if (!entry) throw new Error(`Missing level ${n}`);
      return entry;
    }

    loadLevel(n, options = {}) {
      const entry = this.rawLevel(n);
      this.levelNo = n;
      this.background = entry.background.slice(0, 3);
      this.map = entry.tiles.slice();
      this.map[0] = this.map[1] = this.map[2] = 0;

      const collected = this.collectedCoinsByLevel.get(n);
      if (collected) {
        for (const key of collected) this.map[key] = 0;
      }

      this.platforms = this.extractPlatforms();
      this.fallingRocks = [];
      this.cannons = [];
      this.projectiles = [];
      this.enemies = [];
      this.enemyCounter = 0;
      this.invulnBlinkCounter = 0;
      this.timeLeft = 200;
      this.lastDirection = DIR.RIGHT;
      this.flag = options.keepFlag ? this.flag : null;
      this.upgradeSequence = null;
      this.blockingSequence = null;
      this.checkpointCraneY = null;
      this.player = {
        scroll: 0,
        y: 10,
        acceleration: 0,
        speed: 0,
        jumpCounter: 0,
        jumpSpeed: 0,
        maxHigherJump: 0,
        maxJumpHeight: 24,
        fallCounter: 0,
        fallSpeed: 0,
        onPlatform: 99,
        grounded: false,
        ladder: false,
        holdingLadder: false,
        ladderCounter: 0,
        facing: DIR.RIGHT, // visual facing (original kortenaussehen)
        direction: DIR.RIGHT, // movement/collision direction (original richtung)
        invulnTimer: 0,
        dead: false,
        animCounter: 0,
        lastScrollForSprite: 0
      };
      this.activateVisibleEntities(true);
      this.emit('levelLoaded', n);
    }

    extractPlatforms() {
      const platforms = [];
      const isMarker = v => v >= 200 && v <= 203;
      for (let c = 0; c < COLS; c++) {
        for (let r = 0; r < ROWS; r++) {
          const startVal = this.map[idx(r, c)];
          if (!isMarker(startVal)) continue;
          const p = {
            type: null,
            lengthType: startVal === 200 ? PLATFORM.SMALL : startVal === 201 ? PLATFORM.MEDIUM : PLATFORM.LARGE,
            startX: c * TILE, startY: r * TILE,
            x: c * TILE, y: r * TILE,
            stopX: c * TILE, stopY: r * TILE,
            direction: DIR.RIGHT
          };
          this.map[idx(r, c)] = 0;
          const right = c + 1 < COLS && isMarker(this.map[idx(r, c + 1)]);
          const down = r + 1 < ROWS && isMarker(this.map[idx(r + 1, c)]);
          if (right) {
            p.type = PLATFORM.HORIZONTAL;
            let cc = c + 1;
            while (cc < COLS && isMarker(this.map[idx(r, cc)])) {
              const v = this.map[idx(r, cc)];
              if (v === 200) p.lengthType = PLATFORM.SMALL;
              if (v === 201) p.lengthType = PLATFORM.MEDIUM;
              if (v === 202) p.lengthType = PLATFORM.LARGE;
              if (v === 203) p.x = cc * TILE;
              this.map[idx(r, cc)] = 0;
              p.stopX = (cc + 1) * TILE;
              p.stopY = r * TILE;
              cc++;
            }
            if (p.x === 0 && p.startX !== 0) p.x = p.startX;
            p.y = p.startY;
            p.direction = DIR.RIGHT;
            platforms.push(p);
          } else if (down) {
            p.type = PLATFORM.VERTICAL;
            let rr = r + 1;
            while (rr < ROWS && isMarker(this.map[idx(rr, c)])) {
              const v = this.map[idx(rr, c)];
              if (v === 200) p.lengthType = PLATFORM.SMALL;
              if (v === 201) p.lengthType = PLATFORM.MEDIUM;
              if (v === 202) p.lengthType = PLATFORM.LARGE;
              if (v === 203) p.y = rr * TILE;
              this.map[idx(rr, c)] = 0;
              p.stopX = c * TILE;
              p.stopY = rr * TILE;
              rr++;
            }
            p.x = p.startX;
            if (p.y === 0 && p.startY !== 0) p.y = p.startY;
            p.direction = DIR.DOWN;
            platforms.push(p);
          }
        }
      }
      return platforms;
    }

    tileRC(r, c) {
      if (r < 0) return 0;
      if (r >= ROWS || c < 0 || c >= COLS) return 0;
      return this.map[idx(r, c)] || 0;
    }

    tilePixel(x, y) {
      return this.tileRC(Math.floor(y / TILE), Math.floor(x / TILE));
    }

    collisionFamily(tile) {
      return tile <= 20 || tile === 25 || tile === 26 || tile === 40 || tile === 41 || (tile >= 29 && tile <= 36);
    }

    sideBlocks(tile) {
      return tile !== 0 && this.collisionFamily(tile) && tile !== 6 && tile !== 7 && tile !== 8;
    }

    collisionRight() {
      const p = this.player;
      if (p.y < -255) return true;
      const wx = p.scroll + PLAYER_SCREEN_X;
      if (wx >= 6224) return false;
      const x = wx + 14;
      for (const y of [p.y, p.y + 25, p.y + 15]) {
        const r = Math.trunc(y / TILE), c = Math.trunc(x / TILE);
        if (r >= 0 && this.sideBlocks(this.tileRC(r, c))) return false;
      }
      return true;
    }

    collisionLeft() {
      const p = this.player;
      if (p.y < -255) return true;
      const x = p.scroll + PLAYER_SCREEN_X + 1;
      for (const y of [p.y + 25, p.y, p.y + 15]) {
        const r = Math.trunc(y / TILE), c = Math.trunc(x / TILE);
        if (r >= 0 && this.sideBlocks(this.tileRC(r, c))) return false;
      }
      return true;
    }

    collisionUp() {
      const p = this.player;
      if (p.y < -255) return true;
      const y = p.y - 1;
      const r = Math.trunc(y / TILE);
      if (r < 0) return true;
      const wx = p.scroll + PLAYER_SCREEN_X;
      for (const x of [wx + 2, wx + 13]) {
        if (this.sideBlocks(this.tileRC(r, Math.trunc(x / TILE)))) return false;
      }
      return true;
    }

    collisionDown() {
      const p = this.player;
      if (p.y < -255) return true;
      const y = p.y + 26;
      const yPrev = p.y + 25;
      const r = Math.trunc(y / TILE);
      if (r < 0) return true;
      const wx = p.scroll + PLAYER_SCREEN_X;
      for (const x of [wx + 13, wx + 2]) {
        const c = Math.trunc(x / TILE);
        const tile = this.tileRC(r, c);
        if (tile !== 0 && this.collisionFamily(tile)) {
          const prev = this.tileRC(Math.trunc(yPrev / TILE), c);
          if (prev === 6 || prev === 7 || prev === 8) continue;
          return false;
        }
      }
      return true;
    }

    checkPlatform() {
      const p = this.player;
      const worldX = p.scroll + PLAYER_SCREEN_X;
      for (let i = 0; i < this.platforms.length; i++) {
        const pl = this.platforms[i];
        const len = PLATFORM_LENGTH[pl.lengthType] || 16;
        if (worldX + 11 >= pl.x && worldX + 3 <= pl.x + len) {
          if (p.y + 25 === pl.y || p.y + 26 === pl.y) return i;
        }
      }
      return 99;
    }

    movePlatforms() {
      for (const p of this.platforms) {
        const len = PLATFORM_LENGTH[p.lengthType] || 16;
        if (p.type === PLATFORM.HORIZONTAL) {
          if (p.direction === DIR.RIGHT) {
            if (p.x + len !== p.stopX) p.x++;
            else p.direction = DIR.LEFT;
          }
          if (p.direction === DIR.LEFT) {
            if (p.x !== p.startX) p.x--;
            else p.direction = DIR.RIGHT;
          }
        } else {
          if (p.direction === DIR.DOWN) {
            if (p.y !== p.stopY) p.y++;
            else p.direction = DIR.UP;
          }
          if (p.direction === DIR.UP) {
            if (p.y !== p.startY) p.y--;
            else p.direction = DIR.DOWN;
          }
        }
      }
    }

    moveWithPlatform(index) {
      if (index === 99) return;
      const p = this.player;
      const pl = this.platforms[index];
      if (!pl) return;
      if (pl.type === PLATFORM.HORIZONTAL) {
        if (pl.direction === DIR.LEFT && this.collisionLeft()) p.scroll--;
        if (pl.direction === DIR.RIGHT && pl.x !== pl.startX && this.collisionRight()) p.scroll++;
      } else {
        p.y = pl.y - 26;
      }
    }

    checkLadder() {
      const p = this.player;
      if (p.y < -255) return false;
      const r = Math.trunc((p.y + 17) / TILE);
      const wx = p.scroll + PLAYER_SCREEN_X;
      for (const x of [wx + 2, wx + 13]) {
        const t = this.tileRC(r, Math.trunc(x / TILE));
        if (t === 23 || t === 24) return true;
      }
      return false;
    }

    moveOnLadder(collisions) {
      const p = this.player;
      if (!p.holdingLadder) return;
      if (this.input.left && collisions.left) {
        p.scroll--; p.ladderCounter += 2; p.facing = DIR.LEFT; this.lastDirection = DIR.LEFT;
      }
      if (this.input.right && collisions.right) {
        p.scroll++; p.ladderCounter += 2; p.facing = DIR.RIGHT; this.lastDirection = DIR.RIGHT;
      }
      if (this.input.up && collisions.up && !this.isCraneLift()) { p.y--; p.ladderCounter++; }
      if (this.input.down && collisions.down && !this.isCraneLift()) { p.y++; p.ladderCounter++; }
      if (p.ladderCounter >= 40) p.ladderCounter = 0;
    }

    accelerationSpeed() {
      const a = this.player.acceleration;
      let s = this.player.speed;
      if (a === 0) s = 0;
      if (a > 0 && a <= 18) s = 1;
      if (a > 18 && a <= 24) s = 2;
      if (a < 0 && a >= -6) s = 0;
      if (a < -6 && a >= -18) s = -1;
      if (a < -18 && a >= -24) s = -2;
      this.player.speed = s;
    }

    horizontalMove() {
      const p = this.player;
      if (p.holdingLadder) return;
      if (p.speed < 0) {
        for (let s = -1; s >= p.speed; s--) {
          if (this.collisionLeft()) { p.scroll--; this.lastDirection = DIR.LEFT; }
        }
      } else if (p.speed > 0 && p.scroll !== MAX_SCROLL) {
        for (let s = 1; s <= p.speed; s++) {
          if (this.collisionRight()) { p.scroll++; this.lastDirection = DIR.RIGHT; }
        }
      }
      if (p.scroll < 0) p.scroll = 1;
      p.scroll = clamp(p.scroll, 0, MAX_SCROLL);
    }

    fall() {
      const p = this.player;
      for (let i = 1; i <= p.fallSpeed; i++) {
        p.onPlatform = this.checkPlatform();
        if (p.onPlatform !== 99) break;
        if (this.collisionDown()) p.y++;
      }
    }

    jump() {
      const p = this.player;
      p.jumpCounter--;
      if (p.jumpCounter > 0 && p.jumpCounter <= 5) p.jumpSpeed = 1;
      if (p.jumpCounter > 5 && p.jumpCounter <= 12) p.jumpSpeed = 2;
      if (p.jumpCounter > 12 && p.jumpCounter <= 27) p.jumpSpeed = 3;
      if (p.jumpCounter > 27) p.jumpSpeed = 5;
      for (let i = 1; i <= p.jumpSpeed; i++) {
        if (this.collisionUp()) p.y--;
        else break;
      }
    }

    fallSpeed() {
      const p = this.player;
      if (p.fallCounter === 1) p.fallSpeed = 0;
      if (p.fallCounter >= 2 && p.fallCounter < 8) p.fallSpeed = 1;
      if (p.fallCounter >= 8 && p.fallCounter < 16) p.fallSpeed = 2;
      if (p.fallCounter >= 16 && p.fallCounter < 48) p.fallSpeed = 3;
    }

    maxJumpHeight() {
      const s = abs(this.player.speed);
      this.player.maxJumpHeight = s === 0 ? 20 : s === 1 ? 24 : s === 2 ? 31 : 40;
    }

    dangerousSpikes(grounded) {
      if (!grounded || this.player.y < -255) return false;
      const r = Math.trunc((this.player.y + 10) / TILE);
      const wx = this.player.scroll + PLAYER_SCREEN_X;
      return [wx + 4, wx + 12].some(x => this.tileRC(r, Math.trunc(x / TILE)) === 21);
    }

    standingOnFinish() {
      if (this.collisionDown()) return false;
      const r = Math.trunc((this.player.y + 26) / TILE);
      const c = Math.trunc((this.player.scroll + PLAYER_SCREEN_X + 8) / TILE);
      return this.tileRC(r, c) === 9;
    }

    checkPlayerCannon() {
      const p = this.player;
      if (p.y < -255 || this.isCraneCannonBlocked()) return false;
      if (this.collisionDown()) return false;
      const r = Math.trunc((p.y + 17) / TILE) + 1;
      const c1 = Math.trunc((p.scroll + PLAYER_SCREEN_X - 1) / TILE);
      const c2 = Math.trunc((p.scroll + PLAYER_SCREEN_X + 16) / TILE);
      return this.tileRC(r, c1) === 30 && this.tileRC(r, c2) === 31;
    }

    activateVisibleEntities(initial = false) {
      const currentCol = Math.trunc((this.player.scroll + PLAYER_SCREEN_X - 1) / TILE);
      const cols = initial ? [currentCol + 18] : [this.lastDirection === DIR.LEFT ? currentCol - 18 : currentCol + 18];
      for (const col of cols) {
        if (col < 0 || col >= COLS) continue;
        for (let r = 0; r < ROWS; r++) {
          const t = this.tileRC(r, col);
          if ([33, 34, 40, 41].includes(t) && !this.cannons.some(c => c.r === r && c.c === col)) {
            this.cannons.push({ r, c: col, type: t, timer: 10 });
          }
          if (t >= 150 && t <= 179) {
            this.enemies.push({
              type: t, x: col * TILE, y: r * TILE,
              direction: DIR.LEFT, status: 0,
              parabolaX: 0, parabolaY: 0,
              bossTimer: 0, bossHits: 3, bossBlink: 0
            });
            this.map[idx(r, col)] = 0;
          }
        }
      }
      const unloadCol = this.lastDirection === DIR.LEFT ? currentCol + 20 : currentCol - 20;
      this.cannons = this.cannons.filter(c => c.c !== unloadCol);
    }

    enemySideCollision(e, dir) {
      const r = Math.trunc((e.y + 8) / TILE);
      const c = Math.trunc((e.x + (dir === DIR.LEFT ? -1 : 16)) / TILE);
      const t = this.tileRC(r, c);
      return !(t !== 0 && (t <= 20 || t === 40 || t === 41 || (t >= 29 && t <= 36)));
    }

    enemyDownCollision(e) {
      const r = Math.trunc((e.y + 16) / TILE);
      for (const x of [e.x + 2, e.x + 13]) {
        const t = this.tileRC(r, Math.trunc(x / TILE));
        if (t !== 0 && (t <= 20 || t === 40 || t === 41 || (t >= 29 && t <= 36))) return false;
      }
      return true;
    }

    classifyEnemyHit(e) {
      const py = this.player.y;
      const px = this.player.scroll + PLAYER_SCREEN_X;
      if (e.type < 165) {
        if (py < e.y) {
          const dy = e.y - py;
          if (dy > 14 && dy < 25) return DIR.UP;
          if (dy < 14) return e.x > px ? DIR.LEFT : DIR.RIGHT;
        } else if (py - e.y < 15) return DIR.DOWN;
      } else if (e.type === 165) {
        const top = e.y - 36;
        if (py < top) {
          const dy = top - py;
          if (dy > 14 && dy < 25) return DIR.UP;
          if (dy < 14) return e.x > px + 8 ? DIR.LEFT : DIR.RIGHT;
        } else {
          if (py - top < 36) return e.x > px + 8 ? DIR.LEFT : DIR.RIGHT;
          return DIR.DOWN;
        }
      }
      return 99;
    }

    damageShield(direction, scorePenalty = 0) {
      if (this.player.invulnTimer !== 0) return;
      if (this.cheats.enabled && this.cheats.invulnerable) { this.player.invulnTimer = 30; return; }
      if (!(this.cheats.enabled && this.cheats.infiniteShields)) {
        if (this.shields[direction] > 0) this.shields[direction]--;
        else this.player.dead = true;
      }
      this.player.invulnTimer = 150;
      if (scorePenalty) this.score -= scorePenalty;
      this.sound('hit');
    }

    hitEnemy(e) {
      const side = this.classifyEnemyHit(e);
      if (side === 99) return;
      if (side === DIR.UP) {
        const killable = e.type === 150 || e.type === 156 || e.type === 162 || e.type === 165 ||
          ((e.type === 152 || e.type === 154) && this.upgrade === UPGRADE.SHOES);
        if (killable) {
          if (e.type < 165) {
            e.status = 1; e.parabolaX = e.x + 16; e.parabolaY = e.y - 40;
            this.addScore(200); this.player.jumpCounter += 5; this.sound('enemyTop');
          } else {
            if (e.bossBlink === 0) {
              e.bossHits--; e.bossBlink = 150;
              this.player.speed -= 4; this.player.acceleration -= 30;
              if (e.bossHits <= 0) { e.status = 1; this.winBoss(e); }
            }
            this.player.jumpCounter += 16;
          }
          return;
        }
        if ([152,154,158,160].includes(e.type)) this.damageShield(DIR.DOWN);
        return;
      }
      if (side === DIR.DOWN) { this.damageShield(DIR.UP); return; }
      if (side === DIR.LEFT || side === DIR.RIGHT) {
        const killable = e.type === 152 || e.type === 158 || e.type === 162 ||
          ((e.type === 150 || e.type === 154) && this.upgrade === UPGRADE.SHIRT);
        if (killable) {
          e.status = 1; e.parabolaX = e.x + 16; e.parabolaY = e.y - 40;
          this.addScore(100); this.sound('enemySide'); return;
        }
        if ([150,154,156,160,165].includes(e.type)) {
          this.damageShield(side === DIR.LEFT ? DIR.RIGHT : DIR.LEFT);
        }
      }
    }

    updateEnemies() {
      const px = this.player.scroll + PLAYER_SCREEN_X;
      for (const e of this.enemies) {
        if (e.status === 0 && e.type < 165) {
          let turned = false;
          if (e.direction === DIR.LEFT && !this.enemySideCollision(e, DIR.LEFT)) { e.direction = DIR.RIGHT; turned = true; }
          if (!turned && e.direction === DIR.RIGHT && !this.enemySideCollision(e, DIR.RIGHT)) e.direction = DIR.LEFT;
          const speed = e.type === 162 ? 2 : 1;
          e.x += e.direction === DIR.LEFT ? -speed : speed;
          if (this.enemyDownCollision(e)) e.y += 2;
          if (abs(px - e.x) < 15 && this.player.invulnTimer === 0) this.hitEnemy(e);
          if (e.type === 162) this.triggerRockUnderEnemy(e);
        } else if (e.status === 0 && e.type === 165) {
          if (e.bossTimer === 0) {
            e.bossTimer = 40 + Math.floor(Math.random() * 161);
            e.direction = Math.random() < 0.5 ? DIR.RIGHT : DIR.LEFT;
          }
          if (e.bossTimer > 0) e.bossTimer--;
          let turned = false;
          if (e.direction === DIR.LEFT && !this.enemySideCollision(e, DIR.LEFT)) { e.direction = DIR.RIGHT; turned = true; }
          if (!turned && e.direction === DIR.RIGHT && !this.enemySideCollision(e, DIR.RIGHT)) e.direction = DIR.LEFT;
          e.x += e.direction === DIR.LEFT ? -1 : 1;
          if (this.enemyDownCollision(e)) e.y += 2;
          if (abs(px + 8 - e.x) < 40 && this.player.invulnTimer === 0) this.hitEnemy(e);
          if (e.bossBlink > 0) e.bossBlink--;
        } else if (e.status === 1 && e.type < 165) {
          e.x++;
          e.y = 0.15 * (e.x - e.parabolaX) * (e.x - e.parabolaX) + e.parabolaY;
        }
      }
      this.enemies = this.enemies.filter(e => !((px - e.x > 500 || e.y >= 192) && e.type !== 162) && !(e.type === 162 && e.y >= 192));
    }

    winBoss(e) {
      this.sound('boss');
      const c = Math.trunc((this.player.scroll + PLAYER_SCREEN_X + 8) / TILE);
      this.state = 'bossDeath';
      this.blockingSequence = {
        type: 'bossDeath',
        boss: { ...e },
        finishColumn: c,
        finalLevel: this.levelNo >= 20
      };
      this.emit('bossDeath', {
        boss: { ...e }, finishColumn: c, finalLevel: this.levelNo >= 20,
        snapshot: this.snapshot(), map: this.map.slice()
      });
    }
    spawnProjectileFromCannon(c) {
      const playerCol = Math.trunc((this.player.scroll + PLAYER_SCREEN_X - 1) / TILE);
      const playerRow = Math.trunc((this.player.y + 17) / TILE);
      const random = c.type === 33 || c.type === 34;
      c.timer = random ? 10 + Math.floor(Math.random() * 291) : 100;
      let direction;
      if (c.type === 33 || c.type === 40) direction = playerCol <= c.c ? DIR.LEFT : DIR.RIGHT;
      else direction = playerRow <= c.r ? DIR.UP : DIR.DOWN;
      this.projectiles.push({ x: c.c * TILE, y: c.r * TILE, direction });
      // The recovered C++ only plays kanone.wav for Netrok's launch cannon,
      // not for ordinary level cannon projectiles.
    }

    moveProjectiles(spawnReady = true) {
      if (spawnReady) {
        for (const c of this.cannons) if (c.timer === 0) this.spawnProjectileFromCannon(c);
      }
      for (const b of this.projectiles) {
        if (b.direction === DIR.UP) b.y -= 2;
        if (b.direction === DIR.DOWN) b.y += 2;
        if (b.direction === DIR.RIGHT) b.x += 2;
        if (b.direction === DIR.LEFT) b.x -= 2;
        this.reflectProjectile(b);
        if (this.player.invulnTimer === 0) this.projectileHitsPlayer(b);
      }
      const px = this.player.scroll + PLAYER_SCREEN_X;
      this.projectiles = this.projectiles.filter(b =>
        !(b.direction === DIR.RIGHT && b.x - px >= 480) &&
        !(b.direction === DIR.LEFT && px - b.x >= 480) &&
        !(b.direction === DIR.UP && b.y <= -20) &&
        !(b.direction === DIR.DOWN && b.y >= 220));
    }

    updateCannons() {
      for (const c of this.cannons) c.timer--;
      this.moveProjectiles(true);
    }
    reflectProjectile(b) {
      const c = Math.trunc((b.x + 4) / TILE), r = Math.trunc((b.y + 4) / TILE);
      const t = this.tileRC(r, c);
      if ((t !== 35 && t !== 36) || b.x !== c * TILE || b.y !== r * TILE) return;
      if (t === 35) {
        if (b.direction === DIR.RIGHT) b.direction = DIR.UP;
        else if (b.direction === DIR.LEFT) b.direction = DIR.DOWN;
        else if (b.direction === DIR.DOWN) b.direction = DIR.LEFT;
        else if (b.direction === DIR.UP) b.direction = DIR.RIGHT;
      } else {
        if (b.direction === DIR.RIGHT) b.direction = DIR.DOWN;
        else if (b.direction === DIR.LEFT) b.direction = DIR.UP;
        else if (b.direction === DIR.DOWN) b.direction = DIR.RIGHT;
        else if (b.direction === DIR.UP) b.direction = DIR.LEFT;
      }
    }

    projectileHitsPlayer(b) {
      const p = this.player;
      const px = p.scroll + PLAYER_SCREEN_X;
      if (abs(px - b.x) > 11 || abs((p.y + 13) - (b.y + 8)) > 18) return;
      if (abs(px - b.x) <= 8) {
        this.damageShield((p.y + 13) > (b.y + 8) ? DIR.UP : DIR.DOWN, 50);
      } else {
        this.damageShield((b.x + 8) <= (px + 8) ? DIR.LEFT : DIR.RIGHT, 50);
      }
    }

    rockKey(r, c) { return `${r}:${c}`; }

    triggerRock(r, c) {
      if (this.tileRC(r, c) !== 5) return;
      const key = this.rockKey(r, c);
      if (this.fallingRocks.some(s => s.key === key)) return;
      this.fallingRocks.push({ key, r, c, x: c * TILE, y: r * TILE, state: 1, timer: 30 });
    }

    triggerRockUnderPlayer() {
      if (this.collisionDown() || this.timeLeft >= 197) return;
      const r = Math.trunc((this.player.y + 10) / TILE) + 1;
      const wx = this.player.scroll + PLAYER_SCREEN_X;
      this.triggerRock(r, Math.trunc((wx + 3) / TILE));
      this.triggerRock(r, Math.trunc((wx + 13) / TILE));
    }

    triggerRockUnderEnemy(e) {
      if (this.enemyDownCollision(e)) return;
      this.triggerRock(Math.trunc((e.y + 8) / TILE) + 1, Math.trunc((e.x + 8) / TILE));
    }

    updateRocks() {
      for (const s of this.fallingRocks) {
        if (s.state === 1 && s.timer > 0) s.timer--;
        if (s.state === 1 && s.timer === 0) { s.state = 2; this.map[idx(s.r, s.c)] = 0; }
        if (s.state === 2 && s.y < 220) s.y += 3;
      }
    }

    coinAtPixel(x, y) {
      if (y < -255) return null;
      const r = Math.trunc(y / TILE), c = Math.trunc(x / TILE);
      if (this.tileRC(r, c) !== 37) return null;
      if (x >= c * TILE + 3 && x <= c * TILE + 13 && y >= r * TILE + 3 && y <= r * TILE + 13) return { r, c };
      return null;
    }

    collectCoins() {
      const p = this.player, wx = p.scroll + PLAYER_SCREEN_X;
      const pts = [
        [wx+15,p.y],[wx+15,p.y+15],[wx+15,p.y+25],[wx,p.y+25],
        [wx,p.y+15],[wx,p.y],[wx+8,p.y],[wx+8,p.y+25]
      ];
      for (const [x,y] of pts) {
        const coin = this.coinAtPixel(x,y);
        if (coin) { this.collectCoin(coin.r, coin.c); break; }
      }
      if (this.coins === 20) this.giveShieldFromCoins();
    }

    collectCoin(r, c) {
      if (this.coins >= 20 || this.tileRC(r,c) !== 37) return;
      this.map[idx(r,c)] = 0;
      if (!this.collectedCoinsByLevel.has(this.levelNo)) this.collectedCoinsByLevel.set(this.levelNo, new Set());
      this.collectedCoinsByLevel.get(this.levelNo).add(idx(r,c));
      this.coins++;
      this.addScore(20);
      this.sound('coin');
    }

    giveShieldFromCoins() {
      let pos = 0;
      for (let d = 1; d <= 4; d++) if (this.shields[d] === 0) { pos = d; break; }
      if (!pos) for (let d = 1; d <= 4; d++) if (this.shields[d] === 1) { pos = d; break; }
      if (pos && this.shields[pos] < 2) { this.coins -= 20; this.shields[pos]++; }
    }

    setFlag() {
      if (this.flag) return;
      const p = this.player;
      const c = Math.trunc((p.scroll + PLAYER_SCREEN_X + 8) / TILE);
      const startR = Math.trunc((p.y + 17) / TILE) + 1;
      for (let r = startR; r < ROWS; r++) {
        const t = this.tileRC(r,c);
        if (t !== 0 && (t <= 20 || t === 40 || t === 41 || (t >= 29 && t <= 36))) {
          this.flag = { c, r: r - 1, y: p.y };
          this.score -= 2000; // This is what 0.95 source actually does; README still says 1000.
          this.sound('flag');
          this.emit('message', 'Jump-in flag placed: -2000 score (0.95 source behavior).');
          return;
        }
      }
      this.flag = { c, r: 0, y: p.y };
      this.score -= 2500;
      this.sound('flag');
      this.emit('message', 'Jump-in flag placed without ground below: -2500 score.');
    }

    moveShield(direction) {
      if (!this.shieldSelection) {
        if (this.shields[direction] > 0) this.shieldSelection = direction;
        return;
      }
      const source = this.shieldSelection;
      this.shieldSelection = null;
      if (source !== direction && this.shields[direction] < 2) {
        this.shields[source]--;
        this.shields[direction]++;
        this.score -= 10;
      }
    }

    checkUpgradeButton() {
      if (this.player.y < -255 || this.upgradeSequence) return null;
      const r = Math.trunc((this.player.y + 17) / TILE) + 1;
      const wx = this.player.scroll + PLAYER_SCREEN_X;
      for (const c of [Math.trunc(wx / TILE), Math.trunc((wx + 15) / TILE)]) {
        const t = this.tileRC(r,c);
        if (t === 25 || t === 26) return { r, c, type: t === 25 ? UPGRADE.SHOES : UPGRADE.SHIRT };
      }
      return null;
    }

    beginUpgrade(button) {
      this.map[idx(button.r, button.c)] = 0;
      this.upgradeSequence = { phase: 1, craneY: -200, buttonDrop: 0, ...button };
      this.score -= 200;
      this.sound('crane');
    }

    isCraneBusy() { return !!this.upgradeSequence; }
    isCraneLift() { return !!(this.upgradeSequence && this.upgradeSequence.phase === 2); }
    isCraneCarry() { return !!(this.upgradeSequence && (this.upgradeSequence.phase === 2 || this.upgradeSequence.phase === 3)); }
    isCraneCannonBlocked() { return !!(this.upgradeSequence && this.upgradeSequence.phase >= 1 && this.upgradeSequence.phase <= 3); }

    updateUpgrade() {
      const s = this.upgradeSequence;
      if (!s) return;
      if (s.buttonDrop < 15) s.buttonDrop++;
      if (s.buttonDrop === 15) {
        this.map[idx(s.r,s.c)] = s.type === UPGRADE.SHOES ? 27 : 28;
        if (s.r + 1 < ROWS && this.tileRC(s.r + 1, s.c) === 2) this.map[idx(s.r + 1,s.c)] = s.type === UPGRADE.SHOES ? 12 : 11;
      }
      if (s.phase === 1 && s.craneY + 190 <= this.player.y) s.craneY++;
      if (s.phase === 1 && s.craneY + 190 >= this.player.y) { s.phase = 2; this.sound('crane'); }
      if (s.phase === 2 && s.craneY > -230) { s.craneY--; this.player.y--; }
      if (s.phase === 2 && s.craneY === -230) { s.phase = 3; this.upgrade = s.type; }
      if (s.phase === 3 && this.collisionDown()) { s.craneY++; this.player.y++; }
      if (s.phase === 3 && !this.collisionDown()) { s.phase = 4; this.sound('crane'); }
      if (s.phase === 3 && s.craneY > 0) { s.phase = 4; this.sound('crane'); }
      if (s.phase === 4 && s.craneY > -230) s.craneY--;
      if (s.phase === 4 && s.craneY === -230) this.upgradeSequence = null;
    }

    addScore(points) {
      this.score += points;
      if (points > 0) this.oneUpScore += points;
      this.awardOneUps();
    }

    awardOneUps() {
      if (this.oneUpScore >= 5000) {
        this.oneUpScore = 0;
        this.lives++;
        this.emit('message', '1 UP: 5000 earned points.');
      }
    }

    finishLevel() {
      this.addScore(1000);
      this.addScore(this.timeLeft * 10);
      this.state = 'levelComplete';
      this.emit('levelComplete', { level: this.levelNo, score: this.score, timeLeft: this.timeLeft });
      this.sound('levelFinish');
    }

    nextLevel() {
      if (this.state !== 'levelComplete') return;
      if (this.levelNo >= 20) { this.state = 'victory'; return; }
      this.flag = null;
      this.loadLevel(this.levelNo + 1, { preserveMeta: true });
      this.state = 'playing';
    }

    die() {
      const deathDetail = { snapshot: this.snapshot(), map: this.map.slice() };
      const preDeathTime = this.timeLeft;
      const preservedPlatforms = this.platforms.map(p => ({ ...p }));
      this.emit('death', deathDetail);
      this.sound('death');
      if (!(this.cheats.enabled && this.cheats.infiniteLives)) this.lives--;
      this.score -= 1000;
      if (this.lives === -1) {
        this.state = 'gameOver';
        this.emit('gameOver', this.score);
        return;
      }
      const oldFlag = this.flag ? { ...this.flag } : null;
      this.shields = [0,2,2,1,1];
      this.upgrade = UPGRADE.NORMAL;
      this.shieldSelection = null;
      this.loadLevel(this.levelNo, { preserveMeta: true, keepFlag: true });
      this.flag = oldFlag;
      // 0.95 reloads level data on death but does NOT rebuild moving platforms.
      // Their positions/directions therefore survive the death sequence.
      if (preservedPlatforms.length === this.platforms.length) {
        this.platforms = preservedPlatforms;
      }
      this.player.invulnTimer = 0;
      if (oldFlag && oldFlag.r !== 0) {
        this.timeLeft = preDeathTime; // reset to 200 only after level_fade_in() returns
        this.blockingSequence = {
          type: 'checkpoint', phase: 'scroll', targetScroll: oldFlag.c * TILE - PLAYER_SCREEN_X,
          targetY: oldFlag.r * TILE - 16, craneY: this.player.y - 190
        };
      } else {
        this.timeLeft = 200;
      }
    }
    beginCannonSequence(collisions) {
      this.blockingSequence = {
        type: 'cannon', phase: 'down', frames: 0,
        startY: this.player.y, resumeCollisions: { ...collisions },
        resumeInput: { ...this.input }, visualY: this.player.y
      };
    }

    stepBlockingWorld({ incrementEnemyCounter = false, updateUpgrade = false } = {}) {
      this.invulnBlinkCounter++;
      if (this.invulnBlinkCounter === 20) this.invulnBlinkCounter = 0;
      if (incrementEnemyCounter) {
        this.enemyCounter++;
        if (this.enemyCounter === 50) this.enemyCounter = 0; // no time decrement inside source blocking loops
      }
      this.activateVisibleEntities();
      this.updateEnemies();
      this.movePlatforms();
      this.updateRocks();
      this.moveProjectiles(true); // source does not decrement cannon timers here
      if (updateUpgrade && this.upgradeSequence) this.updateUpgrade();
      if (updateUpgrade && this.checkpointCraneY != null) this.updateCheckpointCrane();
    }

    stepCannonSequence() {
      const s = this.blockingSequence;
      if (!s || s.type !== 'cannon') return null;
      const p = this.player;
      s.visualY = p.y;
      const firstHalf = s.frames < 20;
      this.stepBlockingWorld({ incrementEnemyCounter: firstHalf, updateUpgrade: true });
      if (firstHalf) p.y++;
      else p.y--;
      s.frames++;
      if (s.frames < 40) return null;
      p.jumpCounter = 80;
      this.sound('cannon');
      const resume = { collisions: s.resumeCollisions, input: s.resumeInput };
      this.blockingSequence = null;
      return resume;
    }

    stepCheckpointSequence() {
      const s = this.blockingSequence;
      if (!s || s.type !== 'checkpoint') return false;
      const p = this.player;
      p.invulnTimer = 50;
      this.invulnBlinkCounter++;
      if (this.invulnBlinkCounter === 20) this.invulnBlinkCounter = 0;
      this.enemyCounter++;
      if (this.enemyCounter === 50) this.enemyCounter = 0; // source does not decrement time here
      this.activateVisibleEntities();
      this.updateEnemies();
      this.movePlatforms();
      this.updateRocks();
      this.moveProjectiles(true);
      if (s.phase === 'scroll') {
        s.craneY = p.y - 190;
        if (p.scroll <= s.targetScroll) p.scroll += 10;
        if (p.scroll > s.targetScroll) s.phase = 'drop';
      } else {
        s.craneY += 2;
        if (p.y <= s.targetY) p.y += 2;
        if (p.y > s.targetY) {
          this.checkpointCraneY = s.craneY;
          this.blockingSequence = null;
          this.timeLeft = 200;
          return true;
        }
      }
      return false;
    }

    updateCheckpointCrane() {
      if (this.checkpointCraneY == null) return;
      if (this.checkpointCraneY > -230) this.checkpointCraneY--;
      if (this.checkpointCraneY <= -230) this.checkpointCraneY = null;
    }

    stepBossDeathFrame() {
      if (!this.blockingSequence || this.blockingSequence.type !== 'bossDeath') return;
      this.invulnBlinkCounter++;
      if (this.invulnBlinkCounter === 20) this.invulnBlinkCounter = 0;
      this.enemyCounter++;
      if (this.enemyCounter === 50) this.enemyCounter = 0;
      this.updateRocks();
      this.moveProjectiles(true); // no cannon timer decrement in bosstot()
    }

    completeBossDeath() {
      const s = this.blockingSequence;
      if (!s || s.type !== 'bossDeath') return { finalLevel: this.levelNo >= 20 };
      for (const dc of [-1,0,1]) {
        const c = s.finishColumn + dc;
        if (c >= 0 && c < COLS) this.map[idx(12,c)] = 9;
      }
      const finalLevel = s.finalLevel;
      this.enemies = this.enemies.filter(e => e.type !== 165);
      this.blockingSequence = null;
      if (finalLevel) {
        // Original 0.95 calls endanimation()+gameover() inside bosstot() BEFORE
        // enemies_bewegen() reaches its +4000 dead-boss branch. The displayed
        // final score/high score therefore excludes this otherwise intended bonus.
        this.state = 'victory';
      } else {
        this.addScore(4000);
        this.player.scroll = 6001;
        this.state = 'playing';
      }
      return { finalLevel };
    }

    step() {
      if (this.input.shieldPressed) { this.moveShield(this.input.shieldPressed); this.input.shieldPressed = 0; }
      if (this.input.flagPressed) { if (this.state === 'playing') this.setFlag(); this.input.flagPressed = false; }
      if (this.input.confirmPressed) {
        if (this.state === 'levelComplete') this.nextLevel();
        else if (this.state === 'gameOver' || this.state === 'victory') this.resetRun();
        this.input.confirmPressed = false;
      }

      if (this.blockingSequence && this.blockingSequence.type === 'cannon') {
        const resume = this.stepCannonSequence();
        if (!resume) return;
        const liveInput = { ...this.input };
        Object.assign(this.input, resume.input);
        this.stepGameplayTail(resume.collisions);
        Object.assign(this.input, liveInput);
        return;
      }
      if (this.state !== 'playing') { this.input.jumpPressed = false; return; }

      const p = this.player;
      this.invulnBlinkCounter++;
      this.enemyCounter++;
      if (this.enemyCounter === 50) {
        this.enemyCounter = 0;
        if (!(this.cheats.enabled && this.cheats.freezeTime)) this.timeLeft--;
        if (this.timeLeft <= 0 && !(this.cheats.enabled && this.cheats.freezeTime)) p.dead = true;
      }
      if (this.invulnBlinkCounter === 20) this.invulnBlinkCounter = 0;
      if (p.ladderCounter >= 40) p.ladderCounter = 0;

      let collisions = { down: this.collisionDown(), up: this.collisionUp(), left: this.collisionLeft(), right: this.collisionRight() };
      p.grounded = !collisions.down;
      p.onPlatform = this.checkPlatform();
      if (p.onPlatform !== 99) { collisions.down = false; p.grounded = true; }
      this.movePlatforms();
      if (p.onPlatform !== 99) this.moveWithPlatform(p.onPlatform);

      if (this.input.left && p.acceleration >= -24 && !p.holdingLadder) { p.acceleration -= 2; if (p.grounded) p.facing = DIR.LEFT; }
      if (this.input.right && p.acceleration <= 24 && !p.holdingLadder) { p.acceleration += 2; if (p.grounded) p.facing = DIR.RIGHT; }

      this.activateVisibleEntities();
      p.ladder = this.checkLadder();
      if (!p.ladder) p.holdingLadder = false;
      if ((this.input.up || this.input.down) && p.ladder) p.holdingLadder = true;
      this.moveOnLadder(collisions);

      if (this.input.down && this.checkPlayerCannon()) {
        this.beginCannonSequence(collisions);
        const resume = this.stepCannonSequence();
        if (!resume) return;
        collisions = resume.collisions;
      }
      this.stepGameplayTail(collisions);
    }

    stepGameplayTail(collisions) {
      const p = this.player;
      this.accelerationSpeed();
      if (this.input.run && p.acceleration > 24 && !p.holdingLadder && !this.isCraneCarry() && p.grounded) p.speed = 4;
      if (this.input.run && p.acceleration < -24 && !p.holdingLadder && !this.isCraneCarry() && p.grounded) p.speed = -4;

      if (!collisions.right && p.acceleration > 0) p.acceleration = 0;
      if (!collisions.left && p.acceleration < 0) p.acceleration = 0;

      if (this.input.jumpPressed && p.jumpCounter === 0 && p.grounded && !p.holdingLadder) {
        p.jumpCounter = 8; this.sound('jump');
      }
      this.input.jumpPressed = false;

      if (collisions.down && p.jumpCounter === 0 && !p.holdingLadder && !this.isCraneCarry()) this.fall();
      if (!collisions.up && p.jumpCounter > 0) { p.jumpCounter = 0; this.sound('ceiling'); }
      if (p.jumpCounter !== 0) this.jump();

      if (p.jumpCounter === 0 && collisions.down) { if (p.fallCounter === 0) p.fallCounter = 1; p.fallCounter++; }
      if (!collisions.down) p.fallCounter = 0;
      this.fallSpeed();
      this.horizontalMove();
      p.direction = p.speed < 0 ? DIR.LEFT : DIR.RIGHT;
      if (p.jumpCounter > 0) p.maxHigherJump++;
      this.maxJumpHeight();
      if (this.input.jump && p.jumpCounter > 0 && p.maxHigherJump < p.maxJumpHeight && !p.holdingLadder) p.jumpCounter++;
      if (p.maxHigherJump === 24 && !collisions.down) p.maxHigherJump = 0;
      if (!collisions.down) p.maxHigherJump = 0;

      if (p.acceleration !== 0) p.animCounter++;
      if (p.onPlatform !== 99 && p.acceleration === 0) p.animCounter = 9;
      if (p.animCounter === 30) p.animCounter = 0;

      this.updateEnemies();
      if (this.state === 'bossDeath') return; // bosstot() becomes the active blocking loop immediately
      this.stepGameplayPostEnemies();
    }

    stepGameplayPostEnemies() {
      const p = this.player;
      if (this.flag && this.flag.y !== this.flag.r * TILE) this.flag.y++;
      this.triggerRockUnderPlayer();
      this.updateRocks();
      this.updateCannons();

      const button = this.checkUpgradeButton();
      if (button && !this.collisionDown()) { this.sound('button'); this.beginUpgrade(button); }
      this.updateUpgrade();
      this.updateCheckpointCrane();
      this.collectCoins();

      p.lastScrollForSprite = p.scroll;
      if (p.grounded && p.acceleration > 0) p.acceleration--;
      if (p.grounded && p.acceleration < 0) p.acceleration++;
      if (!p.grounded && p.acceleration > 0 && this.invulnBlinkCounter < 10) p.acceleration--;
      if (!p.grounded && p.acceleration < 0 && this.invulnBlinkCounter < 10) p.acceleration++;

      if (this.dangerousSpikes(p.grounded) && !(this.cheats.enabled && this.cheats.invulnerable)) p.dead = true;
      if (p.y > 174 || p.dead) { this.die(); return; }
      if (this.standingOnFinish()) { this.finishLevel(); return; }
      if (p.speed === 3 && p.grounded) p.speed = 2;
      if (p.speed === -3 && p.grounded) p.speed = -2;
      if (p.invulnTimer > 0) p.invulnTimer--;
      this.awardOneUps();
    }
    playerSprite() {
      const p = this.player;
      if (p.holdingLadder) {
        const pair = this.upgrade === UPGRADE.NORMAL ? [116,117] : this.upgrade === UPGRADE.SHOES ? [133,134] : [135,136];
        return pair[p.ladderCounter < 20 ? 0 : 1];
      }
      const right = p.facing !== DIR.LEFT;
      if (p.jumpCounter !== 0) {
        if (this.upgrade === UPGRADE.NORMAL) return right ? 108 : 109;
        if (this.upgrade === UPGRADE.SHOES) return right ? 131 : 132;
        return right ? 137 : 138;
      }
      const standing = p.speed === 0;
      if (standing) {
        if (this.upgrade === UPGRADE.NORMAL) return right ? 100 : 101;
        if (this.upgrade === UPGRADE.SHOES) return right ? 110 : 111;
        return right ? 118 : 119;
      }
      let frame;
      const a = p.animCounter;
      if (abs(p.speed) === 1) frame = a <= 10 ? 0 : 1;
      else if (abs(p.speed) === 2) frame = a <= 10 ? 0 : a <= 20 ? 1 : 2;
      else frame = a <= 5 ? 0 : a <= 10 ? 1 : a <= 15 ? 2 : a <= 20 ? 0 : a <= 25 ? 1 : 2;
      const sets = this.upgrade === UPGRADE.NORMAL ? [[102,103],[104,105],[106,107]] :
        this.upgrade === UPGRADE.SHOES ? [[112,113],[114,115],[129,130]] : [[120,121],[122,123],[124,125]];
      return sets[frame][right ? 0 : 1];
    }

    setCheats(next = {}) {
      this.cheats = { ...this.cheats, ...next };
      this.cheats.enabled = !!this.cheats.enabled;
      if (this.cheats.enabled) this.runCheated = true;
      if (!this.cheats.enabled) {
        this.cheats.infiniteLives = false;
        this.cheats.invulnerable = false;
        this.cheats.freezeTime = false;
        this.cheats.infiniteShields = false;
      }
      this.emit('message', this.cheats.enabled ? 'Cheat mode enabled.' : 'Cheat mode disabled.');
    }

    cheatSetLevel(n) {
      if (!this.cheats.enabled) return false;
      n = Math.max(1, Math.min(20, Number(n) || 1));
      this.state = 'playing';
      this.flag = null;
      this.loadLevel(n, { preserveMeta: true });
      return true;
    }

    cheatAddScore(points = 5000) {
      if (!this.cheats.enabled) return false;
      this.addScore(Number(points) || 0);
      return true;
    }

    cheatSetUpgrade(value) {
      if (!this.cheats.enabled) return false;
      const v = Number(value);
      if (![UPGRADE.NORMAL, UPGRADE.SHOES, UPGRADE.SHIRT].includes(v)) return false;
      this.upgrade = v;
      this.upgradeSequence = null;
      return true;
    }

    cheatFillShields() {
      if (!this.cheats.enabled) return false;
      this.shields = [0, 2, 2, 2, 2];
      return true;
    }

    exportState() {
      if (this.state !== 'playing' || this.blockingSequence || this.runCheated) return null;
      return {
        version: 1,
        state: this.state, levelNo: this.levelNo, score: this.score, oneUpScore: this.oneUpScore,
        lives: this.lives, coins: this.coins, shields: this.shields.slice(), upgrade: this.upgrade,
        shieldSelection: this.shieldSelection, timeLeft: this.timeLeft, lastDirection: this.lastDirection,
        flag: this.flag ? { ...this.flag } : null, map: this.map.slice(),
        platforms: this.platforms.map(p => ({ ...p })), fallingRocks: this.fallingRocks.map(r => ({ ...r })),
        cannons: this.cannons.map(c => ({ ...c })), projectiles: this.projectiles.map(b => ({ ...b })),
        enemies: this.enemies.map(e => ({ ...e })), enemyCounter: this.enemyCounter,
        invulnBlinkCounter: this.invulnBlinkCounter, upgradeSequence: this.upgradeSequence ? { ...this.upgradeSequence } : null,
        checkpointCraneY: this.checkpointCraneY, player: { ...this.player }, runCheated: false,
        collectedCoinsByLevel: [...this.collectedCoinsByLevel.entries()].map(([level, set]) => [level, [...set]])
      };
    }

    importState(saved) {
      if (!saved || saved.version !== 1 || saved.state !== 'playing') return false;
      const levelNo = Number(saved.levelNo);
      if (!Number.isInteger(levelNo) || levelNo < 1 || levelNo > 20) return false;
      if (!Array.isArray(saved.map) || saved.map.length !== ROWS * COLS) return false;
      if (!saved.player || !Array.isArray(saved.shields) || saved.shields.length < 5) return false;
      if ([saved.score, saved.oneUpScore, saved.lives, saved.coins, saved.timeLeft].some(v => !Number.isFinite(Number(v)))) return false;

      // Start from the canonical level so any fields added in future versions keep sane defaults.
      this.cheats = { enabled: false, infiniteLives: false, invulnerable: false, freezeTime: false, infiniteShields: false };
      this.runCheated = false;
      this.loadLevel(levelNo, { preserveMeta: true });
      this.state = 'playing';
      this.score = Number(saved.score);
      this.oneUpScore = Number(saved.oneUpScore);
      this.lives = Number(saved.lives);
      this.coins = Number(saved.coins);
      this.shields = saved.shields.slice(0, 5).map(Number);
      this.upgrade = Number(saved.upgrade) || UPGRADE.NORMAL;
      this.shieldSelection = saved.shieldSelection == null ? null : Number(saved.shieldSelection);
      this.timeLeft = Number(saved.timeLeft);
      this.lastDirection = Number(saved.lastDirection) || DIR.RIGHT;
      this.flag = saved.flag ? { ...saved.flag } : null;
      this.map = saved.map.slice();
      this.platforms = Array.isArray(saved.platforms) ? saved.platforms.map(p => ({ ...p })) : this.extractPlatforms();
      this.fallingRocks = Array.isArray(saved.fallingRocks) ? saved.fallingRocks.map(r => ({ ...r })) : [];
      this.cannons = Array.isArray(saved.cannons) ? saved.cannons.map(c => ({ ...c })) : [];
      this.projectiles = Array.isArray(saved.projectiles) ? saved.projectiles.map(b => ({ ...b })) : [];
      this.enemies = Array.isArray(saved.enemies) ? saved.enemies.map(e => ({ ...e })) : [];
      this.enemyCounter = Number(saved.enemyCounter) || 0;
      this.invulnBlinkCounter = Number(saved.invulnBlinkCounter) || 0;
      this.upgradeSequence = saved.upgradeSequence ? { ...saved.upgradeSequence } : null;
      this.blockingSequence = null;
      this.checkpointCraneY = saved.checkpointCraneY == null ? null : Number(saved.checkpointCraneY);
      this.player = { ...this.player, ...saved.player, dead: false };
      this.input.left = this.input.right = this.input.up = this.input.down = false;
      this.input.run = this.input.jump = this.input.jumpPressed = this.input.flagPressed = false;
      this.input.shieldPressed = 0; this.input.confirmPressed = false;
      this.collectedCoinsByLevel = new Map();
      if (Array.isArray(saved.collectedCoinsByLevel)) {
        for (const pair of saved.collectedCoinsByLevel) {
          if (!Array.isArray(pair) || pair.length !== 2 || !Array.isArray(pair[1])) continue;
          this.collectedCoinsByLevel.set(Number(pair[0]), new Set(pair[1].map(Number)));
        }
      }
      this.emit('levelLoaded', levelNo);
      return true;
    }

    snapshot() {
      return {
        state: this.state, level: this.levelNo, score: this.score, lives: this.lives,
        coins: this.coins, shields: this.shields.slice(), upgrade: this.upgrade,
        timeLeft: this.timeLeft, flag: this.flag ? { ...this.flag } : null,
        player: { ...this.player }, background: this.background.slice(),
        platforms: this.platforms.map(p => ({ ...p })),
        enemies: this.enemies.map(e => ({ ...e })), cannons: this.cannons.map(c => ({ ...c })),
        projectiles: this.projectiles.map(b => ({ ...b })), fallingRocks: this.fallingRocks.map(r => ({ ...r })),
        upgradeSequence: this.upgradeSequence ? { ...this.upgradeSequence } : null,
        blockingSequence: this.blockingSequence ? { ...this.blockingSequence } : null,
        checkpointCraneY: this.checkpointCraneY,
        shieldSelection: this.shieldSelection,
        cheats: { ...this.cheats }, runCheated: this.runCheated
      };
    }
  }

  return { Game, TILE, ROWS, COLS, SCREEN_W, SCREEN_H, PLAYER_SCREEN_X, MAX_SCROLL, DIR, UPGRADE, PLATFORM, PLATFORM_LENGTH };
});
