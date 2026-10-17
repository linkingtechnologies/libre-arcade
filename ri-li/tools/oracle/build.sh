#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Libre Arcade contributors
# SPDX-License-Identifier: GPL-3.0-only
#
# Builds the oracle: the original Ri-li 2.0.1 (reference/Ri-li-2.0.1.tar.bz2, checked against its SHA-256) compiled unchanged, with harness.cc and
# audio_stub.cc, against SDL 1.2 (headers and libSDL.a under $SDL_PREFIX; any SDL 1.2 build with the "dummy" video driver will do).
# The result is $RILI_BUILD/rili-oracle (default: ./build next to this script). Needs bash, g++ and bzip2 (or python3, which can unpack the archive itself); run it on Linux or in WSL.
#
#   SDL_PREFIX=/path/to/sdl1.2-prefix ./build.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
TARBALL="${RILI_SRC:-$HERE/../../reference/Ri-li-2.0.1.tar.bz2}"
SDL="${SDL_PREFIX:?set SDL_PREFIX to the prefix where SDL 1.2 is installed (include/SDL/SDL.h, lib/libSDL.a)}"
OUT="${RILI_BUILD:-$HERE/build}"
EXPECTED=f71ccc20c37c601358d963e087ac0d524de8c68e96df09c3aac1ae65edd38dbd

got="$(sha256sum "$TARBALL" | cut -d' ' -f1)"
[ "$got" = "$EXPECTED" ] || { echo "the source archive is not Ri-li 2.0.1: SHA-256 $got" >&2; exit 1; }

mkdir -p "$OUT"
if [ ! -d "$OUT/Ri-li-2.0.1" ]; then
  if command -v bzip2 >/dev/null 2>&1; then tar -xjf "$TARBALL" -C "$OUT"
  else python3 -c 'import sys, tarfile; tarfile.open(sys.argv[1]).extractall(sys.argv[2])' "$TARBALL" "$OUT"; fi
fi
SRC="$OUT/Ri-li-2.0.1/src"
DATA="$OUT/Ri-li-2.0.1/data"

CXX="${CXX:-g++}"
# the 2007 code is C++98: it compares pointers with 0 (-std=gnu++98, -fpermissive) and converts string literals; -w: its warnings are not ours
FLAGS=(-O1 -std=gnu++98 -fpermissive -w -DLINUX "-DDATA_DIR=\"$DATA\"" -I"$HERE/stubs" -I"$SDL/include" -I"$SRC")
# the original's calls to the clock and to sleep go to the harness's virtual ones (SDL's own timer thread must keep the real ones)
ORIG_FLAGS=("${FLAGS[@]}" -DSDL_GetTicks=rili_GetTicks -DSDL_Delay=rili_Delay)

# The only change to the original's text: three tests "pointer <= 0" (a failed allocation: sprite.cc twice, tableau.cc once), which C++ no longer accepts,
# are written "pointer == 0", which is the same test for a pointer. Nothing else is touched.
sed 's/\(Image\[[a-z0-9]*\]\)<=NULL/\1==NULL/' "$SRC/sprite.cc" > "$OUT/sprite_patched.cc"
sed 's/if(Buf<=0)/if(Buf==0)/' "$SRC/tableau.cc" > "$OUT/tableau_patched.cc"
[ "$(diff "$SRC/sprite.cc" "$OUT/sprite_patched.cc" | grep -c '^>')" = 2 ] || { echo "the patch of sprite.cc did not change exactly two lines" >&2; exit 1; }
[ "$(diff "$SRC/tableau.cc" "$OUT/tableau_patched.cc" | grep -c '^>')" = 1 ] || { echo "the patch of tableau.cc did not change exactly one line" >&2; exit 1; }

objs=()
for f in ecran editeur jeux loco menu mouse utils; do
  "$CXX" "${ORIG_FLAGS[@]}" -c "$SRC/$f.cc" -o "$OUT/$f.o"; objs+=("$OUT/$f.o")
done
for f in sprite tableau; do
  "$CXX" "${ORIG_FLAGS[@]}" -c "$OUT/${f}_patched.cc" -o "$OUT/$f.o"; objs+=("$OUT/$f.o")
done
"$CXX" "${ORIG_FLAGS[@]}" -Dmain=original_main -c "$SRC/main.cc" -o "$OUT/main.o"; objs+=("$OUT/main.o")
"$CXX" "${FLAGS[@]}" -std=c++11 -c "$HERE/harness.cc" -o "$OUT/harness.o"; objs+=("$OUT/harness.o")
"$CXX" "${FLAGS[@]}" -std=c++11 -c "$HERE/audio_stub.cc" -o "$OUT/audio_stub.o"; objs+=("$OUT/audio_stub.o")

WRAP=()
for s in rand SDL_PollEvent SDL_GetVideoInfo SDL_SetVideoMode SDL_Flip _ZN5Ecran14AfficheOptionsEii _ZN4Menu10SDLMain_HREv _ZN4Menu14SDLMain_InGameEv; do WRAP+=("-Wl,--wrap=$s"); done
"$CXX" -o "$OUT/rili-oracle" "${objs[@]}" "${WRAP[@]}" "$SDL/lib/libSDL.a" -lpthread -ldl -lm
echo "built $OUT/rili-oracle"
