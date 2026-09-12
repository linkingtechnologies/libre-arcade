# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, timing, physics, level format | [Don Ceferino Hazaña](reference/ceferino-0.97.8/) 0.97.8 by Hugo Ruscitti | Preserved archive `ceferino_0.97.8.orig.tar.gz`, SHA-256 independently re-verified against the included copy | GPL-2.0-or-later | Preserved unmodified in `reference/ceferino-0.97.8/` and `reference/ceferino_0.97.8.orig.tar.gz`; faithfully ported to JavaScript in `public/src/core/` — see `docs/PARITY.md` |
| Active graphics, levels, WAV sound effects | same source, per-directory `LICENSE-KIND.FILES` notices (`data/ima`, `data/levels`, `data/music`, `data/sounds`) | same archive | GPL-2.0-or-later | Copied byte-identical into `public/assets/`, except the documented `pres_losers.jpg` derivative (below) — see `docs/ASSET_AUDIT.md` and `docs/AUDIO_AUDIT.md` |
| Historical bitmap fonts, `menu.xm` module | same source | same archive | GPL-2.0-or-later grant present, but embedded sample/typeface provenance undocumented | Preserved in `reference/` and `quarantine/`, **not loaded** by the runtime — see "Quarantine" below |
| Web UI, Canvas renderer, input, storage, i18n | this repository | — | GPL-3.0-only (this repository's own `LICENSE` carries the plain GPLv3 text) | New reconstruction work |

## Licensing: independently re-verified against the included archive

Before integrating this restoration, `docs/LEGAL_AUDIT.md`'s conclusion was
checked again directly: the included `reference/ceferino_0.97.8.orig.tar.gz`
was hashed and matches the documented SHA-256
(`6f0f2674a8a968950498570b89123e341dca50499d255e7bcdf3703a85aa3074`)
exactly, and `COPYING` plus a source file header
(`reference/ceferino-0.97.8/src/gaucho.cc`) and the `data/ima/LICENSE-KIND.FILES`
notice were read directly:

> Don Ceferino Hazaña is free software; you can redistribute it and/or
> modify it under the terms of the GNU General Public License as published
> by the Free Software Foundation; either version 2 of the License, or (at
> your option) any later version.

60 of the 62 original `.cc`/`.h` files carry this exact notice (the other
two are a trivial gettext wrapper and an empty header); all four data
directories carry a byte-identical GPL-2.0-or-later notice. This confirms
`docs/LEGAL_AUDIT.md`'s own conclusion rather than just repeating it.

## Quarantine: a named, visible holding area, not a silent omission

Unlike this collection's other recent restorations — which physically
exclude specific ambiguous binary files from the repository entirely — this
restoration keeps them, in a dedicated `quarantine/` folder with its own
`README.md` explaining exactly what's there and why: bitmap font sheets
whose underlying typeface source is undocumented, and `menu.xm`, whose
package-level GPL grant and composer credit (Javier Da Silva) are solid, but
whose embedded MID2XM/General-MIDI-style sample bank has no traceable
per-sample origin. Neither is loaded by the production build. This is a
different, more transparent solution to the same problem 54321, Donkey
Bolonkey and PSY PONG 3D solved by omission — the files are still visible in
the tree, clearly labeled as not-yet-clearable, rather than absent.

## The one deliberate pixel edit, fully accounted for

`pres_losers.jpg`, the first LosersJuegos presentation image, originally
displayed the now-dead URL `www.losersjuegos.com.ar`. The runtime copy has
that text removed; the byte-identical original remains in
`reference/ceferino-0.97.8/data/ima/pres_losers.jpg`. Both files' SHA-256
hashes are pinned by an automated test
(`test/licenses.test.mjs`, "runtime pres_losers artwork is the documented
URL-free derivative while reference stays original"), so the one intentional
pixel-level change in this entire restoration is independently checked on
every test run, not just described in prose.

## What was not ported, and why

- **SDL/SDL_image/SDL_mixer native rendering, windowing, and audio** —
  replaced by Canvas 2D and HTML5 `Audio`, which have no original
  counterpart to be faithful to.
- **The 11-element/12-sound array mismatch in the original `audio.cc`** — a
  genuine memory-safety defect in the C++ source (an array sized for 11
  pointers that stores 12), documented in `docs/PARITY.md` but not
  reproduced; JavaScript has no equivalent fixed-size array overflow to
  preserve.
- **The historical level editor and `ceferinosetup` desktop utility** —
  preserved under `reference/`, not ported; the browser shell exposes
  equivalent preferences directly instead.
- **`menu.xm` and the bitmap fonts** — see "Quarantine" above.
