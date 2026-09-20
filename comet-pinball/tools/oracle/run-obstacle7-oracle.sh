#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
JAR="$ROOT/reference/releases/comet-pinball-1.1.0-b480.jar"
OUT="$ROOT/reports/oracle-m8"
BUILD="${TMPDIR:-/tmp}/comet-pinball-oracle"
mkdir -p "$BUILD" "$OUT"
javac -cp "$JAR" -d "$BUILD" "$ROOT/tools/oracle/CometFullTableOracle.java" "$ROOT/tools/oracle/Obstacle7Oracle.java"
java -cp "$JAR:$BUILD" Obstacle7Oracle > "$OUT/obstacle7-continuous.txt"
java -cp "$JAR:$BUILD" Obstacle7Oracle discrete > "$OUT/obstacle7-discrete.txt"
printf 'Obstacle-7 M8 oracle diagnostics regenerated in %s\n' "$OUT"
