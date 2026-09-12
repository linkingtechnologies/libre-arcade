# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, physics, AI, timing, camera behavior | [PSY PONG 3D](reference/original-source/psypong3d-0.9/) by Quetzy Garcia | `0.9` (2009-01-02), archive SHA-256 recorded in `reference/audit/` | GPL-3.0-or-later | Preserved unmodified in `reference/original-source/psypong3d-0.9/`; faithfully transcribed to renderer-independent JavaScript in `public/src/core/` — see `specs/PARITY.md` |
| Original BMP textures (`menu.bmp`, `background.bmp`, `spiral.bmp`) | same source | same release | GPL-3.0-or-later, but **not redistributed here** | Excluded — see "Quarantined originals" below |
| Replacement artwork (`game-background.png`, `floor-vortex.png`, `menu-background.png`), WebGL renderer, UI shell, i18n, touch controls | this repository | — | GPL-3.0-or-later | New work — see `public/assets/ASSET_PROVENANCE.md` |

## Licensing: confirmed directly from the archive, no external metadata needed

The upstream 0.9 archive bundles the complete GPLv3 license text, and its
README, CHANGELOG, Makefile, and every source file header state that PSY
PONG 3D may be redistributed under GPL version 3 or, at the recipient's
option, any later version. This is the primary evidence — stronger than
external package metadata that labels the project GPLv2 elsewhere, which
this project's own audit explicitly overrides in favor of the archive's own
text (see `reference/audit/LEGAL_AUDIT.md`). **Conclusion: GPL-3.0-or-later**,
for the code, without qualification.

## Quarantined originals: textures with unclear redistribution rights

The upstream README credits its three BMP textures to sources outside the
author's own copyright: `menu.bmp` from GIMP's Alien Neon logo creator,
`background.bmp` from a Flickr photo credited to "Lynn (Gracie's mom)," and
`spiral.bmp` from an AdobeUserSite.com Photoshop tutorial. None of these
carries a redistribution grant sufficient to establish GPL-compatible reuse.
Following this collection's conservative default, **none of the three are
redistributed here** — they exist only inside the historical archive
referenced by `reference/audit/SHA256SUMS.txt`, never copied into this
repository. The browser build instead uses three entirely new replacement
images, created for this restoration and documented with their own
provenance in `public/assets/ASSET_PROVENANCE.md`; the historical screenshot
was consulted only for overall color-mood guidance, never as source pixels.

## What was not ported, and why

- **GLUT/OpenGL windowing, input and the fixed-function rendering pipeline**
  — replaced by WebGL, which has no original counterpart to be faithful to.
- **Exact historical frame-rate-dependent pacing** — the original advances
  gameplay from its render loop and sleeps 5,000 microseconds per frame, so
  its absolute speed depended on one specific machine's actual frame cost.
  This port uses a deterministic 5 ms source-derived reference step and
  preserves every observed per-step movement formula, but does not claim
  bit-identical pacing to any particular historical machine — see
  `specs/PARITY.md` and the "Timing note" in `README.md`. A native
  side-by-side executable comparison is recorded as a specific open item in
  `specs/RELEASE_CHECKLIST.md`, not silently assumed complete.
