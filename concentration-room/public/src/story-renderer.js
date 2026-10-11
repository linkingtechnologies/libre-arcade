import { OpeningScroller, OpponentTypewriter, STORY_PRESENTATION } from './story-presentation.js';
import { NES_CLUT } from './nes-visual.js';

const NES_WIDTH = 256;
const NES_HEIGHT = 240;

function makeImage(url) {
  const image = new Image();
  image.src = url;
  return image;
}

export class StoryRenderer {
  constructor(canvas, {
    titleAtlasUrl = './assets/original/titlegfx.png',
    storyAssetBase = './assets/derived/story',
  } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = NES_WIDTH;
    canvas.height = NES_HEIGHT;
    this.ctx.imageSmoothingEnabled = false;

    this.titleAtlas = makeImage(titleAtlasUrl);
    this.storyAssetBase = storyAssetBase;
    this.opponents = Array.from({ length: 5 }, (_, i) => makeImage(`${storyAssetBase}/opponent-${i}.png`));
    this.hombon = makeImage(`${storyAssetBase}/hombon-sprites.png`);
    this.fontAtlas = document.createElement('canvas');
    this.fontAtlas.width = 128;
    this.fontAtlas.height = 128;
    this.fontAtlasDark = document.createElement('canvas');   // the same glyphs in the black ($0F) that the opening text is in
    this.fontAtlasDark.width = 128;
    this.fontAtlasDark.height = 128;
    this.tinted = new Map();
    this.fontReady = false;
    this.titleAtlas.onload = () => this.#prepareFont();

    this.kind = null;
    this.opening = null;
    this.typer = null;
    this.scene = null;
  }

  #prepareFont() {
    const c = this.fontAtlas.getContext('2d', { willReadFrequently: true });
    c.imageSmoothingEnabled = false;
    c.clearRect(0, 0, 128, 128);
    c.drawImage(this.titleAtlas, 0, 0);
    const d = c.getImageData(0, 0, 128, 128);
    for (let i = 0; i < d.data.length; i += 4) {
      // ASCII glyphs in the original title CHR use color index 3, stored as
      // RGB 0 in the source PNG. Everything else is transparent here.
      const isInk = d.data[i] < 16 && d.data[i+1] < 16 && d.data[i+2] < 16;
      d.data[i] = 255;
      d.data[i+1] = 255;
      d.data[i+2] = 255;
      d.data[i+3] = isInk ? 255 : 0;
    }
    c.putImageData(d, 0, 0);
    const dark = this.fontAtlasDark.getContext('2d', { willReadFrequently: true });
    const black = parseInt(NES_CLUT[0x0f].slice(1), 16);
    for (let i = 0; i < d.data.length; i += 4) { d.data[i] = black >> 16; d.data[i + 1] = (black >> 8) & 255; d.data[i + 2] = black & 255; }
    dark.putImageData(d, 0, 0);
    this.fontReady = true;
  }

  showOpening(lines) {
    this.kind = 'opening';
    this.opening = new OpeningScroller(lines);
    this.typer = null;
    this.scene = null;
  }

  showOpponent(scene) {
    this.kind = 'opponent';
    this.scene = scene;
    this.typer = new OpponentTypewriter(scene?.rawText ?? '');
    this.opening = null;
  }

  tick(input = {}) {
    if (this.kind === 'opening') this.opening?.tick(input);
    else if (this.kind === 'opponent') this.typer?.tick(1);
  }

  advance() {
    if (this.kind === 'opening') {
      this.opening?.startFade();
      return false;
    }
    return this.kind === 'opponent'; // A exits opponent scene immediately in 0.02
  }

  get finished() {
    return this.kind === 'opening' && Boolean(this.opening?.finished);
  }

  clear() {
    this.kind = null;
    this.opening = null;
    this.typer = null;
    this.scene = null;
  }

  #drawGlyph(ch, x, y, dark = false) {
    if (!this.fontReady) return;
    const code = ch.charCodeAt(0);
    if (code < 0x20 || code > 0x7f) return;
    const sx = (code & 0x0f) * 8;
    const sy = (code >>> 4) * 8;
    this.ctx.drawImage(dark ? this.fontAtlasDark : this.fontAtlas, sx, sy, 8, 8, x, y, 8, 8);
  }

  #drawPixelText(text, x, y, lineHeight = 8, dark = false) {
    let cx = x;
    let cy = y;
    for (const ch of text) {
      if (ch === '\n') {
        cx = x;
        cy += lineHeight;
      } else {
        this.#drawGlyph(ch, cx, cy, dark);
        cx += 8;
      }
    }
  }

  #renderOpening() {
    const c = this.ctx;
    const s = this.opening;
    // The picture is made of colours that the original steps down together when it fades out: the background $27, $17, $07, $0F,
    // and the Hombon logo $20, $10, $00, $0F (the text is $0F throughout). After the third step the screen goes off.
    const step = s.fadeStep;
    const colours = [[0x27, 0x20], [0x17, 0x10], [0x07, 0x00], [0x0f, 0x0f], [0x0f, 0x0f]][step];
    c.fillStyle = NES_CLUT[colours[0]];
    c.fillRect(0, 0, NES_WIDTH, NES_HEIGHT);
    if (step === 4) return;
    const logo = this.#tintedLogo(colours[1]);
    if (logo) c.drawImage(logo, 0, 0);

    // scrollOpeningText: one pixel per six frames, a row of text every 16 pixels, the first row coming in at y = 232
    const startY = STORY_PRESENTATION.openingFirstRowY - s.scrollPx;
    for (let i = 0; i < s.lines.length; i += 1) {
      const y = startY + i * STORY_PRESENTATION.openingRowHeight;
      if (y <= -8 || y >= NES_HEIGHT) continue;
      this.#drawPixelText(s.lines[i], 16, y, 8, true);
    }
  }

  // the logo picture with its colour changed (it is drawn in one colour, white in the picture)
  #tintedLogo(colour) {
    if (!this.hombon.complete) return null;
    if (colour === 0x20) return this.hombon;
    if (!this.tinted.has(colour)) {
      const canvas = document.createElement('canvas');
      canvas.width = NES_WIDTH; canvas.height = NES_HEIGHT;
      const x = canvas.getContext('2d', { willReadFrequently: true });
      x.drawImage(this.hombon, 0, 0);
      const d = x.getImageData(0, 0, NES_WIDTH, NES_HEIGHT), rgb = parseInt(NES_CLUT[colour].slice(1), 16);
      for (let i = 0; i < d.data.length; i += 4) if (d.data[i + 3]) { d.data[i] = rgb >> 16; d.data[i + 1] = (rgb >> 8) & 255; d.data[i + 2] = rgb & 255; }
      x.putImageData(d, 0, 0);
      this.tinted.set(colour, canvas);
    }
    return this.tinted.get(colour);
  }

  #renderOpponent() {
    const c = this.ctx;
    const image = this.opponents[this.scene?.portraitIndex ?? 0];
    c.fillStyle = '#000';
    c.fillRect(0, 0, NES_WIDTH, NES_HEIGHT);
    if (image?.complete) c.drawImage(image, 0, 0);
    this.#drawPixelText(
      this.typer?.text ?? '',
      STORY_PRESENTATION.opponentTextX,
      STORY_PRESENTATION.opponentTextY,
      STORY_PRESENTATION.opponentLineHeight,
    );
  }

  render() {
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    if (this.kind === 'opening') this.#renderOpening();
    else if (this.kind === 'opponent') this.#renderOpponent();
    else {
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, NES_WIDTH, NES_HEIGHT);
    }
    this.ctx.restore();
  }
}
