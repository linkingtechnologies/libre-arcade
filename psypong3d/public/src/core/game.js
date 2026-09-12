// SPDX-License-Identifier: GPL-3.0-or-later
import { DEFAULT_OPTIONS, ORIGINAL } from './config.js';
import { Rng } from './rng.js';

export const MODES = Object.freeze({ MENU: 'menu', SINGLE: 'single', DUAL: 'dual', DEMO: 'demo', PAUSE: 'pause', WON: 'won' });

function makePlayer(index) {
  const side = index === 0 ? -1 : 1;
  return {
    id: index,
    x: side * (ORIGINAL.floorWidth / 2 + ORIGINAL.playerSize / 2),
    z: -ORIGINAL.playerSize * 2,
    resetX: side * (ORIGINAL.floorWidth / 2 + ORIGINAL.playerSize / 2),
    resetZ: -ORIGINAL.playerSize * 2,
    score: 0,
    radius: ORIGINAL.playerRadius,
    width: ORIGINAL.playerWidth
  };
}

export class PsyPongGame {
  constructor(options = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.rng = new Rng(this.options.seed);
    this.mode = MODES.MENU;
    this.previousMode = MODES.MENU;
    this.players = [makePlayer(0), makePlayer(1)];
    this.ball = {
      x: 0, y: 0, z: 0,
      radius: ORIGINAL.ballRadius,
      right: this.rng.int(2) === 1,
      front: this.rng.int(2) === 1
    };
    this.camera = { x: 0, y: 0, z: ORIGINAL.cameraDistance, rx: 45, ry: 0, rz: 0 };
    this.level = this.options.levelStart;
    this.elapsedMs = 0;
    this.cameraAccumMs = 0;
    this.lastLevelSecond = -1;
    this.winner = null;
    this.input = { p1Up: false, p1Down: false, p2Up: false, p2Down: false };
  }

  setOptions(options = {}) {
    this.options = { ...this.options, ...options };
  }

  resetObjects({ scores = true } = {}) {
    for (const p of this.players) {
      p.x = p.resetX;
      p.z = p.resetZ;
      if (scores) p.score = 0;
    }
    this.ball.x = 0;
    this.ball.y = 0;
    this.ball.z = 0;
    this.resetCamera();
  }

  resetCamera() {
    this.camera.x = 0;
    this.camera.y = 0;
    this.camera.z = ORIGINAL.cameraDistance;
    this.camera.rx = 45;
    this.camera.ry = 0;
    this.camera.rz = 0;
  }

  start(mode) {
    if (![MODES.SINGLE, MODES.DUAL, MODES.DEMO].includes(mode)) throw new Error(`Unsupported mode: ${mode}`);
    // The web port exposes an explicit seed for reproducible matches.
    this.rng = new Rng(Number(this.options.seed) >>> 0);
    this.ball.right = this.rng.int(2) === 1;
    this.ball.front = this.rng.int(2) === 1;
    this.mode = mode;
    this.previousMode = mode;
    this.level = Math.max(1, Math.min(256, Number(this.options.levelStart) || 1));
    this.elapsedMs = 0;
    this.cameraAccumMs = 0;
    this.lastLevelSecond = -1;
    this.winner = null;
    this.resetObjects({ scores: true });
  }

  toMenu() {
    this.mode = MODES.MENU;
    this.previousMode = MODES.MENU;
    this.winner = null;
    this.resetObjects({ scores: true });
  }

  togglePause() {
    if ([MODES.MENU, MODES.DEMO, MODES.WON].includes(this.mode)) return;
    if (this.mode === MODES.PAUSE) {
      this.mode = this.previousMode;
    } else {
      this.previousMode = this.mode;
      this.mode = MODES.PAUSE;
    }
  }

  setInput(name, value) {
    if (name in this.input) this.input[name] = Boolean(value);
  }

  get playerSpeed() { return this.level * 0.02; }
  get ballSpeed() { return this.playerSpeed * 0.8; }
  get cameraSpeed() { return (this.level * 0.02) % 360; }

  step(dtMs = ORIGINAL.simulationStepMs) {
    if (![MODES.SINGLE, MODES.DUAL, MODES.DEMO].includes(this.mode)) return;

    this.elapsedMs += dtMs;
    this.#updateLevel();
    this.#moveHumans();
    this.#warpPlayers();
    this.#maybeSwapPlayers();
    this.#moveBall();
    this.#collideBall();
    this.#scoreIfNeeded();
    this.#moveCpu();
    this.#updateCamera(dtMs);
    this.#checkWinner();
  }

  #updateLevel() {
    if (!this.options.levelIncrease) return;
    const second = Math.floor(this.elapsedMs / 1000);
    if (second !== this.lastLevelSecond) {
      this.lastLevelSecond = second;
      // Mirrors the original `(elapsed % 2) == 1` test: first bump at ~1 s, then 3, 5, ...
      if (second > 0 && second % ORIGINAL.levelIncreaseSeconds === ORIGINAL.levelIncreaseSeconds - 1) {
        this.level = Math.min(256, this.level + 1);
      }
    }
  }

  #moveHumans() {
    const speed = this.playerSpeed;
    const p1 = this.players[0];
    const p2 = this.players[1];
    if (this.mode === MODES.SINGLE || this.mode === MODES.DUAL) {
      if (this.input.p1Up && this.#canMove(p1, -1)) p1.z -= speed;
      if (this.input.p1Down && this.#canMove(p1, 1)) p1.z += speed;
    }
    if (this.mode === MODES.DUAL) {
      if (this.input.p2Up && this.#canMove(p2, -1)) p2.z -= speed;
      if (this.input.p2Down && this.#canMove(p2, 1)) p2.z += speed;
    }
  }

  #canMove(player, direction) {
    if (this.options.warp) return true;
    const floorMin = -ORIGINAL.floorDepth / 2;
    const floorMax = ORIGINAL.floorDepth / 2;
    const center = player.z + player.width / 2;
    if (direction < 0) return center > floorMin - player.width;
    return center < floorMax + player.width;
  }

  #warpPlayers() {
    if (!this.options.warp) return;
    const floorMin = -ORIGINAL.floorDepth / 2;
    const floorMax = ORIGINAL.floorDepth / 2;
    for (const p of this.players) {
      const gap = p.width / 2;
      const center = p.z + gap;
      if (center < floorMin - p.width) p.z = floorMax + p.width - gap;
      if (center > floorMax + p.width) p.z = floorMin - p.width - gap;
    }
  }

  #maybeSwapPlayers() {
    if (!this.options.swap || this.ball.x !== 0 || !(this.players[0].score || this.players[1].score)) return;
    const levelPass = this.level > this.rng.int(this.level + 1);
    const coin = this.rng.int(2) === 1;
    if (levelPass && coin) {
      const x = this.players[0].x;
      this.players[0].x = this.players[1].x;
      this.players[1].x = x;
    }
  }

  #moveBall() {
    const speed = this.ballSpeed;
    this.ball.x += speed * (this.ball.right ? 1 : -1);
    this.ball.z += speed * (this.ball.front ? 1 : -1);
  }

  #collideBall() {
    const floorMin = -ORIGINAL.floorDepth / 2;
    const floorMax = ORIGINAL.floorDepth / 2;
    if (this.ball.z < floorMin + this.ball.radius) this.ball.front = true;
    if (this.ball.z > floorMax - this.ball.radius) this.ball.front = false;

    const signedRadius = this.ball.radius * (this.ball.right ? 1 : -1);
    for (const p of this.players) {
      const center = p.z + p.width / 2;
      if (Math.abs(this.ball.z - center) <= p.width / 2 + p.radius &&
          Math.abs(this.ball.x + signedRadius - p.x) <= p.radius) {
        this.ball.right = !this.ball.right;
      }
    }
  }

  #scoreIfNeeded() {
    const floorMinX = -ORIGINAL.floorWidth / 2;
    const floorMaxX = ORIGINAL.floorWidth / 2;
    const outside = 8 * this.ball.radius;
    if (this.ball.x >= floorMinX - outside && this.ball.x <= floorMaxX + outside) return false;

    let farthest = 0;
    let distance = 0;
    for (let i = 0; i < this.players.length; i++) {
      const d = Math.abs(this.ball.x - this.players[i].x);
      if (distance < d) { farthest = i; distance = d; }
    }
    this.players[farthest].score += 1;
    this.ball.x = 0;
    this.ball.y = 0;
    this.ball.z = 0;
    if (this.options.cameraReset) this.resetCamera();
    return true;
  }

  #cpuMove(player) {
    player.z += this.playerSpeed * (this.ball.z > (player.z + player.width / 2) ? 1 : -1);
  }

  #cpuPasses() {
    return this.level > this.rng.int(this.level + 1);
  }

  #moveCpu() {
    if (this.mode === MODES.DEMO && this.#cpuPasses()) this.#cpuMove(this.players[0]);
    if (this.mode !== MODES.DUAL && this.#cpuPasses()) this.#cpuMove(this.players[1]);
  }

  #updateCamera(dtMs) {
    if (!this.options.cameraRotate) return;
    this.cameraAccumMs += dtMs;
    while (this.cameraAccumMs >= ORIGINAL.cameraStepMs) {
      this.cameraAccumMs -= ORIGINAL.cameraStepMs;
      const angle = this.cameraSpeed;
      const axes = [-1, 0, 1];
      this.camera.rx += this.rng.float() * angle * this.rng.pick(axes);
      this.camera.ry += this.rng.float() * angle * this.rng.pick(axes);
      this.camera.rz += this.rng.float() * angle * this.rng.pick(axes);
    }
  }

  #checkWinner() {
    const limit = Math.max(1, Math.min(32, Number(this.options.scoreLimit) || ORIGINAL.scoreLimit));
    const winner = this.players.findIndex((p) => p.score === limit);
    if (winner >= 0) {
      this.winner = winner;
      this.previousMode = this.mode;
      this.mode = MODES.WON;
    }
  }

  snapshot() {
    return {
      mode: this.mode,
      previousMode: this.previousMode,
      level: this.level,
      elapsedMs: this.elapsedMs,
      winner: this.winner,
      players: this.players.map((p) => ({ ...p })),
      ball: { ...this.ball },
      camera: { ...this.camera },
      options: { ...this.options }
    };
  }
}
