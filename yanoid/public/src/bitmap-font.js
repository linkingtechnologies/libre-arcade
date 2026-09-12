/*
 * Original bitmap font for the web port.
 * The PNG atlas is newly created for this project and is not derived from
 * Yanoid's historical SDL_Console fonts.
 */
const FIRST_ASCII = 32;
const LAST_ASCII = 126;
const CELL = 8;
const COLS = 16;
const GLYPH_W = 5;
const GLYPH_H = 7;
const ADVANCE = 6;

function normalizeText(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/·/g, '-')
    .toUpperCase();
}

export class BitmapFont {
  constructor(src = './assets/fonts/yanoid-web-5x7.png') {
    this.image = new Image();
    this.image.src = src;
  }

  get ready() {
    return Boolean(this.image.complete && this.image.naturalWidth);
  }

  measure(text, scale = 1) {
    const normalized = normalizeText(text);
    if (!normalized.length) return 0;
    return ((normalized.length - 1) * ADVANCE + GLYPH_W) * scale;
  }

  draw(ctx, text, x, y, scale = 1) {
    if (!this.ready) return false;
    const normalized = normalizeText(text);
    let dx = Math.round(x);
    const dy = Math.round(y);
    for (const raw of normalized) {
      let code = raw.charCodeAt(0);
      if (code < FIRST_ASCII || code > LAST_ASCII) code = '?'.charCodeAt(0);
      const index = code - FIRST_ASCII;
      const sx = (index % COLS) * CELL + 1;
      const sy = Math.floor(index / COLS) * CELL;
      if (raw !== ' ') {
        ctx.drawImage(this.image, sx, sy, GLYPH_W, GLYPH_H,
          dx, dy, GLYPH_W * scale, GLYPH_H * scale);
      }
      dx += ADVANCE * scale;
    }
    return true;
  }

  drawCentered(ctx, text, centerX, y, scale = 1) {
    const width = this.measure(text, scale);
    return this.draw(ctx, text, centerX - width / 2, y, scale);
  }
}
