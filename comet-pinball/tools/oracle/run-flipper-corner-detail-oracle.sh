#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
JAR="$ROOT/reference/releases/comet-pinball-1.1.0-b480.jar"
OUT="$ROOT/reports/oracle-m8"
BUILD="${TMPDIR:-/tmp}/comet-pinball-oracle"
mkdir -p "$BUILD" "$OUT"
javac -cp "$JAR" -d "$BUILD" "$ROOT/tools/oracle/CometFullTableOracle.java" "$ROOT/tools/oracle/FlipperCornerDetailOracle.java"
java -cp "$JAR:$BUILD" FlipperCornerDetailOracle > "$OUT/flipper-corner-detail-state.csv" 2> "$OUT/flipper-corner-detail-contacts.log"
java -cp "$JAR:$BUILD" FlipperCornerDetailOracle discrete > "$OUT/flipper-corner-discrete-state.csv" 2> "$OUT/flipper-corner-discrete-contacts.log"
printf 'Flipper-corner M8 detail diagnostics regenerated in %s\n' "$OUT"
