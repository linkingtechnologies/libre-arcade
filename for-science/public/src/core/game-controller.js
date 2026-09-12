import { BoardModel, uniquePositions } from './board.js';
import { ASSETS, PlayerState, attackRoll } from './player.js';
import { RandomSource } from './random.js';
import { findOriginalMove, chooseOriginalAsset } from '../ai/original-ai.js';
import { attackVisualSpec } from './effects.js';

const TICK_MS = 200; // GameControl.speed = 0.2
const WIDTH = 640;
const HEIGHT = 480;

export class GameController {
  constructor({ renderer, audio, demo = false, rng = new RandomSource(), onExit = () => {}, t = defaultText }) {
    this.renderer = renderer;
    this.audio = audio;
    this.demo = demo;
    this.rng = rng;
    this.onExit = onExit;
    this.t = t;

    this.board = new BoardModel(rng);
    this.players = [new PlayerState(0), new PlayerState(1)];
    this.currentPlayer = 1; // toggled to Dr X by first startTurn(), as original.
    this.selected = [];
    this.phase = 'intro';
    this.turnOver = 0;
    this.turnTime = 100;
    this.turnRemaining = 1;
    this.timerRunning = false;
    this.timerElapsed = 0;
    this.lastUpdateAt = 0;
    this.effect = null;
    this.explosion = null;
    this.boardAnimation = null;
    this.sceneStartedAt = 0;
    this.aiToken = 0;
    this.gameOverText = '';
    this.floatingBonuses = [];
    this.hasShownTip = false;
    this.pointerConsumedThisFrame = false;
  }

  async start() {
    // Original new_board(): Delay(1.0) + MoveTo(..., 2.0), then Ready? for
    // Delay(2.0) + MoveTo(..., 0.5), with the first turn as its callback.
    this.sceneStartedAt = performance.now();
    this.phase = 'intro-wait';
    this.boardAnimation = { type: 'intro-wait', started: this.sceneStartedAt, duration: 1000 };
    await delay(1000);
    if (!this.#isIntroActive()) return;

    this.phase = 'intro-drop';
    this.boardAnimation = { type: 'refill', started: performance.now(), duration: 2000 };
    await delay(2000);
    if (!this.#isIntroActive()) return;

    this.boardAnimation = null;
    this.phase = 'intro-ready';
    this.renderer.showMessage(this.t('game.ready'), 2000, 38, { move: true });
    await delay(2500);
    if (!this.#isIntroActive()) return;
    this.startTurn();
  }

  #isIntroActive() {
    return this.phase !== 'stopped' && this.phase !== 'gameover' && this.phase.startsWith('intro');
  }

  stop() {
    this.phase = 'stopped';
    this.timerRunning = false;
    this.aiToken += 1;
    this.effect = null;
    this.explosion = null;
    this.boardAnimation = null;
  }

  update(now = performance.now()) {
    if (this.explosion && now >= this.explosion.started + this.explosion.duration) {
      this.explosion = null;
    }
    this.floatingBonuses = this.floatingBonuses.filter((item) => now < item.started + item.duration);
    if (!this.timerRunning) return;

    const dt = Math.max(0, now - this.lastUpdateAt);
    this.lastUpdateAt = now;
    this.timerElapsed += dt;

    // Literal upstream behavior: when elapsed > 0.2, discard the overflow,
    // draw the current integer percentage, then decrement it. This makes the
    // effective timeout 101 ticks (roughly 20.2 s), not a continuous 20 s.
    if (this.timerElapsed > TICK_MS) {
      this.timerElapsed = 0;
      this.turnRemaining = Math.max(0, this.turnTime / 100);
      this.turnTime -= 1;
      if (this.turnTime < 0) this.onTurnTimeout();
    }
  }

  startTurn() {
    if (this.phase === 'gameover' || this.phase === 'stopped') return;
    this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
    this.selected = [];
    this.turnTime = 100;
    this.turnRemaining = 1;
    this.timerElapsed = 0;
    this.lastUpdateAt = performance.now();
    this.timerRunning = true;

    const humanTurn = !this.demo && this.currentPlayer === 0;
    this.phase = humanTurn ? 'human' : 'ai';

    if (humanTurn) {
      if (!this.hasShownTip) {
        this.renderer.showMessage(this.t('game.tipHuman'), 4000, 14);
        this.hasShownTip = true;
      }
    } else {
      if (!this.hasShownTip) {
        this.renderer.showMessage(this.t('game.tipDemo'), 4000, 14);
        this.hasShownTip = true;
      }
      const token = ++this.aiToken;
      void this.#runAi(token);
    }
  }

  async #runAi(token) {
    const me = this.players[this.currentPlayer];
    const enemy = this.players[this.currentPlayer === 0 ? 1 : 0];

    const asset = chooseOriginalAsset(me, enemy, this.rng);
    if (asset !== null && asset !== undefined) {
      me.use(asset);
      const msg = this.t(`asset.${ASSETS[asset].id}`);
      if (token !== this.aiToken || this.phase !== 'ai') return;
      this.turnOver = 0;
      this.timerRunning = false;
      this.phase = 'animating';
      this.renderer.showMessage(msg, 1000, 34, { move: true });
      await delay(1500);
      if (token !== this.aiToken || this.phase === 'stopped') return;
      await this.#useAsset(asset);
      return;
    }

    const move = findOriginalMove(this.board, this.rng);
    if (!move.length) {
      // Original AI simply waits for the normal timer to expire.
      return;
    }

    this.selected = move;
    await delay(1500);
    if (token !== this.aiToken || this.phase !== 'ai') return;
    await this.#attemptSwap(move, true);
  }

  endFrame() {
    // GameControl.draw() clears `clicked` once per rendered frame upstream.
    this.pointerConsumedThisFrame = false;
  }

  async handlePointer(clientX, clientY) {
    if (this.phase !== 'human') return;
    const v = this.renderer.canvasToVirtual(clientX, clientY);
    const boardPoint = this.renderer.virtualToBoard(v.x, v.y);

    if (!boardPoint) {
      this.selected = [];
      const asset = this.renderer.virtualToHumanAsset(v.x, v.y);
      if (asset !== null) await this.#humanUseAsset(asset);
      return;
    }

    if (this.pointerConsumedThisFrame) return;
    this.pointerConsumedThisFrame = true;

    if (!this.selected.length) {
      this.selected = [boardPoint];
      return;
    }

    const first = this.selected[0];
    if (first.x === boardPoint.x && first.y === boardPoint.y) {
      this.selected = [];
      return;
    }

    // Upstream deliberately ignores a second cell containing the same tile.
    if (this.board.isSameTile(first, boardPoint)) return;

    const adjacent = Math.abs(first.x - boardPoint.x) + Math.abs(first.y - boardPoint.y) === 1;
    if (!adjacent) return;

    this.selected.push(boardPoint);
    await this.#attemptSwap([...this.selected], false);
  }

  async #attemptSwap(move, fromAi) {
    if (this.phase === 'gameover' || this.phase === 'stopped') return;
    const phaseBefore = this.phase;
    this.phase = 'animating';
    await this.#animateSwap(move);
    if (this.phase === 'stopped' || this.phase === 'gameover') return;

    const result = this.board.validMove(move);
    if (result.positions.length) {
      this.audio.play('score');
      this.timerRunning = false;
      const beforeGrid = this.board.cloneGrid();
      const matched = uniquePositions(result.positions).map(({ x, y }) => ({
        x, y, tile: beforeGrid[y][x],
      }));
      this.#spawnBonusLabels(result.scores);
      const finalScores = this.board.consumeMatch(result.positions, result.scores);
      const holedGrid = this.board.cloneGrid();
      this.board.gravityAndFill();
      this.boardAnimation = buildMatchAnimation(
        holedGrid,
        this.board.cloneGrid(),
        matched,
        this.currentPlayer,
        performance.now(),
      );
      this.selected = [];
      this.turnOver = 0;

      // apply_score() and gravity() both complete after 0.4 seconds upstream.
      await delay(400);
      if (this.phase === 'stopped' || this.phase === 'gameover') return;
      this.players[this.currentPlayer].addScore(finalScores);
      this.boardAnimation = null;
      this.startTurn();
      return;
    }

    // Invalid move: animate the swap back. The turn timer remains scheduled.
    await this.#animateSwap(move);
    if (this.phase === 'stopped' || this.phase === 'gameover') return;
    this.selected = [];
    this.audio.play('error');

    if (fromAi) {
      this.phase = 'ai';
      const token = ++this.aiToken;
      void this.#runAi(token);
    } else {
      this.phase = phaseBefore === 'human' ? 'human' : phaseBefore;
    }
  }

  #spawnBonusLabels(scores) {
    let last = null;
    const started = performance.now();
    for (const { tile, amount, origin } of scores) {
      if (tile === 0 || amount <= 3 || !origin) continue;
      let x = 150 + origin.x * 34;
      let bottomY = 446 - origin.y * 34;
      if (last && x === last.x && bottomY === last.bottomY) bottomY -= 20;
      last = { x, bottomY };
      this.floatingBonuses.push({
        text: `+$${(amount - 3) * 5}`,
        x,
        y: HEIGHT - bottomY,
        started,
        duration: 3000,
        fadeStart: 1500,
      });
    }
  }

  async #animateSwap(move) {
    const [a, b] = move;
    const tileA = this.board.get(a.x, a.y);
    const tileB = this.board.get(b.x, b.y);
    this.board.swap(a, b);
    const animation = {
      type: 'swap',
      started: performance.now(),
      duration: 200,
      a: { ...a },
      b: { ...b },
      tileA,
      tileB,
    };
    this.boardAnimation = animation;
    await delay(200);
    if (this.boardAnimation === animation) this.boardAnimation = null;
  }

  async #humanUseAsset(asset) {
    const me = this.players[this.currentPlayer];
    if (!me.canUse(asset)) {
      this.audio.play('error');
      return;
    }
    me.use(asset);
    const msg = this.t(`asset.${ASSETS[asset].id}`);
    this.turnOver = 0;
    this.timerRunning = false;
    this.phase = 'animating';
    this.renderer.showMessage(msg, 1000, 34, { move: true });
    await delay(1500);
    if (this.phase === 'stopped') return;
    await this.#useAsset(asset);
  }

  async #useAsset(asset) {
    const me = this.players[this.currentPlayer];
    const enemyIndex = this.currentPlayer === 0 ? 1 : 0;
    const enemy = this.players[enemyIndex];

    if (asset === 0) {
      me.applyShieldDelta(-15);
      // Upstream starts the opponent's turn before playing shield.wav.
      this.startTurn();
      this.audio.play('shield');
      return;
    }

    const { damage, targetJitter } = attackRoll(asset, this.rng);
    const player = this.currentPlayer;
    const { sourceBottom, targetBottom, duration, flipX, rotateTurns } =
      attackVisualSpec(asset, player, targetJitter);
    const dstBottom = player === 0 ? [WIDTH - 75, 75] : [75, 75];

    const audioNames = { 1: 'cow', 2: 'meteorite', 3: 'rocket', 4: 'laser' };
    this.audio.play(audioNames[asset]);
    this.effect = {
      assetIndex: asset,
      from: bottomToCanvas(sourceBottom),
      to: bottomToCanvas(targetBottom),
      started: performance.now(),
      duration,
      fadeDuration: 200,
      flipX,
      rotateTurns,
    };

    await delay(duration);
    if (this.phase === 'stopped') return;

    enemy.applyShieldDelta(damage);
    this.explosion = {
      at: bottomToCanvas(dstBottom),
      started: performance.now(),
      duration: 2000,
    };
    this.audio.play('explosion');

    // Projectile/line then FadeOut(0.2) + Delay(1.0).
    await delay(200);
    this.effect = null;
    await delay(1000);
    if (this.phase === 'stopped') return;

    if (enemy.shield > 0) {
      this.startTurn();
    } else {
      await this.#endGameSequence();
    }
  }

  onTurnTimeout() {
    if (!['human', 'ai'].includes(this.phase)) return;
    this.phase = 'animating';
    this.timerRunning = false;
    this.aiToken += 1;
    this.audio.play('endturn');
    this.turnOver += 1;
    this.selected = [];

    if (this.turnOver === 2) {
      this.turnOver = 0;
      this.renderer.showMessage(this.t('game.newBoard'), 1000, 36, { move: true });
      void this.#shuffleBoard();
    } else {
      // Important upstream quirk: the next turn starts immediately while the
      // Timeout! label remains on screen for its own 1.5 second action.
      this.renderer.showMessage(this.t('game.timeout'), 1000, 36, { move: true });
      this.startTurn();
    }
  }

  async #shuffleBoard() {
    this.audio.play('shield');
    this.phase = 'animating';
    this.boardAnimation = { type: 'fade', started: performance.now(), duration: 300 };
    await delay(300);
    if (this.phase === 'stopped' || this.phase === 'gameover') return;

    this.board.newBoard();
    this.boardAnimation = { type: 'refill', started: performance.now(), duration: 400 };
    await delay(400);
    if (this.phase === 'stopped' || this.phase === 'gameover') return;
    this.boardAnimation = null;
    this.startTurn();
  }

  async #endGameSequence() {
    // on_end_of_game(): fade all board sprites for 0.3s without gravity.
    this.phase = 'animating';
    this.boardAnimation = { type: 'fade', started: performance.now(), duration: 300 };
    await delay(300);
    if (this.phase === 'stopped') return;
    this.boardAnimation = { type: 'hidden', started: performance.now(), duration: Infinity };
    this.#gameOver();
  }

  #gameOver() {
    this.phase = 'gameover';
    this.timerRunning = false;
    this.aiToken += 1;

    if (this.demo) {
      // Demo mode only shows the lower message upstream; the central game-over
      // label belongs to the non-demo branch.
      this.gameOverText = '';
      const message = this.currentPlayer === 0 ? this.t('game.drXWon') : this.t('game.drZWon');
      this.renderer.showMessage(message, 10_000, 36);
      setTimeout(() => {
        if (this.phase === 'gameover') this.onExit();
      }, 10_300);
      return;
    }

    if (this.currentPlayer === 0) {
      this.gameOverText = this.t('game.youWon');
      this.audio.startMusic();
      this.renderer.showMessage(this.t('game.thanks'), 20_000, 24, { move: true });
      setTimeout(() => {
        if (this.phase === 'gameover') this.onExit();
      }, 20_500);
    } else {
      this.gameOverText = this.t('game.gameOver');
      this.renderer.showMessage(this.t('game.youLose'), 10_000, 32, { move: true });
      setTimeout(() => {
        if (this.phase === 'gameover') this.onExit();
      }, 10_500);
    }
  }
}

function defaultText(key) {
  const text = {
    'game.ready': 'Ready?',
    'game.tipHuman': 'click 2 adjacent cells to swap',
    'game.tipDemo': 'press ESC to leave the demo',
    'game.newBoard': 'New Board',
    'game.timeout': 'Timeout!',
    'game.drXWon': 'Dr X Won!',
    'game.drZWon': 'Dr Z Won!',
    'game.youWon': 'You Won!',
    'game.gameOver': 'Game Over',
    'game.thanks': 'Thanks for playing!',
    'game.youLose': 'You lose!',
    'asset.shield': 'Shield UP!',
    'asset.cow': 'Orbital Cow!',
    'asset.meteorite': 'Meteor Burst!',
    'asset.rocket': 'Rocket!',
    'asset.laser': 'Laser Beam!',
  };
  return text[key] ?? key;
}

function buildMatchAnimation(holedGrid, finalGrid, matched, player, started) {
  const height = holedGrid.length;
  const width = holedGrid[0].length;
  const survivors = [];
  const fills = [];

  for (let x = 0; x < width; x += 1) {
    let destinationY = height - 1;
    for (let sourceY = height - 1; sourceY >= 0; sourceY -= 1) {
      const tile = holedGrid[sourceY][x];
      if (tile === null || tile === undefined) continue;
      survivors.push({ tile, x, fromY: sourceY, toY: destinationY });
      destinationY -= 1;
    }
    for (let y = destinationY; y >= 0; y -= 1) {
      fills.push({ tile: finalGrid[y][x], x, y });
    }
  }

  return {
    type: 'match',
    started,
    duration: 400,
    gravityDuration: 200,
    matched,
    survivors,
    fills,
    tileDestination: player === 0 ? { x: 80, y: 30 } : { x: 560, y: 30 },
  };
}

function bottomToCanvas([x, y]) {
  return { x, y: HEIGHT - y };
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
