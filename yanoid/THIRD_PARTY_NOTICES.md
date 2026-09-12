# Third-party notices

## Historical upstream source

Yanoid 0.3.0 (SDL Game Development Contest 2001) is Copyright 2001 Jonas
Christian Drewsen, Bjarke Sørensen, Mads Bondo Dydensborg and contributors,
licensed GPL-2.0-or-later — confirmed directly in the archive's own
`COPYING` and `README` ("either version 2 of the License, or (at your
option) any later version"). The extracted tree is preserved under
`reference/yanoid-0.3.0/`, verified against the SHA-256 of the archive
downloaded from SourceForge (`reference/README.md`,
`reference/UPSTREAM_SHA256SUMS`, `reference/yanoid-0.3.0.SHA256SUMS`).

## Ten files omitted from the preserved tree

Yanoid's own `CREDITS` file distinguishes the project's own work from code
and media reused from elsewhere. Ten specific files are physically absent
from `reference/yanoid-0.3.0/` for that reason — everything else, including
the two areas of reused *code*, is preserved intact:

- `data/graphics/fonts/ConsoleFont.png`, `LargeFont.png` — SDL_Console fonts.
  `CREDITS`: "Author: Garrett Banuk... License: ? (Probably GPL, fill in)" —
  never filled in.
- `data/music/yanoid.xm` — "from the Plutonic demo group... License: GPL."
  No version stated; not independently verified.
- `data/sounds/pop.wav` — from Gnibbles (GNOME Games), marked GPL.
- `data/sounds/fire.wav`, `menu_move.wav`, `peep.wav` — from KDE, each
  marked GPL and renamed from a KDE sound-theme file.
- `data/sounds/menu_choose.wav`, `powerup_bad.wav` — from EgoBoo, marked GPL.
- `data/sounds/powerup_collect.wav` — from KDE, marked GPL.

(`CREDITS` also names a `blip.wav` "from the game defendguin," but no file
by that name exists in the audited 0.3.0 archive — noted here rather than
silently dropped, since the discrepancy is itself part of the record.)

Reused *code* is treated differently and is **not omitted**: the SDL_Console
source under `src/ConsoleSource/` (same "probably GPL, fill in" uncertainty
as its fonts) and the libsge-derived pixel-collision fragment in
`entity.cc` remain in `reference/yanoid-0.3.0/` under their own historical
notices, exactly as shipped — they are preserved as evidence of what the
contest entry actually contained, not endorsed for reuse. Neither is used
by the JavaScript port: the console isn't needed in a browser, and
collision is reimplemented from the audited bounding-box semantics (see
`specs/PARITY.md`).

The raw `.tar.gz` archives are not redistributed at all, since a
byte-identical tarball would necessarily still contain the ten omitted
files. See `reference/README.md` for how to fetch and verify the complete
originals independently.

## Web port

New JavaScript, HTML, CSS, the newly authored 5×7 bitmap font
(`public/assets/fonts/yanoid-web-5x7.png`), the newly authored chiptune and
Web Audio sound effects, tests, and documentation in this restoration are
licensed GPL-3.0-or-later. This does not relicense the preserved historical
Yanoid source, which keeps its own GPL-2.0-or-later notices.
