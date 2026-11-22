// Level 1 oracle: upstream's own store.js (reference/) runs next to the port's
// and every observable is compared after every action: all entities in order
// (class, disabled flag, position), game state, level, move lock, freeze
// counter, the sound calls, and the "all levels complete" signal.
import assert from "node:assert/strict";
import test from "node:test";
import levels from "../public/js/game/levels.js";
import * as entityClasses from "../public/js/game/entities.js";
import { DIRS, loadOriginal, loadPort, press, snapshot } from "./helpers/engine.mjs";
import { solveLevel } from "./helpers/solver.mjs";

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function lockstep(o, p, label, step) {
  assert.deepEqual(snapshot(p.store), snapshot(o.store), `${label}: state after ${step}`);
  assert.deepEqual(p.sounds, o.sounds, `${label}: sounds after ${step}`);
  assert.equal(p.completions.length, o.completions.length, `${label}: completion after ${step}`);
}

test("a winning line through all 20 levels plays identically in both", async () => {
  const solver = await loadPort();
  const solutions = levels.map((_, n) => solveLevel(solver, entityClasses, n).path);
  const o = await loadOriginal();
  const p = await loadPort();
  let steps = 0;
  for (let n = 0; n < levels.length; n += 1) {
    for (const dir of solutions[n]) {
      // A press inside the 100 ms lock must be ignored by both.
      press(o.store, dir);
      press(p.store, dir);
      press(o.store, "Up");
      press(p.store, "Up");
      lockstep(o, p, `level ${n + 1}`, `press ${dir}`);
      o.clock.advance(100);
      p.clock.advance(100);
      steps += 1;
      lockstep(o, p, `level ${n + 1}`, `settle ${steps}`);
    }
    assert.equal(o.store.state.gameState, "WON");
    o.clock.advance(2000);
    p.clock.advance(2000);
    lockstep(o, p, `level ${n + 1}`, "next level");
  }
  assert.equal(o.completions.length, 1, "original shows its end alert once");
  assert.equal(p.completions.length, 1, "port signals the end once");
  console.log(`full game: ${steps} moves, identical after each`);
});

test("random play (with a pull towards the door) is identical in both", async () => {
  let actions = 0;
  let wins = 0;
  let losses = 0;
  for (let seed = 1; seed <= 150; seed += 1) {
    const random = rng(seed);
    const o = await loadOriginal();
    const p = await loadPort();
    for (let i = 0; i < 260; i += 1) {
      let dir;
      if (random() < 0.55) {
        const door = o.store.state.entities.find((e) => e.className === "door");
        const me = o.store.player;
        const dx = door.x - me.x;
        const dy = door.y - me.y;
        dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "Right" : "Left") : dy > 0 ? "Down" : "Up";
        if (dx === 0 && dy === 0) dir = DIRS[Math.floor(random() * 4)];
      } else {
        dir = DIRS[Math.floor(random() * 4)];
      }
      const before = o.store.state.gameState;
      press(o.store, dir);
      press(p.store, dir);
      const wait = [0, 30, 100, 100, 100, 150, 700, 2000][Math.floor(random() * 8)];
      o.clock.advance(wait);
      p.clock.advance(wait);
      actions += 1;
      lockstep(o, p, `seed ${seed}`, `action ${i} (${dir}, +${wait})`);
      if (o.store.state.gameState === "WON" && before !== "WON") wins += 1;
      if (o.store.state.gameState === "LOST" && before !== "LOST") losses += 1;
    }
  }
  console.log(`random traces: ${actions} actions, ${wins} wins, ${losses} losses, no difference`);
  assert.ok(wins > 20 && losses > 20, "the traces must exercise both end conditions");
});

test("known, deliberate difference: restarting no longer leaks old timers or freeze", async () => {
  // Level 10 (index 9) has a freeze pickup.
  const o = await loadOriginal();
  const p = await loadPort();
  for (const ctx of [o, p]) {
    ctx.store.loadLevel(9);
    ctx.store.frozenTurnsRemaining = 3; // as if a 3-turn freeze had just been picked up
    ctx.store.reloadLevel(); // what the R key does
  }
  assert.equal(o.store.frozenTurnsRemaining, 3, "upstream keeps the freeze across a restart");
  assert.equal(p.store.frozenTurnsRemaining, 0, "the port starts the restart unfrozen");

  // R pressed during the 100 ms after a move.
  for (const ctx of [o, p]) {
    ctx.store.loadLevel(1);
    ctx.store.frozenTurnsRemaining = 0;
    ctx.store.canMove = true;
  }
  const fresh = snapshot(p.store).entities;
  press(o.store, "Down");
  press(p.store, "Down");
  o.store.reloadLevel();
  p.store.reloadLevel();
  o.clock.advance(100);
  p.clock.advance(100);
  assert.notDeepEqual(snapshot(o.store).entities, fresh, "upstream moves enemies of the restarted level");
  assert.deepEqual(snapshot(p.store).entities, fresh, "the port leaves the restarted level untouched");
});
