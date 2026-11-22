export class Game {
  constructor({ boardA, boardB, playerA, playerB }) {
    this.boards = [boardA, boardB];
    this.players = [playerA, playerB];
    this.turn = 0;
    this.history = [];
    this.winner = null;
  }

  snapshotFor(playerIndex) {
    const opponent = 1 - playerIndex;
    return {
      playerIndex,
      boardSize: this.boards[opponent].size,
      history: this.history.map(event => ({ ...event, coord: { ...event.coord } }))
    };
  }

  step() {
    if (this.winner !== null) return null;
    const actor = this.turn;
    const target = 1 - actor;
    const coord = this.players[actor].nextShot(this.snapshotFor(actor));
    const result = this.boards[target].fire(coord);
    if (result.repeated) throw new Error(`${this.players[actor].name} repeated shot ${coord.x},${coord.y}`);
    const event = { turn: this.history.length, actor, ...result };
    this.history.push(event);
    this.players[actor].observe?.(event, this.snapshotFor(actor));
    if (this.boards[target].allSunk()) this.winner = actor;
    else this.turn = target;
    return event;
  }

  run(maxTurns = 500) {
    while (this.winner === null && this.history.length < maxTurns) this.step();
    if (this.winner === null) throw new Error('Game did not terminate');
    return { winner: this.winner, turns: this.history.length, history: this.history };
  }
}
