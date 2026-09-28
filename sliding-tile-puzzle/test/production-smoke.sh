#!/usr/bin/env bash
# Optional full re-verification: needs bash and a JDK, neither of which
# `npm test` requires. It re-runs the two Java oracles live against the
# preserved jar and checks their output against the stored fixtures
# (test/fixtures/mix-oracle.json, background-oracle.json), which is what
# actually detects fixture drift; the delivered version of this script
# instead fed live Java output straight into mix-parity.cjs/background-parity.cjs,
# which no longer call Java at all (see AGENTS.md and PROVENANCE.md).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

node --check "$ROOT/src/game.js"
node --check "$ROOT/src/i18n.js"
node --check "$ROOT/src/app.js"
node --check "$ROOT/public/app.bundle.js"
node "$ROOT/test/run-all.cjs"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
javac --release 8 -cp "$ROOT/reference/puzzlegames.jar" -d "$TMP" "$ROOT/test/PrintSliderMix.java" "$ROOT/test/PrintBackgroundColors.java"

node -e '
const cp = require("child_process");
const path = require("path");
const fixture = require(process.argv[1]);
const root = process.argv[2];
const tmp = process.argv[3];
const sep = process.platform === "win32" ? ";" : ":";
let checked = 0;
for (const { size, seed, blank, board } of fixture.scenarios) {
  const out = cp.execFileSync("java", ["-cp", `${tmp}${sep}${path.join(root,"reference/puzzlegames.jar")}`, "PrintSliderMix", String(size), String(seed)], { encoding: "utf8" }).trim();
  const expected = `${blank}:${board.join(",")}`;
  if (out !== expected) throw new Error(`mix drift: size ${size} seed ${seed}: fixture says ${expected}, live jar says ${out}`);
  checked++;
}
console.log(`live mix re-check: ok (${checked} scenarios still match reference/puzzlegames.jar)`);
' "$ROOT/test/fixtures/mix-oracle.json" "$ROOT" "$TMP"

node -e '
const cp = require("child_process");
const fixture = require(process.argv[1]);
const tmp = process.argv[2];
const means = fixture.scenarios.map((s) => s.rgb.join(","));
const out = cp.execFileSync("java", ["-cp", tmp, "PrintBackgroundColors", ...means], { encoding: "utf8" }).trim().split(/\r?\n/);
const expected = fixture.scenarios.map((s) => s.hex);
if (JSON.stringify(out) !== JSON.stringify(expected)) throw new Error(`background drift: fixture says ${expected}, live jar says ${out}`);
console.log(`live background re-check: ok (${out.length} colors still match reference/puzzlegames.jar)`);
' "$ROOT/test/fixtures/background-oracle.json" "$TMP"

(cd "$TMP" && jar xf "$ROOT/reference/puzzlegames.jar")
for f in "$ROOT"/public/assets/photos/*.jpg; do cmp -s "$f" "$TMP/pics/$(basename "$f")"; done
for f in "$ROOT"/public/assets/photos/thumbs/*.jpg; do cmp -s "$f" "$TMP/pics/thumbs/$(basename "$f")"; done
echo 'live photo re-check: ok (still byte-identical to reference/puzzlegames.jar)'

echo 'production-smoke.sh: ok (fixtures confirmed against a live JDK re-run)'
