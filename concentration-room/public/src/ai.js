/*
 * Frame-faithful transcription of Concentration Room 0.02 "Artificial idiocy".
 * Source: reference/ConcentrationRoom-0.02/source/src/aidiocy.s; checked against the ROM by tools/rom-oracle.mjs
 */
import { FIELD_SIZE } from './layouts.js';

export const AI_STATE = Object.freeze({
  START: 0,
  FORGET: 1,
  FIND_KNOWN_PAIR: 2,
  FIND_MATCH_FOR: 3,
});

function isPresent(value) { return (value & 0x80) !== 0; }
function isFaceDown(value) { return (value & 0xc0) === 0x80; }

export function randomRemainingCard(board, prng) {
  prng.randomBits(8);
  const present = [];
  for (let y = FIELD_SIZE - 1; y >= 0; y -= 1) {
    if (isPresent(board[y])) present.push(y);
  }
  if (!present.length) return -1;
  // aidiocy.s randomCard reduces rand3 modulo the current card count,
  // then maps ordinal 0 to the highest-numbered present slot.
  return present[prng.rand3 % present.length];
}

export class ArtificialIdiocy {
  constructor({ noiseLevel = 8, rememberState = null } = {}) {
    this.noiseLevel = noiseLevel & 0xff;
    this.remember = rememberState ?? new Uint8Array(FIELD_SIZE);
    this.state = AI_STATE.START;
    this.timer = 0;
  }

  resetTurn() {
    this.state = AI_STATE.START;
    this.timer = 0;
  }

  observe(index) {
    if (Number.isInteger(index) && index >= 0 && index < FIELD_SIZE) this.remember[index] = 1;
  }

  // Compatibility helper retained for deterministic oracle tests: returns a remembered pair
  // using the same high-to-low scan direction as the 0.02 AI.
  findKnownPair(board) {
    for (let hi = FIELD_SIZE - 1; hi >= 1; hi -= 1) {
      if (!this.remember[hi] || !isPresent(board[hi])) continue;
      for (let lo = hi - 1; lo >= 0; lo -= 1) {
        if (board[lo] === board[hi] && this.remember[lo]) return [lo, hi];
      }
    }
    return null;
  }

  snapshot() {
    return { state: this.state, timer: this.timer, noiseLevel: this.noiseLevel };
  }

  // Exact randomCard policy from 0.02: random byte modulo number of cards,
  // then map the result onto present cards while scanning slot 71 down to 0.
  randomRemainingCard(board, prng) {
    return randomRemainingCard(board, prng);
  }

  forgetOne(prng) {
    prng.randomBits(8);
    let y = prng.rand3;
    if (y >= 144) y -= 144;
    if (y >= 72) y -= 72;
    this.remember[y] = 0;
    return y;
  }

  // One call corresponds to one invocation of doAI from handleStateStill.
  // Returns a board index when the original would synthesize KEY_A this frame.
  tick({ board, selected, curTurn, prng }) {
    switch (this.state) {
      case AI_STATE.START:
        this.timer = this.noiseLevel;
        this.state = AI_STATE.FORGET;
        return { index: -1, action: 'start' };

      case AI_STATE.FORGET:
        if (this.timer > 0) {
          this.timer -= 1;
          return { index: -1, action: 'forget', forgotten: this.forgetOne(prng) };
        }
        // The 6502 falls straight through to FIND_KNOWN_PAIR on this frame.
        this.state = AI_STATE.FIND_KNOWN_PAIR;
        this.timer = FIELD_SIZE;
        return this.#findKnownPairStep(board, prng);

      case AI_STATE.FIND_KNOWN_PAIR:
        return this.#findKnownPairStep(board, prng);

      case AI_STATE.FIND_MATCH_FOR:
        if (this.timer > 0) {
          this.timer -= 1;
          return { index: -1, action: 'think' };
        }
        return this.#findMatchFor(board, selected, curTurn, prng);

      default:
        throw new Error(`Invalid AI state ${this.state}`);
    }
  }

  #findKnownPairStep(board, prng) {
    let y = this.timer - 1;
    if (y <= 0) return this.#noKnownPairs(board, prng);

    while (true) {
      if (this.remember[y] && isPresent(board[y])) {
        const value = board[y];
        this.timer = y;
        y -= 1;
        if (y < 0) throw new Error('0.02 AI invariant failed while finding second remembered card');
        while (y >= 0) {
          if (board[y] === value) {
            if (this.remember[y]) {
              this.state = AI_STATE.FIND_MATCH_FOR;
              this.timer = 30;
              return { index: y, action: 'known-pair-first' };
            }
            // Original returns immediately and resumes below the high card next frame.
            return { index: -1, action: 'known-match-not-remembered' };
          }
          y -= 1;
        }
        return { index: -1, action: 'known-card-no-lower-match' };
      }

      y -= 1;
      if (y < 0) throw new Error('0.02 AI invariant failed while scanning remembered cards');
      if (y === 0) {
        this.timer = 0;
        return { index: -1, action: 'scan-bottom' };
      }
    }
  }

  #noKnownPairs(board, prng) {
    let y = this.randomRemainingCard(board, prng);
    if (y < 0) return { index: -1, action: 'no-cards' };

    for (let x = 0; x < FIELD_SIZE; x += 1) {
      if (isPresent(board[y]) && !this.remember[y]) {
        this.state = AI_STATE.FIND_MATCH_FOR;
        this.timer = 30;
        return { index: y, action: 'unknown-first' };
      }
      y = y > 0 ? y - 1 : FIELD_SIZE - 1;
    }

    // Original intentionally uses the current Y if every remaining card is known.
    this.state = AI_STATE.FIND_MATCH_FOR;
    this.timer = 30;
    return { index: y, action: 'all-known-first' };
  }

  #findMatchFor(board, selected, curTurn, prng) {
    const first = selected[1];
    if (first < 0) throw new Error('0.02 AI expected first selected card');
    const target = (board[first] & 0xbf) | 0x80;

    let match = -1;
    for (let y = FIELD_SIZE - 1; y >= 0; y -= 1) {
      if (board[y] === target) {
        match = y;
        break;
      }
    }

    if (match >= 0 && this.remember[match]) {
      this.state = AI_STATE.START;
      this.timer = 0;
      return { index: match, action: 'remembered-second' };
    }

    // Match is not remembered (or defensive fallback): choose the historical
    // nearby start offset (+8 or +64), then scan downward/wrap.
    prng.randomBits(1);
    let y = (first + ((prng.rand3 & 1) ? 64 : 8)) % FIELD_SIZE;
    for (let x = 0; x < FIELD_SIZE; x += 1) {
      const allowedMemory = curTurn !== 0 || !this.remember[y];
      if (isFaceDown(board[y]) && allowedMemory) {
        this.state = AI_STATE.START;
        this.timer = 0;
        return { index: y, action: 'unknown-second' };
      }
      y = y > 0 ? y - 1 : FIELD_SIZE - 1;
    }

    throw new Error('0.02 AI could not find a legal second card');
  }
}
