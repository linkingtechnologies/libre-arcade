import { RNG } from './RNG.js';
import { Dice } from './Dice.js';
import { GameState } from './GameState.js';
import { RuleEngine } from './RuleEngine.js';
import { TurnManager } from './TurnManager.js';

export class Game {
  constructor({ board, seed, players, snapshot } = {}) {
    if (!board) throw new TypeError('board is required');
    this.board = board;

    if (snapshot) {
      this.state = GameState.fromJSON(snapshot);
      this.rng = new RNG(this.state.gameSeed);
      if (this.state.rngState) this.rng.importState(this.state.rngState);
    } else {
      this.state = new GameState({ boardId: board.id, gameSeed: seed, players });
      this.rng = new RNG(seed);
    }

    this.dice = new Dice(board.dice);
    this.rules = new RuleEngine(board);
    this.turns = new TurnManager(this.state);
    this.syncRngState();
  }

  rollCurrent() {
    if (this.state.status !== 'playing') return [];
    const player = this.state.currentPlayer;
    const roll = this.dice.roll(this.rng);
    const moveEvents = this.rules.applyRoll(this.state, player.id, roll);
    this.syncRngState();

    if (this.state.status === 'finished') return moveEvents;

    const { events: turnEvents } = this.turns.advance();
    this.syncRngState();
    return [...moveEvents, ...turnEvents];
  }

  syncRngState() {
    this.state.rngState = this.rng.exportState();
  }

  save() {
    this.syncRngState();
    return this.state.toJSON();
  }

  static restore({ board, snapshot }) {
    return new Game({ board, snapshot });
  }
}
