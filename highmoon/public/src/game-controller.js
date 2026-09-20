// SPDX-License-Identifier: GPL-3.0-or-later
import { BORDER_WIDTH, MAX_PLANETS, MIN_PLANETS, PI, SCREEN_HEIGHT, SHOOT_POWER_FACTOR } from './constants.js';
import { Vector2, VectorType } from './vector2.js';
import { GlibcRand } from './rng.js';
import { createGalaxy } from './galaxy.js';
import { createHistoricalRuntime, advanceBackgroundVisualRng, advanceGalaxyHistoricalDraw } from './historical-runtime.js';
import { createHistoricalUfos, createComputerSearchState, computerMoveFrame } from './ai.js';
import { GameShot } from './game-shot.js';

export const GameMode = Object.freeze({
  ONE_PLAYER: 'one-player',
  TWO_PLAYER: 'two-player',
  DEMO: 'demo',
});

export const DIFFICULTY_FACTORS = Object.freeze([10, 8, 6, 3, 1]);
export const DIFFICULTY_NAMES = Object.freeze(['Novice', 'Recruit', 'Soldier', 'Officer', 'General']);
export const WINNING_WAIT_FRAMES = 400;

function randomBodyCount(rng) {
  return Math.trunc(rng.random(MAX_PLANETS, MIN_PLANETS, null, 'Playfield.planet_count'));
}

function setPlayerModes(players, mode) {
  players[0].human = mode !== GameMode.DEMO;
  players[1].human = mode === GameMode.TWO_PLAYER;
}

function resetUfo(ufo) {
  // Literal Ufo::reset(): position and shoot angle intentionally survive a new game.
  ufo.shield = 100;
  ufo.bonus = 0;
  ufo.boughtWeapon = 'laser';
  ufo.active = false;
  ufo.locked = false;
}

function activateUfo(ufo) {
  ufo.active = true;
  ufo.locked = false;
  ufo.shootPower = 0;
}

function deactivateUfo(ufo) {
  ufo.active = false;
}

export function buyHistoricalBonus(ufo) {
  if (ufo.bonus <= 0) return false;
  switch (ufo.bonus) {
    case 1:
      ufo.shield += 5;
      ufo.bonus = 0;
      return true;
    case 2:
      if (ufo.boughtWeapon === 'laser') {
        ufo.boughtWeapon = 'heavy';
        ufo.bonus = 0;
        return true;
      }
      return false;
    case 3:
      if (ufo.boughtWeapon === 'laser') {
        ufo.boughtWeapon = 'cluster';
        ufo.bonus = 0;
        return true;
      }
      return false;
    case 4:
      ufo.shield += 25;
      ufo.bonus = 0;
      return true;
    default:
      return false;
  }
}

function addBonus(ufo) {
  ufo.bonus = Math.min(4, ufo.bonus + 1);
}

function makeShotFromUfo(ufo) {
  const start = new Vector2(ufo.x, ufo.y, VectorType.K).plus(new Vector2(60, ufo.shootAngle, VectorType.P));
  const velocity = new Vector2(ufo.shootPower * SHOOT_POWER_FACTOR, ufo.shootAngle, VectorType.P);
  const weapon = ufo.boughtWeapon;
  if (weapon === 'heavy' || weapon === 'cluster') ufo.boughtWeapon = 'laser';
  ufo.locked = true;
  return new GameShot({ weapon, x: start.x, y: start.y, speed: velocity.length, direction: velocity.angle });
}

export class HighMoonGame {
  constructor({
    mode = GameMode.ONE_PLAYER,
    difficulty = 2,
    startupSeed = 12345,
    galaxySeed = 54321,
    objects = 6,
    trace = null,
  } = {}) {
    this.rng = new GlibcRand(1);
    this.runtime = createHistoricalRuntime({ rng: this.rng, startupSeed, galaxySeed, objects, trace });
    this.players = createHistoricalUfos();
    this.mode = mode;
    this.difficulty = difficulty;
    this.activePlayer = 0;
    this.winner = -1;
    this.winnerWait = WINNING_WAIT_FRAMES;
    this.targeting = false;
    this.targetLocked = false;
    this.shot = null;
    this.aiState = createComputerSearchState();
    this.frame = 0;
    this.events = [];
    this.trace = trace;
    this.galaxySeed = galaxySeed;
    this.objects = objects;
    this.newGame(mode);
  }

  emit(event) {
    const e = { frame: this.frame, ...event };
    this.events.push(e);
    this.trace?.(e);
    return e;
  }

  drainEvents() {
    const out = this.events;
    this.events = [];
    return out;
  }

  newGame(mode = this.mode) {
    this.mode = mode;
    setPlayerModes(this.players, mode);
    for (const p of this.players) resetUfo(p);
    this.activePlayer = 0;
    activateUfo(this.players[0]);
    deactivateUfo(this.players[1]);
    this.winner = -1;
    this.winnerWait = WINNING_WAIT_FRAMES;
    this.targeting = false;
    this.targetLocked = false;
    this.shot = null;
    this.aiState = createComputerSearchState();
    this.emit({ event: 'new_game', mode });
  }

  /** Historical TAB warp: preserve stars/visual state, replace only Galaxy and kill Extra. */
  warpGalaxy(seed, objects = null) {
    if (this.shot?.isActive()) return false;
    const bodyCount = objects ?? randomBodyCount(this.rng);
    this.runtime.galaxy = createGalaxy({ max: bodyCount, seed, rng: this.rng, trace: this.trace, collapsed: true });
    this.runtime.visual.extra.wait = 250; // Extra::kill(); waiting intentionally survives.
    this.galaxySeed = seed;
    this.objects = bodyCount;
    this.emit({ event: 'galaxy_warp', seed, objects: bodyCount });
    return true;
  }

  cycleDifficulty() {
    this.difficulty = (this.difficulty + 1) % DIFFICULTY_FACTORS.length;
    this.emit({ event: 'difficulty', index: this.difficulty, factor: DIFFICULTY_FACTORS[this.difficulty] });
  }

  nextPlayer() {
    this.activePlayer = (this.activePlayer + 1) % this.players.length;
    for (const p of this.players) deactivateUfo(p);
    activateUfo(this.players[this.activePlayer]);
    this.targetLocked = false;
    this.targeting = false;
    this.emit({ event: 'turn', player: this.activePlayer });
  }

  checkWinner() {
    let last = 0;
    let dead = 0;
    for (let i = 0; i < this.players.length; i += 1) {
      if (this.players[i].shield <= 0) dead += 1;
      else last = i;
    }
    // Literal HighMoon: simultaneous deaths produce no winner.
    return dead === this.players.length - 1 ? last : -1;
  }

  buyBonus(player = this.players[this.activePlayer]) {
    const before = { bonus: player.bonus, shield: player.shield, weapon: player.boughtWeapon };
    const bought = buyHistoricalBonus(player);
    if (bought) this.emit({ event: 'bonus_bought', player: player.playerId, before, after: { bonus: player.bonus, shield: player.shield, weapon: player.boughtWeapon } });
    return bought;
  }

  fireActivePlayer(source = 'human') {
    if (this.shot?.isActive()) return false;
    const ufo = this.players[this.activePlayer];
    if (!ufo.active) return false;
    this.shot = makeShotFromUfo(ufo);
    this.targetLocked = true;
    this.targeting = false;
    this.emit({ event: 'fire', player: this.activePlayer, source, weapon: this.shot.weapon, power: ufo.shootPower, angle: ufo.shootAngle });
    return true;
  }

  /** SDL_KEYUP bug preserved: any key release fires once targeting became true. */
  releaseAnyKey() {
    if (!this.targeting || this.targetLocked || this.winner !== -1) return false;
    return this.fireActivePlayer('keyup');
  }

  #humanFrame(input) {
    const ufo = this.players[this.activePlayer];
    if (this.targetLocked) return;
    if (input.buyBonusPressed) this.buyBonus(ufo);
    if (input.left) ufo.shootAngle -= PI / 180;
    if (input.right) ufo.shootAngle += PI / 180;
    if (input.up && ufo.y > BORDER_WIDTH) ufo.y -= 2;
    if (input.down && ufo.active && ufo.y < SCREEN_HEIGHT - BORDER_WIDTH) ufo.y += 2;
    if (input.fire) {
      ufo.shootPower += 1;
      if (ufo.shootPower > 100) ufo.shootPower = 100;
      this.targeting = true;
    }
  }

  #cpuFrame() {
    const factor = DIFFICULTY_FACTORS[this.difficulty];
    const result = computerMoveFrame({
      runtime: this.runtime,
      state: this.aiState,
      ufos: this.players,
      playerId: this.activePlayer,
      factor,
      trace: this.trace,
    });
    if (result.fired) {
      // computerMoveFrame has already set locked/power/angle and consumed a
      // purchased weapon exactly as Ufo::calculate_Computer_Move would.
      this.fireActivePlayer('cpu');
    }
  }

  #animateShot() {
    if (!this.shot?.isActive()) return false;

    // Presentation events are derived from state changes after the historical
    // simulation tick. They never feed back into gameplay or RNG.
    const shieldsBefore = this.players.map((p) => p.shield);
    const fragmentsBefore = this.shot.fragments?.length ?? 0;
    const primaryBefore = this.shot.getPrimaryPosition();
    const result = this.shot.tick({ bodies: this.runtime.galaxy.bodies, ufos: this.players, trace: this.trace });
    const primaryAfter = this.shot.getPrimaryPosition();

    for (let i = 0; i < this.players.length; i += 1) {
      if (this.players[i].shield < shieldsBefore[i]) {
        this.emit({
          event: 'damage',
          player: i,
          amount: shieldsBefore[i] - this.players[i].shield,
          shieldBefore: shieldsBefore[i],
          shieldAfter: this.players[i].shield,
          x: this.players[i].x,
          y: this.players[i].y,
        });
      }
    }

    if ((this.shot.fragments?.length ?? 0) > fragmentsBefore) {
      this.emit({ event: 'cluster_spawn', x: this.shot.parent.x, y: this.shot.parent.y, count: this.shot.fragments.length });
    }

    if (result.reason === 'wormhole') {
      this.emit({ event: 'wormhole', x: primaryBefore.x, y: primaryBefore.y, toX: primaryAfter.x, toY: primaryAfter.y, bodyIndex: result.bodyIndex });
    } else if (result.reason === 'storm') {
      const body = this.runtime.galaxy.bodies[result.bodyIndex];
      this.emit({ event: 'storm_contact', x: body?.x ?? primaryAfter.x, y: body?.y ?? primaryAfter.y, bodyIndex: result.bodyIndex });
    } else if (result.reason === 'body_collision') {
      const body = this.runtime.galaxy.bodies[result.bodyIndex];
      this.emit({ event: 'body_impact', x: body?.x ?? primaryAfter.x, y: body?.y ?? primaryAfter.y, bodyIndex: result.bodyIndex });
    }

    if (result.finished) {
      this.emit({ event: 'shot_end', reason: result.reason, weapon: this.shot.weapon });
      this.nextPlayer();
      return true;
    }

    if (this.shot.hitExtra(this.runtime.visual.extra, this.trace)) {
      addBonus(this.players[this.activePlayer]);
      this.emit({ event: 'bonus_collected', player: this.activePlayer, bonus: this.players[this.activePlayer].bonus });
    }
    return false;
  }

  #drawPhase() {
    advanceBackgroundVisualRng(this.runtime.visual, this.runtime.rng, this.trace);
    advanceGalaxyHistoricalDraw(this.runtime.galaxy, this.runtime.visual, this.runtime.rng, this.trace);
    this.shot?.consumeDrawRng(this.runtime.rng, this.trace);
    this.runtime.frames += 1;
  }

  /** One 30 ms historical game-logic frame. */
  step(input = {}) {
    if (input.newMode) this.newGame(input.newMode);
    if (input.cycleDifficulty) this.cycleDifficulty();
    if (input.warpSeed != null && !this.shot?.isActive()) this.warpGalaxy(input.warpSeed, input.warpObjects ?? null);

    // SDL event queue is processed before held-key logic.
    if (input.anyKeyReleased) this.releaseAnyKey();

    if (this.winner === -1) {
      const player = this.players[this.activePlayer];
      if (player.human) this.#humanFrame(input);
      else this.#cpuFrame();
    } else {
      this.winnerWait -= 1;
      if (this.winnerWait === 0) this.newGame(this.mode);
    }

    this.#animateShot();

    const previousWinner = this.winner;
    this.winner = this.checkWinner();
    if (this.winner !== -1 && previousWinner === -1 && this.winnerWait === WINNING_WAIT_FRAMES) {
      this.emit({ event: 'winner', player: this.winner });
    }

    this.#drawPhase();
    this.frame += 1;
    return this.snapshot();
  }

  snapshot() {
    const e = this.runtime.visual.extra;
    return {
      frame: this.frame,
      mode: this.mode,
      difficulty: this.difficulty,
      difficultyName: DIFFICULTY_NAMES[this.difficulty],
      activePlayer: this.activePlayer,
      winner: this.winner,
      winnerWait: this.winnerWait,
      targeting: this.targeting,
      targetLocked: this.targetLocked,
      galaxySeed: this.galaxySeed,
      objects: this.objects,
      rngIndex: this.rng.index,
      galaxy: this.runtime.galaxy,
      extra: { ...e, collisionActive: e.wait <= 50, visible: e.wait < 30 },
      players: this.players.map((p) => ({ ...p })),
      shot: this.shot ? {
        weapon: this.shot.weapon,
        active: this.shot.isActive(),
        projectiles: this.shot.activeProjectiles().map((p) => ({ x: p.x, y: p.y, speed: p.speed, direction: p.direction, movingTime: p.movingTime, weight: p.weight })),
        primary: this.shot.getPrimaryPosition(),
      } : null,
    };
  }
}
