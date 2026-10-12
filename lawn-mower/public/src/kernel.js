// SPDX-License-Identifier: GPL-3.0-or-later
// The game of Shiru's Lawn Mower (v1.12), one NMI at a time: a transcription of game.asm, title.asm and the routines they call,
// with the original's variables in the original's units so that they can be compared with the ROM's memory. It keeps what the
// picture unit holds (ppu.js) as the original writes it, but draws nothing and plays nothing: display.js and the sound player read it.
// No DOM, timers or framework.

import {
  MAP_WIDTH, MAP_HEIGHT, PLAYFIELD_TOP,
  FUEL_MAX, FUEL_LOW, FLOWER_PENALTY, STONE_PENALTY,
  INTRO_GATE_TICKS, INTRO_FILL_PER_TICK,
  START_SPEED, BOOST_THRESHOLD,
  FUEL_TIMER_BASES, DIR, TILE, RAW_TO_RUNTIME, PAD, BOOT_FRAME_COUNT, OAM_PLAYER, OAM_FUEL_BAR, LEVEL_SETUP_FRAMES, GAME_CLEAR_SETUP_FRAMES, TITLE_SETUP_FRAMES,
} from './constants.js';
import { LawnRng, sourceModulo } from './rng.js';
import { LEVELS } from './levels-data.js';
import {
  MSG_LEVEL_CLEAR, MSG_OUT_OF_FUEL, META_PLAYER, PAL_GAME_BG, PAL_GAME_SPR, PAL_LEVEL_TRIPLES, PAL_TITLE, PAL_DONE, TITLE_COLOR_ANIMATION,
} from './nes-assets.js';
import { Ppu } from './ppu.js';

function asciiRaw(ch) {
  if (ch === 'G') return 1;
  if (ch === 'F') return 2;
  if (ch === 'R') return 3;
  // '.' and 'S' are both already-cut lawn in the editor data.
  return 0;
}

function clampSub(value, amount) { return Math.max(0, value - amount); }
function u16(v) { return v & 0xffff; }

export class LawnMowerKernel {
  /** `screens` are the two packed nametables of the cartridge ({ title, done }, as the .rle files hold them); without them those two
   *  screens are left blank, which is all that the game logic needs. */
  constructor({ seed = 1, checkPadClearsDirection = false, screens = null } = {}) {
    this.screens = screens;
    // The competition ROM v1.1 clears the requested direction when the level is cleared or the tank is empty; the v1.12 source does not.
    this.checkPadClearsDirection = Boolean(checkPadClearsDirection);
    this.rng = new LawnRng(seed);
    this.events = [];
    this.frameCount = 0;
    this.frameCount2 = 0;
    this.levelIndex = 0;
    this.map = new Uint8Array(MAP_WIDTH * MAP_HEIGHT);
    this.coldReset(seed);
  }

  emit(type, detail = {}) { this.events.push({ type, ...detail }); }
  drainEvents() { const e = this.events; this.events = []; return e; }

  /** The state the original is in when its title screen first shows: RAM cleared, RAND_SEED = 1, the NTSC test passed and
   *  the cheat flag off. FRAME_CNT already counts the NMIs of the start-up (BOOT_FRAME_COUNT). */
  coldReset(seed = 1) {
    this.rng.setSeed(seed);
    this.frameCount = BOOT_FRAME_COUNT;
    this.frameCount2 = 0;
    this.levelIndex = 0;
    this.levelSkip = false;                  // GAME_LSKIP: set by the title's cheat code, never cleared again
    this.fuelY = 0;
    this.pendingFuelY = 0;
    this.oam = new Uint8Array(256);          // OAM_PAGE ($0200): the sprites the next NMI's DMA copies to the PPU
    this.ppu = new Ppu();                    // what the picture unit holds: nametables, palette, sprites
    this.ppu.oam.fill(0xff);                 // (the start-up cleared it)
    this.chrAnim = 0;                        // GAME_CHR_ANIM
    this.updateX = 0; this.updateY = 0;      // GAME_UPDATE_X/Y: the tile the next video update draws (also showMessage's column and counter)
    this.doneScr = 0;                        // GAME_DONE_SCR: the completion number as last drawn
    this.cameraX = 0; this.cameraBase = 0;
    this.regs = null;
    this.padState = 0;
    this.padStateP = 0;
    this.padStateT = 0;
    this.titleBuf = new Uint8Array(8);       // the last four direction presses, twice over, for the cheat code
    this.titleOff = 0;
    this.showTitleVideo();
    this.mode = 'title';
    this.paused = false;
    this.events = [];
    this.titleStartCounter = 0;
    this.titleX0 = 0x0100;
    this.titleX1 = 0xff08;
    this.titlePalAnim = 0;
    this.flowPhase = null;
    this.sequenceDelay = 0;
    this.messageReveal = 0;
    this.messageFade = 0;
    this.messageFlash = 0;
    this.setupFrames = 0;
  }

  /** showTitle's work on the picture unit: the title's nametable, the second one cleared, the sprite that splits the screen, the
   *  palette (faded in). The display is off while this is done. */
  showTitleVideo() {
    const ppu = this.ppu;
    ppu.clearNametables();                   // (at start-up; showTitle only clears the second one, but the first is overwritten whole)
    if (this.screens) ppu.unrle(this.screens.title, 0x2000);
    for (let i = 0; i < 1024; i++) ppu.write(0x2400 + i, 0);
    this.setTitleSprite0();
    this.titleBuf = new Uint8Array(8);       // the cheat code's presses start again with each showing of the title (GAME_LSKIP stays)
    this.titleOff = 0;
    ppu.palReset();
    ppu.palSetup(0, PAL_TITLE);
    ppu.palSetFadeIn();
  }

  advanceTitleVisual() {
    // title.asm scroll0/scroll1: two bands enter from opposite mirrored nametables.
    if (!((this.titleX0 & 0xff) === 4 && (((this.titleX0 >>> 8) & 1) === 0))) this.titleX0 = (this.titleX0 + 1) & 0xffff;
    if (!((this.titleX1 & 0xff) === 4 && (((this.titleX1 >>> 8) & 1) === 0))) this.titleX1 = (this.titleX1 - 1) & 0xffff;
    if (this.titleX0 === 0x0204 && this.titleX1 === 0xfe04) {
      // both bands have arrived: the colours of the letters take the next step of their flash (two entries per step)
      const row = TITLE_COLOR_ANIMATION[(this.titlePalAnim & 0xfe) >> 1];
      const data = this.ppu.palData;
      data[2] = row[0]; data[3] = row[1]; data[6] = row[2]; data[7] = row[3];
      if (this.titlePalAnim < 14) this.titlePalAnim++;
    }
  }

  /** One physical NMI of the title loop (showTitle). START begins the 49-processed-tick exit before level 1. */
  titleFlowPhysicalTick(pad = 0) {
    if (this.mode !== 'title') throw new Error('titleFlowPhysicalTick requires title mode');
    this.frameCount = (this.frameCount + 1) & 0xff;
    // The loop draws every NMI, the skipped ones too: the sprites, the palette, and the split of the screen in three bands.
    this.ppu.oam.set(this.oam);
    this.ppu.palUpdate(this.frameCount);
    this.regs = { kind: 'title', x0: this.titleX0, x1: this.titleX1, start: this.titleStartCounter, frameCount: this.frameCount };
    const processed = this.shouldProcessThisNmi();
    if (!processed) return 'skipped';
    this.advanceTitleVisual();
    if (this.titleStartCounter === 0) {
      this.rng.next();
      this.padPoll(pad);
      if (this.padStateT & PAD.START) {
        this.titleStartCounter = 1;
        this.titleX0 = 0x0204; this.titleX1 = 0xfe04;
        this.emit('title-start');
        return 'starting';
      }
      // The cheat: RIGHT, UP, LEFT, LEFT. The newly pressed directions of each poll go into a ring of four (kept twice so that the
      // last four are always in a row) and the ring is compared with the code after every press.
      const pressed = this.padStateT & (PAD.LEFT | PAD.RIGHT | PAD.UP);
      if (pressed) {
        this.titleBuf[this.titleOff] = pressed;
        this.titleBuf[this.titleOff + 4] = pressed;
        const x = (this.titleOff + 1) & 3;
        this.titleOff = x;
        if (this.titleBuf[x] === PAD.RIGHT && this.titleBuf[x + 1] === PAD.UP && this.titleBuf[x + 2] === PAD.LEFT && this.titleBuf[x + 3] === PAD.LEFT) {
          this.levelSkip = true;
          this.emit('cheat-on');
        }
      }
      return 'title';
    }
    this.titleStartCounter++;
    if (this.titleStartCounter === 34) { this.ppu.palSetFadeOut(); this.emit('title-fade-out'); }
    if (this.titleStartCounter >= 50) {
      this.levelIndex = 0;
      this.initLevel();
      this.titleStartCounter = 0;
      return 'started';
    }
    return 'starting';
  }

  retryLevel() { this.initLevel(); }

  /** The screen is off while the original sets a screen up (initLevel, gameClear, showTitle): its main thread works for a number of
   *  NMIs in which neither the pacing counter nor the pad is touched, and only FRAME_CNT counts. The work is done here at once; this
   *  keeps the NMI count (measured on the ROM). */
  beginSetup(frames, next) {
    this.mode = 'setup';
    this.setupFrames = frames;
    this.setupNext = next;
    this.flowPhase = null;
    this.sequenceDelay = 0;
    this.messageReveal = 0;
    this.messageFade = 0;
    this.messageFlash = 0;
  }

  setupTick() {
    this.frameCount = (this.frameCount + 1) & 0xff;
    if (--this.setupFrames <= 0) this.mode = this.setupNext;
  }

  initLevel() {
    const level = LEVELS[this.levelIndex];
    if (!level) throw new RangeError('invalid levelIndex');

    this.beginSetup(LEVEL_SETUP_FRAMES[this.levelIndex], 'intro');
    this.paused = false;
    this.fuel = 0;
    this.delay = 0;
    this.offsetRaw = 0;
    this.fuelX = 0;                          // initLevel clears the can's and the next can's X, not their Y
    this.pendingFuelX = 0;
    this.cameraShake = false;
    this.cameraShakeOffset = 0;
    this.grassType = 0;
    this.grassSpriteTile = 0xac;
    this.boost = false;
    this.checkExit = false;
    this.chrAnim = 0x80;

    // Exact source order: timer consumes RNG before setField consumes 512 RNG calls.
    this.setFuelTimer();

    this.speed = START_SPEED;
    this.direction = DIR.RIGHT;
    this.newDirection = DIR.RIGHT;
    this.prevDirection = DIR.RIGHT;

    this.width = level.width;
    this.playerXRaw = level.start_game.x << 8;
    this.playerYRaw = level.start_game.y << 8;
    this.doneRaw = 0;
    this.doneScr = 0;
    this.doneCount = level.grass_required;
    this.doneIncrement = level.done_inc_raw_8_8;

    this.setField(level);
    this.ppu.drawField(this.map);            // drawField draws the whole map, then the status bar,
    this.ppu.drawStatusBar();
    this.setSprite0();                       // setSprite0 clears the sprites and puts the one that splits the screen,
    this.updateX = 0; this.updateY = 0;
    this.checkCurrentTile();                 // checks the tile under the mower once (usually the "nothing here" mute),
    this.ppu.putNumber(0x2046, this.levelIndex + 1, 2);
    this.setLevelPalette();
    this.playerShowLogic();                  // and initLevel ends with playerShow and the fuel bar
    this.updateFuelBar();
    this.ppu.palSetFadeIn();
    this.emit('level-init', { level: this.levelIndex + 1 });
  }

  /** palReset and the level's colours: the common ones, three of them replaced by the level's own, and the sprites'. */
  setLevelPalette() {
    const ppu = this.ppu;
    ppu.palReset();
    ppu.palSetup(0, PAL_GAME_BG);
    const [c1, c2, c7] = PAL_LEVEL_TRIPLES[this.levelIndex];
    ppu.palData[1] = c1; ppu.palData[2] = c2; ppu.palData[7] = c7;
    ppu.palSetup(16, PAL_GAME_SPR);
    ppu.palData[23] = ppu.palData[7];
  }

  setFuelTimer() {
    const jitter = this.rng.next() & 31;
    this.fuelTime = FUEL_TIMER_BASES[this.levelIndex] + jitter;
    return this.fuelTime;
  }

  /** Reconstructs runtime map and deliberately consumes all 512 RNG calls from setField. */
  setField(level = LEVELS[this.levelIndex]) {
    const raw = new Uint8Array(MAP_WIDTH * MAP_HEIGHT);
    for (let row = 0; row < level.height; row++) {
      const line = level.ascii[row];
      for (let x = 0; x < level.width; x++) {
        raw[(PLAYFIELD_TOP + row) * MAP_WIDTH + 1 + x] = asciiRaw(line[x]);
      }
    }

    // The 6502 loop walks Y=0..255 and alternates GAME_MAP[Y], GAME_MAP[256+Y].
    // This still consumes 512 calls, but the interleaving is observable in per-cell tile variants.
    for (let y = 0; y < 256; y++) {
      for (const i of [y, 256 + y]) {
        const r = this.rng.next() & 3;
        const semantic = raw[i] & 3;
        this.map[i] = RAW_TO_RUNTIME[semantic][r];
      }
    }

    // The borders, in the order setField draws them. Rows 0 and 1 are blank sky ($01), row 2 the top hedge ($03) and row 14 the
    // bottom one ($08); the side hedges ($05 left, $06 right) run down rows 3 to 14 and the four corners are drawn over them.
    const w = this.width;
    for (let x = 0; x < MAP_WIDTH; x++) {
      this.map[x] = 1;
      this.map[MAP_WIDTH + x] = 1;
      this.map[2 * MAP_WIDTH + x] = 3;
      this.map[14 * MAP_WIDTH + x] = 8;
    }
    for (let y = PLAYFIELD_TOP; y <= 14; y++) {
      this.map[y * MAP_WIDTH] = 5;
      this.map[y * MAP_WIDTH + w + 1] = 6;
    }
    this.map[2 * MAP_WIDTH] = 2;
    this.map[2 * MAP_WIDTH + w + 1] = 4;
    this.map[14 * MAP_WIDTH] = 7;
    this.map[14 * MAP_WIDTH + w + 1] = 9;
    for (let x = 0; x < MAP_WIDTH; x++) this.map[15 * MAP_WIDTH + x] = 0;
    // Whatever lies to the right of the lawn in rows 0 to 13 is cleared (the lawn is at most 30 wide).
    if (w !== 30) for (let y = 0; y < 14; y++) for (let x = w + 2; x < MAP_WIDTH; x++) this.map[y * MAP_WIDTH + x] = 0;
  }

  mapIndex(x, y) { return (y * MAP_WIDTH) + x; }
  tileAt(x, y) { return this.map[this.mapIndex(x, y)]; }
  setTile(x, y, tile) { this.map[this.mapIndex(x, y)] = tile & 0xff; }
  isCutTile(tile) { return tile >= TILE.CUT_MIN && tile <= TILE.CUT_MAX; }

  /** Source max routine + rejection loop. One call performs at most one candidate attempt. */
  tryGeneratePendingFuel() {
    if (this.pendingFuelX !== 0) return false;
    const x = sourceModulo(this.rng.next() & 31, this.width) + 1;
    const y = sourceModulo(this.rng.next() & 15, 11) + 3;
    if (!this.isCutTile(this.tileAt(x, y))) return false;
    this.pendingFuelX = x;
    this.pendingFuelY = y;
    return true;
  }

  addFuelCan() {
    if (this.pendingFuelX === 0) return false;
    this.fuelX = this.pendingFuelX;
    this.fuelY = this.pendingFuelY;
    this.pendingFuelX = 0;
    // fuelUpdateTime runs before the NMI's FamiToneUpdate, so the sound of a new can is heard in this very NMI ("early").
    this.emit('fuel-spawn', { x: this.fuelX, y: this.fuelY, early: true });
    return true;
  }

  /** fuelUpdate: the can blinks between its two tiles, in the map and on the screen. */
  updateFuelCanTile() {
    if (this.paused || this.fuelX === 0) return;
    const tile = ((this.frameCount >>> 3) & 1) ? TILE.FUEL_B : TILE.FUEL_A;
    this.setTile(this.fuelX, this.fuelY, tile);
    this.ppu.updateTile(this.map, this.fuelX, this.fuelY);
  }

  /** Runs every physical NMI, including NTSC movement-skip frames.
   *  Returns true when the routine ends with X not zero. The original passes "this NMI is processed" to the end of its loop in X
   *  (0 for a skipped one, 1 for a processed one), and fuelUpdateTime does not keep X: whenever it searches for a position for
   *  the next fuel can it leaves X = 11 (the row count it loads for the second max call), so a skipped NMI that searches runs its
   *  game logic anyway. */
  fuelUpdateTime() {
    if (!this.paused && this.delay === INTRO_GATE_TICKS && this.fuelX === 0) {
      if (this.fuelTime === 0) {
        this.addFuelCan();
        this.setFuelTimer();
      } else {
        this.fuelTime--;
      }
    }
    // Candidate precomputation is outside the pause/delay/timer guard in the source.
    const searches = this.pendingFuelX === 0;
    this.tryGeneratePendingFuel();
    return searches;
  }

  subtractFuel(amount) {
    const before = this.fuel;
    this.fuel = clampSub(this.fuel, amount);
    if (before >= FUEL_LOW && this.fuel < FUEL_LOW) this.emit('fuel-low');
    return this.fuel;
  }

  updateSpeed(boostHeld) {
    if (boostHeld) {
      if (!this.boost) this.emit('boost-start');
      this.boost = true;
      if (this.speed < BOOST_THRESHOLD) this.speed = (this.speed + 2) & 0xff;
      return this.speed;
    }
    if (this.speed < 16) return this.speed;
    this.boost = false;
    this.speed--;
    if ((this.frameCount & 1) === 0 && this.speed >= 16) this.speed--;
    return this.speed;
  }

  /** checkPad's four direction tests, on the pad as polled. The order is LEFT, RIGHT, UP, DOWN and a later match overwrites an earlier one. */
  requestDirection(state) {
    const xHigh = (this.playerXRaw >>> 8) & 0xff;
    const yHigh = (this.playerYRaw >>> 8) & 0xff;
    if (state & PAD.LEFT) {
      if (this.direction === DIR.RIGHT || xHigh !== 1) this.newDirection = DIR.LEFT;
    }
    if (state & PAD.RIGHT) {
      if (xHigh !== this.width) this.newDirection = DIR.RIGHT;
    }
    if (state & PAD.UP) {
      if (this.direction === DIR.DOWN || yHigh !== 3) this.newDirection = DIR.UP;
    }
    if (state & PAD.DOWN) {
      if (yHigh !== 13) this.newDirection = DIR.DOWN;
    }
  }

  /** padPoll: the pad is read three times and the byte seen twice wins (here the pad does not change within a frame); the buttons
   *  pressed since the last poll are kept apart, and the last poll is only updated when the game polls. */
  padPoll(pad) {
    this.padState = pad & 0xff;
    this.padStateT = this.padState & ~this.padStateP & 0xff;
    this.padStateP = this.padState;
    return this.padState;
  }

  alignForTurn() {
    const xLow = this.playerXRaw & 0xff;
    let xHigh = (this.playerXRaw >>> 8) & 0xff;
    const yLow = this.playerYRaw & 0xff;
    let yHigh = (this.playerYRaw >>> 8) & 0xff;
    if (this.direction === DIR.LEFT && xLow !== 0 && xHigh !== this.width) xHigh++;
    if (this.direction === DIR.UP && yLow !== 0 && yHigh !== 13) yHigh++;
    this.playerXRaw = xHigh << 8;
    this.playerYRaw = yHigh << 8;
  }

  currentTileCoordsForCheck() {
    let tx = (this.playerXRaw >>> 8) & 0xff;
    let ty = (this.playerYRaw >>> 8) & 0xff;
    if (this.direction === DIR.LEFT && (this.playerXRaw & 0xff) !== 0) tx++;
    if (this.direction === DIR.UP && (this.playerYRaw & 0xff) !== 0) ty++;
    return [tx, ty];
  }

  checkTileAt(x, y) {
    const tile = this.tileAt(x, y);
    this.updateX = x; this.updateY = y;            // the next video update draws this tile
    this.cameraShake = false;
    this.cameraShakeOffset = 0;
    this.grassType = 0;
    this.grassSpriteTile = 0xac;

    if (tile >= TILE.GRASS_MIN && tile <= TILE.GRASS_MAX) {
      this.setTile(x, y, tile - 4);
      this.doneRaw = u16(this.doneRaw + this.doneIncrement);
      if (this.doneCount > 0) this.doneCount--;
      this.grassType = 0xda;
      this.emit('grass-cut', { x, y, remaining: this.doneCount });
      return 'grass';
    }
    if (tile === TILE.FLOWERS) {
      this.setTile(x, y, TILE.FLOWERS_CUT);
      this.subtractFuel(FLOWER_PENALTY);
      this.grassType = 0xea;
      this.emit('flowers-hit', { x, y });
      return 'flowers';
    }
    if (tile === TILE.FLOWERS_CUT) {
      this.setTile(x, y, TILE.CUT_MIN + (this.rng.next() & 3));
      this.grassType = 0xda;
      this.emit('flowers-cleared', { x, y });
      return 'flowers-cut';
    }
    if (tile === TILE.STONE) {
      this.cameraShake = true;
      this.subtractFuel(STONE_PENALTY);
      this.emit('stone-hit', { x, y });
      return 'stone';
    }
    if (tile === TILE.FUEL_A || tile === TILE.FUEL_B) {
      this.fuelX = 0;
      this.fuelY = 0;
      this.setTile(x, y, TILE.CUT_MIN + (this.rng.next() & 3));
      this.fuel = FUEL_MAX;
      this.emit('fuel-collected', { x, y });
      return 'fuel';
    }
    this.emit('grass-mute');
    return 'none';
  }

  checkCurrentTile() {
    const [x, y] = this.currentTileCoordsForCheck();
    return this.checkTileAt(x, y);
  }

  /** playerShow has RNG side effects in the original even though it is nominally rendering.
   *  Camera shake consumes one RNG value; grass/flower debris consumes another.
   *  These calls must live in the behavioral kernel because they affect later fuel RNG.
   */
  playerShowLogic() {
    // GAME_CAM_X: the player's pixel position less 128, kept between 0 and the end of the lawn, then the shake flips its low bit.
    const max = Math.max(0, (this.width - 14) * 16);
    const base = Math.max(0, Math.min(max, (this.playerXRaw >>> 4) - 128));
    this.cameraBase = base;                 // the sprites are placed with this one; the shake is applied after them
    // The mower's sprites (OAM_PLAYER, 11 of them): where the mower is on the screen, from the low bytes of its pixel position and of
    // the camera, and the metasprite of the direction it faces. Nothing is written while it faces nowhere.
    const meta = META_PLAYER[this.prevDirection];
    if (meta) {
      const screenX = ((this.playerXRaw >>> 4) - base) & 0xff, y = ((this.playerYRaw >>> 4) & 0xff) - 1;
      meta.forEach(([tile, dy, attribute, dx], i) => {
        const o = OAM_PLAYER + i * 4;
        this.oam[o] = (y + dy) & 0xff; this.oam[o + 1] = tile; this.oam[o + 2] = attribute; this.oam[o + 3] = (screenX + dx) & 0xff;
      });
    }
    this.cameraShakeOffset = 0;
    if (this.cameraShake) this.cameraShakeOffset = this.rng.next() & 1;
    this.cameraX = (base & 0xff00) | ((base & 0xff) ^ this.cameraShakeOffset);
    this.grassSpriteTile = 0xac;
    if (this.grassType) this.grassSpriteTile = (this.grassType + (this.rng.next() & 3)) & 0xff;
    this.oam[OAM_PLAYER + 10 * 4 + 1] = this.grassSpriteTile;       // the last sprite of the mower shows the cuttings
    return { cameraShakeOffset: this.cameraShakeOffset, grassSpriteTile: this.grassSpriteTile };
  }

  /** showTitle: clearOAM, then the sprite that splits the title screen (line 27). */
  setTitleSprite0() {
    this.oam.fill(0xff);
    this.oam[0] = 26; this.oam[1] = 0x49; this.oam[2] = 0; this.oam[3] = 0;
  }

  /** clearOAM, then the sprite that splits the playfield screen (line 33). */
  setSprite0() {
    this.oam.fill(0xff);
    this.oam[0] = 32; this.oam[1] = 0xab; this.oam[2] = 0; this.oam[3] = 0;
  }

  /** updateFuelBar: eight sprites, each a segment of 8 quarter-units of fuel; the ones beyond the fuel are moved off the screen. */
  updateFuelBar() {
    const quarter = this.fuel >>> 2;
    for (let i = 0; i < 8; i++) {
      const threshold = i * 8, o = OAM_FUEL_BAR + i * 4, rest = (quarter - threshold) & 0xff;
      this.oam[o] = quarter < threshold ? 0xef : 21;
      this.oam[o + 1] = rest < 8 ? 0xf0 + rest : 0xf8;
      this.oam[o + 2] = 0;
      this.oam[o + 3] = 107 + threshold;
    }
    // the bar's colour flashes while the tank is low (fuel/4 under 14), in step with bit 4 of the frame counter
    this.ppu.palData[18] = (quarter < 14 && (this.frameCount & 0x10)) ? 0x16 : 0x27;
  }

  clipAndCheckIfNeeded() {
    let xHigh = (this.playerXRaw >>> 8) & 0xff;
    let yHigh = (this.playerYRaw >>> 8) & 0xff;
    let clipped = false;

    if (this.direction === DIR.LEFT && xHigh === 0) {
      xHigh = 1; clipped = true;
    } else if (this.direction === DIR.RIGHT && xHigh === this.width) {
      xHigh = this.width; clipped = true;
    } else if (this.direction === DIR.UP && yHigh === 2) {
      yHigh = 3; clipped = true;
    } else if (this.direction === DIR.DOWN && yHigh === 13) {
      yHigh = 13; clipped = true;
    }

    if (clipped) {
      this.playerXRaw = xHigh << 8;
      this.playerYRaw = yHigh << 8;
      this.offsetRaw = 0;
      this.direction = DIR.NONE;
      this.checkCurrentTile();
    }
    return clipped;
  }

  movePlayer() {
    let deltaX = 0, deltaY = 0;
    switch (this.direction) {
      case DIR.LEFT: deltaX = -this.speed; break;
      case DIR.RIGHT: deltaX = this.speed; break;
      case DIR.UP: deltaY = -this.speed; break;
      case DIR.DOWN: deltaY = this.speed; break;
      default:
        this.offsetRaw = 0;
        return { crossedTile: false, clipped: false };
    }

    this.playerXRaw = u16(this.playerXRaw + deltaX);
    this.playerYRaw = u16(this.playerYRaw + deltaY);
    this.offsetRaw = u16(this.offsetRaw + this.speed);

    const clipped = this.clipAndCheckIfNeeded();
    if (clipped) return { crossedTile: false, clipped: true };

    if (this.offsetRaw >= 0x100) {
      this.checkCurrentTile();
      this.offsetRaw &= 0xff;
      if (this.newDirection !== this.direction) {
        this.alignForTurn();
        this.direction = this.newDirection;
        this.prevDirection = this.newDirection;
        this.offsetRaw = 0;
      }
      this.checkExit = true;
      return { crossedTile: true, clipped: false };
    }
    return { crossedTile: false, clipped: false };
  }


  alignPlayerPixelCoords() {
    let xLow=this.playerXRaw & 0xff, xHigh=(this.playerXRaw>>>8)&0xff;
    let yLow=this.playerYRaw & 0xff, yHigh=(this.playerYRaw>>>8)&0xff;
    if (xLow >= 128 && xHigh !== this.width) xHigh++;
    if (yLow >= 128 && yHigh !== 13) yHigh++;
    this.playerXRaw=xHigh<<8; this.playerYRaw=yHigh<<8;
  }

  beginLevelClear() {
    this.mode='level-clear'; this.flowPhase='delay'; this.sequenceDelay=80;
    this.cameraShake=false; this.cameraShakeOffset=0;
    this.grassType=0; this.paused=false; this.messageReveal=0; this.messageFade=0; this.messageFlash=0;
    this.playerShowLogic();
    this.emit('level-clear',{level:this.levelIndex+1});
  }

  beginOutOfFuel() {
    this.updateFuelBar();
    this.mode='out-of-fuel'; this.flowPhase='delay'; this.sequenceDelay=100;
    this.cameraShake=false; this.cameraShakeOffset=0; this.grassType=0; this.paused=false;
    this.alignPlayerPixelCoords(); this.playerShowLogic();
    this.messageReveal=0; this.messageFade=0; this.messageFlash=0;
    this.emit('out-of-fuel',{level:this.levelIndex+1});
    this.emit('audio-mute-stream',{stream:1});
    this.emit('audio-mute-stream',{stream:2});
  }

  /** showMessage: the message (3 rows of 16 large tiles) is written twice over the 32 columns of map rows 7 to 9, starting at the
   *  column under the left edge of the screen; one column per processed tick is then drawn on the screen. */
  showMessageFill(message) {
    const camera = this.cameraX;
    this.updateX = (((camera >>> 8) << 4) | (camera >>> 4)) & 0xff;
    let column = ((this.updateX - 1) ^ 31) & 15;
    for (let x = 0; x < MAP_WIDTH; x++) {
      this.map[7 * MAP_WIDTH + x] = message[column];
      this.map[8 * MAP_WIDTH + x] = message[16 + column];
      this.map[9 * MAP_WIDTH + x] = message[32 + column];
      column = (column + 1) & 15;
    }
    this.updateY = 0;
    this.chrAnim = 0x80;                     // the message is drawn from the first pattern table, whatever the animation was doing
  }

  /** gameClear: after the last message the original sets the final screen up with the display off. */
  beginGameClear() {
    this.levelIndex++;                       // levelClear's inc GAME_LEVEL: it is 10 on the final screen
    this.beginSetup(GAME_CLEAR_SETUP_FRAMES, 'complete');
    this.flowPhase = 'wait';
    this.sequenceDelay = 200;
    const ppu = this.ppu;
    if (this.screens) ppu.unrle(this.screens.done, 0x2000);
    ppu.palReset();
    ppu.palSetup(0, PAL_DONE);
    ppu.palSetFadeIn();
    this.emit('game-complete');
  }

  /** The end of the final screen: initGame -> showTitle. RAND_SEED is not touched, so the title's random numbers go on from the game's. */
  resetTitleWithoutReseed() {
    this.beginSetup(TITLE_SETUP_FRAMES, 'title');
    this.paused=false; this.titleStartCounter=0;
    this.titleX0=0x0100; this.titleX1=0xff08; this.titlePalAnim=0;
    this.levelIndex=0;
    this.showTitleVideo();
    this.emit('title-return');
  }

  /** chrAnimation: the mower's sprites change pattern table (bit 3 of GAME_CHR_ANIM) every few NMIs once the wait for the start is past
   *  halfway, and the background changes (bit 4) every sixteenth NMI. `delay` is what GAME_DELAY holds in the loop that calls it. */
  chrAnimation(delay) {
    let v = this.chrAnim;
    if (delay >= 30) {
      const mask = delay >= 60 ? 3 : 16;
      if ((mask & this.frameCount) === 0) v ^= 0x08;
    }
    if ((this.frameCount & 15) === 0) v ^= 0x10;
    this.chrAnim = v;
  }

  /** What the NMI's registers are told at the screen split, from the state before this NMI's game logic: the scroll the lawn was left at
   *  and the pattern tables. (The page draws from this and from the picture unit's memories, `ppu`.) */
  captureRegs(kind) {
    this.regs = { kind, camX: this.cameraX, chrAnim: this.chrAnim, flash: this.messageFlash, frameCount: this.frameCount };
  }

  /** Level-clear, out-of-fuel, message and final-screen state machine.
   *  Delays count processed logic ticks, matching the source's ntscIsSkip loops.
   */
  flowPhysicalTick(pad = 0) {
    if (!['level-clear','out-of-fuel','complete'].includes(this.mode)) return false;
    this.frameCount=(this.frameCount+1)&0xff;
    const ppu = this.ppu;

    if (this.mode === 'complete') {
      // gameClear's loop, every NMI: the palette, the final screen with no split, the animation counter, then the pacing
      this.captureRegs('done');
      ppu.palUpdate(this.frameCount);
      this.chrAnimation(this.flowPhase === 'fade' ? this.messageFade : this.sequenceDelay);
      if (!this.shouldProcessThisNmi()) return false;
      if (this.flowPhase === 'fade') {
        this.messageFade++;
        if (this.messageFade >= 16) this.resetTitleWithoutReseed();
      } else {
        this.padPoll(pad);
        if (this.padStateT === PAD.START) { this.flowPhase='fade'; this.messageFade=0; ppu.palSetFadeOut(); this.emit('final-exit'); }
      }
      return true;
    }

    if (this.flowPhase === 'delay') {
      // the loops that count down to the message: sprites, palette, the can, the tile last cut and (for a cleared level) the number
      this.captureRegs('field');
      ppu.oam.set(this.oam);
      ppu.palUpdate(this.frameCount);
      this.updateFuelCanTile();
      ppu.updateTile(this.map, this.updateX, this.updateY);
      if (this.mode === 'level-clear') ppu.putNumber(0x205a, 100, 3);
    } else if (this.flowPhase === 'message-reveal') {
      // showMessage's loop: sprites, then it blanks the column it is about to draw (on every NMI, the skipped ones too; the second half
      // of the 32 columns is blanked as it is drawn and the first half keeps the message) and draws the three tiles of the column
      this.captureRegs('field');
      ppu.oam.set(this.oam);
      if (this.messageReveal >= 16) {
        this.map[7 * MAP_WIDTH + this.updateX] = 0x16;
        this.map[8 * MAP_WIDTH + this.updateX] = 0x17;
        this.map[9 * MAP_WIDTH + this.updateX] = 0x18;
      }
      for (const row of [7, 8, 9]) ppu.updateTile(this.map, this.updateX, row);
    } else {
      // the wait for START and the fade after it: palette and (for some reason rows 5 to 7 of) the column again; no sprites
      this.captureRegs('message');
      ppu.palUpdate(this.frameCount);
      for (const row of [5, 6, 7]) ppu.updateTile(this.map, this.updateX, row);
    }
    if (!this.shouldProcessThisNmi()) return false;

    if (this.flowPhase === 'delay') {
      this.playerShowLogic();
      this.chrAnimation(this.sequenceDelay);
      // Audio cues are checked against GAME_DELAY before the source decrements it.
      if (this.mode === 'level-clear' && this.sequenceDelay === 70) {
        this.emit('audio-mute-stream',{stream:1}); this.emit('audio-mute-stream',{stream:2});
      }
      if (this.mode === 'level-clear' && this.sequenceDelay === 50) this.emit('engine-stop');
      if (this.mode === 'out-of-fuel' && this.sequenceDelay === 95) this.emit('engine-stall');
      if (this.mode === 'out-of-fuel' && this.sequenceDelay === 50) this.emit('engine-stop');
      if (this.mode === 'level-clear' && this.levelSkip) {          // the cheat: SELECT cuts the wait short
        this.padPoll(pad);
        if (this.padState & PAD.SELECT) this.sequenceDelay = 1;
      }
      if (this.sequenceDelay > 0) this.sequenceDelay--;
      if (this.sequenceDelay === 0) {
        this.flowPhase='message-reveal'; this.messageReveal=0;
        this.showMessageFill(this.mode === 'level-clear' ? MSG_LEVEL_CLEAR : MSG_OUT_OF_FUEL);
        this.emit('message-start',{kind:this.mode});
      }
      return true;
    }
    if (this.flowPhase === 'message-reveal') {
      // The mower and its cuttings are taken off the screen where the message has been drawn: every sprite of the mower and the
      // sprites after it in the page (the fuel bar is out of reach) that is within the message's rows and not to the left of its edge.
      const edge = (((this.updateX << 4) & 0xff) - (this.cameraX & 0xff) + 24) & 0xff;
      if ((this.cameraX >>> 8) === 0 || this.updateX >= 16) {
        for (let o = OAM_PLAYER; o < OAM_FUEL_BAR; o += 4) {
          const y = this.oam[o];
          if (y >= 7 * 16 - 8 && y < 10 * 16 - 1 && edge >= this.oam[o + 3]) this.oam[o] = 0xef;
        }
      }
      this.updateX = (this.updateX + 1) & 31;
      this.messageReveal++;
      this.updateY = this.messageReveal;
      if (this.messageReveal >= 32) { this.flowPhase='message-wait'; this.messageFlash=0; }
      return true;
    }
    if (this.flowPhase === 'message-wait') {
      // showMessage increments GAME_FLASH_CNT once per processed wait tick and polls the pad. START then
      // forces it to $80 for the 16-tick fade, preserving the original raster split.
      this.messageFlash=(this.messageFlash+1)&0xff;
      this.padPoll(pad);
      if (this.padStateT & PAD.START) {
        this.flowPhase='message-fade'; this.messageFade=16; this.messageFlash=0x80;
        ppu.palSetFadeOut();
        this.emit('message-confirm');
      }
      return true;
    }
    if (this.flowPhase === 'message-fade') {
      if (this.messageFade > 0) this.messageFade--;
      if (this.messageFade === 0) {
        if (this.mode === 'out-of-fuel') { this.retryLevel(); }
        else if (this.levelIndex >= LEVELS.length-1) {
          this.beginGameClear();
        } else { this.levelIndex++; this.initLevel(); }
      }
      return true;
    }
    return true;
  }

  processedGameplayTick(pad = 0) {
    if (this.mode === 'intro') {
      this.playerShowLogic();
      if (this.levelSkip) {                                          // the cheat: SELECT fills the tank and ends the wait
        this.padPoll(pad);
        if (this.padState & PAD.SELECT) { this.fuel = FUEL_MAX; this.delay = INTRO_GATE_TICKS - 1; }
      }
      if (this.fuel !== FUEL_MAX) this.fuel = Math.min(FUEL_MAX, this.fuel + INTRO_FILL_PER_TICK);
      this.delay++;
      this.updateFuelBar();
      this.chrAnimation(this.delay);
      if (this.delay === 20) this.emit('engine-start');
      if (this.delay >= INTRO_GATE_TICKS) {
        this.delay = INTRO_GATE_TICKS;
        this.mode = 'playing';
        this.emit('play-start');
      }
      return;
    }
    if (this.mode !== 'playing') return;

    // Paused source path only polls START, then jumps back to the next NMI with no movement.
    if (this.paused) {
      this.padPoll(pad);
      if (this.padStateT === PAD.START) {
        this.paused = false;
        this.ppu.palSetFadeIn();
        this.emit('pause-off');
      }
      return;
    }

    if (this.doneCount > 0 && this.fuel > 0) {
      this.padPoll(pad);
      this.requestDirection(this.padState);
      const boostHeld = (this.padState & (PAD.A | PAD.B)) !== 0;
      this.updateSpeed(boostHeld);
      // In the source START and SELECT are looked at only on the no-fire path. Pausing still allows
      // the current processed tick to finish; the pause gate applies on the next NMI.
      if (!boostHeld) {
        if (this.padStateT & PAD.START) {
          this.paused = true;
          this.ppu.palSetFadeHalf();
          this.emit('pause-on');
        }
        if ((this.padStateT & PAD.SELECT) && this.levelSkip) this.doneCount = 0;
      }
    } else {
      // v1.12 skips pad/speed mutation here and keeps newDirection; v1.1 clears it.
      if (this.checkPadClearsDirection) this.newDirection = DIR.NONE;
    }

    if (this.direction === DIR.NONE) {
      this.direction = this.newDirection;
      this.prevDirection = this.newDirection;
    }

    this.movePlayer();
    this.playerShowLogic();

    if ((this.frameCount & 1) === 1 && this.fuel > 0) this.subtractFuel(1);
    this.updateFuelBar();
    this.chrAnimation(this.delay);

    if (this.checkExit || this.direction === DIR.NONE) {
      this.checkExit = false;
      if (this.doneCount === 0) {
        this.beginLevelClear();
      } else if (this.fuel === 0) {
        this.beginOutOfFuel();
      }
    }
  }

  /** ntscIsSkip: the game was written for 50 Hz and runs on a 60 Hz console (this port is NTSC only, like the console it was checked
   *  on) by skipping the logic of every fifth NMI. */
  shouldProcessThisNmi() {
    this.frameCount2 = (this.frameCount2 + 1) & 0xff;
    if (this.frameCount2 === 5) {
      this.frameCount2 = 0;
      return false;
    }
    return true;
  }

  /** One physical NMI/frame of the level (intro, play, pause). Returns whether the game logic ran. */
  physicalTick(pad = 0) {
    this.frameCount = (this.frameCount + 1) & 0xff;
    const ppu = this.ppu;
    this.captureRegs('field');
    ppu.oam.set(this.oam);                                           // updateOAM

    const paced = this.shouldProcessThisNmi();
    if (paced) {
      // updateVideo, skipped on the NMIs that the 1-in-5 pacing skips: the palette, the tile last cut, the can, the completion number
      ppu.palUpdate(this.frameCount);
      if (this.updateX !== 0) { ppu.updateTile(this.map, this.updateX, this.updateY); this.updateX = 0; }
      this.updateFuelCanTile();
      const done = (this.doneRaw >>> 8) & 0xff;
      if (done !== this.doneScr) { this.doneScr = done; ppu.putNumber(0x205a, done, 3); }
    }
    const searched = this.fuelUpdateTime();
    const processed = paced || searched;
    if (processed) this.processedGameplayTick(pad);
    return processed;
  }
}

export { DIR, TILE, LEVELS, FUEL_MAX, FUEL_LOW, FLOWER_PENALTY, STONE_PENALTY };
