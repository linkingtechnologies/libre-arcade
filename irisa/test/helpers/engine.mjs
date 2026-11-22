// Test helpers: a virtual clock, the port's store, and the ORIGINAL store
// (upstream's src/store.js executed from reference/, only its imports'
// extensions rewritten so Node can load it).
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
export const ROOT = join(here, "..", "..");
export const REF_SRC = join(ROOT, "reference", "irisa-4dada41", "src");

export function fakeClock() {
  let now = 0;
  let nextId = 1;
  let tasks = [];
  return {
    get now() { return now; },
    get pending() { return tasks.length; },
    after(fn, ms) {
      const task = { id: nextId++, at: now + ms, fn };
      tasks.push(task);
      return task;
    },
    cancelAll() { tasks = []; },
    // Run everything due within the next `ms`, in time order.
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const due = tasks.filter((t) => t.at <= end).sort((a, b) => a.at - b.at || a.id - b.id)[0];
        if (!due) break;
        tasks = tasks.filter((t) => t !== due);
        now = due.at;
        due.fn();
      }
      now = end;
    },
  };
}

let portCounter = 0;
export async function loadPort() {
  const url = pathToFileURL(join(ROOT, "public", "js", "game", "store.js")).href + `?p=${portCounter++}`;
  const store = (await import(url)).default;
  const clock = fakeClock();
  const sounds = [];
  const completions = [];
  store.clock = clock;
  store.playSound = (name) => sounds.push(name);
  store.onAllComplete = () => completions.push(clock.now);
  store.loadLevel(0);
  return { store, clock, sounds, completions };
}

let originalDir = null;
function prepareOriginal() {
  if (originalDir) return originalDir;
  originalDir = mkdtempSync(join(tmpdir(), "irisa-original-"));
  for (const f of ["audio", "constants", "entities", "gamestate", "glyphs", "levels", "store", "util"]) {
    cpSync(join(REF_SRC, `${f}.js`), join(originalDir, `${f}.js`));
    const p = join(originalDir, `${f}.js`);
    // Only change: './x' -> './x.js' so Node's ESM loader can resolve it.
    writeFileSync(p, readFileSync(p, "utf8").replace(/from '(\.\/[a-z]+)'/g, "from '$1.js'"));
  }
  writeFileSync(join(originalDir, "package.json"), '{"type":"module"}');
  return originalDir;
}

let originalCounter = 0;
export async function loadOriginal() {
  const dir = prepareOriginal();
  const clock = fakeClock();
  const sounds = [];
  const completions = [];
  // Stubs for what the original expects from a browser.
  Object.defineProperty(globalThis, "navigator", { value: { userAgent: "Chrome" }, configurable: true });
  // audio.js is imported once; its stub elements report to whichever run is current.
  globalThis.__irisaSounds = sounds;
  globalThis.document = {
    querySelector: (sel) => {
      const name = sel.replace("audio.", "").replace("-", "");
      return { currentTime: 0, pause() {}, play() { globalThis.__irisaSounds.push(name); } };
    },
  };
  globalThis.alert = () => completions.push(clock.now);
  globalThis.location = { reload() {} };
  globalThis.setTimeout = (fn, ms) => clock.after(fn, ms);
  const url = pathToFileURL(join(dir, "store.js")).href + `?o=${originalCounter++}`;
  const mod = await import(url);
  const entities = await import(pathToFileURL(join(dir, "entities.js")).href);
  const store = mod.default;
  store.loadLevel(0);
  return { store, clock, sounds, completions, entities };
}

export const snapshot = (store) => ({
  level: store.state.currentLevelNumber,
  gameState: store.state.gameState,
  boardSize: store.state.boardSize,
  canMove: store.canMove,
  frozen: store.frozenTurnsRemaining,
  entities: store.state.entities.map((e) => `${e.className}|${e.isDisabled ? 1 : 0}|${e.x},${e.y}`),
});

// The part of a state that can influence the future (disabled entities cannot).
export const liveKey = (store) =>
  JSON.stringify([
    store.state.gameState,
    store.frozenTurnsRemaining,
    store.state.entities
      .filter((e) => !e.isDisabled)
      .map((e) => `${e.className}@${e.x},${e.y}`)
      .sort(),
  ]);

export function restore(store, entityClasses, snap) {
  const { Door, Enemy, FreezeTime, Player, Reverse, Teleporter, Wall } = entityClasses;
  store.state.entities = snap.entities.map((s) => {
    const [cls, dis, xy] = s.split("|");
    const [x, y] = xy.split(",").map(Number);
    let e;
    if (cls.startsWith("freeze-time")) e = new FreezeTime(x, y, Number(/for-(\d)-turns/.exec(cls)[1]));
    else e = new ({ door: Door, enemy: Enemy, player: Player, reverse: Reverse, teleporter: Teleporter, wall: Wall })[cls](x, y);
    e.isDisabled = dis === "1";
    return e;
  });
  store.state.gameState = snap.gameState;
  store.state.currentLevelNumber = snap.level;
  store.state.boardSize = snap.boardSize;
  store.frozenTurnsRemaining = snap.frozen;
  store.canMove = snap.canMove;
}

export const DIRS = ["Up", "Left", "Down", "Right"];
export const press = (store, dir) => store[`movePlayer${dir}`]();
