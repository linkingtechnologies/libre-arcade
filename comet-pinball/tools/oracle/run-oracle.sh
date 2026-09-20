#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
JAR="$ROOT/reference/releases/comet-pinball-1.1.0-b480.jar"
OUT="$ROOT/reference/oracle"
BUILD="${TMPDIR:-/tmp}/comet-pinball-oracle"
mkdir -p "$BUILD" "$OUT"

javac -cp "$JAR" -d "$BUILD" \
  "$ROOT/tools/oracle/CometBox2DOracle.java" \
  "$ROOT/tools/oracle/CometFullTableOracle.java" \
  "$ROOT/tools/oracle/FlipperCornerOracle.java"

for scenario in freefall launch bumper flipper flipper-joint flipper-contact launch-contact flipper-detail; do
  java -cp "$JAR:$BUILD" CometBox2DOracle "$scenario" > "$OUT/$scenario.csv"
done
java -cp "$JAR:$BUILD" CometFullTableOracle state > "$OUT/fullgame-state.csv"
java -cp "$JAR:$BUILD" CometFullTableOracle events > "$OUT/fullgame-events.csv"
java -cp "$JAR:$BUILD" FlipperCornerOracle state > "$OUT/flipper-corner.csv"
java -cp "$JAR:$BUILD" FlipperCornerOracle contacts > "$OUT/flipper-corner-contact.csv"

(cd "$OUT" && sha256sum *.csv > SHA256SUMS)
"$ROOT/tools/oracle/run-flipper-corner-detail-oracle.sh"
"$ROOT/tools/oracle/run-obstacle7-oracle.sh"
"$ROOT/tools/oracle/run-m9-oracles.sh"
printf 'Oracle traces plus M8/M9 diagnostics regenerated in %s and %s/reports/oracle-m8\n' "$OUT" "$ROOT"
