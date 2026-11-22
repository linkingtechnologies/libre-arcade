// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Level 1 verification: the port, driven by the seed and the key events that were given to the
// ORIGINAL game (Crafty 0.6.3, its own sources, run in a browser with a seeded Math.random and a
// virtual clock), must reproduce the original's state on every one of the 9000 frames of a game:
// player, every carrot's health and claim, every enemy's position, target, path progress, pull and
// push state, the totem, the carrot limit, the sounds, and the final score. The goldens hold a
// fingerprint per frame; tools/oracle/diff.mjs shows the readable difference after re-recording.

import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { replay, initialOf } from "../tools/shared/replay.mjs";
import { digest } from "../tools/shared/digest.mjs";

const dir = fileURLToPath(new URL("./golden/", import.meta.url));
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const g = JSON.parse(readFileSync(dir + file, "utf8"));
  test(`port matches the original over a whole game: ${g.name}`, () => {
    const init = initialOf(g);
    assert.deepEqual(init.layout, g.initial.layout, "scenery layout");
    assert.deepEqual(init.player, g.initial.player, "player start");
    let n = 0;
    for (const r of replay(g)) {
      if (r.over) {
        assert.equal(r.frame, g.overAt, "game ends on the same frame");
        assert.equal(r.score, g.finalScore, "final score");
        break;
      }
      const want = g.digests.slice(r.frame * 12, r.frame * 12 + 12);
      if (digest(r.text) !== want) assert.fail(`first difference at frame ${r.frame}: ${r.text}`);
      n++;
    }
    assert.equal(n, g.frames);
  });
}
