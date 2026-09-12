import { STEP_MS } from './constants.js';

export class FixedStepLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.accumulator = 0;
    this.last = 0;
    this.running = false;
    this.frame = this.frame.bind(this);
  }
  start() { this.running = true; this.last = performance.now(); requestAnimationFrame(this.frame); }
  stop() { this.running = false; }
  frame(now) {
    if (!this.running) return;
    this.accumulator += Math.min(250, now - this.last);
    this.last = now;
    while (this.accumulator > STEP_MS) {
      this.update();
      this.accumulator -= STEP_MS;
    }
    this.render(this.accumulator / STEP_MS);
    requestAnimationFrame(this.frame);
  }
}
