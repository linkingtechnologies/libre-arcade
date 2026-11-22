#!/usr/bin/env node
// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// Turns tools/oracle/out/<name>.json (full recordings of the original, tens of
// megabytes) into tests/golden/<name>.json: the seed, the key events, and a
// 12-hex-digit SHA-256 fingerprint of every frame. That is small enough to
// commit and enough for `npm test` to detect any divergence without a browser.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { digest } from "../shared/digest.mjs";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const scenarios = JSON.parse(readFileSync(here("./scenarios.json"), "utf8"));
mkdirSync(here("../../tests/golden"), { recursive: true });
for (const s of scenarios) {
  if (s.name === "probe") continue;
  const rec = JSON.parse(readFileSync(here(`./out/${s.name}.json`), "utf8"));
  const golden = {
    name: rec.name, mode: rec.mode, seed: rec.seed, startCarrots: rec.startCarrots || 0, overAt: rec.overAt, finalScore: rec.finalScore,
    initial: rec.initial, inputs: rec.inputs, frames: rec.frameTexts.length,
    digests: rec.frameTexts.map(digest).join(""),
  };
  writeFileSync(here(`../../tests/golden/${s.name}.json`), JSON.stringify(golden) + "\n");
  console.log("golden", s.name, golden.frames, "frames");
}
