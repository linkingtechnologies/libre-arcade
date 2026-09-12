import { PLAYER_STATE, SHOT_TYPE } from './constants.js';

const ANIMS = [
  [0], [1,2,1,0,3,4,3,0], [5,6,7], [13,13,13,13,13,13,13],
  [], [8,9,8,10], [14], [15], [11,11], [19,20,21,22,23], [19,20,21,22,23], [16,17,17,18]
];

export class Player {
  constructor(game, level, { x, y }) {
    this.game = game;
    this.level = level;
    this.x = x;
    this.y = y;
    this.flip = 1;
    this.delay = 0;
    this.animStep = 0;
    this.maxShots = 1;
    this.shotType = SHOT_TYPE.SIMPLE;
    this.shotHeld = false;
    this.velocity = 1;
    this.state = level.distanceToFloor(x, y, 1) > 0 ? PLAYER_STATE.FALL : PLAYER_STATE.IDLE;
  }

  get frame() { return ANIMS[this.state]?.[this.animStep] ?? 0; }
  resetAnimation() { this.delay = 0; this.animStep = 0; }
  advanceAnimation() {
    const anim = ANIMS[this.state] || [0];
    if (this.delay > 5) {
      if (this.animStep + 1 >= anim.length) {
        this.animStep = 0; this.delay = 0; return true;
      }
      this.animStep++; this.delay = 0;
    } else this.delay++;
    return false;
  }

  // procesos::get_cant_tiros() counts list nodes even if a shot became DEAD earlier
  // in the same tick; pruning only happens at the start of the next process update.
  canShoot() { return this.game.shots.length < this.maxShots && !this.shotHeld; }
  shoot() { this.shotHeld = true; this.game.createShot(this.x + 7, this.y - 10, this.shotType); }

  update(input) {
    switch (this.state) {
      case PLAYER_STATE.IDLE: this.#idle(input); break;
      case PLAYER_STATE.WALK: this.#walk(input); break;
      case PLAYER_STATE.SHOOT: if (this.advanceAnimation()) this.state = PLAYER_STATE.IDLE; break;
      case PLAYER_STATE.DYING: if (this.advanceAnimation()) this.state = PLAYER_STATE.IDLE; break;
      case PLAYER_STATE.CLIMB: this.#climb(input); break;
      case PLAYER_STATE.CROUCH: this.#crouch(input); break;
      case PLAYER_STATE.FALL: this.#fall(input, false); break;
      case PLAYER_STATE.SWEEP:
      case PLAYER_STATE.SPIN: this.#sweep(input); break;
      case PLAYER_STATE.FALL_SPIN: this.#fall(input, true); break;
      case PLAYER_STATE.BOMB: this.#bomb(); break;
    }
  }

  #idle(input) {
    if (input.left || input.right) { this.resetAnimation(); this.state = PLAYER_STATE.WALK; return; }
    if (input.shot && this.canShoot()) { this.resetAnimation(); this.shoot(); this.state = PLAYER_STATE.SHOOT; return; }
    if (!input.shot) this.shotHeld = false;
    if (input.up && this.level.isLadder(this.x, this.y - 7)) { this.resetAnimation(); this.state = PLAYER_STATE.CLIMB; return; }
    if (input.down) {
      this.resetAnimation();
      this.state = this.level.isLadder(this.x, this.y + 1) ? PLAYER_STATE.CLIMB : PLAYER_STATE.CROUCH;
      return;
    }
    if (input.sweep) { this.resetAnimation(); this.state = PLAYER_STATE.SWEEP; }
    this.advanceAnimation();
  }

  #walk(input) {
    if (input.left) { this.flip = -1; this.x += this.level.distanceToWall(this.x, this.y - 8, -2); }
    else if (input.right) { this.flip = 1; this.x += this.level.distanceToWall(this.x + 20, this.y - 8, 2); }
    else { this.resetAnimation(); this.state = PLAYER_STATE.IDLE; }

    if (input.shot && this.canShoot()) { this.resetAnimation(); this.shoot(); this.state = PLAYER_STATE.SHOOT; return; }
    if (!input.shot) this.shotHeld = false;
    this.advanceAnimation();
    if (this.level.distanceToFloor(this.x, this.y, 1) > 0) { this.resetAnimation(); this.state = PLAYER_STATE.FALL; }
    if (input.sweep) { this.resetAnimation(); this.state = PLAYER_STATE.SWEEP; }
    if (input.up && this.level.isLadder(this.x, this.y - 7)) { this.resetAnimation(); this.state = PLAYER_STATE.CLIMB; return; }
    if (input.down) {
      this.resetAnimation();
      this.state = this.level.isLadder(this.x, this.y + 3) ? PLAYER_STATE.CLIMB : PLAYER_STATE.CROUCH;
    }
  }

  #climb(input) {
    this.flip = 1;
    this.x = Math.trunc(this.x / 32) * 32 + 9;
    if (input.up) {
      this.advanceAnimation(); this.y -= 1;
      if (!this.level.isLadder(this.x, this.y - 7)) { this.resetAnimation(); this.state = PLAYER_STATE.IDLE; }
    }
    if (input.down) {
      this.advanceAnimation(); this.y += 1;
      if (!this.level.isLadder(this.x, this.y - 6)) { this.resetAnimation(); this.state = PLAYER_STATE.IDLE; }
    }
  }

  #crouch(input) {
    if (!input.down) { this.resetAnimation(); this.state = PLAYER_STATE.IDLE; }
    if (input.shot && this.canShoot()) { this.resetAnimation(); this.shoot(); this.state = PLAYER_STATE.SHOOT; return; }
    if (input.sweep) { this.resetAnimation(); this.state = PLAYER_STATE.SWEEP; }
  }

  #fall(input, spinning) {
    this.velocity += 0.1;
    const dy = this.level.distanceToFloor(this.x, this.y, Math.trunc(this.velocity));
    this.y += dy;
    if (dy < Math.trunc(this.velocity)) {
      this.velocity = 0; this.resetAnimation(); this.state = PLAYER_STATE.IDLE; this.y += 6;
    }
    // Keep the historical x-15 probe on both directions.
    if (input.left) this.x += this.level.distanceToWall(this.x - 15, this.y - 8, -1);
    if (input.right) this.x += this.level.distanceToWall(this.x - 15, this.y - 8, 1);
    if (spinning) this.advanceAnimation();
  }

  #sweep(input) {
    if (this.flip === 1) this.x += this.level.distanceToWall(this.x + 20, this.y - 8, 7);
    else this.x += this.level.distanceToWall(this.x, this.y - 8, -7);

    if (this.level.distanceToFloor(this.x, this.y, 1) > 0) { this.resetAnimation(); this.state = PLAYER_STATE.FALL_SPIN; }
    if (!input.sweep) {
      this.resetAnimation();
      this.state = this.level.distanceToFloor(this.x, this.y, 1) > 0 ? PLAYER_STATE.FALL : PLAYER_STATE.IDLE;
    }
    if (this.advanceAnimation() && this.state === PLAYER_STATE.SWEEP) this.state = PLAYER_STATE.SPIN;
  }

  #bomb() {
    if (this.advanceAnimation()) {
      this.game.createBomb(this.x, this.y, this.flip);
      this.resetAnimation(); this.state = PLAYER_STATE.IDLE;
    }
  }

  hitBall() {
    if (this.state !== PLAYER_STATE.DYING) {
      this.game.loseLife();
      this.game.emitSound('lose');
      this.resetAnimation(); this.state = PLAYER_STATE.DYING;
    }
  }

  collectItem(type) {
    if (type === 0) { this.resetAnimation(); this.state = PLAYER_STATE.BOMB; }
    else if (type === 1) this.maxShots++;
    else if (type === 2) this.shotType = SHOT_TYPE.TRIDENT;
  }
}
