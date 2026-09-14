import { movementPath } from './movementPath.js';

const DIE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export class Animator {
  constructor({ boardEl, startZoneEl, diceEl, finish = 63, reducedMotion = () => false, audio = null } = {}) {
    this.boardEl = boardEl;
    this.startZoneEl = startZoneEl;
    this.diceEl = diceEl;
    this.finish = finish;
    this.reducedMotion = reducedMotion;
    this.audio = audio;
  }

  wait(ms) {
    if (this.reducedMotion()) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  setDice(values) {
    if (!this.diceEl) return;
    this.diceEl.innerHTML = '';
    for (const value of values) {
      const die = document.createElement('span');
      die.className = 'die';
      die.textContent = DIE_FACES[value - 1] ?? DIE_FACES[0];
      this.diceEl.append(die);
    }
  }

  async rollDice(values) {
    this.audio?.dice();
    if (this.reducedMotion()) {
      this.setDice(values);
      return;
    }

    for (let frame = 0; frame < 8; frame += 1) {
      const shown = values.map((finalValue, index) => ((finalValue + frame * 2 + index * 3) % 6) + 1);
      this.setDice(shown);
      this.diceEl?.querySelectorAll('.die').forEach((die) => die.classList.add('die-rolling'));
      await this.wait(48 + frame * 4);
    }
    this.setDice(values);
    this.diceEl?.querySelectorAll('.die').forEach((die) => die.classList.add('die-landed'));
    await this.wait(120);
  }

  locationElement(position) {
    if (position === 0) return this.startZoneEl;
    return this.boardEl?.querySelector(`[data-index="${position}"]`) ?? null;
  }

  tokenElement(playerId) {
    return document.querySelector(`.board-stage .token-${CSS.escape(playerId)}`);
  }

  centerOf(element) {
    const rect = element?.getBoundingClientRect();
    if (!rect) return null;
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }

  async animateTokenPath(playerId, positions, fromPosition = null) {
    if (!positions?.length) return;
    const original = this.tokenElement(playerId);
    if (!original) return;
    if (this.reducedMotion()) {
      // Reduced motion suppresses animation, not useful audio feedback.
      this.audio?.step();
      return;
    }

    const sourceElement = fromPosition === null ? original : this.locationElement(fromPosition);
    const sourceCenter = this.centerOf(sourceElement);
    const tokenRect = original.getBoundingClientRect();
    if (!sourceCenter) return;
    const sourceRect = {
      left: sourceCenter.x - tokenRect.width / 2,
      top: sourceCenter.y - tokenRect.height / 2,
      width: tokenRect.width,
      height: tokenRect.height
    };
    const ghost = original.cloneNode(true);
    ghost.classList.add('moving-token');
    ghost.style.visibility = 'visible';
    ghost.style.width = `${sourceRect.width}px`;
    ghost.style.height = `${sourceRect.height}px`;
    ghost.style.left = `${sourceRect.left}px`;
    ghost.style.top = `${sourceRect.top}px`;
    document.body.append(ghost);
    original.style.visibility = 'hidden';

    let current = { x: sourceRect.left + sourceRect.width / 2, y: sourceRect.top + sourceRect.height / 2 };
    try {
      for (const position of positions) {
        const targetElement = this.locationElement(position);
        const target = this.centerOf(targetElement);
        if (!target) continue;
        const dx = target.x - current.x;
        const dy = target.y - current.y;
        const animation = ghost.animate(
          [
            { transform: 'translate(0, 0) scale(1)' },
            { transform: `translate(${dx}px, ${dy}px) scale(1.12)` }
          ],
          { duration: 125, easing: 'cubic-bezier(.2,.75,.25,1)', fill: 'forwards' }
        );
        await animation.finished.catch(() => {});
        animation.cancel();
        ghost.style.left = `${target.x - sourceRect.width / 2}px`;
        ghost.style.top = `${target.y - sourceRect.height / 2}px`;
        ghost.style.transform = '';
        current = target;
        this.audio?.step();
      }
    } finally {
      original.style.visibility = '';
      ghost.remove();
    }
  }

  async animateDirect(playerId, from, to, className = 'effect-jump') {
    const original = this.tokenElement(playerId);
    const destination = this.locationElement(to);
    if (!original || !destination || this.reducedMotion()) return;

    const sourceElement = this.locationElement(from) ?? original;
    const source = this.centerOf(sourceElement);
    const tokenRect = original.getBoundingClientRect();
    const fromRect = {
      left: source.x - tokenRect.width / 2,
      top: source.y - tokenRect.height / 2,
      width: tokenRect.width,
      height: tokenRect.height
    };
    const target = this.centerOf(destination);
    const ghost = original.cloneNode(true);
    ghost.classList.add('moving-token', className);
    ghost.style.visibility = 'visible';
    ghost.style.width = `${fromRect.width}px`;
    ghost.style.height = `${fromRect.height}px`;
    ghost.style.left = `${fromRect.left}px`;
    ghost.style.top = `${fromRect.top}px`;
    document.body.append(ghost);
    original.style.visibility = 'hidden';

    const start = { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 };
    const dx = target.x - start.x;
    const dy = target.y - start.y;
    const animation = ghost.animate(
      [
        { transform: 'translate(0,0) scale(1)', offset: 0 },
        { transform: `translate(${dx * .5}px, ${dy * .5 - 22}px) scale(1.25)`, offset: .5 },
        { transform: `translate(${dx}px, ${dy}px) scale(1)`, offset: 1 }
      ],
      { duration: 420, easing: 'cubic-bezier(.18,.75,.25,1)', fill: 'forwards' }
    );
    await animation.finished.catch(() => {});
    original.style.visibility = '';
    ghost.remove();
  }

  async pulseTile(position, className = 'effect-flash') {
    const tile = this.locationElement(position);
    if (!tile || this.reducedMotion()) return;
    tile.classList.remove(className);
    void tile.offsetWidth;
    tile.classList.add(className);
    await this.wait(260);
    tile.classList.remove(className);
  }

  makeConfettiLayer() {
    if (!this.boardEl) return null;
    const layer = document.createElement('div');
    layer.className = 'victory-confetti';
    layer.setAttribute('aria-hidden', 'true');

    // Fixed positions/delays keep the effect lively without touching gameplay RNG.
    const pieces = [
      [7, 0, -7, 12], [14, 70, 9, 9], [21, 25, -4, 11], [29, 95, 6, 8],
      [37, 45, -9, 10], [45, 10, 8, 12], [53, 85, -6, 9], [61, 35, 5, 11],
      [69, 120, -8, 8], [77, 55, 7, 10], [85, 5, -5, 12], [92, 100, 4, 9],
      [11, 135, 7, 8], [18, 40, -8, 10], [25, 110, 6, 12], [33, 15, -5, 9],
      [41, 80, 9, 11], [49, 150, -7, 8], [57, 60, 5, 10], [65, 125, -9, 12],
      [73, 20, 8, 9], [81, 90, -6, 11], [89, 160, 4, 8], [96, 50, -7, 10]
    ];

    pieces.forEach(([left, delay, drift, size], index) => {
      const piece = document.createElement('i');
      piece.className = `confetti-piece confetti-${(index % 5) + 1}`;
      piece.style.setProperty('--left', `${left}%`);
      piece.style.setProperty('--delay', `${delay}ms`);
      piece.style.setProperty('--drift', `${drift}vw`);
      piece.style.setProperty('--size', `${size}px`);
      piece.style.setProperty('--spin', `${180 + (index % 6) * 55}deg`);
      layer.append(piece);
    });

    this.boardEl.append(layer);
    return layer;
  }

  makeWinnerGhost(playerId) {
    const original = this.tokenElement(playerId);
    const finishTile = this.locationElement(this.finish);
    const target = this.centerOf(finishTile);
    if (!original || !target) return null;

    const rect = original.getBoundingClientRect();
    const ghost = original.cloneNode(true);
    ghost.classList.add('victory-pawn');
    ghost.style.visibility = 'visible';
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    ghost.style.left = `${target.x - rect.width / 2}px`;
    ghost.style.top = `${target.y - rect.height / 2}px`;
    document.body.append(ghost);
    return ghost;
  }

  async celebrate(playerId) {
    this.audio?.win();
    const finishTile = this.locationElement(this.finish);

    if (this.reducedMotion()) {
      finishTile?.classList.add('victory-finish-static');
      setTimeout(() => finishTile?.classList.remove('victory-finish-static'), 1200);
      return;
    }

    const confetti = this.makeConfettiLayer();
    const winnerGhost = this.makeWinnerGhost(playerId);
    finishTile?.classList.add('victory-finish');
    this.boardEl?.classList.add('board-winner');

    await this.wait(1850);

    confetti?.remove();
    winnerGhost?.remove();
    finishTile?.classList.remove('victory-finish');
    this.boardEl?.classList.remove('board-winner');
  }

  async play(events, { onEventStart, onEvent } = {}) {
    for (const event of events) {
      await onEventStart?.(event);
      switch (event.type) {
        case 'DICE_ROLLED':
          await this.rollDice(event.values);
          break;
        case 'TOKEN_MOVED':
          await this.animateTokenPath(event.playerId, movementPath({
            from: event.from,
            to: event.to,
            distance: event.distance,
            direction: event.direction,
            finish: this.finish
          }), event.from);
          break;
        case 'FIRST_ROLL_SPECIAL':
          await this.animateDirect(event.playerId, event.from, event.to, 'effect-opening');
          break;
        case 'GOOSE_TRIGGERED':
          this.audio?.goose();
          await this.pulseTile(event.at, 'effect-goose');
          break;
        case 'BRIDGE_TRIGGERED':
          this.audio?.bridge();
          await this.animateDirect(event.playerId, event.from, event.to, 'effect-bridge');
          break;
        case 'MAZE_TRIGGERED':
          this.audio?.penalty();
          await this.animateDirect(event.playerId, event.from, event.to, 'effect-maze');
          break;
        case 'DEATH_TRIGGERED':
          this.audio?.death();
          await this.animateDirect(event.playerId, event.from, event.to, 'effect-death');
          break;
        case 'PLAYER_DELAYED':
        case 'PLAYER_BLOCKED':
          this.audio?.penalty();
          await this.pulseTile(event.at, 'effect-penalty');
          break;
        case 'PLAYERS_SWAPPED':
          this.audio?.swap();
          await this.animateDirect(event.otherPlayerId, event.playerTo, event.otherTo, 'effect-swap');
          break;
        case 'PLAYER_WON':
          await this.celebrate(event.playerId);
          break;
        default:
          break;
      }
      await onEvent?.(event);
    }
  }
}
