#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
JAR="$ROOT/reference/releases/comet-pinball-1.1.0-b480.jar"
OUT="$ROOT/reference/oracle"
BUILD="${TMPDIR:-/tmp}/comet-pinball-oracle"
mkdir -p "$BUILD" "$OUT"
javac -cp "$JAR" -d "$BUILD" "$ROOT/tools/oracle/CometFullTableOracle.java"
java -cp "$JAR:$BUILD" CometFullTableOracle state > "$OUT/fullgame-state.csv"
java -cp "$JAR:$BUILD" CometFullTableOracle events > "$OUT/fullgame-events.csv"
printf 'Full-game oracle regenerated in %s\n' "$OUT"
