# Third-party notices

## 54321 (2001)

Original author: Patrick Stein / nklein software.  
Original release: `v1.0.2001.11.16`.  
Original website recorded in the archive: `http://www.nklein.com/products/54321`.

The complete historical source/data tree is preserved under `reference/54321-1.0.2001.11.16/`. The exact user-supplied archive is preserved under `reference/original-archive/` with a SHA-256 manifest. This material is licensed `LicenseRef-NKlein-Universal-NonExclusive` — see `PROVENANCE.md` and `LICENSES/LicenseRef-NKlein-Universal-NonExclusive.txt`.

Selected original PNG artwork is copied into `public/src/assets/original/` to support visual parity for the five advertised games. The browser runtime also includes the historical Tile Slider `centers.png` and `borders.png` sprite sheets. These, and the faithful JavaScript transcription of the original game logic in `public/src/core/` and `public/src/games/`, are licensed GPL-3.0-or-later by this repository — permitted under nklein's own grant, which does not require a derivative to carry the same terms. See `REUSE.toml`.

The historical tarball does not contain a standalone `LICENSE` or `COPYING` file. Its own webpage source, however, was wired into nklein.com's site-wide copyright system, whose "Universal, Non-Exclusive License" was independently located and dated via the Wayback Machine, bracketing the 54321 release. See `docs/LICENSE-RESEARCH.md` for the full evidentiary chain. This is a custom, non-SPDX-standard license — not FSF/OSI-certified — recorded as `LicenseRef-NKlein-Universal-NonExclusive`.

## Blue Vinyl Fonts

The original game credits Jess / Blue Vinyl Fonts for the font design. The precise historical typeface/license has not yet been identified. The original raster `font.png` remains preserved under `/reference`, but The browser restoration does not use it for newly rendered browser text.

See `docs/LICENSE-RESEARCH.md` and `docs/ASSET-PROVENANCE.md`.

## Browser-port additions

The responsive shell, localization, touch controls, optional cross-game dimensional-help overlays and Web Audio implementation are new browser-port work, licensed GPL-3.0-or-later by this repository. They do not change the licensing status of the preserved original files in `reference/`.
