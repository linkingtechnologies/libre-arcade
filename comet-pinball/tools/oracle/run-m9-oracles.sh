#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
JAR="$ROOT/reference/releases/comet-pinball-1.1.0-b480.jar"
BUILD="${TMPDIR:-/tmp}/comet-pinball-oracle-m9"
OUT="$ROOT/reports/oracle-m9"
rm -rf "$BUILD"; mkdir -p "$BUILD" "$OUT"
javac -cp "$JAR" -d "$BUILD" "$ROOT/tools/oracle/CometFullTableOracle.java" "$ROOT/tools/oracle/Obstacle8Oracle.java" "$ROOT/tools/oracle/Sling5Oracle.java" "$ROOT/tools/oracle/Sling9Oracle.java" "$ROOT/tools/oracle/RightFlipperBallOracle.java"
java -cp "$JAR:$BUILD" Obstacle8Oracle > "$OUT/obstacle8-continuous.txt"
java -cp "$JAR:$BUILD" Obstacle8Oracle discrete > "$OUT/obstacle8-discrete.txt"
java -cp "$JAR:$BUILD" Sling5Oracle > "$OUT/sling5-continuous.txt"
java -cp "$JAR:$BUILD" Sling5Oracle discrete > "$OUT/sling5-discrete.txt"
java -cp "$JAR:$BUILD" Sling9Oracle > "$OUT/sling9-continuous.txt"
java -cp "$JAR:$BUILD" Sling9Oracle discrete > "$OUT/sling9-discrete.txt"
java -cp "$JAR:$BUILD" RightFlipperBallOracle > "$OUT/right-flipper-ball.txt"
(cd "$OUT" && sha256sum *.txt > SHA256SUMS)
printf 'M9 diagnostic oracle traces regenerated in %s\n' "$OUT"
