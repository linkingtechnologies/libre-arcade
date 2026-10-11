import { cardIdentity, FIELD_SIZE } from './layouts.js';
import { MODE, solitaireInitialMisses } from './rules.js';
import { ArtificialIdiocy, randomRemainingCard } from './ai.js';

export const PLAY_STATE = Object.freeze({
  STILL: 'still',
  FLIPPING: 'flipping',
  UNFLIPPING: 'unflipping',
  COLLECTING: 'collecting',
  PASS_CONTROLLER: 'pass-controller',
  CLEARED: 'cleared',
  GAME_OVER: 'game-over',
  DONE: 'done',
});

export const NTSC = Object.freeze({
  fps: 3606 / 60,
  flipFrames: 5,
  compareFrames: 90,
  secondUnflipFrames: 6,
  collectFirstStart: 28,
  collectSecondStart: 16,
  clearHoldFrames: 180,
  gameOverFrames: 90,
});

// The pad bits handleStateStill looks at (nes.h: KEY_A, KEY_B).
const KEY_A = 0x80;
const KEY_B = 0x40;

function isFaceDown(v) { return (v & 0xc0) === 0x80; }

/**
 * Frame-driven transcription of Concentration Room 0.02 memorygame.s.
 *
 * selected[0] is the card currently being animated/handled.
 * selected[1] is the previously opened card.  This intentionally mirrors
 * the slightly unusual ordering in the 6502 original.
 */
export class FrameGame {
  constructor({ board, mode = MODE.TWO_PLAYER, difficulty = 0, lastPlayerIsAI = false, prng = null, aiNoiseLevel = 8 } = {}) {
    if (!board || board.length !== FIELD_SIZE) throw new Error('FrameGame requires a 72-slot board');
    this.board = Uint8Array.from(board);
    this.mode = mode;
    this.difficulty = difficulty;
    this.numPlayers = (mode === MODE.TWO_PLAYER || mode === MODE.VS_CPU) ? 2 : 1;
    this.lastPlayerIsAI = lastPlayerIsAI || mode === MODE.VS_CPU;
    this.scoreMethod = this.numPlayers >= 2 ? 1 : 0;
    this.score = this.scoreMethod ? [0, 0] : [solitaireInitialMisses(difficulty), 0];
    this.curTurn = 0;
    // The score boxes are drawn from an update that the original builds one iteration after the change (handleStatePassController and
    // handleStateCleared rebuild them): these are the frames after which the new turn marker and the WIN mark are on the screen.
    this.turnChangedAt = -1;
    this.clearedAt = -1;
    this.activePad = 0;
    this.state = PLAY_STATE.STILL;
    this.stateTimer = 0;
    this.selected = [-1, -1];
    this.card0FlipFrame = 0;
    this.cursorX = 4;
    this.cursorY = 3;
    this.bgcolor = 0x18;
    this.isCombo = false;
    this.winner = null;
    this.finished = false;
    this.endReason = null;
    this.rememberState = new Uint8Array(FIELD_SIZE);
    this.prng = prng;
    this.aiNoiseLevel = aiNoiseLevel;
    this.ai = this.lastPlayerIsAI
      ? new ArtificialIdiocy({ noiseLevel: aiNoiseLevel, rememberState: this.rememberState })
      : null;
    if (this.ai && !this.prng) throw new Error('Vs CPU requires the historical shared PRNG');
    this.collectProgress = [0, 0];
    this.collectingX = [0, 0];
    this.collectingY = [0, 0];
    this.collectingDX = 0;
    this.collectingDY = 0;
    this.frame = 0;
    this.events = [];
  }

  emit(type, detail = {}) {
    const event = { frame: this.frame, type, ...detail };
    this.events.push(event);
    return event;
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  remainingCards() {
    let n = 0;
    for (const v of this.board) if (v & 0x80) n += 1;
    return n;
  }

  setCursor(index) {
    if (!Number.isInteger(index) || index < 0 || index >= FIELD_SIZE) return false;
    this.cursorX = Math.floor(index / 8);
    this.cursorY = index & 7;
    return true;
  }

  moveCursor(dx, dy) {
    if (this.state === PLAY_STATE.DONE) return false;
    const nx = Math.max(0, Math.min(8, this.cursorX + (dx | 0)));
    const ny = Math.max(0, Math.min(7, this.cursorY + (dy | 0)));
    const changed = nx !== this.cursorX || ny !== this.cursorY;
    this.cursorX = nx; this.cursorY = ny;
    return changed;
  }

  randomizeCursor() {
    if (this.state !== PLAY_STATE.STILL || !this.prng) return -1;
    const index = randomRemainingCard(this.board, this.prng);
    if (index >= 0) {
      this.setCursor(index);
      this.emit('random-cursor', { index });
    }
    return index;
  }

  get cursorIndex() { return this.cursorX * 8 + this.cursorY; }

  canSelect(index) {
    if (this.state !== PLAY_STATE.STILL) return false;
    if (!Number.isInteger(index) || index < 0 || index >= FIELD_SIZE) return false;
    if (index === this.selected[0] || index === this.selected[1]) return false;
    return isFaceDown(this.board[index]);
  }

  select(index) {
    if (!this.canSelect(index)) return false;
    this.setCursor(index);
    return this.#flipAtCursor();
  }

  // The A branch of handleStateStill: the card under the cursor is turned over if there is a card there and it is
  // neither of the two already selected.
  #flipAtCursor() {
    const index = this.cursorIndex;
    if (index === this.selected[1] || index === this.selected[0]) return false;
    if (!(this.board[index] & 0x80)) return false;
    this.selected[0] = index;
    this.board[index] = cardIdentity(this.board[index]) | 0x40;
    this.state = PLAY_STATE.FLIPPING;
    this.stateTimer = NTSC.flipFrames;
    this.card0FlipFrame = 8;
    this.emit('flip-start', { index });
    return true;
  }

  // The B branch of handleStateStill (USE_B_FOR_RANDOM): jump the cursor to a random card. The generator is drawn
  // from even when no card is left, and the cursor then goes to the last slot.
  #jumpCursor() {
    let index = randomRemainingCard(this.board, this.prng);
    if (index < 0 || index >= FIELD_SIZE) index = FIELD_SIZE - 1;
    this.setCursor(index);
    this.emit('random-cursor', { index });
  }

  acknowledgePass(pad = 0) {
    if (this.state !== PLAY_STATE.PASS_CONTROLLER) return false;
    this.activePad = pad & 1;
    this.state = PLAY_STATE.STILL;
    this.emit('pass-acknowledged', { player: this.curTurn, pad: this.activePad });
    return true;
  }

  // One iteration of the original's state handler. `input.newKeys` is the active pad's new keys for this iteration
  // (read_pads and autorepeat have already run): only handleStateStill looks at them, and so does the end of
  // handleStateCleared, which falls through into it.
  tick(frames = 1, input = null) {
    const newKeys = input?.newKeys ?? 0;
    for (let i = 0; i < frames; i += 1) {
      if (this.state === PLAY_STATE.DONE) {
        this.frame += 1;
        continue;
      }
      this.#tickOne(newKeys);
      this.frame += 1;
    }
    return this;
  }

  #tickOne(newKeys) {
    switch (this.state) {
      case PLAY_STATE.STILL:
        this.#handleStill(newKeys);
        break;
      case PLAY_STATE.FLIPPING: this.#tickFlipping(); break;
      case PLAY_STATE.UNFLIPPING: this.#tickUnflipping(); break;
      case PLAY_STATE.COLLECTING: this.#tickCollecting(); break;
      case PLAY_STATE.PASS_CONTROLLER:
        // handleStatePassController: with a CPU player in the game the state is left at once, whoever's turn it is
        // (the CPU's, or the human's after a CPU miss); with two humans it waits for A+B or Continue.
        if (this.lastPlayerIsAI) {
          this.state = PLAY_STATE.STILL;
          this.emit('pass-to-ai', { player: this.curTurn });
        }
        break;
      case PLAY_STATE.CLEARED: this.#tickCleared(newKeys); break;
      case PLAY_STATE.GAME_OVER: this.#tickGameOver(); break;
      default: break;
    }
  }

  // handleStateStill, in the original's order: B jumps the cursor, then the CPU, if it is its turn, takes its step, then A
  // turns over the card under the cursor. doAI begins by clearing the new keys of the first pad ("disable the first
  // gamepad while doing AI") and presses A for itself by setting them again, so on the CPU's turn the human's A on that
  // pad is lost, while B and the directions, handled before doAI, are not. The CPU's choice moves the cursor.
  #handleStill(newKeys) {
    if ((newKeys & KEY_B) && this.prng) this.#jumpCursor();
    this.card0FlipFrame = 0;
    let a = (newKeys & KEY_A) !== 0;
    if (this.ai && this.curTurn === this.numPlayers - 1) {
      const decision = this.ai.tick({
        board: this.board,
        selected: this.selected,
        curTurn: this.curTurn,
        prng: this.prng,
      });
      if (decision.action === 'forget') this.emit('ai-forget', { index: decision.forgotten });
      if (this.activePad === 0) a = false;
      if (decision.index >= 0) {
        this.emit('ai-select', { index: decision.index, action: decision.action });
        this.setCursor(decision.index);
        if (this.activePad === 0) a = true;
      }
    }
    if (a) this.#flipAtCursor();
  }

  #tickFlipping() {
    if (this.stateTimer !== 0) {
      this.stateTimer -= 1;
      this.card0FlipFrame = ((this.stateTimer >>> 1) ^ 0x03) + 0x07;
      return;
    }

    const y = this.selected[0];
    if (y < 0) {
      this.card0FlipFrame = 0;
      return;
    }
    this.board[y] |= 0xc0;
    this.rememberState[y] = 1;
    this.emit('flip-complete', { index: y });

    if (this.selected[1] < 0) {
      // Original swaps first opened card into selectedCards+1.
      this.selected[1] = y;
      this.selected[0] = -1;
      this.state = PLAY_STATE.STILL;
      this.card0FlipFrame = 0;
      return;
    }

    const x = this.selected[0];
    const other = this.selected[1];
    const match = cardIdentity(this.board[x]) === cardIdentity(this.board[other]);
    const wasCombo = this.isCombo;
    this.state = match ? PLAY_STATE.COLLECTING : PLAY_STATE.UNFLIPPING;
    this.stateTimer = NTSC.compareFrames;
    this.card0FlipFrame = 0;
    this.isCombo = match ? true : false;
    this.emit(match ? 'pair-match' : 'pair-mismatch', {
      cards: [x, other],
      ...(match ? { combo: wasCombo } : {}),
    });
  }

  #tickUnflipping() {
    if (this.stateTimer !== 0) {
      const oldTimer = this.stateTimer;
      this.stateTimer -= 1;

      // The 6502 compares A after DEC memory; A still contains oldTimer.
      // Thus the Solitaire miss decrement occurs when entering with 89.
      if (oldTimer === 89 && this.scoreMethod === 0 && this.score[this.curTurn] > 0) {
        this.score[this.curTurn] -= 1;
        this.emit('solitaire-miss', { remaining: this.score[this.curTurn] });
        if (this.score[this.curTurn] === 0) {
          this.state = PLAY_STATE.GAME_OVER;
          this.bgcolor = 0x06;
          this.endReason = 'game-over';
          this.emit('game-over', { reason: 'miss-budget', timer: this.stateTimer });
          return;
        }
      }

      if (this.stateTimer >= 6) {
        this.card0FlipFrame = 0;
        return;
      }

      if (this.stateTimer === 5) {
        const y = this.selected[0];
        if (y >= 0) this.board[y] = cardIdentity(this.board[y]) | 0x40;
        this.emit('unflip-start', { index: y });
      }
      this.card0FlipFrame = (this.stateTimer >>> 1) + 8;
      return;
    }

    const y = this.selected[0];
    if (y >= 0) this.board[y] = cardIdentity(this.board[y]) | 0x80;
    this.emit('unflip-complete', { index: y });
    this.selected[0] = -1;

    if (this.selected[1] >= 0) {
      // Unflip the other card with the original six-frame tail.
      this.selected[0] = this.selected[1];
      this.selected[1] = -1;
      this.stateTimer = NTSC.secondUnflipFrames;
      this.card0FlipFrame = 0;
      return;
    }

    this.card0FlipFrame = 0;
    if (this.numPlayers < 2) {
      this.state = this.score[0] === 0 ? PLAY_STATE.DONE : PLAY_STATE.STILL;
      if (this.state === PLAY_STATE.DONE) this.finished = true;
      return;
    }

    this.curTurn = (this.curTurn + 1) % this.numPlayers;
    this.turnChangedAt = this.frame + 1;
    this.state = PLAY_STATE.PASS_CONTROLLER;
    this.emit('turn-pass', { player: this.curTurn });
  }

  #tickCollecting() {
    if (this.stateTimer !== 0) {
      const oldTimer = this.stateTimer;
      this.stateTimer -= 1;

      if (oldTimer === NTSC.collectFirstStart) {
        this.#initCollecting1();
        const firstToCollect = this.selected[1];
        if (firstToCollect >= 0) this.board[firstToCollect] = cardIdentity(this.board[firstToCollect]);
        this.collectProgress[1] = 0;
        this.emit('collect-first-start', { index: firstToCollect });
        this.#clockCollecting1();
      } else if (oldTimer < NTSC.collectFirstStart && oldTimer > NTSC.collectSecondStart) {
        const secondToCollect = this.selected[0];
        if (secondToCollect >= 0) this.board[secondToCollect] = cardIdentity(this.board[secondToCollect]);
        this.#clockCollecting1();
        this.collectProgress[1] = Math.min(1, this.collectProgress[1] + 1 / 12);
      }

      if (oldTimer === NTSC.collectSecondStart) {
        this.#initCollecting2();
        this.collectProgress[0] = 0;
        this.emit('collect-second-start', { index: this.selected[0] });
      } else if (oldTimer < NTSC.collectSecondStart) {
        this.#clockCollecting2();
        this.collectProgress[0] = Math.min(1, this.collectProgress[0] + 1 / 16);
      }
      this.card0FlipFrame = 0;
      return;
    }

    const y = this.selected[0];
    if (y >= 0) this.board[y] = 0;
    this.emit('collect-card', { index: y });
    this.selected[0] = -1;

    if (this.selected[1] >= 0) {
      // The original returns here without reloading stateTimer; next frame
      // removes the other card immediately with timer still zero.
      this.selected[0] = this.selected[1];
      this.selected[1] = -1;
      return;
    }

    this.collectProgress = [0, 0];
    this.collectingX = [0, 0];
    this.collectingY = [0, 0];
    this.collectingDX = 0;
    this.collectingDY = 0;
    if (this.scoreMethod) this.score[this.curTurn] += 1;
    this.emit('score', { player: this.curTurn, score: this.score[this.curTurn] });

    const remaining = this.remainingCards();
    let end = remaining === 0;
    if (!end && this.numPlayers >= 2) {
      const other = this.curTurn ^ 1;
      const maxOther = this.score[other] + (remaining >>> 1);
      end = this.score[this.curTurn] >= maxOther;
    }

    if (!end) {
      if (this.ai) this.ai.resetTurn();
      this.state = PLAY_STATE.STILL;
      return;
    }

    if (this.lastPlayerIsAI && this.numPlayers >= 2 && this.curTurn === this.numPlayers - 1) {
      this.state = PLAY_STATE.GAME_OVER;
      this.stateTimer = NTSC.gameOverFrames;
      this.bgcolor = 0x06;
      this.endReason = 'game-over';
      this.winner = this.curTurn;
      this.emit('game-over', { reason: 'cpu-win', winner: this.winner });
    } else {
      this.state = PLAY_STATE.CLEARED;
      this.clearedAt = this.frame + 1;
      this.stateTimer = NTSC.clearHoldFrames;
      this.endReason = 'cleared';
      this.winner = this.curTurn;
      this.emit('cleared', { winner: this.winner });
    }
  }

  #initCollecting1() {
    for (let slot = 0; slot < 2; slot += 1) {
      const i = this.selected[slot];
      if (i < 0) continue;
      const col = Math.floor(i / 8), row = i & 7;
      this.collectingX[slot] = col * 24 + 24;
      this.collectingY[slot] = row * 24 + 18;
    }
    const a = this.selected[0], b = this.selected[1];
    if (a >= 0 && b >= 0) {
      this.collectingDX = Math.floor(b / 8) - Math.floor(a / 8);
      this.collectingDY = (b & 7) - (a & 7);
    }
  }

  #clockCollecting1() {
    this.collectingY[0] = (this.collectingY[0] + this.collectingDY) & 0xff;
    this.collectingX[0] = (this.collectingX[0] + this.collectingDX) & 0xff;
    this.collectingY[1] = (this.collectingY[1] - this.collectingDY) & 0xff;
    this.collectingX[1] = (this.collectingX[1] - this.collectingDX) & 0xff;
  }

  #initCollecting2() {
    let a = (212 - this.collectingY[0]) & 0xff, carry = 1;
    for (let i = 0; i < 4; i += 1) { carry = a & 1; a >>>= 1; }
    this.collectingDY = (a + carry) & 0xff;

    const targetX = this.curTurn === 0 ? 32 : 144;
    carry = targetX >= this.collectingX[0] ? 1 : 0;
    a = (targetX - this.collectingX[0]) & 0xff;
    let nextCarry = a & 1; a = ((carry << 7) | (a >>> 1)) & 0xff; carry = nextCarry;
    for (let i = 0; i < 3; i += 1) { carry = a & 1; a >>>= 1; }
    this.collectingDX = (a + 0xf0 + carry) & 0xff;
    this.collectingY[1] = 0xf0;
  }

  #clockCollecting2() {
    this.collectingY[0] = (this.collectingY[0] + this.collectingDY) & 0xff;
    this.collectingX[0] = (this.collectingX[0] + this.collectingDX) & 0xff;
  }

  #tickCleared(newKeys) {
    this.stateTimer -= 1;
    if (this.stateTimer <= 0) {
      this.stateTimer = 0;
      this.state = PLAY_STATE.DONE;
      this.finished = true;
      this.endReason ??= 'cleared';
      this.emit('done', { winner: this.winner, reason: this.endReason });
      // handleStateCleared has no return after setting DONE: it falls through into handleStateStill, in the same
      // iteration. B can still jump the cursor (drawing from the generator), and A can turn over a card that is left,
      // which sets the state to FLIPPING again and so keeps play_memory from returning.
      this.#handleStill(newKeys);
      if (this.state !== PLAY_STATE.DONE) this.finished = false;
    }
  }

  #tickGameOver() {
    // 0.02 tests for zero *before* DEC stateTimer. Therefore timer 0 is
    // rendered for one full frame (including the center wipe row) and only
    // the following dispatch enters DONE.
    if (this.stateTimer === 0) {
      this.state = PLAY_STATE.DONE;
      this.finished = true;
      this.endReason = 'game-over';
      this.stateTimer = 0xFF;                 // the DEC after the test still runs
      this.emit('done', { winner: this.winner, reason: this.endReason });
      return;
    }
    this.stateTimer = (this.stateTimer - 1) & 0xff;
  }

  snapshot() {
    return {
      frame: this.frame,
      state: this.state,
      stateTimer: this.stateTimer,
      selected: [...this.selected],
      score: [...this.score],
      curTurn: this.curTurn,
      activePad: this.activePad,
      winner: this.winner,
      finished: this.finished,
      endReason: this.endReason,
      card0FlipFrame: this.card0FlipFrame,
      cursorX: this.cursorX, cursorY: this.cursorY, bgcolor: this.bgcolor,
      collectingX: [...this.collectingX], collectingY: [...this.collectingY],
      board: Array.from(this.board),
      ai: this.ai ? this.ai.snapshot() : null,
    };
  }
}
