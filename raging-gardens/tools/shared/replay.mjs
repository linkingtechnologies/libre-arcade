// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Replays a recording made from the original game (its seed and the key events
// it was given) on the port, yielding the canonical text of every frame.

import { Game } from "../../public/src/sim.js";
import { mulberry32 } from "../../public/src/rng.js";
import { canonical } from "./canon.mjs";

export function* replay(rec) {
  const game = new Game({ random: mulberry32(rec.seed) });
  game.player.carrotsCount += rec.startCarrots || 0;
  const byFrame = new Map();
  for (const [f, type, key] of rec.inputs) {
    if (!byFrame.has(f)) byFrame.set(f, []);
    byFrame.get(f).push([type, key]);
  }
  for (let frame = 0; ; frame++) {
    for (const [type, key] of byFrame.get(frame) || []) (type === "d" ? game.keyDown(key) : game.keyUp(key));
    game.step();
    const events = game.takeEvents();
    if (game.over) { yield { over: true, frame, score: game.score }; return; }
    const sounds = events.filter((e) => e.type === "sound").map((e) => e.name).sort();
    const snap = game.snapshot(sounds);
    yield { over: false, frame, snap, text: canonical(snap) };
  }
}

export function initialOf(rec) {
  const game = new Game({ random: mulberry32(rec.seed) });
  return {
    layout: game.obstacles.map((o) => [o.tx, o.ty, o.kind]),
    player: { x: game.player.x, y: game.player.y },
  };
}
