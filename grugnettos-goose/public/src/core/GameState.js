export class GameState {
  constructor({ boardId, gameSeed, players, currentPlayerIndex = 0 } = {}) {
    if (!boardId) throw new TypeError('boardId is required');
    if (!Array.isArray(players) || players.length < 2) {
      throw new TypeError('At least two players are required');
    }

    this.boardId = boardId;
    this.gameSeed = gameSeed;
    this.players = players.map((player, index) => ({
      id: player.id ?? `p${index + 1}`,
      name: player.name ?? `Player ${index + 1}`,
      type: player.type ?? 'human',
      symbol: player.symbol ?? ['●', '▲', '■', '◆', '★', '✚'][index % 6],
      position: player.position ?? 0,
      skipTurns: player.skipTurns ?? 0,
      blockedBy: player.blockedBy ?? null,
      blockedSince: player.blockedSince ?? null,
      firstRollDone: player.firstRollDone ?? false
    }));
    this.currentPlayerIndex = currentPlayerIndex;
    this.turnNumber = 1;
    this.status = 'playing';
    this.winnerId = null;
    this.lastRoll = null;
    this.events = [];
    this.rngState = null;
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  findPlayer(id) {
    return this.players.find((player) => player.id === id) ?? null;
  }

  toJSON() {
    return JSON.parse(JSON.stringify({
      boardId: this.boardId,
      gameSeed: this.gameSeed,
      players: this.players,
      currentPlayerIndex: this.currentPlayerIndex,
      turnNumber: this.turnNumber,
      status: this.status,
      winnerId: this.winnerId,
      lastRoll: this.lastRoll,
      events: this.events,
      rngState: this.rngState
    }));
  }

  static fromJSON(snapshot) {
    const state = new GameState({
      boardId: snapshot.boardId,
      gameSeed: snapshot.gameSeed,
      players: snapshot.players,
      currentPlayerIndex: snapshot.currentPlayerIndex
    });
    state.turnNumber = snapshot.turnNumber ?? 1;
    state.status = snapshot.status ?? 'playing';
    state.winnerId = snapshot.winnerId ?? null;
    state.lastRoll = snapshot.lastRoll ?? null;
    state.events = snapshot.events ?? [];
    state.rngState = snapshot.rngState ?? null;
    return state;
  }
}
