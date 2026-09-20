#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
NROOT="$ROOT/oracle/native_headless"
SRC="$ROOT/instrumented/HighMoon/src"
g++ -std=gnu++03 -O0 -fno-fast-math -fno-strict-aliasing -D__ORACLE_TRACE__ -Wall -Wextra -Wno-write-strings \
  -I"$NROOT/fake_sdl" -I"$SRC" \
  "$NROOT/src/native_runner.cpp" "$NROOT/src/fake_sdl.cpp" "$NROOT/src/sound_stub.cpp" \
  "$SRC/vector_2.cpp" "$SRC/object.cpp" "$SRC/graphics.cpp" "$SRC/galaxy.cpp" "$SRC/shoot.cpp" "$SRC/oracle_trace.cpp" \
  -o "$NROOT/bin/highmoon-native-headless"
echo "$NROOT/bin/highmoon-native-headless"
