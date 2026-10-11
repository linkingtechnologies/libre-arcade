import { JavaRandom } from './rng.js';

export const TICK_MS = 141;
export const BLOCK = 8;
export const BUILDING_COUNT = 26;
export const SCREEN_WIDTH = 240;
export const SCREEN_HEIGHT = 320;

export class BomberGame {
  constructor({seed = Date.now()} = {}) {
    this.rng = new JavaRandom(seed);
    this.scoreRecord = 0;
    this.score = 0;
    this.landings = 0;
    this.bombStatus = 0;
    this.crashFrame = 0;
    this.state = 'startup';
  }

  completeStartup() { this.resetToTitle(); }

  resetToTitle() {
    if ((this.score ?? 0) > this.scoreRecord) this.scoreRecord = this.score;
    this.state = 'title';
    this.score = this.score ?? 0;
    this.landings = this.landings ?? 0;
    this.bombStatus = 0;
    this.crashFrame = 0;
  }

  newGame() {
    this.score = 0;
    this.landings = 0;
    this.initLevel();
    this.state = 'city-intro';
  }

  initLevel() {
    this.planeX = 22;
    this.planeY = 0;
    this.planeFrame = 0;
    this.bombStatus = 0;
    this.bombX = 0;
    this.bombY = 0;
    this.bombLife = 0;
    this.buildingHeights = [];
    this.buildingCaps = [];
    this.buildingColours = [];
    for (let i=0; i<BUILDING_COUNT; i++) {
      const h = this.rng.nextInt(this.landings * 3 + 8) + 1;
      this.buildingHeights[i] = h;
      this.buildingCaps[i] = h > 4 ? this.rng.nextInt(2) + 1 : 0;
      this.buildingColours[i] = this.rng.nextInt(7);
    }
  }

  beginPlay() { this.state = 'playing'; }

  randomCrashFrame() {
    this.planeFrame = 1 + this.rng.nextInt(3);
    return this.planeFrame;
  }

  tick(inputHeld = false) {
    if (this.state !== 'playing') return {event:null};

    if (this.planeY >= 29) {
      if (this.planeX === 0) {
        this.state = 'success';
        return {event:'success'};
      }
      this.planeY = 0;
      this.planeX--;
    } else if (this.planeY < BUILDING_COUNT - 1 && this.buildingHeights[this.planeY] - 1 >= this.planeX) {
      this.state = 'crash';
      this.crashFrame = 0;
      return {event:'crash'};
    } else {
      this.planeY++;
    }

    if (this.bombStatus === 0 && inputHeld && this.planeY >= 3) {
      this.bombStatus = 1;
      this.bombX = this.planeX - 1;
      this.bombY = this.planeY;
      this.bombLife = 0;
    }

    let event = null;
    if (this.bombStatus === 1) {
      if (this.bombX < 0) {
        this.bombStatus = 0;
      } else if (
        this.bombY >= 3 && this.bombY < BUILDING_COUNT + 3 &&
        this.buildingHeights[this.bombY - 3] >= this.bombX &&
        this.buildingHeights[this.bombY - 3] > 0
      ) {
        this.bombStatus = 0;
        const column = this.bombY - 3;
        let destroyed = 0;
        // Intentional parity: original does not re-check building height inside this loop.
        for (let i=0; i<3 && this.bombX >= 0; i++) {
          this.buildingHeights[column]--;
          this.buildingCaps[column] = 3;
          this.bombX--;
          this.score++;
          destroyed++;
        }
        return {event:'impact', destroyed, blockingMs:destroyed * 25};
      } else {
        if (this.bombX <= 0) this.bombStatus = 0;
        this.bombX--;
        this.bombLife++;
        event = 'bomb-fall';
      }
    } else {
      event = 'motor';
    }
    return {event, blockingMs:0};
  }

  completeSuccess() {
    this.landings++;
    this.initLevel();
    this.state = 'city-intro';
  }

  completeCrash() {
    if (this.score > this.scoreRecord) this.scoreRecord = this.score;
    this.state = 'title';
  }
}
