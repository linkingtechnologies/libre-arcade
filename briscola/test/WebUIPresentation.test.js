// SPDX-License-Identifier: GPL-3.0-only
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const uiSource = fs.readFileSync(path.join(root, "src/ui/WebUI.js"), "utf8");
const cssSource = fs.readFileSync(path.join(root, "styles.css"), "utf8");

test("game UI keeps resolved tricks visible and animates CPU/human plays", () => {
  assert.match(uiSource, /addEventListener\("cardplayed"/);
  assert.match(uiSource, /addEventListener\("trickwon"/);
  assert.match(uiSource, /this\.visualTable/);
  assert.match(uiSource, /this\.presentationLock = true/);
  assert.match(cssSource, /@keyframes play-from-cpu/);
  assert.match(cssSource, /@keyframes play-from-human/);
  assert.match(cssSource, /@keyframes collect-to-cpu/);
  assert.match(cssSource, /@keyframes collect-to-human/);
});

test("mobile sizing, opponent labeling, and clean setup copy are preserved", () => {
  assert.match(uiSource, /--card-aspect/);
  assert.match(cssSource, /calc\(20dvh \* var\(--card-aspect\)\)/);
  assert.match(uiSource, /Bravura avversario/);
  assert.doesNotMatch(uiSource, /Bravura CPU/);
  assert.doesNotMatch(uiSource, /Livelli aggregati dai benchmark Arena/);
  assert.doesNotMatch(uiSource, /motore reale resta mascherato/);
  assert.match(uiSource, /return "Avversario"/);
  assert.match(uiSource, /Engine specifico/);
  assert.match(uiSource, /Opzioni avanzate/);
  assert.doesNotMatch(uiSource, /Opzioni laboratorio/);
  assert.doesNotMatch(uiSource, /deck-help/);
  assert.match(uiSource, /L\'anno indica l\'anno del codice\/reperto restaurato/);
  assert.match(uiSource, /cuperativa: "2021"/);
  assert.match(uiSource, /filter\(\(item\) => item\.kind === "image"\)/);
});

test("an active best-of-three series shows completed-manche score at top left", () => {
  assert.match(uiSource, /class="series-running"/);
  assert.match(uiSource, /state\.phase === "playing"/);
  assert.match(uiSource, /Manche <span aria-hidden="true">👤<\/span> <strong>/);
  assert.match(uiSource, /<span aria-hidden="true">🤖<\/span>/);
  assert.match(cssSource, /\.brand-area/);
  assert.match(cssSource, /\.series-running/);
});
