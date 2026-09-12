# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, topology, level data, scoring, timing | [Donkey Bolonkey](http://www.davidcapello.com.ar/) by David A. Capello, written for the SpeedHack 2001 competition | Debian-labeled `2001`, but file timestamps/changelog show maintenance through 2003 (see `specs/ARCHAEOLOGY.md`) | GPL-2.0-or-later | Preserved unmodified in `reference/dkbk/`; faithfully transcribed to JavaScript in `public/src/core/` — see `specs/PARITY.md` |
| Original Allegro datafile (`dkbk.dat`), original tarball, historical screenshots | same source | same release | GPL-2.0-or-later, but **not redistributed here** | Excluded from this repo-safe package — see "Quarantined originals" below |
| Web UI, canvas rendering, procedural graphics, synthesized Web Audio, localization, touch controls, high-score persistence | this repository | — | GPL-3.0-or-later | New reconstruction work; no historical asset is copied or transformed |

## Licensing: a straightforward "or later" upgrade

Every historical source file's own header states the license explicitly and
unambiguously:

> This program is free software; you can redistribute it and/or modify it
> under the terms of the GNU General Public License as published by the
> Free Software Foundation; either version 2 of the License, or (at your
> option) any later version.

This is the author's own textual "or later" grant — not inferred, not
reconstructed from secondary sources — so this project exercises that
permission the same way [`netris/PROVENANCE.md`](../netris/PROVENANCE.md)
does for Netris 0.52: the frozen original in `reference/dkbk/` keeps its own
GPL-2.0-or-later notices unmodified (see `reference/dkbk/COPYING`), and this
repository distributes the project as a whole, including the faithful
JavaScript transcription of the original logic, under GPL-3.0-or-later.

## Quarantined originals: media with unclear provenance is not redistributed here

The original SpeedHack README credits several assets whose redistribution
terms are not independently documented: three backgrounds from an
unspecified CD, a motor sound lifted from *Colin McRae Rally* (PlayStation),
at least one sound of unknown origin, additional family-recorded sounds with
no separate grant, and a raster font whose source typeface was never
identified. All of that lives only inside `dkbk.dat`, the original Allegro
datafile — and this package **intentionally excludes it**, along with the
original tarball and two historical screenshots (`.gitignore`; see
`specs/ASSET_AUDIT.md`). The web runtime never loads or references
`dkbk.dat`; `test/production.test.js` has a standing regression test for
exactly that. Every sprite the browser draws is procedural, and every sound
is synthesized at runtime by `public/src/audio.js` — new timbres, not
recordings or transformations of the historical samples.

This is a stricter stance than 54321's: rather than research the original
media's licensing further, this restoration simply declines to redistribute
it and rebuilds the presentation layer from scratch, while still faithfully
porting the GPL-covered *game logic* (which is unambiguously licensed).

## What was not ported, and why

- **Allegro/DJGPP rendering, input and audio backends** — replaced by
  Canvas 2D and Web Audio, which have no original counterpart to be
  faithful to.
- **Exact libc `rand()` sequence** — platform-dependent and not portable;
  gameplay RNG and decorative renderer jitter are deliberately decoupled
  (see `specs/PARITY.md`, "Render-time RNG coupling").
- **Native Allegro 4 executable-to-executable trace** — not yet possible in
  this environment (no Allegro 4 headers/libraries); the current parity
  evidence is source-derived deterministic traces plus a hand-verified
  level-1 fixture, not oracle-level executable comparison. See
  `specs/PARITY.md`, "Next parity target."
