#!/usr/bin/env bash
# SPDX-FileCopyrightText: 2026 Libre Arcade contributors
# SPDX-License-Identifier: GPL-3.0-only
#
# Builds the SDL 1.2.15 that the oracle links against: downloads the official source archive, checks its SHA-256, and installs a static libSDL.a and the headers
# under $SDL_PREFIX (default: ./build/sdl next to this script). No audio, no X11, no OpenGL: only the "dummy" video driver is needed, which draws nothing on a
# display but gives the program real software surfaces, and nothing outside $SDL_PREFIX is touched. Needs bash, curl (or wget), tar, make and gcc.
#
#   SDL_PREFIX=$HOME/.cache/rili-sdl ./build-sdl.sh
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
PREFIX="${SDL_PREFIX:-$HERE/build/sdl}"
URL=https://www.libsdl.org/release/SDL-1.2.15.tar.gz
EXPECTED=d6d316a793e5e348155f0dd93b979798933fb98aa1edebcc108829d6474aad00

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
cd "$work"
if command -v curl >/dev/null 2>&1; then curl -sSL -o SDL.tar.gz "$URL"; else wget -q -O SDL.tar.gz "$URL"; fi
got="$(sha256sum SDL.tar.gz | cut -d' ' -f1)"
[ "$got" = "$EXPECTED" ] || { echo "SDL-1.2.15.tar.gz has SHA-256 $got, expected $EXPECTED" >&2; exit 1; }
tar -xzf SDL.tar.gz
cd SDL-1.2.15
./configure --prefix="$PREFIX" --disable-audio --disable-video-x11 --disable-video-opengl --disable-joystick --disable-cdrom --disable-pulseaudio \
  --disable-alsa --disable-esd --disable-arts --disable-nas --disable-oss --disable-input-events --disable-input-tslib --disable-assembly \
  --disable-shared --enable-static > "$work/configure.log" 2>&1
make -j"$(nproc)" > "$work/make.log" 2>&1
make install > "$work/install.log" 2>&1
echo "SDL 1.2.15 installed in $PREFIX"
