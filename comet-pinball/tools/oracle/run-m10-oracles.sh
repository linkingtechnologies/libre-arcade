#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
JAR="$ROOT/reference/releases/comet-pinball-1.1.0-b480.jar"
BUILD="$(mktemp -d "${TMPDIR:-/tmp}/comet-m10-oracle.XXXXXXXX")"
trap 'rm -rf "$BUILD"' EXIT HUP INT TERM
OUT="$ROOT/reports/oracle-m10"
mkdir -p "$OUT"
javac -cp "$JAR" -d "$BUILD" "$ROOT/tools/oracle/CometFullTableOracle.java" "$ROOT/tools/oracle/RightFlipperPolygonOracle.java" "$ROOT/tools/oracle/RightWallOracle.java"
java -cp "$JAR:$BUILD" RightFlipperPolygonOracle > "$OUT/right-flipper-polygon.txt"
java -cp "$JAR:$BUILD" RightWallOracle > "$OUT/right-wall.txt"
(cd "$OUT" && sha256sum right-flipper-polygon.txt right-wall.txt > SHA256SUMS)
echo 'M10 oracles generated from the immutable historical JAR'
