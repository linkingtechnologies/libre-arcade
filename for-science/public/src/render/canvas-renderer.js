import { TILE_NAMES } from '../core/board.js';
import { ASSETS } from '../core/player.js';

const WIDTH = 640;
const HEIGHT = 480;
const BOARD_X = 150;
const BOARD_Y = 2; // sprite top; input cells intentionally start at y=0 upstream
const STEP = 34;
const TILE = 32;
const BOARD_FALL_START_Y = -96;

export class AssetStore {
  constructor(base = './assets/original/') {
    this.base = base;
    this.images = new Map();
  }

  async loadImages() {
    const names = [
      'background.png', 'title.png', 'drx.png', 'drz.png', 'station.png',
      'selected.png', 'explosion.png', 'rocket_launch.png',
      'money.png', 'shield.png', 'cow.png', 'meteorite.png', 'rocket.png', 'laser.png',
      '0shield.png', '0cow.png', '0meteorite.png', '0rocket.png', '0laser.png',
    ];
    await Promise.all(names.map((name) => this.#loadImage(name)));
  }

  async #loadImage(name) {
    const image = new Image();
    image.decoding = 'async';
    const source = `${this.base}${name}`;
    await new Promise((resolve, reject) => {
      image.addEventListener('load', resolve, { once: true });
      image.addEventListener('error', () => reject(new Error(`Unable to load image: ${name}`)), { once: true });
      image.src = source;
    });
    if (typeof image.decode === 'function') {
      try { await image.decode(); } catch { /* already loaded; decoding can be eager */ }
    }
    this.images.set(name, image);
  }

  get(name) {
    return this.images.get(name);
  }
}

export class CanvasRenderer {
  constructor(canvas, assets, t = defaultText) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.assets = assets;
    this.t = t;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    this.messages = [];
  }

  showMessage(text, delayMs = 1000, size = 36, { move = false } = {}) {
    const started = performance.now();
    const transition = move ? 500 : 300;
    this.messages.push({
      text,
      size,
      move,
      started,
      staticUntil: started + delayMs,
      ends: started + delayMs + transition,
    });
  }

  drawTitle() {
    this.ctx.drawImage(this.assets.get('title.png'), 0, 0, WIDTH, HEIGHT);
  }

  drawGame(game) {
    const ctx = this.ctx;
    ctx.drawImage(this.assets.get('background.png'), 0, 0, WIDTH, HEIGHT);
    this.#drawStations(game);
    this.#drawBoard(game);
    this.#drawPlayers(game);
    this.#drawTimeline(game);
    this.#drawSelection(game);
    this.#drawEffects(game);
    this.#drawFloatingBonuses(game);
    this.#drawGameOver(game);
    this.#drawMessages();
  }

  #drawBoard(game) {
    const anim = game.boardAnimation;
    if (anim?.type === 'hidden' || anim?.type === 'intro-wait') return;
    if (anim?.type === 'swap') {
      this.#drawSwapAnimation(game, anim);
      return;
    }
    if (anim?.type === 'match') {
      this.#drawMatchAnimation(anim);
      return;
    }

    const now = performance.now();
    let alpha = 1;
    let fallProgress = null;

    if (anim?.type === 'fade') {
      alpha = 1 - clamp01((now - anim.started) / anim.duration);
    } else if (anim?.type === 'refill') {
      fallProgress = clamp01((now - anim.started) / anim.duration);
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = alpha;
    for (let y = 0; y < game.board.height; y += 1) {
      for (let x = 0; x < game.board.width; x += 1) {
        const tile = game.board.get(x, y);
        if (tile === null || tile === undefined) continue;
        const img = this.assets.get(`${TILE_NAMES[tile]}.png`);
        const targetY = BOARD_Y + y * STEP;
        const drawY = fallProgress === null
          ? targetY
          : BOARD_FALL_START_Y + (targetY - BOARD_FALL_START_Y) * fallProgress;
        ctx.drawImage(img, 1, 1, TILE, TILE, BOARD_X + x * STEP, drawY, TILE, TILE);
      }
    }
    ctx.restore();
  }


  #drawSwapAnimation(game, anim) {
    const ctx = this.ctx;
    const t = clamp01((performance.now() - anim.started) / anim.duration);

    for (let y = 0; y < game.board.height; y += 1) {
      for (let x = 0; x < game.board.width; x += 1) {
        const isA = x === anim.a.x && y === anim.a.y;
        const isB = x === anim.b.x && y === anim.b.y;
        if (isA || isB) continue;
        const tile = game.board.get(x, y);
        if (tile === null || tile === undefined) continue;
        const img = this.assets.get(`${TILE_NAMES[tile]}.png`);
        ctx.drawImage(img, 1, 1, TILE, TILE, BOARD_X + x * STEP, BOARD_Y + y * STEP, TILE, TILE);
      }
    }

    drawMovingTile(ctx, this.assets, anim.tileA, anim.a, anim.b, t);
    drawMovingTile(ctx, this.assets, anim.tileB, anim.b, anim.a, t);
  }

  #drawMatchAnimation(anim) {
    const now = performance.now();
    const totalT = clamp01((now - anim.started) / anim.duration);
    const gravityT = clamp01((now - anim.started) / anim.gravityDuration);
    const ctx = this.ctx;

    for (const item of anim.survivors) {
      const img = this.assets.get(`${TILE_NAMES[item.tile]}.png`);
      const fromY = BOARD_Y + item.fromY * STEP;
      const toY = BOARD_Y + item.toY * STEP;
      const y = fromY + (toY - fromY) * gravityT;
      ctx.drawImage(img, 1, 1, TILE, TILE, BOARD_X + item.x * STEP, y, TILE, TILE);
    }

    for (const item of anim.fills) {
      const img = this.assets.get(`${TILE_NAMES[item.tile]}.png`);
      const targetY = BOARD_Y + item.y * STEP;
      const y = BOARD_FALL_START_Y + (targetY - BOARD_FALL_START_Y) * totalT;
      ctx.drawImage(img, 1, 1, TILE, TILE, BOARD_X + item.x * STEP, y, TILE, TILE);
    }

    for (const item of anim.matched) {
      const img = this.assets.get(`${TILE_NAMES[item.tile]}.png`);
      const fromX = BOARD_X + item.x * STEP;
      const fromY = BOARD_Y + item.y * STEP;
      const x = fromX + (anim.tileDestination.x - fromX) * totalT;
      const y = fromY + (anim.tileDestination.y - fromY) * totalT;
      ctx.drawImage(img, 1, 1, TILE, TILE, x, y, TILE, TILE);
    }
  }

  #drawSelection(game) {
    if (!game.selected?.length || game.boardAnimation?.type === 'hidden') return;
    const img = this.assets.get('selected.png');
    for (const p of game.selected) {
      ctxDrawCropped(this.ctx, img, BOARD_X + p.x * STEP, BOARD_Y + p.y * STEP, TILE, TILE);
    }
  }

  #drawStations(game) {
    const elapsed = Math.max(0, performance.now() - (game.sceneStartedAt || performance.now()));
    const opacity = clamp01((elapsed - 1000) / 2000);
    const ctx = this.ctx;
    const station = this.assets.get('station.png');

    ctx.save();
    ctx.globalAlpha = opacity;
    drawCroppedCentered(ctx, station, 75, 405, 128, 128, false);
    drawCroppedCentered(ctx, station, WIDTH - 75, 405, 128, 128, true);
    ctx.restore();

    // new_shieldlines() is called after the right station's 1s delay + 2s fade.
    if (elapsed >= 3000) {
      drawShieldBar(ctx, 10, 470, game.players[0].shield);
      drawShieldBar(ctx, WIDTH - 138, 470, game.players[1].shield);
    }
  }

  #drawPlayers(game) {
    const ctx = this.ctx;
    ctxDrawCropped(ctx, this.assets.get('drx.png'), 48, 20, 64, 64);
    ctxDrawCropped(ctx, this.assets.get('drz.png'), 528, 20, 64, 64);

    ctx.save();
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '12px "Russo One", sans-serif';
    ctx.fillText(`$${String(game.players[0].score[0]).padStart(4, '0')}`, 80, 120);
    ctx.fillText(`$${String(game.players[1].score[0]).padStart(4, '0')}`, 560, 120);

    // label_turn starts hidden and becomes permanently visible on first turn.
    if (!game.phase.startsWith('intro') && game.phase !== 'gameover') {
      ctx.fillText(this.t('game.move'), game.currentPlayer === 0 ? 80 : 560, 94);
    }

    for (let assetIndex = 0; assetIndex < ASSETS.length; assetIndex += 1) {
      drawAssetHud(ctx, this.assets, game.players[0], assetIndex, 90, 138 + assetIndex * 34, 'left');
      drawAssetHud(ctx, this.assets, game.players[1], assetIndex, 518, 138 + assetIndex * 34, 'right');
    }
    ctx.restore();
  }

  #drawTimeline(game) {
    const elapsed = Math.max(0, performance.now() - (game.sceneStartedAt || performance.now()));
    if (elapsed < 3000 || game.phase === 'gameover' || game.boardAnimation?.type === 'hidden') return;

    const ctx = this.ctx;
    const width = 340;
    // Original line is at bottom-left y=126 => canvas y=354.
    ctx.fillStyle = '#143214';
    ctx.fillRect(150, 351, width, 6);
    ctx.fillStyle = '#008000';
    ctx.fillRect(150, 353, width * Math.max(0, Math.min(1, game.turnRemaining)), 2);
  }

  #drawEffects(game) {
    const now = performance.now();
    const ctx = this.ctx;

    if (game.effect) {
      const e = game.effect;
      const moveT = clamp01((now - e.started) / e.duration);
      const fadeT = now <= e.started + e.duration
        ? 0
        : clamp01((now - e.started - e.duration) / e.fadeDuration);
      const alpha = 1 - fadeT;

      if (e.assetIndex === 4) {
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(e.from.x, e.from.y);
        ctx.lineTo(e.to.x, e.to.y);
        ctx.stroke();
        ctx.restore();
      } else {
        const names = { 1: 'cow.png', 2: 'meteorite.png', 3: 'rocket_launch.png' };
        const img = this.assets.get(names[e.assetIndex]);
        const x = e.from.x + (e.to.x - e.from.x) * moveT;
        const y = e.from.y + (e.to.y - e.from.y) * moveT;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(x, y);
        if (e.rotateTurns) ctx.rotate(moveT * Math.PI * 2 * e.rotateTurns);
        if (e.flipX) ctx.scale(-1, 1);
        ctx.drawImage(img, 1, 1, 32, 32, -16, -16, 32, 32);
        ctx.restore();
      }
    }

    if (game.explosion) {
      const e = game.explosion;
      const { opacity, scale } = explosionVisualState(now - e.started, e.duration);
      const img = this.assets.get('explosion.png');
      ctx.save();
      ctx.globalAlpha = Math.max(0, opacity);
      ctx.translate(e.at.x, e.at.y);
      ctx.scale(-scale, scale); // explosion image is loaded flip_x=True upstream
      ctx.drawImage(img, 1, 1, 32, 32, -16, -16, 32, 32);
      ctx.restore();
    }
  }

  #drawFloatingBonuses(game) {
    if (!game.floatingBonuses?.length) return;
    const now = performance.now();
    const ctx = this.ctx;
    for (const item of game.floatingBonuses) {
      const age = now - item.started;
      if (age < 0 || age > item.duration) continue;
      const t = clamp01(age / item.duration);
      const fade = age <= item.fadeStart
        ? 1
        : 1 - clamp01((age - item.fadeStart) / (item.duration - item.fadeStart));
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#ffcc00';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '14px "Russo One", sans-serif';
      ctx.fillText(item.text, item.x, item.y - 100 * t);
      ctx.restore();
    }
  }

  #drawGameOver(game) {
    if (game.phase !== 'gameover' || !game.gameOverText) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = '#ffcc00';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '38px "Russo One", sans-serif';
    ctx.fillText(game.gameOverText, WIDTH / 2, HEIGHT / 2);
    ctx.restore();
  }

  #drawMessages() {
    const now = performance.now();
    this.messages = this.messages.filter((message) => now <= message.ends);
    if (!this.messages.length) return;

    const ctx = this.ctx;
    for (const message of this.messages) {
      let y = 400; // upstream position=(320,80) in bottom-left coordinates
      let alpha = 1;
      if (now > message.staticUntil) {
        const duration = message.ends - message.staticUntil;
        const t = clamp01((now - message.staticUntil) / duration);
        if (message.move) y = 400 + 100 * t; // MoveTo y=-20 => canvas y=500
        else alpha = 1 - t;
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#ffcc00';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `${message.size}px "Russo One", sans-serif`;
      ctx.fillText(message.text, WIDTH / 2, y);
      ctx.restore();
    }
  }

  canvasToVirtual(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) * WIDTH / rect.width,
      y: (clientY - rect.top) * HEIGHT / rect.height,
    };
  }

  virtualToBoard(x, y) {
    return virtualToBoardPoint(x, y);
  }

  virtualToHumanAsset(x, y) {
    return virtualToHumanAssetIndex(x, y);
  }
}

function defaultText(key) {
  return key === 'game.move' ? 'MOVE!' : key;
}

function ctxDrawCropped(ctx, img, x, y, width, height) {
  ctx.drawImage(img, 1, 1, width, height, x, y, width, height);
}

function drawCroppedCentered(ctx, img, cx, cy, width, height, flipX) {
  ctx.save();
  ctx.translate(cx, cy);
  if (flipX) ctx.scale(-1, 1);
  ctx.drawImage(img, 1, 1, width, height, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function drawShieldBar(ctx, x, y, actual) {
  const visible = Math.max(0, Math.min(100, actual));
  ctx.fillStyle = '#1e1e1e';
  ctx.fillRect(x, y - 3, 128, 6);
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(x, y - 1, 128 * visible / 100, 2);
}

function drawAssetHud(ctx, assets, player, assetIndex, x, y, side) {
  const scoreIndex = assetIndex + 1;
  const usable = player.canUse(assetIndex);
  const filename = `${usable ? '' : '0'}${ASSETS[assetIndex].id}.png`;
  const img = assets.get(filename);
  ctxDrawCropped(ctx, img, x, y, 32, 32);

  ctx.textAlign = side === 'left' ? 'right' : 'left';
  ctx.fillStyle = usable ? '#ffcc00' : '#808080';
  ctx.font = '8px "Droid Sans Mono", monospace';
  const tx = side === 'left' ? x - 4 : x + 36;
  ctx.fillText(String(player.score[scoreIndex]).padStart(2, '0'), tx, y + 8);
  ctx.font = '8px "Russo One", sans-serif';
  ctx.fillText(`$${String(ASSETS[assetIndex].cost).padStart(2, '0')}`, tx, y + 22);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export function virtualToBoardPoint(x, y) {
  // Literal screen_to_board() semantics. Cocos receives bottom-left virtual
  // coordinates and truncates both axes with int() before // division. The
  // top-left browser y therefore cannot be simplified to floor(y / 34) at
  // fractional row boundaries without changing one-pixel edge behavior.
  const cocosX = Math.trunc(x);
  const cocosY = Math.trunc(HEIGHT - y);
  const bx = Math.floor((cocosX - BOARD_X) / STEP);
  const by = Math.floor(-(cocosY - 446 - TILE - 2) / STEP) || 0;
  if (bx >= 0 && bx < 10 && by >= 0 && by < 10) return { x: bx, y: by };
  return null;
}

export function virtualToHumanAssetIndex(x, y) {
  // Literal screen_to_asset(): get virtual bottom-left coordinates, int()
  // truncate, then apply the original floor-division formula.
  const cocosX = Math.trunc(x);
  const cocosY = Math.trunc(HEIGHT - y);
  const ax = Math.floor((cocosX - 90) / TILE);
  const ay = Math.floor(-(cocosY - 310 - 34) / 34) || 0;
  if (ax === 0 && ay >= 0 && ay < ASSETS.length) return ay;
  return null;
}

function drawMovingTile(ctx, assets, tile, from, to, t) {
  const img = assets.get(`${TILE_NAMES[tile]}.png`);
  const x0 = BOARD_X + from.x * STEP;
  const y0 = BOARD_Y + from.y * STEP;
  const x1 = BOARD_X + to.x * STEP;
  const y1 = BOARD_Y + to.y * STEP;
  const x = x0 + (x1 - x0) * t;
  const y = y0 + (y1 - y0) * t;
  ctx.drawImage(img, 1, 1, TILE, TILE, x, y, TILE, TILE);
}


export function explosionVisualState(ageMs, durationMs = 2000) {
  const age = Math.max(0, ageMs);
  const t = clamp01(age / durationMs);
  // Source: (Delay(1)+FadeOut(2)) | (ScaleBy(1.2,2)+CallFunc(kill)).
  // Because the scale branch kills at t=2s, the nominal FadeOut has only
  // reached 50% when the sprite disappears.
  const opacity = age <= 1000 ? 1 : Math.max(0.5, 1 - (age - 1000) / 2000);
  return { opacity, scale: 1 + 0.2 * t };
}
