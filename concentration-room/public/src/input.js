// Frame-based NES pad model used by Concentration Room 0.02.
// read_pads + autorepeat constants are transcribed from src/pads.s.
export const KEY = Object.freeze({
  A: 0x80,
  B: 0x40,
  SELECT: 0x20,
  START: 0x10,
  UP: 0x08,
  DOWN: 0x04,
  LEFT: 0x02,
  RIGHT: 0x01,
});

export const DAS = Object.freeze({ delay: 15, speed: 3 });

export class HistoricalPads {
  constructor() {
    this.current = [0, 0];
    this.previous = [0, 0];
    this.newKeys = [0, 0];
    this.dasKeys = [0, 0];
    this.dasTimer = [0, 0];
  }

  setButton(pad, mask, down) {
    pad &= 1;
    mask &= 0xff;
    if (down) this.current[pad] = (this.current[pad] | mask) & 0xff;
    else this.current[pad] = (this.current[pad] & (~mask)) & 0xff;
  }

  beginFrame(activePad = 0) {
    for (let pad = 0; pad < 2; pad += 1) {
      this.newKeys[pad] = ((~this.previous[pad]) & this.current[pad]) & 0xff;
      this.previous[pad] = this.current[pad];
    }
    this.#autorepeat(activePad & 1);
    return this.snapshot();
  }

  #autorepeat(pad) {
    const cur = this.current[pad];
    if (cur === 0) return;
    if (this.newKeys[pad] !== 0) {
      this.dasKeys[pad] = this.newKeys[pad];
      this.dasTimer[pad] = DAS.delay;
      return;
    }
    this.dasTimer[pad] = (this.dasTimer[pad] - 1) & 0xff;
    if (this.dasTimer[pad] !== 0) return;
    this.dasTimer[pad] = DAS.speed;
    this.newKeys[pad] = ((this.dasKeys[pad] & cur) | this.newKeys[pad]) & 0xff;
  }

  // handleStatePassController scans controller 2 before controller 1.
  passControllerPad() {
    const both = KEY.A | KEY.B;
    for (let pad = 1; pad >= 0; pad -= 1) {
      if ((this.current[pad] & both) === both && (this.newKeys[pad] & both) !== 0) return pad;
    }
    return -1;
  }

  cancelRepeat(pad) {
    this.dasKeys[pad & 1] = 0;
  }

  snapshot() {
    return {
      current: [...this.current],
      newKeys: [...this.newKeys],
      dasKeys: [...this.dasKeys],
      dasTimer: [...this.dasTimer],
    };
  }
}

export function browserPadBinding(key) {
  const k = key.length === 1 ? key.toLowerCase() : key;
  const map = {
    ArrowUp: [0, KEY.UP], ArrowDown: [0, KEY.DOWN], ArrowLeft: [0, KEY.LEFT], ArrowRight: [0, KEY.RIGHT],
    z: [0, KEY.A], x: [0, KEY.B],
    w: [1, KEY.UP], s: [1, KEY.DOWN], a: [1, KEY.LEFT], d: [1, KEY.RIGHT],
    n: [1, KEY.A], m: [1, KEY.B],
  };
  return map[k] ?? null;
}
