# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, physics, generators, scoring | [Wok](reference/wok-1.0/) 1.0 by Kenta Cho, SDL Game Development Contest 2001 | `1.0` (2001), archive SHA-256 in `reference/original/SHA256SUMS.txt` | BSD-2-Clause-style (see below) | Preserved unmodified in `reference/wok-1.0/`; faithfully ported to JavaScript in `public/src/core.js` — see `specs/PARITY.md` |
| Original PNG artwork and WAV/OGG audio | same source | same release | BSD-2-Clause-style | Copied unmodified into `public/assets/original/`; used directly by the browser runtime (color-key transparency removed only at render time, not in the files themselves) |
| Runtime-only WAV derivatives of the two beta-Vorbis music tracks | derived from the same source | — | Same historical notice; no new creative content | `public/assets/runtime/sounds/wok1.wav`, `wok2.wav` — decoded once with SoX, no re-encoding — see "A codec too old for its own decoders" below |
| Web UI, renderer, input handling, Web Audio playback | this repository | — | GPL-3.0-or-later | New reconstruction work |

## Licensing: a genuine permissive grant, not an inference

Wok's own `reference/wok-1.0/README` states the license in full:

> Copyright 2001 Kenta Cho. All rights reserved.
>
> Redistribution and use in source and binary forms, with or without
> modification, are permitted provided that the following conditions are
> met: 1. Redistributions of source code must retain the above copyright
> notice... 2. Redistributions in binary form must reproduce the above
> copyright notice...

This is a textbook BSD-2-Clause-style permissive license — no copyleft
obligation, no share-alike requirement, explicitly permitting modification
and redistribution in source or binary form. Unlike every other restoration
in this collection to date, **no research was needed** to establish this:
the grant is right there in the archive's own README, in the archive's own
words, with no Wayback Machine capture or secondary source required. It
also directly answers the media question: with no separate asset license or
third-party attribution found anywhere in the package, the PNG/WAV/OGG
files are covered by the same package-wide notice as the code, so — unlike
54321, Donkey Bolonkey, and PSY PONG 3D — **none of the original assets
needed to be excluded or replaced here**. See `specs/LICENSE_AUDIT.md` for
the full audit.

## A codec too old for its own decoders

`wok1.ogg` and `wok2.ogg` are encoded with an early Xiphophorus Vorbis beta
bitstream. Modern FFmpeg/Chromium correctly identify the stream as "Vorbis
beta 1/2" but refuse to decode it — the setup codebooks predate the format
that shipped decoders actually implement. SoX can still decode the historical
stream. Rather than accept silent playback failure or introduce a second
lossy encoding generation, this restoration decodes each file exactly once
to 16-bit mono 16 kHz PCM WAV (`specs/AUDIO_CONVERSION.md` records the exact
SHA-256 of both the original `.ogg` and the derived `.wav`). The original
`.ogg` files remain byte-for-byte unchanged in `reference/wok-1.0/sounds/`
and `public/assets/original/sounds/`; only the runtime copies are the
decoded WAVs, verified to decode correctly in a real browser by
`test/audio-browser-smoke.html`.

## What was not ported, and why

- **SDL/SDL_mixer/libao/libogg/libvorbis native audio and windowing** —
  replaced by Web Audio and Canvas 2D, which have no original counterpart to
  be faithful to.
- **`music_ogg.h`** — an SDL_mixer-internal header by Sam Lantinga, carrying
  its own LGPL-2.0-or-later notice, preserved only as untouched historical
  reference; the browser port's audio is an independent Web Audio
  implementation and does not reuse this code at all.
- **Exact SDL 8-bit palette quantization** — the port uses the original PNG
  RGB values directly after reproducing the historical color-key
  transparency; matching the original's indexed-palette rendering exactly is
  recorded as a future visual-parity task in `specs/PARITY.md`, not a
  gameplay-affecting change.
