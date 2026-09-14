export class RuleEngine {
  constructor(boardDefinition) {
    this.board = boardDefinition;
    this.tileMap = new Map((boardDefinition.tiles ?? []).map((tile) => [tile.index, tile]));
  }

  applyRoll(state, playerId, roll) {
    if (state.status !== 'playing') throw new Error('Game is not active');

    const player = state.findPlayer(playerId);
    if (!player) throw new Error(`Unknown player: ${playerId}`);
    if (player.id !== state.currentPlayer.id) throw new Error('Not this player\'s turn');
    if (player.skipTurns > 0 || player.blockedBy) throw new Error('Player cannot roll this turn');

    const events = [];
    const turnOrigin = player.position;
    state.lastRoll = { playerId, values: [...roll.values], total: roll.total };
    events.push({ type: 'DICE_ROLLED', playerId, values: [...roll.values], total: roll.total });

    const firstRollDestination = this.resolveFirstRoll(player, roll.values);
    if (firstRollDestination !== null) {
      const from = player.position;
      player.position = firstRollDestination;
      player.firstRollDone = true;
      events.push({ type: 'FIRST_ROLL_SPECIAL', playerId, from, to: player.position });
      this.resolveLanding(state, player, events, firstRollDestination - from, 1);
      return this.finishMove(state, player, events, turnOrigin);
    }

    player.firstRollDone = true;
    const direction = this.moveWithBounce(player, roll.total, events);
    this.resolveLanding(state, player, events, roll.total, direction);
    return this.finishMove(state, player, events, turnOrigin);
  }

  resolveFirstRoll(player, values) {
    if (player.firstRollDone) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const rule = (this.board.firstRollRules ?? []).find((item) => {
      const faces = [...item.faces].sort((a, b) => a - b);
      return faces.length === sorted.length && faces.every((value, index) => value === sorted[index]);
    });
    return rule?.destination ?? null;
  }

  moveWithBounce(player, distance, events) {
    const finish = this.board.finish;
    const from = player.position;
    let target = from + distance;
    let direction = 1;

    if (target > finish && this.board.finishRule?.overflow === 'bounce') {
      const excess = target - finish;
      target = finish - excess;
      direction = -1;
      events.push({ type: 'BOUNCE', playerId: player.id, at: finish, excess, to: target });
    }

    player.position = target;
    events.push({ type: 'TOKEN_MOVED', playerId: player.id, from, to: target, distance, direction });
    return direction;
  }

  resolveLanding(state, player, events, movementDistance, direction, depth = 0) {
    if (depth > 32) throw new Error('Special-tile chain exceeded safety limit');
    if (player.position === this.board.finish) return;

    const tile = this.tileMap.get(player.position);
    if (!tile) return;

    switch (tile.type) {
      case 'goose': {
        const signedDistance = Math.abs(movementDistance) * direction;
        events.push({ type: 'GOOSE_TRIGGERED', playerId: player.id, at: player.position, distance: signedDistance });
        const nextDirection = this.moveRelativeRespectingBounce(player, signedDistance, events);
        this.resolveLanding(state, player, events, Math.abs(movementDistance), nextDirection, depth + 1);
        break;
      }
      case 'bridge':
      case 'maze': {
        const from = player.position;
        player.position = tile.destination;
        events.push({ type: `${tile.type.toUpperCase()}_TRIGGERED`, playerId: player.id, from, to: player.position });
        this.resolveLanding(
          state,
          player,
          events,
          Math.abs(player.position - from),
          Math.sign(player.position - from) || 1,
          depth + 1
        );
        break;
      }
      case 'inn':
        player.skipTurns = tile.skipTurns ?? 2;
        events.push({ type: 'PLAYER_DELAYED', playerId: player.id, turns: player.skipTurns, at: player.position });
        break;
      case 'well':
      case 'prison':
        player.blockedBy = tile.type;
        player.blockedSince = state.turnNumber;
        events.push({ type: 'PLAYER_BLOCKED', playerId: player.id, reason: tile.type, at: player.position });
        break;
      case 'death': {
        const from = player.position;
        player.position = tile.destination ?? this.board.start ?? 0;
        events.push({ type: 'DEATH_TRIGGERED', playerId: player.id, from, to: player.position });
        break;
      }
      default:
        break;
    }
  }

  moveRelativeRespectingBounce(player, signedDistance, events) {
    const finish = this.board.finish;
    const start = this.board.start ?? 0;
    const from = player.position;
    let target = from + signedDistance;
    let direction = Math.sign(signedDistance) || 1;

    if (target > finish) {
      const excess = target - finish;
      target = finish - excess;
      direction = -1;
      events.push({ type: 'BOUNCE', playerId: player.id, at: finish, excess, to: target });
    }

    if (target < start) {
      target = start;
      direction = 1;
    }

    player.position = target;
    events.push({ type: 'TOKEN_MOVED', playerId: player.id, from, to: target, distance: Math.abs(signedDistance), direction });
    return direction;
  }

  finishMove(state, player, events, turnOrigin) {
    if (player.position === this.board.finish) {
      state.status = 'finished';
      state.winnerId = player.id;
      events.push({ type: 'PLAYER_WON', playerId: player.id, at: player.position });
    } else {
      this.resolveReplacementAndSwap(state, player, events, turnOrigin);
    }

    state.events.push(...events);
    return events;
  }

  resolveReplacementAndSwap(state, player, events, turnOrigin) {
    const occupants = state.players.filter(
      (other) => other.id !== player.id && other.position === player.position
    );
    if (occupants.length === 0) return;

    // The classic board should normally have at most one resting occupant.
    // Resolve in player order for deterministic behavior if an imported state is irregular.
    const occupant = occupants[0];

    if (occupant.blockedBy === 'well' || occupant.blockedBy === 'prison') {
      const reason = occupant.blockedBy;
      occupant.blockedBy = null;
      occupant.blockedSince = null;

      // The newcomer stays imprisoned by the special tile already resolved.
      if (!player.blockedBy) {
        player.blockedBy = reason;
        player.blockedSince = state.turnNumber;
        events.push({ type: 'PLAYER_BLOCKED', playerId: player.id, reason, at: player.position });
      }

      events.push({ type: 'PLAYER_RELEASED', playerId: occupant.id, reason, byPlayerId: player.id });
      events.push({ type: 'BLOCKER_REPLACED', playerId: player.id, releasedPlayerId: occupant.id, reason, at: player.position });
      return;
    }

    occupant.position = turnOrigin;
    events.push({
      type: 'PLAYERS_SWAPPED',
      playerId: player.id,
      otherPlayerId: occupant.id,
      playerTo: player.position,
      otherTo: turnOrigin
    });
  }
}
