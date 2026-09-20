#!/usr/bin/env sh
set -eu
ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
BUILD="$(mktemp -d "${TMPDIR:-/tmp}/comet-corner.XXXXXXXX")"
trap 'rm -rf "$BUILD"' EXIT HUP INT TERM
JAR="$ROOT/reference/releases/comet-pinball-1.1.0-b480.jar"
javac -cp "$JAR" -d "$BUILD" "$ROOT/tools/oracle/CometFullTableOracle.java" "$ROOT/tools/diagnostics/NativeUpperCornerProbe.java"
java -cp "$JAR:$BUILD" NativeUpperCornerProbe
