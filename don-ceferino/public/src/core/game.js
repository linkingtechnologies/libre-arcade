import { Ball } from './ball.js';
import { Bomb } from './bomb.js';
import { BreakableBlock } from './block.js';
import { Item } from './item.js';
import { Player } from './player.js';
import { Shot } from './shot.js';
import {
  NORMAL_MESSAGE_PROCESS_TICKS,
  PLAYER_STATE,
  QUICK_MESSAGE_PROCESS_TICKS,
  SHOT_STATE,
  STEP_MS
} from './constants.js';

const NO_INPUT = Object.freeze({left:false,right:false,up:false,down:false,shot:false,sweep:false});

export class Game {
  constructor(levelSet, { rng = Math.random } = {}) {
    this.levelSet = levelSet;
    this.rng = rng;
    this.levelNumber = 1;
    this.points = 0;
    this.lives = 3;
    this.nextExtraLife = 300;
    this.timeBonus = 0;
    this.nowMs = 0;
    this.timerBaseMs = 0;
    this.state = 'level-intro';
    this.flashTicks = 0;
    this.messages = [];
    this.events = [];
    this.playerEnabled = false;
    this.enemiesEnabled = false;
    this.shotsEnabled = false;
    this.loadLevel(1);
  }

  loadLevel(number) {
    const level = this.levelSet.load(number);
    if (!level) {
      this.messages = [];
      this.state = 'finished';
      return false;
    }

    this.level = level;
    this.levelNumber = number;
    this.balls = level.ballSpawns.map(s => new Ball(s));
    this.shots = [];
    this.items = [];
    this.blocks = level.breakables.map(s => new BreakableBlock(s));
    this.bombs = [];
    if (!level.playerSpawn) throw new Error(`Level ${number} has no player marker`);
    this.player = new Player(this, level, level.playerSpawn);
    this.time = 30;
    this.messages = [];
    this.#pauseAll();
    this.#addMessage('level', 'normal', number);
    this.state = 'level-intro';
    return true;
  }

  createShot(x, y, type) {
    this.shots.push(new Shot({x,y,type}));
    this.emitSound('shot');
  }
  createBomb(x, y, flip) {
    this.bombs.push(new Bomb({x,y,flip}));
    this.state = 'bomb';
  }

  drainEvents() {
    const events = this.events;
    this.events = [];
    return events;
  }

  emitSound(name) { this.events.push({ type: 'sound', name }); }

  randomItemType() {
    const n = Math.trunc(10 * this.rng());
    if (n === 0) return 0;
    if (n >= 1 && n <= 3) return 1;
    if (n === 4 || n === 6) return 2;
    if (n >= 7 && n <= 9) return 3;
    return -1;
  }

  spawnRandomItem(x, y) {
    const type = this.randomItemType();
    if (type !== -1) this.items.push(new Item({x,y,type}));
  }

  addScore(value) {
    this.points += value;
    if (this.points > this.nextExtraLife) {
      this.nextExtraLife += 300;
      this.lives++;
    }
  }

  loseLife() {
    this.lives--;
    this.#pauseAll();
    if (this.lives < 0) {
      this.state = 'gameover';
      return;
    }
    this.#addMessage('life-lost', 'normal', Math.trunc(this.rng() * 3));
    this.state = 'life-lost';
  }

  update(input = NO_INPUT) {
    this.nowMs += STEP_MS;
    if (this.flashTicks > 0) this.flashTicks--;

    switch (this.state) {
      case 'paused':
      case 'finished':
      case 'gameover':
        return;
      case 'level-intro':
        this.#updateLevelIntro();
        return;
      case 'life-lost':
        this.#updateLifeLost();
        return;
      case 'time-out':
        this.#updateTimeOut();
        return;
      case 'level-complete':
        this.#updateLevelComplete();
        return;
      case 'bonus-freeze':
        this.#updateBonus(input);
        return;
      case 'bomb':
        this.#updateBomb(input);
        return;
      default:
        this.#updatePlaying(input);
    }
  }

  #updateLevelIntro() {
    if (this.#hasMessages()) {
      this.#updateProcesses(NO_INPUT, false);
      return;
    }
    this.#resumeAll();
    this.state = 'playing';
    this.timerBaseMs = this.nowMs;
  }

  #updateLifeLost() {
    if (this.#hasMessages()) {
      this.#updateProcesses(NO_INPUT, false);
      return;
    }
    this.loadLevel(this.levelNumber);
  }

  #updateTimeOut() {
    if (this.#hasMessages()) {
      this.#updateProcesses(NO_INPUT, false);
      return;
    }
    // The original timeout path first shows "time out", then calls
    // restar_vidas(), which may start the normal life-lost message.
    this.loseLife();
  }

  #updateLevelComplete() {
    if (this.#hasMessages()) {
      this.#updateProcesses(NO_INPUT, false);
      return;
    }
    // Historical code adds remaining time directly; it does not call sumar_puntos(),
    // so this bonus cannot itself award an extra life.
    this.points += this.time;
    this.time = 0;
    this.loadLevel(this.levelNumber + 1);
  }

  #updateBonus(input) {
    if (this.#hasMessages()) {
      this.#updateProcesses(input, true);
      return;
    }

    if (this.timeBonus > 1 && this.balls.length > 0) {
      this.timeBonus--;
      this.#addMessage('bonus', 'quick', this.timeBonus);
      return;
    }

    // Deliberately do not reset timeBonus. The 0.97.8 code leaves it at 1,
    // making later freeze pickups last one quick-message interval longer.
    this.#resumeAll();
    this.timerBaseMs = this.nowMs;
    this.state = 'playing';
  }

  #updateBomb(input) {
    // procesos::hay_bomba() tests the list before procesos::actualizar() prunes
    // dead nodes, yielding one final process tick after the bomb dies.
    if (this.bombs.length > 0) {
      this.#updateProcesses(input, true);
      return;
    }
    this.#resumeAll();
    this.timerBaseMs = this.nowMs;
    this.state = 'playing';
  }

  #updatePlaying(input) {
    this.#processTimer();

    // juego::jugando() still calls procesos::actualizar() and avisar_colisiones()
    // on the exact tick that procesar_tiempo() changes state to timeout.
    this.#updateProcesses(input, true);

    // hay_enemigos() counts list nodes. Dead nodes were pruned at the start of
    // the process update, matching the linked-list implementation.
    if (this.balls.length === 0) {
      this.#addMessage('level-complete', 'normal');
      this.#pauseAll();
      this.state = 'level-complete';
    }
  }

  #processTimer() {
    if (this.nowMs - this.timerBaseMs > 1500) {
      this.time--;
      if (this.time < 0) {
        this.#addMessage('time-out', 'normal');
        this.#pauseAll();
        this.state = 'time-out';
      } else {
        this.timerBaseMs += 1000;
      }
    }
  }

  #updateProcesses(input, collisions) {
    // procesos::actualizar(): remove old nodes first, then update messages,
    // blocks, items, bombs, balls, shots, and finally the player.
    this.#prune();
    this.#tickMessages();

    for (const block of this.blocks) block.update();
    for (const item of this.items) item.update(this.level);

    let bombEnded = false;
    for (const bomb of this.bombs) {
      if (bomb.update(this.level)) {
        bomb.state = -1;
        bombEnded = true;
      }
    }
    if (bombEnded) {
      this.flashTicks = 4;
      // reducir_todos_los_enemigos() walks the pre-existing list only. New
      // children are inserted at the head and are not reduced again this pass.
      for (const ball of [...this.balls]) {
        if (ball.state === 0 && ball.size > 1) this.#hitBall(ball, true);
      }
    }

    for (const ball of this.balls) ball.update(this.level, this.enemiesEnabled);
    if (this.shotsEnabled) {
      for (const shot of this.shots) {
        const sound = shot.update(this.level);
        if (sound) this.emitSound(sound);
      }
    }
    if (this.playerEnabled) this.player.update(input);

    if (collisions) this.#collisions(this.enemiesEnabled);
  }

  #prune() {
    this.balls = this.balls.filter(x => x.state !== -1);
    this.shots = this.shots.filter(x => x.state !== -1);
    this.items = this.items.filter(x => x.state !== -1);
    this.blocks = this.blocks.filter(x => x.state !== -1);
    this.bombs = this.bombs.filter(x => x.state !== -1);
  }

  #addMessage(code, kind, value = null) {
    this.messages.unshift({
      code,
      value,
      ticks: kind === 'quick' ? QUICK_MESSAGE_PROCESS_TICKS : NORMAL_MESSAGE_PROCESS_TICKS
    });
  }

  #tickMessages() {
    for (const message of this.messages) message.ticks--;
    this.messages = this.messages.filter(message => message.ticks > 0);
  }

  #hasMessages() { return this.messages.length > 0; }

  #pauseAll() {
    this.playerEnabled = false;
    this.enemiesEnabled = false;
    this.shotsEnabled = false;
  }

  #pauseEnemies() { this.enemiesEnabled = false; }

  #resumeAll() {
    this.playerEnabled = true;
    this.enemiesEnabled = true;
    this.shotsEnabled = true;
  }

  #hitBall(ball, allowItem = true) {
    const { children, score } = ball.hit();
    if (!score) return;
    this.emitSound('ballHit');
    this.addScore(score);
    for (const child of children) this.balls.push(new Ball(child));
    if (allowItem && children.length) this.spawnRandomItem(ball.x, ball.y);
  }

  #payItem(type) {
    if (type === 0) {
      this.#pauseEnemies();
      return;
    }
    if (type === 3) {
      this.#pauseEnemies();
      this.timeBonus += 2;
      if (this.state !== 'bonus-freeze') this.#addMessage('bonus', 'quick', this.timeBonus);
      this.state = 'bonus-freeze';
    }
  }

  #collisions(enemiesCanHitPlayer) {
    const ballsSnapshot = [...this.balls];
    const shotsSnapshot = [...this.shots];

    for (const ball of ballsSnapshot) {
      if (ball.state !== 0) continue;
      const d = ball.width;
      for (const shot of shotsSnapshot) {
        if (shot.state < 2 && shot.state !== -1 && Math.abs(shot.x - ball.x) < d && shot.y < ball.y && shot.y + shot.h > ball.y) {
          this.#hitBall(ball, true);
          shot.hitBall();
          break;
        }
      }
      // procesos.cc gates only the ball-vs-gaucho test on hab_enemigos.
      // Frozen balls may still be shot, but they cannot hurt Ceferino.
      if (enemiesCanHitPlayer) this.#ballPlayerCollision(ball);
    }

    for (const block of this.blocks) {
      const d = 16;
      for (const shot of shotsSnapshot) {
        if (shot.state === SHOT_STATE.NORMAL && Math.abs(shot.x - block.x) <= d && shot.y <= block.y && shot.y + shot.h >= block.y) {
          if (block.hit(this.level)) this.emitSound('breakBlock');
          shot.hitBlock();
          // bloque::colisiona_con_tiro() rolls for an item even while the block
          // is already in its breaking animation.
          this.spawnRandomItem(block.x, block.y);
          break;
        }
      }
    }

    const xg = this.player.x, yg = this.player.y, wg = 27;
    const short = [PLAYER_STATE.CROUCH, PLAYER_STATE.SWEEP, PLAYER_STATE.SPIN].includes(this.player.state);
    const hg = short ? 30 : 45;
    for (const item of this.items) {
      if (Math.abs(item.x - xg) < 16 + wg && Math.abs(item.y - yg) < 16 + hg) {
        // Historical ordering is important: gaucho::colisiona_con_item() is
        // called on every overlapping tick, even after the item is selected.
        // This notably lets the double-shot pickup increase max_tiros more than
        // once while its selected sprite still overlaps the player.
        this.player.collectItem(item.type);
        if (item.collect()) {
          this.emitSound('item');
          this.#payItem(item.type);
        }
      }
    }
  }

  #ballPlayerCollision(ball) {
    const xg = this.player.x, yg = this.player.y, wg = 27;
    const short = [PLAYER_STATE.CROUCH, PLAYER_STATE.SWEEP, PLAYER_STATE.SPIN].includes(this.player.state);
    const hg = short ? 30 : 45;
    if (Math.abs((xg + 10) - ball.x) >= ball.width + wg || Math.abs((yg - hg) - ball.y) >= ball.width + hg) return;
    for (const posY of [15,25,55,75]) {
      const dx = ball.x - (xg + 10);
      const dy = (ball.y + posY) - yg;
      if (Math.hypot(dx, dy) <= ball.width + 20) {
        this.player.hitBall();
        break;
      }
    }
  }

  pause() {
    if (this.state === 'playing') this.state = 'paused';
  }

  resume() {
    if (this.state === 'paused') {
      this.state = 'playing';
      this.timerBaseMs = this.nowMs;
    }
  }

  // Convenience API retained for embedders; the stock input layer uses the
  // original 0.97.8 semantics (P pauses, action/Enter/Space resumes).
  togglePause() {
    if (this.state === 'paused') this.resume();
    else this.pause();
  }

  continueGame() {
    if (this.state !== 'gameover') return false;
    // 0.97.8 resets score and lives but notably keeps proximo_pago_vida and
    // tiempo_bonus untouched when continuing from Game Over.
    this.points = 0;
    this.lives = 3;
    this.loadLevel(this.levelNumber);
    return true;
  }

  cheatNextLevel() {
    if (this.state !== 'playing') return false;
    this.points += this.time;
    this.time = 0;
    return this.loadLevel(this.levelNumber + 1);
  }

  cheatSuperJump() {
    if (this.state !== 'playing') return false;
    // The C++ code calls nivel->ir_nivel(25) and then pasa_nivel(), so the
    // resulting playable level is 26.
    this.points += this.time;
    this.time = 0;
    return this.loadLevel(26);
  }

  cheatBomb() {
    if (this.state !== 'playing' || this.player.state !== PLAYER_STATE.IDLE) return false;
    this.player.resetAnimation();
    this.player.state = PLAYER_STATE.BOMB;
    return true;
  }

  restartGame() {
    this.points = 0;
    this.lives = 3;
    this.nextExtraLife = 300;
    this.timeBonus = 0;
    this.nowMs = 0;
    this.events = [];
    this.loadLevel(1);
  }
}
