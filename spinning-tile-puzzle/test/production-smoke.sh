#!/usr/bin/env bash
# Optional full re-verification: needs bash and a JDK, neither of which
# `npm test` requires. It re-runs the Java oracle live against the preserved
# jar and checks its output against the stored fixtures
# (test/fixtures/geometry-oracle.json, mix-oracle.json, spin-oracle.json),
# which is what actually detects fixture drift; the delivered version of this
# script instead fed live Java output straight into spinner-parity.cjs, which
# no longer calls Java at all (see AGENTS.md and PROVENANCE.md).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

node --check "$ROOT/src/game.js"
node --check "$ROOT/src/i18n.js"
node --check "$ROOT/src/app.js"
node --check "$ROOT/public/app.bundle.js"
node "$ROOT/test/run-all.cjs"

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
javac --release 8 -cp "$ROOT/reference/puzzlegames.jar" -d "$TMP" "$ROOT/test/PrintSpinnerOracle.java"

node -e '
const cp = require("child_process");
const path = require("path");
const geometry = require(process.argv[1]);
const mix = require(process.argv[2]);
const spin = require(process.argv[3]);
const root = process.argv[4];
const tmp = process.argv[5];
const sep = process.platform === "win32" ? ";" : ":";
const jar = path.join(root, "reference/puzzlegames.jar");
const run = (...args) => cp.execFileSync("java", ["-cp", `${tmp}${sep}${jar}`, "PrintSpinnerOracle", ...args], { encoding: "utf8" }).trim().split(/\r?\n/);

let checked = 0;
for (const { boardWidth, boardHeight, descriptor, tiles, vertices } of geometry.scenarios) {
  const out = run("geom", String(boardWidth), String(boardHeight));
  if (out[0] !== descriptor.join(",")) throw new Error(`geometry drift at ${boardWidth}x${boardHeight}`);
  for (let i = 0; i < 7; i++) if (out[1 + i] !== `t${i}=${tiles[i].join(",")}`) throw new Error(`tile ${i} drift at ${boardWidth}x${boardHeight}`);
  for (let v = 0; v < 6; v++) if (out[8 + v] !== `v${v}=${vertices[v].join(",")}`) throw new Error(`vertex ${v} drift at ${boardWidth}x${boardHeight}`);
  checked++;
}
console.log(`live geometry re-check: ok (${checked} board sizes still match reference/puzzlegames.jar)`);

checked = 0;
for (const { seed, state } of mix.scenarios) {
  const out = run("mix", "800", "600", String(seed))[0];
  const expected = state.map(([o, r]) => `${o}@${r}`).join(";");
  if (out !== expected) throw new Error(`mix drift: seed ${seed}: fixture says ${expected}, live jar says ${out}`);
  checked++;
}
console.log(`live mix re-check: ok (${checked} seeds still match reference/puzzlegames.jar)`);

checked = 0;
for (const { vertex, direction, state, changed } of spin.scenarios) {
  const out = run("spin", "800", "600", String(vertex), String(direction));
  const expected = state.map(([o, r]) => `${o}@${r}`).join(";");
  if (out[0] !== expected) throw new Error(`spin drift: v${vertex} d${direction}: fixture says ${expected}, live jar says ${out[0]}`);
  if (out[1] !== `[${changed.join(", ")}]`) throw new Error(`spin changed-tiles drift: v${vertex} d${direction}`);
  checked++;
}
console.log(`live spin re-check: ok (${checked} vertex/direction pairs still match reference/puzzlegames.jar)`);
' "$ROOT/test/fixtures/geometry-oracle.json" "$ROOT/test/fixtures/mix-oracle.json" "$ROOT/test/fixtures/spin-oracle.json" "$ROOT" "$TMP"

(cd "$TMP" && jar xf "$ROOT/reference/puzzlegames.jar" pics images/cwcursor.png images/ccwcursor.png)
for f in "$ROOT"/public/assets/photos/*.jpg; do cmp -s "$f" "$TMP/pics/$(basename "$f")"; done
for f in "$ROOT"/public/assets/photos/thumbs/*.jpg; do cmp -s "$f" "$TMP/pics/thumbs/$(basename "$f")"; done
cmp -s "$ROOT/public/assets/icons/cwcursor.png" "$TMP/images/cwcursor.png"
cmp -s "$ROOT/public/assets/icons/ccwcursor.png" "$TMP/images/ccwcursor.png"
echo 'live asset re-check: ok (photos, thumbnails and cursors still byte-identical to reference/puzzlegames.jar)'

echo 'production-smoke.sh: ok (fixtures confirmed against a live JDK re-run)'
