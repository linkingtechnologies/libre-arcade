export class CpuPlayer {
  constructor({ delayMs = 650 } = {}) {
    this.delayMs = delayMs;
  }

  canPlay(player) {
    return player?.type === 'cpu';
  }

  async takeTurn(game) {
    if (!this.canPlay(game.state.currentPlayer) || game.state.status !== 'playing') return [];
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return game.rollCurrent();
  }
}
