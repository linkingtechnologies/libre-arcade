#!/bin/sh
# Re-generate *separate* M13.9 boundary fixtures, without writing into reference/.
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
JAR="$ROOT/reference/releases/comet-pinball-1.1.0-b480.jar"
OUT=${1:-"$ROOT/reports/M13.9-native-boundaries-rebuilt.csv"}
BUILD=$(mktemp -d "${TMPDIR:-/tmp}/comet-m139.XXXXXX")
trap 'rm -rf "$BUILD"' EXIT HUP INT TERM
javac -cp "$JAR" -d "$BUILD" "$ROOT/tools/oracle/CometFullTableOracle.java" "$ROOT/tools/oracle/M139BoundaryOracle.java"
java -cp "$JAR:$BUILD" M139BoundaryOracle > "$OUT"
printf 'Regenerated %s\n' "$OUT"
