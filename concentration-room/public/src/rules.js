import { cardIdentity } from './layouts.js';

export const MODE = Object.freeze({
  STORY: 'story',
  SOLITAIRE: 'solitaire',
  TWO_PLAYER: 'two-player',
  VS_CPU: 'vs-cpu',
});

export const TIMING_NTSC = Object.freeze({
  flipFrames: 5,
  compareHoldFrames: 90,
  secondUnflipTailFrames: 6,
  cpuThinkFrames: 30,
  winHoldFrames: 180,
  loseHoldFrames: 90,
});

export function solitaireInitialMisses(difficulty) {
  return 20 * (difficulty + 1);
}

export class RuleCore {
  constructor({ board, mode, difficulty = 0 }) {
    this.board = Uint8Array.from(board);
    this.mode = mode;
    this.difficulty = difficulty;
    this.numPlayers = (mode === MODE.TWO_PLAYER || mode === MODE.VS_CPU) ? 2 : 1;
    this.lastPlayerIsAI = mode === MODE.VS_CPU;
    this.scoreMethod = this.numPlayers >= 2 ? 1 : 0;
    this.score = this.scoreMethod ? [0, 0] : [solitaireInitialMisses(difficulty), 0];
    this.curTurn = 0;
    this.first = -1;
    this.second = -1;
    this.phase = 'ready';
    this.winner = null;
  }

  isFaceDown(index) {
    return (this.board[index] & 0xc0) === 0x80;
  }

  remainingCards() {
    let n = 0;
    for (const value of this.board) if (value & 0x80) n += 1;
    return n;
  }

  flip(index) {
    if (this.phase !== 'ready') return { accepted: false, reason: 'busy' };
    if (!Number.isInteger(index) || index < 0 || index >= this.board.length) {
      return { accepted: false, reason: 'range' };
    }
    if (!this.isFaceDown(index)) return { accepted: false, reason: 'not-face-down' };
    if (index === this.first) return { accepted: false, reason: 'same-card' };

    this.board[index] = cardIdentity(this.board[index]) | 0xc0;
    if (this.first < 0) {
      this.first = index;
      return { accepted: true, result: 'first', index };
    }

    this.second = index;
    const match = cardIdentity(this.board[this.first]) === cardIdentity(this.board[this.second]);
    this.phase = match ? 'pending-match' : 'pending-mismatch';
    return {
      accepted: true,
      result: match ? 'match' : 'mismatch',
      first: this.first,
      second: this.second,
      holdFrames: TIMING_NTSC.compareHoldFrames,
    };
  }

  resolvePair() {
    if (this.phase === 'pending-match') return this.#resolveMatch();
    if (this.phase === 'pending-mismatch') return this.#resolveMismatch();
    return { resolved: false };
  }

  #resolveMatch() {
    this.board[this.first] = 0;
    this.board[this.second] = 0;
    if (this.scoreMethod) this.score[this.curTurn] += 1;
    const previous = [this.first, this.second];
    this.first = -1;
    this.second = -1;

    const remaining = this.remainingCards();
    let ended = remaining === 0;
    if (!ended && this.numPlayers >= 2) {
      const other = this.curTurn ^ 1;
      const maxOtherScore = this.score[other] + (remaining >>> 1);
      ended = this.score[this.curTurn] >= maxOtherScore;
    }

    if (ended) {
      this.phase = 'done';
      if (this.numPlayers === 1) this.winner = 0;
      else this.winner = this.curTurn;
    } else {
      this.phase = 'ready'; // Matching player keeps the turn.
    }
    return { resolved: true, result: 'match', removed: previous, ended, winner: this.winner };
  }

  #resolveMismatch() {
    this.board[this.first] = cardIdentity(this.board[this.first]) | 0x80;
    this.board[this.second] = cardIdentity(this.board[this.second]) | 0x80;
    const previous = [this.first, this.second];
    this.first = -1;
    this.second = -1;

    if (this.scoreMethod === 0) {
      if (this.score[this.curTurn] > 0) this.score[this.curTurn] -= 1;
      if (this.score[this.curTurn] === 0) {
        this.phase = 'done';
        this.winner = null;
        return { resolved: true, result: 'mismatch', previous, ended: true, winner: null };
      }
      this.phase = 'ready';
      return { resolved: true, result: 'mismatch', previous, ended: false };
    }

    this.curTurn = (this.curTurn + 1) % this.numPlayers;
    this.phase = 'pass';
    return { resolved: true, result: 'mismatch', previous, ended: false, passTo: this.curTurn };
  }

  acknowledgePass() {
    if (this.phase !== 'pass') return false;
    this.phase = 'ready';
    return true;
  }
}
