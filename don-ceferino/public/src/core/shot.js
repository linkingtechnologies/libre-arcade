import { SHOT_STATE, SHOT_TYPE } from './constants.js';

export class Shot {
  constructor({ x, y, type = SHOT_TYPE.SIMPLE }) {
    this.state = SHOT_STATE.NORMAL;
    this.x = x;
    this.y = y - 34;
    this.h = 34;
    this.w = 34;
    this.type = type;
    this.graphicHeight = 34;
    this.startY = y;
    this.life = 0;
  }

  update(level) {
    let sound = null;
    switch (this.state) {
      case SHOT_STATE.ENDING:
      case SHOT_STATE.ENDING_STUCK:
        if (this.life > 7) this.state = SHOT_STATE.DEAD;
        else this.life++;
        break;
      case SHOT_STATE.NORMAL:
        if (level.distanceToCeiling(this.x, this.y, -1) === 0) {
          this.state = this.type === SHOT_TYPE.SIMPLE ? SHOT_STATE.ENDING : SHOT_STATE.STUCK;
          sound = this.type === SHOT_TYPE.SIMPLE ? 'ceiling' : 'hook';
        }
        this.y += level.distanceToCeiling(this.x, this.y, -4);
        break;
      case SHOT_STATE.STUCK:
        this.life++;
        if (this.life > 150) {
          this.life = 0;
          this.state = SHOT_STATE.ENDING_STUCK;
        }
        break;
    }
    this.h = this.startY - this.y + this.graphicHeight;
    return sound;
  }

  hitBall() {
    this.life = 0;
    this.state = this.state === SHOT_STATE.STUCK ? SHOT_STATE.ENDING_STUCK : SHOT_STATE.ENDING;
  }

  hitBlock() {
    this.state = SHOT_STATE.ENDING;
  }
}
