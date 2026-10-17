// Touch controls for The Lost Path. Not part of upstream: upstream only
// listens for arrow-key events on `document`, so this file translates a
// finger drag on the canvas into those same events and leaves script.js
// untouched. Drag direction from the touch origin = held arrow key.
(function () {
  const canvas = document.getElementById('gameCanvas');
  const DEAD_ZONE = 14; // px of drag before a direction registers
  const keyFor = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  let origin = null;
  let held = new Set();

  function press(key) {
    if (!held.has(key)) {
      held.add(key);
      document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    }
  }

  function release(key) {
    if (held.delete(key)) {
      document.dispatchEvent(new KeyboardEvent('keyup', { key }));
    }
  }

  function releaseAll() {
    for (const key of [...held]) release(key);
  }

  function update(touch) {
    const dx = touch.clientX - origin.x;
    const dy = touch.clientY - origin.y;
    const want = new Set();
    if (dx > DEAD_ZONE) want.add(keyFor.right);
    if (dx < -DEAD_ZONE) want.add(keyFor.left);
    if (dy > DEAD_ZONE) want.add(keyFor.down);
    if (dy < -DEAD_ZONE) want.add(keyFor.up);
    for (const key of [...held]) if (!want.has(key)) release(key);
    for (const key of want) press(key);
  }

  canvas.addEventListener('touchstart', (e) => {
    const t = e.changedTouches[0];
    origin = { x: t.clientX, y: t.clientY };
    e.preventDefault();
  }, { passive: false });

  canvas.addEventListener('touchmove', (e) => {
    if (origin) update(e.changedTouches[0]);
    e.preventDefault();
  }, { passive: false });

  function end() {
    origin = null;
    releaseAll();
  }
  canvas.addEventListener('touchend', end);
  canvas.addEventListener('touchcancel', end);
})();
