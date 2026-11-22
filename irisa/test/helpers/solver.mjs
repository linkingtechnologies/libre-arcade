import { DIRS, liveKey, press, restore, snapshot } from "./engine.mjs";

// Breadth-first search over the port's own store, one level at a time.
// A "step" is one key press followed by the 100 ms the game waits before
// reacting, exactly what a real player's move costs.
export function solveLevel({ store, clock }, entityClasses, level, limit = 200000) {
  clock.cancelAll();
  store.loadLevel(level);
  const start = snapshot(store);
  const seen = new Set([liveKey(store)]);
  let frontier = [{ snap: start, path: [] }];
  let visited = 0;
  while (frontier.length && visited < limit) {
    const next = [];
    for (const node of frontier) {
      for (const dir of DIRS) {
        clock.cancelAll();
        restore(store, entityClasses, node.snap);
        press(store, dir);
        clock.advance(100);
        visited += 1;
        const state = store.state.gameState;
        if (state === "LOST") continue;
        if (state === "WON") {
          clock.cancelAll();
          return { path: [...node.path, dir], visited };
        }
        const key = liveKey(store);
        if (seen.has(key)) continue;
        seen.add(key);
        next.push({ snap: snapshot(store), path: [...node.path, dir] });
      }
    }
    frontier = next;
  }
  return null;
}
