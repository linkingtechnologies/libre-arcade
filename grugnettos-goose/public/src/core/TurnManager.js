export class TurnManager {
  constructor(state) {
    this.state = state;
  }

  advance() {
    if (this.state.status !== 'playing') return { player: null, events: [] };

    const events = [];
    const playerCount = this.state.players.length;
    let loops = 0;
    const loopLimit = Math.max(16, playerCount * 16);

    while (loops < loopLimit) {
      let foundPlayable = false;

      for (let checked = 0; checked < playerCount; checked += 1) {
        this.state.currentPlayerIndex = (this.state.currentPlayerIndex + 1) % playerCount;
        const player = this.state.currentPlayer;

        if (player.blockedBy) {
          events.push({ type: 'BLOCKED_TURN_SKIPPED', playerId: player.id, reason: player.blockedBy });
          continue;
        }

        if (player.skipTurns > 0) {
          player.skipTurns -= 1;
          events.push({ type: 'TURN_SKIPPED', playerId: player.id, remaining: player.skipTurns });
          continue;
        }

        this.state.turnNumber += 1;
        foundPlayable = true;
        this.state.events.push(...events);
        return { player, events };
      }

      if (foundPlayable) break;

      const blocked = this.state.players.filter((player) => player.blockedBy);
      const delayed = this.state.players.some((player) => player.skipTurns > 0);

      if (blocked.length === playerCount && !delayed) {
        const released = [...blocked].sort((a, b) => {
          const at = a.blockedSince ?? Number.MAX_SAFE_INTEGER;
          const bt = b.blockedSince ?? Number.MAX_SAFE_INTEGER;
          if (at !== bt) return at - bt;
          return this.state.players.indexOf(a) - this.state.players.indexOf(b);
        })[0];
        const reason = released.blockedBy;
        released.blockedBy = null;
        released.blockedSince = null;
        events.push({ type: 'SAFETY_RELEASE', playerId: released.id, reason });
      }

      loops += 1;
    }

    throw new Error('Unable to find a playable player');
  }
}
