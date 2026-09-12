// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const main = readFileSync("src/main.js", "utf8");
const ui = readFileSync("src/ui/WebUI.js", "utf8");

test("restored UI keeps archaeology engines from v1.7", () => {
  for (const token of [
    "PiGAdapter", "PiHAdapter", "PiCAdapter",
    "CardFrameworkCpu0Adapter", "CardFrameworkCpu1Adapter", "CardFrameworkCpu2Adapter",
    "BriscolaJsS0Adapter", "BriscolaJsS1Adapter",
    "POIANA_MODELS_BY_WIN_RATE"
  ]) assert.match(main, new RegExp(token));
});

test("new archaeology engines participate in masked CPU levels", () => {
  for (const id of [
    "giacomelli-pig", "giacomelli-pih", "giacomelli-pic",
    "cardframework-cpu0", "cardframework-cpu1", "cardframework-cpu2",
    "briscolajs-s0", "briscolajs-s1"
  ]) assert.match(ui, new RegExp(id));
});
