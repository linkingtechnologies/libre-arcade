import { FIELD_HEIGHT, FIELD_WIDTH, cardIdentity } from './layouts.js';

// Exact RGB lookup table bundled with the original 0.02 tools/8name.py.
export const NES_CLUT = Object.freeze([
  '#808080','#0000bb','#3700bf','#8400a6','#bb006a','#b7001e','#b30000','#912600',
  '#7b2b00','#003e00','#00480d','#003c22','#002f66','#000000','#050505','#050505',
  '#c8c8c8','#0059ff','#443cff','#b733cc','#ff33aa','#ff375e','#ff371a','#d54b00',
  '#c46200','#3c7b00','#1e8415','#009566','#0084c4','#111111','#090909','#090909',
  '#ffffff','#0095ff','#6f84ff','#d56fff','#ff77cc','#ff6f99','#ff7b59','#ff915f',
  '#ffa233','#a6bf00','#51d96a','#4dd5ae','#00d9ff','#666666','#0d0d0d','#0d0d0d',
  '#ffffff','#84bfff','#bbbbff','#d0bbff','#ffbfea','#ffbfcc','#ffc4b7','#ffccae',
  '#ffd9a2','#cce199','#aeeeb7','#aaf7ee','#b3eeff','#dddddd','#111111','#111111',
]);

export const GAME_PALETTE = Object.freeze([
  0x0f,0x10,0x18,0x0f,
  0x30,0x10,0x00,0x0f,
  0x30,0x22,0x02,0x0f,
  0x30,0x26,0x16,0x0f,
]);

// Two color entries per card identity, copied from 0.02 drawcards.s.
export const CARD_PALETTES = Object.freeze([
  0x16,0x1a,0x16,0x09,0x28,0x18,0x36,0x17,
  0x29,0x19,0x10,0x18,0x10,0x18,0x10,0x16,0x10,0x18,0x22,0x02,0x27,0x16,0x10,0x1a,
  0x29,0x19,0x36,0x16,0x32,0x12,0x34,0x24,0x27,0x18,0x27,0x28,0x28,0x17,0x10,0x00,
  0x28,0x11,0x10,0x11,0x26,0x16,0x10,0x00,0x27,0x17,0x27,0x1a,0x16,0x02,0x16,0x02,
  0x24,0x04,0x27,0x07,0x11,0x01,0x1a,0x0a,0x10,0x00,0x29,0x19,0x2a,0x16,0x16,0x06,
]);

export const NES_GEOMETRY = Object.freeze({
  width: 256,
  height: 240,
  // The game scrolls the background up by 12 pixels (memorygame.s writes PPUSCROLL = 0, 12 every frame); sprites are not scrolled.
  // Everything drawn from the nametable below (the playfield, the cards, the score boxes, the wipe) is in nametable coordinates.
  scrollY: 12,
  playfieldX: 16,
  playfieldY: 24,
  playfieldWidth: 224,
  playfieldHeight: 200,
  cardPitch: 24,
  cardTiles: 4,
  tileSize: 8,
  scoreY: 224,
  scoreWidth: 112,
  scoreHeight: 16,
  scoreX: Object.freeze([16, 128]),
  scoreSpriteX: Object.freeze([32, 144]),
});

export function indexToGrid(index) {
  return { col: Math.floor(index / FIELD_HEIGHT), row: index % FIELD_HEIGHT };
}

export function cardTopLeft(index) {
  const { col, row } = indexToGrid(index);
  return {
    x: NES_GEOMETRY.playfieldX + col * NES_GEOMETRY.cardPitch,
    y: NES_GEOMETRY.playfieldY + row * NES_GEOMETRY.cardPitch,
  };
}

export function symbolSpritePosition(index) {
  const { col, row } = indexToGrid(index);
  return { x: 24 + col * 24, y: 19 + row * 24 };
}

export function symbolTile(identity) {
  const low = identity & 0x07;
  const high = identity & 0x38;
  return ((((high << 1) | low) << 1) & 0xff);
}

function present(v) { return (v & 0x80) !== 0; }

/** Exact JS transcription of 0.02 drawcards.s buildCardTiles. */
export function buildCardTiles(board, index) {
  if (!board || board.length !== FIELD_WIDTH * FIELD_HEIGHT) throw new Error('72-slot board required');
  const { col, row } = indexToGrid(index);
  let surrounds = 0;
  const neighbors = [
    [-1,-1,0x80],[0,-1,0x40],[1,-1,0x20],
    [-1, 0,0x10],            [1, 0,0x08],
    [-1, 1,0x04],[0, 1,0x02],[1, 1,0x01],
  ];
  for (const [dc, dr, bit] of neighbors) {
    const c = col + dc, r = row + dr;
    if (c >= 0 && c < FIELD_WIDTH && r >= 0 && r < FIELD_HEIGHT && present(board[c * FIELD_HEIGHT + r])) surrounds |= bit;
  }
  // card_get_surrounds starts each of the four corners of the table with the bit of the neighbour that would lie outside it on the
  // diagonal, which is what rounds the corners of the playfield (tiles $21, $22, $24, $28)
  if (index === 0) surrounds |= 0x80; else if (index === 7) surrounds |= 0x04; else if (index === 64) surrounds |= 0x20; else if (index === 71) surrounds |= 0x01;

  const out = new Uint8Array(16); out.fill(0x20);
  const shift = () => { const carry = (surrounds & 0x80) !== 0; surrounds = (surrounds << 1) & 0xff; return carry; };

  if (shift()) out[0] |= 0x01;
  if (shift()) {
    out[1] = 0x21; out[0] |= 0x02; out[3] |= 0x01;
    if (row > 0 && (board[index - 1] & 0x40)) out[1] = 0x22;
  }
  if (shift()) out[3] |= 0x02;
  if (shift()) {
    out[4] = 0x21; out[0] |= 0x04; out[12] |= 0x01;
    if (col > 0 && (board[index - FIELD_HEIGHT] & 0x40)) out[4] = 0x22;
  }
  if (shift()) {
    out[7] = 0x23; out[3] |= 0x08; out[15] |= 0x02;
    if (col + 1 < FIELD_WIDTH && (board[index + FIELD_HEIGHT] & 0x40)) out[7] = 0x26;
  }
  if (shift()) out[12] |= 0x04;
  if (shift()) {
    out[13] = 0x23; out[12] |= 0x08; out[15] |= 0x04;
    if (row + 1 < FIELD_HEIGHT && (board[index + 1] & 0x40)) out[13] = 0x26;
  }
  if (shift()) out[15] |= 0x08;

  if (present(board[index])) {
    out[0] |= 0x08; out[3] |= 0x04; out[12] |= 0x02; out[15] |= 0x01;
    const open = (board[index] & 0x40) !== 0;
    if (open) {
      out[1] += 6; out[4] += 6; out[7] += 2; out[13] += 2;
      out[5] = out[6] = out[9] = out[10] = 0x00;
    } else {
      out[1] += 3; out[4] += 3; out[7] += 1; out[13] += 1;
      // CARD_BACK_TILE, then ^$01, ^$11 and ^$01 again: $04 $05 on the first row and $14 $15 on the second
      out[5] = 0x04; out[6] = 0x05; out[9] = 0x14; out[10] = 0x15;
    }
  }

  // ADC follows CMP with carry set, hence +15/+23 rather than +14/+22.
  if (out[1] >= 0x21) { out[1] = (out[1] + 15) & 0xff; out[2] = out[1]; }
  if (out[4] >= 0x21) { out[4] = (out[4] + 23) & 0xff; out[8] = out[4]; }
  if (out[7] >= 0x21) { out[7] = (out[7] + 23) & 0xff; out[11] = out[7]; }
  if (out[13] >= 0x21) { out[13] = (out[13] + 15) & 0xff; out[14] = out[13]; }
  return out;
}

export function cardSpritePalette(identity) {
  const base = (cardIdentity(identity) - 0x1c) * 2;
  if (base < 0 || base + 1 >= CARD_PALETTES.length) return [0x30, 0x10, 0x00, 0x0f];
  return [0x30, CARD_PALETTES[base], CARD_PALETTES[base + 1], 0x0f];
}

export function backgroundPalette(index = 0, bgcolor = 0x18) {
  const p = GAME_PALETTE.slice(index * 4, index * 4 + 4);
  // blitCardSprites writes $30 to $3F10; on NES this mirrors $3F00,
  // so the universal background color becomes white after setup.
  p[0] = 0x30;
  if (index === 0) p[2] = bgcolor & 0x3f;
  return p;
}

// Sprite palette 2 (the arrow, the flipping card and the controller message): colours 1 to 3 are $30, $16 and $0F; entry 0 is transparent.
export const CURSOR_PALETTE = Object.freeze([0x0f,0x30,0x16,0x0f]);

export function scoreBoxTiles(score, player, curTurn, win = false) {
  const top = new Uint8Array(14); top.fill(0x66);
  top[0] = 0x64; top[13] = 0x67;
  top[2] = 0x60 | ((player & 1) << 1); top[3] = top[2] | 1;
  if (curTurn >= 0 && (player & 1) === (curTurn & 1)) top[1] = 0x65;   // a negative turn: the marker is not on the screen yet
  if (win) { top[5] = 0x4d; top[6] = 0x4e; top[7] = 0x4f; }
  const n = Math.max(0, Math.min(255, score | 0));
  const hundreds = Math.floor(n / 100), tens = Math.floor(n / 10) % 10, ones = n % 10;
  if (hundreds) top[9] = 0x40 | hundreds;
  if (hundreds || tens) top[10] = 0x40 | tens;
  top[11] = 0x40 | ones;
  const bottom = Uint8Array.from(top, v => v | 0x10);
  return { top, bottom };
}

export function approachQuarter(current, target) {
  current &= 0xff; target &= 0xff;
  let signed = target - current;
  if (signed >= 0) return (current + Math.ceil(signed / 4)) & 0xff;
  return (current + Math.floor(signed / 4)) & 0xff;
}

export function arrowTarget(cursorX, cursorY, state, stateTimer) {
  const nudge = stateTimer >= 8 && (state === 'collecting' || state === 'unflipping');
  return {
    x: cursorX * 24 + 32 + (nudge ? 4 : 0),
    y: cursorY * 24 + 27 + (nudge ? 8 : 0),
  };
}

export function gameOverWipeRow(oldTimer) {
  if (oldTimer >= 26 || oldTimer < 1) return null;
  let a = oldTimer & 0xff;
  const carry = a & 1;
  a >>>= 1;
  if (carry) a ^= 0xff;
  // ADC #15 retains carry from LSR: odd values add 16, even add 15.
  a = (a + 15 + carry) & 0xff;
  return a & 0x1f;
}

export function gameOverWipeRows(stateTimer, complete = false) {
  const timer = complete ? 0 : Math.max(0, stateTimer | 0);
  const rows = [];
  for (let oldTimer = 25; oldTimer > timer; oldTimer -= 1) {
    const row = gameOverWipeRow(oldTimer);
    if (row != null) rows.push(row);
  }
  return rows;
}

export function passControllerSprites(player = 0) {
  const baseX = NES_GEOMETRY.scoreSpriteX[player & 1] + 24;
  return Object.freeze([
    { tile:0x10, x:baseX + 0,  y:192 },
    { tile:0x11, x:baseX + 8,  y:192 },
    { tile:0x12, x:baseX + 16, y:192 },
    { tile:0x13, x:baseX + 24, y:192 },
    { tile:0x01, x:baseX + 4,  y:202 },
    { tile:0x0b, x:baseX + 12, y:202 },
    { tile:0x02, x:baseX + 20, y:202 },
  ]);
}
