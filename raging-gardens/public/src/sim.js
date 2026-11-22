// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later AND MIT
//
// Raging Gardens, game logic. A line-by-line port of the original's
// src/tilemap.js, src/player.js, src/enemy.js and the game loop of
// src/scene.game.js (Petar Petrov, 2012, MIT; kept verbatim in
// reference/original/src/), with Crafty, Backbone, underscore and jQuery taken
// out. specs/port-map.md says which original function became which function
// here, and tests/oracle.test.mjs replays recordings of the original game
// against this file frame by frame.
//
// No DOM, no clock, no Math.random: the host calls step() once per 20 ms
// (Crafty's fixed 50 frames per second) and supplies the random source.
//
// Crafty behaviours the original silently relied on, reproduced here:
//  * all entity handlers run in creation order, the scene's own loop last;
//  * hit() reports, among the overlapping entities, the oldest one first;
//  * two boxes that merely touch do not collide (Crafty's SAT test is strict);
//  * a key held down does not repeat KeyDown;
//  * Q and W act when the key is RELEASED, Z only while it is held.

import { randomInt } from "./rng.js";
import { Graph, GraphNodeType, search } from "./astar.js";

export const CONFIG = Object.freeze({
  screenWidth: 1024,
  screenHeight: 768,
  frameMs: 20,
  gameTimeLimit: 180 * 1000,
  gameTurnPeriod: 30 * 1000,
  gameTickPeriod: 1 * 1000,
  enemiesPerTurn: 2,
  startEnemiesCount: 4,
  maxEnemiesToSpawn: 16,
  carrotsPerTurn: 1,
  startCarrotsCount: 4,
  maxCarrotsToSpawn: 11,
  defaultCarrots: 0,
  carrotsCollect: 2,
  carrotsPushCost: 1,
  carrotsForkCost: 2,
});

export const KEYS = Object.freeze({ LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, Y: 89, Z: 90, Q: 81, W: 87 });

const TILE = 64;
const PLAYER = { speed: 2, pullSpeed: 2, pushDistance: 64 * 64, pushRepelAmount: 25, halfW: 16, halfH: 24, box: [8, 40, 24, 48] };
const ENEMY = { speed: 2, pullSpeed: 2.25, pushCooldown: 30, halfW: 16, halfH: 24, box: [2, 32, 30, 48] };
const FORK_FRAMES = 300;
const CARROT_HEALTH = 100;

// Obstacle kinds in the order of the original's random draw 1..6, with their hit boxes
// (left, top, right, bottom, relative to the 64 x 64 tile).
export const OBSTACLE_KINDS = [
  null,
  { name: "stone_small", box: [16, 40, 48, 48] },
  { name: "stone_big", box: [16, 40, 48, 48] },
  { name: "tree", box: [12, 52, 56, 64] },
  { name: "barrel", box: [16, 40, 48, 48] },
  { name: "bush", box: [16, 40, 48, 48] },
  { name: "heysack", box: [12, 52, 56, 64] },
];

// Crafty's collision test for two axis-aligned boxes: strictly overlapping.
function overlaps(ax1, ay1, ax2, ay2, bx1, by1, bx2, by2) {
  return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
}

export class Game {
  // random: () => number in [0, 1). config: optional overrides, used by tests only.
  constructor({ random, config } = {}) {
    if (typeof random !== "function") throw new TypeError("Game needs a random function");
    this.random = random;
    this.config = { ...CONFIG, ...(config || {}) };
    const c = this.config;

    // time, in the original Date.now() relative to the scene start; frame is Crafty's frame counter
    this.now = 0;
    this.frame = 0;
    this.over = false;
    this.events = []; // what happened since the host last called takeEvents(): sounds, messages, effects
    this.keysDown = new Set();

    // ---- Tilemap (src/tilemap.js)
    this.width = c.screenWidth / TILE;
    this.height = c.screenHeight / TILE;
    this.spawnArea = { top: 1, left: 1, right: this.width - 2, bottom: this.height - 2 };
    this.spawnAreaPx = {
      top: TILE * this.spawnArea.top, left: TILE * this.spawnArea.left,
      right: TILE * this.spawnArea.right, bottom: TILE * this.spawnArea.bottom,
    };
    this.carrotsCoordsQueue = [];
    this.obstacles = []; // {tx, ty, kind}, in creation order
    this.carrots = []; // live carrots, oldest first
    this.enemies = []; // live enemies, oldest first
    this.carrotSerial = 0;
    this.enemySerial = 0;
    this.fork = null; // {x, y, until}

    this.generateObstacles();

    // ---- Player (src/player.js)
    const spawn = this.spawnAtCentre();
    this.player = {
      x: spawn.x, y: spawn.y,
      move: { left: false, right: false, up: false, down: false },
      digCarrot: { canPull: false, obj: undefined },
      action1: 0, // 0 none, 1 down, 2 up (Crafty key states of the original)
      carrotsCount: c.defaultCarrots,
      pullID: undefined,
    };

    // ---- scene loop state (src/scene.game.js)
    this.currentEnemies = 0;
    this.maxEnemies = c.startEnemiesCount;
    this.maxCarrots = c.startCarrotsCount;
    this.gameTick = 0;
    this.gameTimeLeft = this.now + c.gameTimeLimit;
    this.gameTurnTimeLeft = this.now + c.gameTurnPeriod;
  }

  // ------------------------------------------------------------------ input

  keyDown(code) {
    if (this.keysDown.has(code)) return; // Crafty does not repeat KeyDown
    this.keysDown.add(code);
    const p = this.player;
    if (code === KEYS.RIGHT) p.move.right = true;
    else if (code === KEYS.LEFT) p.move.left = true;
    else if (code === KEYS.UP) p.move.up = true;
    else if (code === KEYS.DOWN) p.move.down = true;
    else if (code === KEYS.Z || code === KEYS.Y) p.action1 = 1;
  }

  keyUp(code) {
    this.keysDown.delete(code);
    const p = this.player;
    if (code === KEYS.RIGHT) p.move.right = false;
    else if (code === KEYS.LEFT) p.move.left = false;
    else if (code === KEYS.UP) p.move.up = false;
    else if (code === KEYS.DOWN) p.move.down = false;
    else if (code === KEYS.Z || code === KEYS.Y) p.action1 = 2;
    else if (code === KEYS.Q) this.pushEnemies();
    else if (code === KEYS.W) this.forkEnemies();
  }

  // Everything released at once (window blur, pause, game over): the original paused and
  // left its movement flags stuck; the host calls this instead.
  releaseAll() {
    for (const code of [...this.keysDown]) {
      if (code !== KEYS.Q && code !== KEYS.W) this.keyUp(code);
    }
    this.keysDown.clear();
  }

  // ------------------------------------------------------------------ Tilemap

  generateObstacles() {
    const a = this.spawnArea;
    for (let i = 0; i < 27; i++) { // maxObstacles
      const kind = randomInt(this.random, 1, 6);
      let ox, oy, occupied;
      do {
        ox = randomInt(this.random, a.left, a.right);
        oy = randomInt(this.random, a.top, a.bottom);
        occupied = this.obstacles.some((o) => o.tx === ox && o.ty === oy);
      } while (occupied);
      this.obstacles.push({ tx: ox, ty: oy, kind });
    }
    // the A* graph: obstaclesMap[y][x], so graph node (x', y') is tile (y', x')... as in the original
    const map = [];
    for (let y = 0; y < this.height; y++) {
      const row = [];
      for (let x = 0; x < this.width; x++) row.push(GraphNodeType.OPEN);
      map.push(row);
    }
    for (const o of this.obstacles) map[o.ty][o.tx] = GraphNodeType.WALL;
    this.graph = new Graph(map);
  }

  // Path of tiles (graph nodes) from a pixel position to another; mutates nothing of the caller's.
  getPathToTilePx(from, to) {
    const fx = from.x / TILE, fy = from.y / TILE;
    const tx = to.x / TILE, ty = to.y / TILE;
    let x = fx < 0 ? 0 : fx;
    x = x >= this.width ? this.width - 1 : x;
    let y = fy < 0 ? 0 : fy;
    y = y >= this.height ? this.height - 1 : y;
    x = Math.floor(x); y = Math.floor(y);
    const nodes = this.graph.nodes;
    return search(nodes, nodes[y][x], nodes[Math.floor(ty)][Math.floor(tx)], true);
  }

  spawnCarrot() {
    if (this.carrots.length < this.maxCarrots) {
      let done = false;
      let pos, tx, ty;
      do {
        const ox = randomInt(this.random, this.spawnArea.left, this.spawnArea.right);
        const oy = randomInt(this.random, this.spawnArea.top, this.spawnArea.bottom);
        pos = this.spawnAt(ox, oy);
        tx = pos.x / TILE;
        ty = pos.y / TILE;
        done = !this.carrotsCoordsQueue.some((q) => q.x === tx && q.y === ty);
      } while (!done);
      // The original meant to remember the last few positions; pop() drops the newest one, so
      // the first eight positions are remembered for good. Kept as it was.
      this.carrotsCoordsQueue.push({ x: tx, y: ty });
      if (this.carrotsCoordsQueue.length > 8) this.carrotsCoordsQueue.pop();
      this.carrots.push({
        serial: ++this.carrotSerial, x: pos.x, y: pos.y, health: CARROT_HEALTH, pulled: false, occupied: false, dead: false,
      });
    }
  }

  // Free map position given tile coordinates, spiralling outwards from obstacles; returns pixels.
  spawnAt(tileX, tileY) {
    let cx = tileX, cy = tileY;
    const nextX = [1, 0, -1, 0];
    const nextY = [0, 1, 0, -1];
    let i = 0, m = 1;
    let occupied;
    do {
      occupied = this.obstacles.some((o) => o.tx === cx && o.ty === cy);
      if (occupied) {
        cx = tileX + nextX[i] * m;
        cy = tileY + nextY[i] * m;
        if (++i > 3) { i = 0; m++; }
      }
    } while (occupied);
    return { x: cx * TILE, y: cy * TILE };
  }

  spawnAtPx(x, y) { return this.spawnAt(x / TILE, y / TILE); }
  spawnAtCentre() { return this.spawnAt(this.width * 0.5, this.height * 0.5); }
  spawnAtRandom() {
    const ox = randomInt(this.random, this.spawnArea.left, this.spawnArea.right);
    const oy = randomInt(this.random, this.spawnArea.top, this.spawnArea.bottom);
    return this.spawnAt(ox, oy);
  }

  spawnRelativeTo(rx, ry) {
    const a = this.spawnArea, p = this.spawnAreaPx;
    let sx, sy;
    const dxl = rx - p.left;
    const dxr = p.right - rx;
    if (dxl < dxr) sx = randomInt(this.random, 0, a.left);
    else sx = randomInt(this.random, a.right, a.right + 2);
    const dyt = ry - p.top;
    const dyb = p.bottom - ry;
    if (dyt < dyb) sy = randomInt(this.random, 0, a.top);
    else sy = randomInt(this.random, a.bottom, a.bottom + 2);
    return { x: sx * TILE, y: sy * TILE };
  }

  spawnRelativeToEdge() {
    const p = this.spawnAreaPx;
    const type = randomInt(this.random, 0, 3);
    if (type === 0) return this.spawnRelativeTo(p.left, p.top); // topleft
    if (type === 1) return this.spawnRelativeTo(p.right, p.top); // topright
    if (type === 2) return this.spawnRelativeTo(p.left, p.bottom); // bottomleft
    return this.spawnRelativeTo(p.right, p.bottom); // bottomright
  }

  // Nearest carrot nobody has claimed (distance between feet and carrot, as the original measured it).
  findFreeCarrot(from) {
    let ref;
    let dist = 1.8437736874454811e19; // the original wrote 18437736874454810627, the same double
    for (const obj of this.carrots) {
      if (!obj.occupied) {
        const dx = (obj.x + 16) - (from.x + 16);
        const dy = (obj.y + 24) - (from.y + 48);
        const d = dx * dx + dy * dy;
        if (d < dist) { dist = d; ref = obj; }
      }
    }
    return ref;
  }

  // ------------------------------------------------------------------ collisions

  // Oldest live carrot whose box overlaps the box (left, top, right, bottom) in pixels.
  hitCarrot(x1, y1, x2, y2) {
    for (const c of this.carrots) {
      if (overlaps(x1, y1, x2, y2, c.x, c.y, c.x + 32, c.y + 32)) return c;
    }
    return undefined;
  }

  hitObstacle(x1, y1, x2, y2) {
    for (const o of this.obstacles) {
      const b = OBSTACLE_KINDS[o.kind].box;
      const ox = o.tx * TILE, oy = o.ty * TILE;
      if (overlaps(x1, y1, x2, y2, ox + b[0], oy + b[1], ox + b[2], oy + b[3])) return true;
    }
    return false;
  }

  destroyCarrot(c) {
    c.dead = true;
    const i = this.carrots.indexOf(c);
    if (i >= 0) this.carrots.splice(i, 1);
  }

  // ------------------------------------------------------------------ Player

  eatCarrots(amount) {
    if (this.player.carrotsCount < amount) {
      this.events.push({ type: "message", id: "noCarrots" });
      this.events.push({ type: "sound", name: "burp" });
      return false;
    }
    this.player.carrotsCount -= amount;
    return true;
  }

  pushEnemies() {
    if (!this.eatCarrots(this.config.carrotsPushCost)) return;
    if (this.enemies.length > 0) {
      const p = this.player;
      const plrX = p.x + PLAYER.halfW;
      const plrY = p.y + PLAYER.halfH;
      this.events.push({ type: "push", x: plrX, y: plrY });
      this.events.push({ type: "sound", name: "fart" });
      for (const e of this.enemies.slice()) {
        const dx = e.x - plrX;
        const dy = e.y - plrY;
        if (dx * dx + dy * dy < PLAYER.pushDistance) {
          this.pushBack(e, { amount: PLAYER.pushRepelAmount, x: plrX, y: plrY });
          this.events.push({ type: "sound", name: "scream" });
        }
      }
    }
  }

  forkEnemies() {
    if (this.fork) return; // only one totem at a time
    if (!this.eatCarrots(this.config.carrotsForkCost)) return;
    this.events.push({ type: "sound", name: "aaaah" });
    if (this.enemies.length > 0) {
      const p = this.player;
      const where = { x: p.x + PLAYER.halfW, y: p.y + PLAYER.halfH };
      this.fork = { x: where.x, y: where.y, until: this.frame + FORK_FRAMES };
      this.events.push({ type: "fork", x: where.x, y: where.y });
      for (const e of this.enemies.slice()) this.forkBeacon(e, where);
    }
  }

  updatePlayer() {
    const p = this.player;
    const oldx = p.x, oldy = p.y;

    if (p.move.up) p.y -= PLAYER.speed;
    if (p.move.down) p.y += PLAYER.speed;
    if (p.move.left) p.x -= PLAYER.speed;
    if (p.move.right) p.x += PLAYER.speed;

    // --- Pull
    if (p.digCarrot.canPull) {
      if (p.action1 === 1) {
        const obj = p.digCarrot.obj;
        if (obj && !obj.pulled) {
          obj.health -= PLAYER.pullSpeed;
          if (obj.health <= 0) {
            p.action1 = 0;
            p.carrotsCount += this.config.carrotsCollect;
            obj.pulled = true;
            this.destroyCarrot(obj);
            p.digCarrot.canPull = false;
            this.events.push({ type: "message", id: "clear" });
            this.events.push({ type: "sound", name: "pull" });
            p.pullID = undefined;
          }
        }
      }
    }

    // --- collisions with the scenery and the edge of the field
    const b = PLAYER.box;
    if (this.hitObstacle(p.x + b[0], p.y + b[1], p.x + b[2], p.y + b[3])
      || p.x + 32 > this.config.screenWidth || p.x < 0
      || p.y + 32 > this.config.screenHeight || p.y < -16) {
      p.x = oldx;
      p.y = oldy;
      return;
    }

    // --- a carrot within reach: remember it, the pull bar follows
    const hit = this.hitCarrot(p.x + b[0], p.y + b[1], p.x + b[2], p.y + b[3]);
    if (hit) {
      if (!p.digCarrot.canPull) {
        p.digCarrot.canPull = true;
        p.digCarrot.obj = hit;
        p.pullID = hit.serial;
      }
    } else if (p.digCarrot.canPull) {
      p.digCarrot.canPull = false;
      p.digCarrot.obj = undefined;
      p.pullID = undefined;
    }
  }

  // ------------------------------------------------------------------ Enemy

  spawnEnemy() {
    const pos = this.spawnRelativeToEdge();
    const e = {
      serial: ++this.enemySerial, x: pos.x, y: pos.y,
      move: { left: false, right: false, up: false, down: false },
      target: { x: undefined, y: undefined, obj: undefined, path: undefined, pathpos: 0 },
      digCarrot: { canPull: false, obj: undefined },
      pushedProps: { pushed: false, atFrame: 0 },
    };
    this.enemies.push(e);
    this.newTarget(e);
    return e;
  }

  // New carrot to go for, or a random place when there is none free
  newTarget(e, anywhere) {
    if (!anywhere) {
      const carrot = this.findFreeCarrot({ x: e.x, y: e.y });
      if (carrot) {
        e.target.x = carrot.x;
        e.target.y = carrot.y;
        e.target.obj = carrot;
        carrot.occupied = true; // never released again, as in the original
      } else {
        anywhere = true;
      }
    }
    if (anywhere) {
      const pos = this.spawnAtRandom();
      e.target.x = pos.x;
      e.target.y = pos.y;
      e.target.obj = undefined;
    }
    e.target.path = this.getPathToTilePx({ x: e.x, y: e.y }, { x: e.target.x, y: e.target.y });
    e.target.pathpos = 0;
    if (e.digCarrot.canPull) {
      e.digCarrot.canPull = false;
      e.digCarrot.obj = undefined;
    }
    return e;
  }

  pushBack(e, playerPos) {
    const amount = playerPos.amount;
    let newX = e.x;
    let newY = e.y;
    const cx = e.x + ENEMY.halfW;
    const cy = e.y + ENEMY.halfH;

    if (e.move.up && playerPos.y < e.y) newY += amount;
    else if (e.move.up && playerPos.y > cy) newY -= amount;
    else if (e.move.down && playerPos.y < cy) newY += amount;
    else if (e.move.down && playerPos.y > cy) newY -= amount;

    if (e.move.left && playerPos.x < cx) newX += amount;
    else if (e.move.left && playerPos.x > cx) newX -= amount;
    if (e.move.right && playerPos.x < cx) newX += amount;
    if (e.move.right && playerPos.x > cx) newX -= amount;

    const pos = this.spawnAtPx(newX, newY);
    e.x = pos.x;
    e.y = pos.y;
    e.pushedProps.pushed = true;
    e.pushedProps.atFrame = undefined;
  }

  forkBeacon(e, where) {
    e.target.x = where.x;
    e.target.y = where.y;
    e.target.path = this.getPathToTilePx({ x: e.x, y: e.y }, { x: e.target.x, y: e.target.y });
    e.target.pathpos = 0;
  }

  updateEnemy(e) {
    const frame = this.frame;

    if (e.pushedProps.pushed) {
      if (!e.pushedProps.atFrame) {
        e.pushedProps.atFrame = frame + ENEMY.pushCooldown;
        return;
      }
      if (e.pushedProps.atFrame > frame) return;
      this.newTarget(e);
      e.pushedProps.pushed = false;
    }

    // --- Pull
    if (e.digCarrot.canPull) {
      const obj = e.digCarrot.obj;
      obj.health -= ENEMY.pullSpeed;
      if (obj.health <= 0) {
        e.digCarrot.canPull = false;
        obj.pulled = true;
        this.destroyCarrot(obj);
        // the player was standing on it: the enemy laughs
        const playerPullID = this.player.pullID;
        if (playerPullID && playerPullID === obj.serial) this.events.push({ type: "sound", name: "laughter" });
        this.newTarget(e);
      }
      return;
    }

    // --- Path decision
    e.move.up = e.move.down = e.move.left = e.move.right = false;
    const sx = e.x + 16;
    const sy = e.y + 32;
    let targetX, targetY;
    let checkGoal = false;

    if (e.target.pathpos === e.target.path.length) {
      if (e.target.obj) {
        targetX = e.target.x + 16;
        targetY = e.target.y + 16;
        checkGoal = true;
      } else {
        this.newTarget(e); // nothing to pick up there
        return;
      }
    } else {
      const node = e.target.path[e.target.pathpos];
      targetX = node.pos.y * TILE + 32;
      targetY = node.pos.x * TILE + 32;
      const dsx = targetX - sx;
      const dsy = targetY - sy;
      if (dsx * dsx + dsy * dsy < 64) e.target.pathpos += 1;
    }

    if (sx < targetX) e.move.right = true;
    else if (sx > targetX) e.move.left = true;
    if (sy < targetY) e.move.down = true;
    else if (sy > targetY) e.move.up = true;

    // --- Move
    if (e.move.up) e.y -= ENEMY.speed;
    if (e.move.down) e.y += ENEMY.speed;
    if (e.move.left) e.x -= ENEMY.speed;
    if (e.move.right) e.x += ENEMY.speed;

    // --- Target reached? Start pulling whichever carrot is underfoot.
    if (checkGoal) {
      const dx = sx - e.target.x + 16;
      const dy = sy - e.target.y + 16;
      const dist = dx * dx + dy * dy;
      if (dist <= 2048) {
        const b = ENEMY.box;
        const hit = this.hitCarrot(e.x + b[0], e.y + b[1], e.x + b[2], e.y + b[3]);
        if (!hit) {
          this.newTarget(e);
          return;
        }
        e.digCarrot.obj = hit;
        e.digCarrot.canPull = true;
      } else {
        e.digCarrot.canPull = false;
        e.digCarrot.obj = undefined;
      }
    }
  }

  // ------------------------------------------------------------------ frame

  // One fixed 20 ms frame.
  step() {
    if (this.over) return;
    this.now += this.config.frameMs;

    // entity handlers, oldest first: the player, then the enemies
    this.updatePlayer();
    for (const e of this.enemies.slice()) this.updateEnemy(e);
    if (this.fork && this.frame > this.fork.until) this.fork = null;

    // the scene's own loop runs after all of them
    const c = this.config;
    const currentTime = this.now;
    if (this.gameTimeLeft < currentTime) {
      this.over = true;
      this.events.push({ type: "gameOver", score: this.player.carrotsCount });
      this.frame++;
      return;
    }

    if (currentTime > this.gameTurnTimeLeft) {
      this.gameTurnTimeLeft = currentTime + c.gameTurnPeriod;
      if (this.maxCarrots < c.maxCarrotsToSpawn) this.maxCarrots += c.carrotsPerTurn;
      this.maxEnemies += c.enemiesPerTurn;
      this.maxEnemies = this.maxEnemies > c.maxEnemiesToSpawn ? c.maxEnemiesToSpawn : this.maxEnemies;
    }

    if (currentTime > this.gameTick) {
      this.spawnCarrot();
      if (this.currentEnemies < this.maxEnemies) {
        this.spawnEnemy();
        this.currentEnemies++;
      }
      this.gameTick = currentTime + c.gameTickPeriod;
    }

    this.frame++;
  }

  // The events since the last call (sounds to play, messages, effects to draw), oldest first.
  takeEvents() {
    const e = this.events;
    this.events = [];
    return e;
  }

  get timeLeftMs() { return Math.max(0, this.gameTimeLeft - this.now); }
  get score() { return this.player.carrotsCount; }

  // The state the oracle comparison is made on (see tools/shared/canon.mjs).
  snapshot(sounds = []) {
    const p = this.player;
    const obj = p.digCarrot.obj;
    return {
      f: this.frame,
      score: p.carrotsCount,
      pullID: p.pullID ? p.pullID : 0,
      px: p.x, py: p.y, canPull: p.digCarrot.canPull, digObj: obj ? obj.serial : 0, action1: p.action1,
      maxCarrots: this.maxCarrots, fork: !!this.fork,
      carrots: this.carrots.map((c) => ({ s: c.serial, x: c.x, y: c.y, h: c.health, o: c.occupied, u: c.pulled })),
      enemies: this.enemies.map((e) => ({
        s: e.serial, x: e.x, y: e.y, tx: e.target.x, ty: e.target.y,
        os: e.target.obj ? e.target.obj.serial : 0, pp: e.target.pathpos, pl: e.target.path ? e.target.path.length : 0,
        cp: e.digCarrot.canPull, ds: e.digCarrot.obj ? e.digCarrot.obj.serial : 0,
        pu: e.pushedProps.pushed, pf: e.pushedProps.atFrame ? e.pushedProps.atFrame : 0,
      })),
      sounds,
    };
  }
}
