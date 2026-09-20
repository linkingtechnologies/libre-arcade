#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
JAR="$ROOT/reference/releases/comet-pinball-1.1.0-b480.jar"
OUT="$ROOT/reference/oracle"
BUILD="${TMPDIR:-/tmp}/comet-pinball-oracle"
mkdir -p "$BUILD" "$OUT"
javac -cp "$JAR" -d "$BUILD" "$ROOT/tools/oracle/CometFullTableOracle.java" "$ROOT/tools/oracle/FlipperCornerOracle.java"
java -cp "$JAR:$BUILD" FlipperCornerOracle state > "$OUT/flipper-corner.csv"
java -cp "$JAR:$BUILD" FlipperCornerOracle contacts > "$OUT/flipper-corner-contact.csv"
printf 'Flipper-corner oracle regenerated in %s\n' "$OUT"
