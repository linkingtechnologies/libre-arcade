# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Original C++/SDL source, board data, artwork, documentation | [54321](http://www.nklein.com/products/54321) by Patrick Stein / nklein software | `1.0.2001.11.16` (16 Nov 2001), preserved byte-for-byte with a SHA-256 manifest in `reference/` | `LicenseRef-NKlein-Universal-NonExclusive` (nklein software's own site-wide grant — see below) | Preserved unmodified in `reference/54321-1.0.2001.11.16/` and `reference/original-archive/` |
| Game rules, topology, difficulty tables, generation/setup (all five advertised games) | same source | same release | GPL-3.0-or-later (this repository) | Faithfully transcribed to JavaScript in `public/src/core/` and `public/src/games/` — see `docs/PARITY.md` for the source-to-browser mapping |
| Original runtime artwork (tile/bomb/wall/peg sprites, sidebar controls, victory/defeat overlays) | same source | same release | GPL-3.0-or-later (this repository) | Byte-identical copies in `public/src/assets/original/`, verified against `reference/` by `test/runtime-assets.test.mjs` |
| Blue Vinyl display font (credited to Jess / Blue Vinyl Fonts) | same source | same release | **Unidentified** — precise typeface/license not established | Preserved unmodified under `reference/`; **not used** for newly rendered browser text |
| Browser shell: responsive layout, EN/IT localization, touch controls, accessibility labels, optional dimensional-help overlays, Web Audio reconstruction of `SoundDev::ding()` | this repository | — | GPL-3.0-or-later | New reconstruction work |
| This integration's own build tooling (`scripts/serve.mjs`, `scripts/build.mjs`, `eslint.config.mjs`) | this repository | — | GPL-3.0-or-later | New files |

Per-path licensing is declared formally in [`REUSE.toml`](REUSE.toml); full
license texts are in [`LICENSES/`](LICENSES/).

## Licensing status: resolved

The 2001 archive itself carries no standalone `LICENSE`/`COPYING` file. That
is no longer treated as "no license": the archive's own webpage source
(`reference/54321-1.0.2001.11.16/data/webpage/hdr.php`, `tail.php`) wires
itself into nklein.com's site-wide copyright system, and that system's
actual copyright page was located, dated, and quoted verbatim via the
Wayback Machine at two dates bracketing the 54321 release (13 Jun 2001 and
26 Dec 2005), independently corroborated by LibreGameWiki's classification
of 54321's code and media. Full evidence, quotes and archive URLs are in
[`docs/LICENSE-RESEARCH.md`](docs/LICENSE-RESEARCH.md) and
[`docs/archaeology/LEGAL_STATUS.md`](docs/archaeology/LEGAL_STATUS.md); the
verbatim license text is preserved in
[`LICENSES/LicenseRef-NKlein-Universal-NonExclusive.txt`](LICENSES/LicenseRef-NKlein-Universal-NonExclusive.txt).

**This is not an SPDX-standard or FSF/OSI-certified license.** It is a
bespoke, plain-English grant, recorded under the custom identifier
`LicenseRef-NKlein-Universal-NonExclusive` per the REUSE convention. Nobody
has certified it GPL-compatible in the way the FSF certifies named licenses.
The classification this project uses is:

> Original 54321 materials are distributed under Patrick Stein / nklein
> software's historical Universal, Non-Exclusive License. The HTML5/
> JavaScript restoration is GPL-3.0-or-later. Historical material retains
> its original licensing and is not relicensed as GPL.

## Why the faithful-port game logic can be GPL-3.0-or-later

nklein's grant authorizes doing "anything you like" with the original
material, explicitly disclaims requiring a derivative work to "give away
your products," and imposes exactly one condition: not restricting *others'*
ability to do the same with the *original* items. It does not require a
derivative to carry the same license, or any particular license at all —
which is the specific permission that lets this repository license its own
JavaScript transcription of the original game logic under GPL-3.0-or-later,
while `reference/` and the copied original artwork remain equally available
to everyone under nklein's own terms, unrestricted and unexclusive, exactly
as the grant requires. This is analogous to how permissively-licensed
upstream code can be incorporated into a GPL-licensed combined work without
being "converted" to GPL (see `klondike/REUSE.toml` for the same pattern
with MIT-licensed upstream engines) — except here the upstream grant is even
more permissive about what license a derivative may carry.

## What was not ported, and why

- **SDL/SDL_image window management and native rendering** — replaced by
  HTML5 Canvas 2D, which has no original counterpart to be faithful to.
- **The compiled hidden Life mode/easter egg** — preserved and documented
  (`docs/archaeology/HISTORY.md`, `docs/ARCHAEOLOGY.md`) but intentionally
  not ported into the five-game selector.
- **Right-click-dependent desktop interactions** — given touch equivalents
  documented as reconstructions, not original behavior.
- **The Blue Vinyl font** — its precise license was never identified, so it
  is preserved but not used for any newly rendered browser text, independent
  of the rest of this resolution.
