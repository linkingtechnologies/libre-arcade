import { EMPTY, GRID_H, GRID_W, SHOT_STATE } from '../core/constants.js';

export class Renderer {
  constructor(canvas, assets) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha:false });
    this.assets = assets;
    this.ctx.imageSmoothingEnabled = false;
  }

  frame(asset, index, x, y, flip = 1, partialHeight = null) {
    const { image, cols, cellW, cellH, px, py } = asset;
    const sx = (index % cols) * cellW;
    const sy = Math.floor(index / cols) * cellH;
    const h = partialHeight == null ? cellH : Math.max(0, Math.min(cellH, partialHeight));
    if (h <= 0) return;
    const dx = x - px;
    const dy = y - py;
    if (flip === 1) {
      this.ctx.drawImage(image, sx, sy, cellW, h, dx, dy, cellW, h);
    } else {
      this.ctx.save();
      this.ctx.translate(dx + cellW, 0);
      this.ctx.scale(-1, 1);
      this.ctx.drawImage(image, sx, sy, cellW, h, 0, dy, cellW, h);
      this.ctx.restore();
    }
  }


  renderBackdrop(assetName = 'menu') {
    const image = this.assets[assetName]?.image;
    if (!image) return;
    this.ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, 640, 480);
  }

  renderMenu(titleAnimation) {
    this.renderBackdrop('menu');
    if (!titleAnimation) return;
    titleAnimation.sprites.forEach((sprite, i) => {
      const image = this.assets[`title${i + 1}`].image;
      this.ctx.drawImage(image, sprite.x, sprite.y);
    });
  }

  renderPresentation(assetName, text, hint = '') {
    this.renderBackdrop(assetName);
    const c = this.ctx;
    c.save();
    c.fillStyle = 'rgba(0,0,0,.72)';
    c.fillRect(0, 360, 640, 120);
    c.fillStyle = '#fff';
    c.font = '600 20px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    this.#wrapText(text, 320, 405, 570, 26);
    if (hint) {
      c.font = '13px system-ui, sans-serif';
      c.fillStyle = 'rgba(255,255,255,.8)';
      c.fillText(hint, 320, 463);
    }
    c.restore();
  }

  #wrapText(text, x, centerY, maxWidth, lineHeight) {
    const words = String(text).split(/\s+/);
    const lines = [];
    let line = '';
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (this.ctx.measureText(candidate).width > maxWidth && line) { lines.push(line); line = word; }
      else line = candidate;
    }
    if (line) lines.push(line);
    const start = centerY - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((value, i) => this.ctx.fillText(value, x, start + i * lineHeight));
  }

  render(game, labels) {
    const c = this.ctx;
    c.drawImage(this.assets.background.image, 0, 0, 640, 480);

    for (let row=0; row<GRID_H; row++) {
      for (let col=0; col<GRID_W; col++) {
        const v = game.level.visualTile(row,col);
        if (v !== EMPTY) this.frame(this.assets.level, v, col*32, row*32);
      }
    }

    for (const block of game.blocks) if (block.state !== -1) this.frame(this.assets.items, block.frame, block.x, block.y);
    for (const item of game.items) if (item.state !== -1) this.frame(this.assets.items, item.frame, item.x, item.y);
    for (const ball of game.balls) if (ball.state !== -1) this.frame(this.assets[`ball${ball.size}`], ball.frame, ball.x, ball.y, ball.flip);
    for (const shot of game.shots) if (shot.state !== -1) this.#shot(shot);
    for (const bomb of game.bombs) if (bomb.state !== -1) this.frame(this.assets.bomb, bomb.frame, bomb.x, bomb.y, bomb.flip);
    if (game.player) this.frame(this.assets.player, game.player.frame, game.player.x, game.player.y, game.player.flip);

    if (game.flashTicks > 0) {
      c.save(); c.fillStyle='rgba(255,255,255,.9)'; c.fillRect(0,0,640,448); c.restore();
    }

    this.#hud(game, labels);
    if (game.state === 'paused') this.#center(labels.pause);
    else {
      const message = game.messages?.[0];
      if (message) {
        if (message.code === 'level') this.#center(`${labels.level} ${message.value}`);
        else if (message.code === 'time-out') this.#center(labels.timeOut);
        else if (message.code === 'level-complete') this.#center(labels.levelComplete);
        else if (message.code === 'bonus') this.#center(`${labels.bonus} ${message.value}`);
        else if (message.code === 'life-lost') this.#center(['ouch','uh','aaah'][message.value ?? 0]);
      }
    }
  }

  #shot(shot) {
    let frame = 0 + shot.type*4;
    if (shot.state === SHOT_STATE.STUCK) frame = 8;
    else if (shot.state === SHOT_STATE.ENDING) frame = 2 + shot.type*4;
    else if (shot.state === SHOT_STATE.ENDING_STUCK) frame = 10;
    this.frame(this.assets.shots, frame, shot.x, shot.y);
    let i;
    for (i=shot.y+34; i<shot.startY-34; i+=34) this.frame(this.assets.shots, frame+1, shot.x, i);
    const rest = shot.startY - i;
    if (rest > 0) this.frame(this.assets.shots, frame+1, shot.x, i, 1, rest);
  }

  #hud(game, labels) {
    const c=this.ctx;
    c.save();
    c.fillStyle='rgba(0,0,0,.74)'; c.fillRect(0,448,640,32);
    c.fillStyle='#fff'; c.font='bold 16px system-ui, sans-serif'; c.textBaseline='middle';
    c.fillText(`${labels.level} ${game.levelNumber}`, 14, 464);
    c.fillText(`${labels.lives} ${Math.max(0,game.lives)}`, 160, 464);
    c.fillText(`${labels.points} ${game.points}`, 285, 464);
    c.textAlign='right'; c.fillText(`${labels.time} ${Math.max(0,game.time)}`, 626, 464);
    c.restore();
  }

  #center(text) {
    const c=this.ctx;
    c.save(); c.fillStyle='rgba(0,0,0,.66)'; c.fillRect(0,190,640,70);
    c.fillStyle='#fff'; c.font='bold 28px system-ui, sans-serif'; c.textAlign='center'; c.textBaseline='middle';
    c.fillText(text,320,225); c.restore();
  }
}
