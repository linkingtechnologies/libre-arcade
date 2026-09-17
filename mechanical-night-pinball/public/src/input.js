const KEYMAP = {
  ArrowLeft: 'left',
  KeyZ: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyM: 'right',
  KeyL: 'right',
  ArrowDown: 'launch',
  Space: 'restart',
};

export class InputController {
  constructor() {
    this.down = { left:false, right:false, launch:false, restart:false };
    this.pressed = { left:false, right:false, launch:false, restart:false };
    this.released = { left:false, right:false, launch:false, restart:false };

    // Browser input can deliver keydown+keyup between two fixed physics ticks.
    // Keep a separate edge queue so a short tap becomes one KEY_DOWN physics tick
    // followed by one KEY_UP physics tick, matching the SDL KEY_STATE model.
    this.physicsDown = { left:false, right:false, launch:false, restart:false };
    this.physicsEdges = { left:[], right:[], launch:[], restart:[] };

    this._handlers = [];
    this._pointerButtons = new Set();
    // Multiple physical inputs may map to the same logical action. Keep them
    // aggregated so releasing A does not release the left flipper while ← or Z
    // is still held (same for right-side aliases and touch input).
    this._activeSources = {
      left:new Set(), right:new Set(), launch:new Set(), restart:new Set(),
    };
  }

  attachKeyboard(target = window) {
    const onKeyDown = (event) => {
      const action = KEYMAP[event.code];
      if (!action) return;
      event.preventDefault();
      this.setSource(action, `kbd:${event.code}`, true);
    };
    const onKeyUp = (event) => {
      const action = KEYMAP[event.code];
      if (!action) return;
      event.preventDefault();
      this.setSource(action, `kbd:${event.code}`, false);
    };
    target.addEventListener('keydown', onKeyDown, { passive:false });
    target.addEventListener('keyup', onKeyUp, { passive:false });
    this._handlers.push(() => target.removeEventListener('keydown', onKeyDown));
    this._handlers.push(() => target.removeEventListener('keyup', onKeyUp));
  }

  attachLifecycle(windowTarget = window, documentTarget = document) {
    const release = () => this.releaseAll();
    const onVisibility = () => { if (documentTarget.visibilityState === 'hidden') release(); };
    windowTarget.addEventListener('blur', release);
    documentTarget.addEventListener('visibilitychange', onVisibility);
    this._handlers.push(() => windowTarget.removeEventListener('blur', release));
    this._handlers.push(() => documentTarget.removeEventListener('visibilitychange', onVisibility));
  }

  attachPointer(button, action) {
    this._pointerButtons.add(button);
    const source = `ptr:${button.id || action}`;
    const start = (e) => {
      e.preventDefault();
      button.setPointerCapture?.(e.pointerId);
      button.classList.add('is-down');
      this.setSource(action, source, true);
    };
    const end = (e) => {
      e.preventDefault();
      button.classList.remove('is-down');
      this.setSource(action, source, false);
    };
    button.addEventListener('pointerdown', start, { passive:false });
    button.addEventListener('pointerup', end, { passive:false });
    button.addEventListener('pointercancel', end, { passive:false });
    button.addEventListener('lostpointercapture', end, { passive:false });
    this._handlers.push(() => button.removeEventListener('pointerdown', start));
    this._handlers.push(() => button.removeEventListener('pointerup', end));
    this._handlers.push(() => button.removeEventListener('pointercancel', end));
    this._handlers.push(() => button.removeEventListener('lostpointercapture', end));
  }

  setSource(action, source, isDown) {
    const sources = this._activeSources[action];
    if (!sources) return;
    if (isDown) sources.add(source);
    else sources.delete(source);
    this.set(action, sources.size > 0);
  }

  set(action, isDown) {
    if (!(action in this.down)) return;
    if (this.down[action] === isDown) return;

    if (isDown) this.pressed[action] = true;
    else this.released[action] = true;
    this.down[action] = isDown;

    // Preserve every real state transition until a fixed physics tick consumes it.
    this.physicsEdges[action].push(isDown);
  }

  // Called once per fixed physics tick. At most one queued transition per action
  // is applied in a tick, so press+release in the same browser frame cannot cancel.
  beginPhysicsTick() {
    const down = {};
    const pressed = {};
    const released = {};
    for (const action of Object.keys(this.physicsDown)) {
      let edge = null;
      if (this.physicsEdges[action].length) edge = this.physicsEdges[action].shift();
      if (edge !== null) {
        const prev = this.physicsDown[action];
        this.physicsDown[action] = edge;
        pressed[action] = edge && !prev;
        released[action] = !edge && prev;
      } else {
        pressed[action] = false;
        released[action] = false;
      }
      down[action] = this.physicsDown[action];
    }
    return { down, pressed, released };
  }

  releaseAll() {
    for (const action of Object.keys(this.down)) {
      if (this.down[action]) this.released[action] = true;
      this.down[action] = false;
      this.pressed[action] = false;
      // On focus loss discard stale queued presses immediately. The next physics
      // sample is released, avoiding stuck controls or delayed ghost taps.
      this.physicsEdges[action].length = 0;
      this.physicsDown[action] = false;
      this._activeSources[action]?.clear();
    }
    for (const button of this._pointerButtons) button.classList?.remove('is-down');
  }

  consumePressed(action) { const value = this.pressed[action]; this.pressed[action] = false; return value; }
  consumeReleased(action) { const value = this.released[action]; this.released[action] = false; return value; }

  endFrame() {
    for (const key of Object.keys(this.pressed)) this.pressed[key] = false;
    for (const key of Object.keys(this.released)) this.released[key] = false;
  }

  destroy() {
    this.releaseAll();
    for (const cleanup of this._handlers.splice(0)) cleanup();
    this._pointerButtons.clear();
  }
}
