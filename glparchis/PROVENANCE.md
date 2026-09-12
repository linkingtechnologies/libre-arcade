# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, board topology/routes, AI decision structure and thresholds | [glParchis](reference/glparchis-20181125/) 20181125 by Mariano Muñoz (Turulomio) | Preserved archive `glparchis-20181125.tar.gz`, SHA-256 independently re-verified against `reference/SHA256SUMS` | GPL-3.0-only | Preserved unmodified in `reference/glparchis-20181125/`; faithfully ported to JavaScript in `public/src/core/` and `public/src/ai/` — see `docs/PARITY.md` |
| `play.png`, `stop.png` preview icons | same source, `glparchis/images/` | same archive | Embedded PNG comment reads "Copyright INCORS GmbH (www.iconexperience.com) - Unlicensed preview image" | Preserved only inside `reference/`; **not loaded** by the runtime — see `docs/ASSET-AUDIT.md` |
| `keka.png`/`keke.png`/`keki.png`/`keko.png` avatars, six WAV effects, remaining UI icons/textures/flags | same source | same archive | Package-level GPL-3.0-only grant, but no per-file authorship/license statement found for these specific binaries | Preserved only inside `reference/`; **not loaded** by the runtime — see `docs/ASSET-AUDIT.md` |
| Web UI, Canvas board/pawn/die rendering, Web Audio sound cues, i18n | this repository | — | GPL-3.0-or-later (this repository's own `LICENSE` carries the plain GPLv3 text) | New reconstruction work |

## Licensing: independently re-verified against the included archive

Before integrating this restoration, `docs/AUDIT.md`'s conclusion was checked
again directly rather than taken on trust. `reference/archives/glparchis-20181125.tar.gz`
was hashed and matches `reference/SHA256SUMS` exactly
(`17a39f659625e8a8f6113053ee2f59b403f781fbbd8c1970b365ba2b319dc730`).
`LICENSE.txt` was read directly and contains the complete, unmodified GNU
General Public License, Version 3, 29 June 2007. `setup.py` independently
declares `license='GPL-3'`. No source file carries a per-file "or (at your
option) any later version" grant — the only occurrences of that phrase in
the whole archive are inside the GPLv3 boilerplate text itself (`LICENSE.txt`
and the About dialog's `frmAbout.ui`/`Ui_frmAbout.py`, which simply quote the
license explaining how versioning works in general), not a project-specific
grant. This confirms `docs/AUDIT.md`'s own **GPL-3.0-only** conclusion —
not GPL-3.0-or-later — rather than just repeating it.

The two flagged preview icons were independently re-inspected with a raw
byte-level read (`grep -a` over the PNG files): both `play.png` and
`stop.png` contain the embedded `tEXt` chunk comment "Copyright INCORS GmbH
(www.iconexperience.com) - Unlicensed preview image", confirming
`docs/ASSET-AUDIT.md`'s claim exactly rather than repeating it uninspected.

## What was not ported, and why

- **Qt5/PyQt5/PyOpenGL desktop rendering, windowing and Qt Multimedia audio**
  — replaced by Canvas 2D and Web Audio, which have no original counterpart
  to be faithful to. The original OpenGL cylinder/disk pawn geometry and 3D
  die are reproduced as flat Canvas primitives rather than ported as 3D
  code.
- **`play.png`, `stop.png`** — the two files whose own embedded metadata
  identifies them as an unlicensed third-party preview image; see
  `docs/ASSET-AUDIT.md`.
- **`keka.png`/`keke.png`/`keki.png`/`keko.png` avatars** — the About dialog
  credits `nobleavatar.com`, but the archive carries no asset-specific
  license statement for these exact files.
- **Six WAV sound effects** (`click.wav`, `comer.wav`, `dice.wav`,
  `meter.wav`, `shoot.wav`, `win.wav`) — no per-file author/license notice
  found; replaced by newly written, clean-room Web Audio oscillator cues in
  `public/src/ui/audio.js`.
- **Remaining UI icons/textures/flags** (`wood.png`, `configure.png`,
  `help.png`, `save.png`, `sound.png`, country flag icons, and similar) —
  no complete asset manifest establishing authorship/license was found;
  replaced by new HTML/CSS/Canvas presentation.
- **Global-statistics upload, update-check and bug-report HTTP calls** —
  optional network features with no gameplay purpose, intentionally omitted
  from a static, privacy-friendly browser build. See `docs/AUDIT.md`'s
  "Network dependencies" section.
- **Romanian and Russian translation catalogues** — individual authorship
  not clearly documented in the package; the restoration ships a new
  Italian catalogue and a clean English catalogue instead.
