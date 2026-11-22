// SPDX-License-Identifier: GPL-3.0-only
// Libre Arcade addition. A pausable, cancellable stand-in for setTimeout, so
// the game's own timers (the 100 ms move follow-up, the 2 s win/lose delay)
// stop while the pause screen is open and can be dropped when a level loads.

export function createClock (now = () => performance.now()) {
  const tasks = new Set();
  let paused = false;

  function arm (task) {
    task.startedAt = now();
    task.handle = setTimeout(() => {
      tasks.delete(task);
      task.fn();
    }, task.remaining);
  }

  return {
    after (fn, ms) {
      const task = { fn, remaining: ms, startedAt: 0, handle: null };
      tasks.add(task);
      if (!paused) {
        arm(task);
      }
      return task;
    },

    cancelAll () {
      tasks.forEach(task => clearTimeout(task.handle));
      tasks.clear();
    },

    pause () {
      if (paused) {
        return;
      }
      paused = true;
      tasks.forEach(task => {
        clearTimeout(task.handle);
        task.remaining = Math.max(0, task.remaining - (now() - task.startedAt));
      });
    },

    resume () {
      if (!paused) {
        return;
      }
      paused = false;
      tasks.forEach(arm);
    },

    get isPaused () {
      return paused;
    },

    get pending () {
      return tasks.size;
    },
  };
}
