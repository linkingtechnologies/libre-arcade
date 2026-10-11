import { TITLE_SCREEN } from './title-flow.js';

const W = 256;
const H = 240;
const MENU_X = 64;
const ARROW_X = 52;
const MENU_Y = 128;
const ROW_H = 8;

function makeImage(url) {
  const image = new Image();
  image.src = url;
  return image;
}

export class TitleRenderer {
  constructor(canvas, {
    backgroundUrl = './assets/derived/title/title-screen-historical.png',
    atlasUrl = './assets/original/titlegfx.png',
  } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = W;
    canvas.height = H;
    this.background = makeImage(backgroundUrl);
    this.atlas = makeImage(atlasUrl);
  }

  itemAt(clientX, clientY, itemCount) {
    const r = this.canvas.getBoundingClientRect();
    const x = (clientX - r.left) * W / r.width;
    const y = (clientY - r.top) * H / r.height;
    if (x < 44 || x > 220 || y < MENU_Y - 4 || y >= MENU_Y + itemCount * ROW_H + 4) return -1;
    const row = Math.floor((y - MENU_Y + 4) / ROW_H);
    return row >= 0 && row < itemCount ? row : -1;
  }

  #glyph(ch, x, y) {
    if (!this.atlas.complete) return;
    const code = ch.charCodeAt(0) & 0xff;
    const sx = (code & 0x0f) * 8;
    const sy = (code >>> 4) * 8;
    this.ctx.drawImage(this.atlas, sx, sy, 8, 8, x, y, 8, 8);
  }

  #text(text, x, y) {
    for (let i = 0; i < text.length; i += 1) this.#glyph(text[i], x + i * 8, y);
  }

  render(flow, labels) {
    const c = this.ctx;
    c.save();
    c.imageSmoothingEnabled = false;
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    if (this.background.complete) c.drawImage(this.background, 0, 0);

    // Libre Arcade player-facing rule: provenance/details are kept on the
    // Credits page instead of the home screen. Preserve the original title
    // art and menu geometry, but cover the historical bottom notice block.
    c.fillStyle = '#fff';
    c.fillRect(0, 176, W, 48);   // the white of the screen ends at y = 224; below it is the black band of the original

    const items = flow.screen === TITLE_SCREEN.MAIN ? labels.main : labels.difficulty;
    for (let i = 0; i < items.length; i += 1) this.#text(items[i], MENU_X, MENU_Y + i * ROW_H);
    this.#text('>', ARROW_X, MENU_Y + flow.selected * ROW_H);

    if (flow.screen === TITLE_SCREEN.DIFFICULTY) {
      this.#text(labels.backHint, 64, 184);
    }
    c.restore();
  }
}
