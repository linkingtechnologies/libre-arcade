# 54321

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/54321/public/index.html)**

A software-archaeology preservation and browser-restoration project for Patrick Stein's **54321**, release **1.0.2001.11.16**, created for the 1 MB SDL Game Programming Contest. See [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the recovery story and [`PROVENANCE.md`](PROVENANCE.md) for exactly what was and wasn't ported, and under which license.

This release candidate restores the **five games advertised by the original release** — **Flip-Flop, Bomb Squad, Maze Runner, Peg Jumper and Tile Slider** — in HTML5 + JavaScript with no application framework or backend. The historical 2001 tree and the exact uploaded archive remain preserved separately under `reference/`.

## Run

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output. Any other static HTTP server pointed at
`public/` works too — there is no build step and no server-side game logic.

## Restored gameplay

- 2D, 3D and 4D versions of all five advertised games.
- Original 4×4-per-axis topology, difficulty tables and Wrap behavior.
- Original 800×600 logical game layout rendered responsively in the browser.
- Selected original runtime artwork, regression-tested byte-for-byte against `/reference`.
- Complete English and Italian player-facing UI/help.
- Short movement sound reconstructed with Web Audio from the original `SoundDev::ding()` algorithm; no sound sample asset is added.
- Touch adaptations for interactions that originally depended on right-click.
- Optional **Dimensional help**, disabled by default, across all five games in 3D/4D. It exposes geometry/legal current actions only; it is not a solver and never reveals hidden Bomb Squad state.
- Persistent language, sound and dimensional-help preferences when browser storage is available.
- **58 automated parity, preservation and localization tests**.

## Software archaeology

The archaeology material is part of the repository, not an external afterthought:

- `reference/54321-1.0.2001.11.16/` — untouched extracted historical source/data tree;
- `reference/original-archive/` — exact archive supplied for the restoration plus checksum manifest;
- `docs/ARCHAEOLOGY.md` — concise archaeology record;
- `docs/archaeology/` — detailed history, gameplay, technical notes, preservation policy and legal-status dossier;
- `docs/PARITY.md` — source-to-browser behavior notes;
- `docs/ASSET-PROVENANCE.md` — runtime asset provenance;
- `docs/LICENSE-RESEARCH.md` — licensing evidence and unresolved questions.

The source also contains a compiled hidden **Life** mode/easter egg. It is preserved and documented but intentionally not promoted into the normal five-game selector.

## Preservation vs reconstruction

**PRESERVED**

- complete historical source/data tree;
- exact uploaded archive and checksums;
- original board data, images and editable historical sources.

**FAITHFUL PORT**

- game rules and state transitions;
- n-dimensional topology and orthogonal-neighbor semantics;
- difficulty values, generation/setup rules and Wrap behavior;
- original board geometry and selected historical artwork;
- desktop mouse behavior where a direct browser equivalent exists.

**RECONSTRUCTED / QoL**

- responsive HTML shell;
- browser-native game/language controls;
- touch-only controls;
- Italian localization;
- accessibility labels;
- browser/system font for newly rendered text;
- Web Audio implementation of the source-generated ding;
- optional dimensional-help overlays.

No reconstructed feature is presented as original 2001 behavior.

## Production status

The five advertised games are technically complete for static web deployment and the automated suite passes **58/58**. See `docs/PRODUCTION-READINESS.md` for the release gate and the short manual browser/device smoke test still recommended before publishing.

## Licensing

The 2001 archive contains no standalone `LICENSE` or `COPYING` file, but its
own webpage source was wired into nklein.com's site-wide copyright system —
whose "Universal, Non-Exclusive License" was independently located and dated
via the Wayback Machine at two points bracketing the 54321 release, and
corroborated by LibreGameWiki's own classification. This is a custom,
non-SPDX-standard grant, not an FSF/OSI-certified license.

- **Original material** (`reference/`, and the copied original artwork/board
  data in `public/src/assets/original/`): `LicenseRef-NKlein-Universal-NonExclusive`.
- **This repository's own code** — the browser shell and the faithful
  JavaScript transcription of the original game logic in `public/src/core/`
  and `public/src/games/`, permitted under nklein's own grant, which does
  not require a derivative to carry the same terms: **GPL-3.0-or-later**.

The project is treated as abandoned upstream for preservation purposes, but
abandonment does not remove copyright or change the licensing analysis
above.

See `docs/LICENSE-RESEARCH.md` for the full evidentiary chain,
`docs/archaeology/LEGAL_STATUS.md`, `docs/ASSET-PROVENANCE.md`,
`THIRD_PARTY_NOTICES.md`, `REUSE.toml` and [`PROVENANCE.md`](PROVENANCE.md).
