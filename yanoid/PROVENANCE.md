# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, physics, map scripts, power-ups | [Yanoid](reference/yanoid-0.3.0/) 0.3.0 by Jonas Christian Drewsen, Bjarke Sørensen, Mads Bondo Dydensborg — SDL Game Development Contest 2001 | `0.3.0` (submitted 1 Dec 2001), SHA-256 independently verified against a fresh SourceForge download | GPL-2.0-or-later | Preserved in `reference/yanoid-0.3.0/` (minus ten specific files, below); faithfully ported to JavaScript in `public/src/` — see `specs/PARITY.md` |
| SDL_Console source (`src/ConsoleSource/`) and libsge-derived pixel-collision fragment (`entity.cc`) | same source | same release | Unresolved ("? (Probably GPL, fill in)" in the original `CREDITS`, never completed) | Preserved as historical evidence in `reference/yanoid-0.3.0/`; **not used** by the port — console isn't needed in a browser, collision is reimplemented from audited bounding-box semantics |
| Two SDL_Console font PNGs, `yanoid.xm`, seven third-party WAV files | same source, reused from SDL_Console/Plutonic/Gnibbles/defendguin/KDE/EgoBoo | same release | Marked "GPL" (fonts: unresolved) with no version or per-file provenance pinned down | **Physically absent** from `reference/yanoid-0.3.0/` and from the repository entirely — see "Ten omitted files" below |
| Selected original gameplay sprites (bricks, paddles, balls, power-ups, background) | same source | same release | GPL-2.0-or-later | Copied into `public/assets/`, used directly by the runtime |
| Web UI, renderer, input, storage, newly authored 5×7 bitmap font, chiptune and Web Audio effects | this repository | — | GPL-3.0-or-later | New reconstruction work |

## Independent re-verification

This restoration's own audit (`specs/ARCHAEOLOGY.md`) concluded GPL-2.0-or-later
from reading the archive. Before integrating it into this collection, that
conclusion was checked again independently: the exact `yanoid-0.3.0.tar.gz`
was downloaded fresh from SourceForge, its SHA-256
(`dc9c71d0f507aa8cdc86e9d830e656d78aab952bff772ff2487409487e49f5d1`) matched
the documented value exactly, and `COPYING`/`README`/`CREDITS` were read
directly. The license statement is unambiguous:

> This program is free software; you can redistribute it and/or modify it
> under the terms of the GNU General Public License as published by the
> Free Software Foundation; either version 2 of the License, or (at your
> option) any later version.

This "or later" grant is what permits the JavaScript port to be distributed
as GPL-3.0-or-later, the same pattern already used for Netris, Donkey
Bolonkey and PSY PONG 3D.

## Ten omitted files: scoped to what's actually ambiguous

The delivered package for this restoration excluded Yanoid's *entire*
extracted source tree from public redistribution, reasoning that it
"contains historical third-party material with imprecise license metadata."
Reading the actual `CREDITS` file shows that description is broader than
the real ambiguity: only two areas of *code* (SDL_Console, one collision
fragment) and ten specific *binary* files are genuinely unresolved or
third-party-reused; the rest — the large majority of the C++/Python source,
written by the three named contest authors — is unambiguously covered by
the project's own top-level GPL-2.0-or-later declaration.

Following this collection's own established pattern for such cases (compare
`54321/PROVENANCE.md`, `psypong3d/PROVENANCE.md`), the reference tree here
preserves the *source code* in full — including the two ambiguous code
areas, kept as historical evidence, never reused — while physically omitting
only the ten specific binary files:

- `data/graphics/fonts/ConsoleFont.png`, `LargeFont.png`
- `data/music/yanoid.xm`
- `data/sounds/fire.wav`, `menu_choose.wav`, `menu_move.wav`, `peep.wav`,
  `pop.wav`, `powerup_bad.wav`, `powerup_collect.wav`

Full reasoning per file is in `THIRD_PARTY_NOTICES.md`. Neither raw
`.tar.gz` archive is redistributed, since a byte-identical archive would
still contain these ten files; `reference/README.md` records the exact
SHA-256 values needed to fetch and verify the complete originals
independently.

## What was not ported, and why

- **SDL/SDL_mixer/SDL_image native rendering, audio, and windowing** —
  replaced by Canvas 2D and Web Audio, which have no original counterpart
  to be faithful to.
- **The embedded Python scripting engine** — the nine original map scripts
  are semantically rewritten as JavaScript factory functions rather than
  running an embedded Python interpreter in the browser; `map8.py`'s
  dynamically-created bricks are implemented as named JS callbacks instead
  of `eval`-ing Python strings. See `specs/PARITY.md`, "Python rewrite."
- **Yanoid 0.3.5's post-contest features** (bonus map, slow/speed-ball
  power-ups, sprite animation, the replacement console) — deliberately kept
  out of Contest mode; see `specs/CONTEST_VS_035.md`.
- **Native executable-to-executable trace** — not yet performed in this
  environment; see `STATUS.md`, "Remaining validation."
