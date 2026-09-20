#!/bin/sh
set -eu
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
OUT="$ROOT/oracle/bin/highmoon-physics-oracle"
g++ -std=gnu++03 -O0 -fno-fast-math -Wall -Wextra \
  -I"$ROOT/reference/HighMoon/src" \
  "$ROOT/oracle/src/highmoon_physics_oracle.cpp" \
  "$ROOT/reference/HighMoon/src/vector_2.cpp" \
  -o "$OUT"
echo "$OUT"
