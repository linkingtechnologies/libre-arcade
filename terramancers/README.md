# Terramancers

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/terramancers/public/index.html)**

A preservation-first browser restoration of **Terramancers**, Shai Shapira's 2012 Liberated Pixel Cup game. See [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the recovery story and [`PROVENANCE.md`](PROVENANCE.md) for exactly what was and wasn't ported.

This repository deliberately separates the historical artifact from the browser port:

- `reference/` preserves the original LPC ZIP, its extracted contents, provenance notes, legal audit and parity evidence;
- `public/src/`, `public/assets/`, `public/index.html` and `public/styles.css` contain the HTML5/JavaScript restoration.

The browser version uses **vanilla JavaScript + Canvas 2D**, has no runtime dependencies, requires no backend and is suitable for static hosting such as GitHub Pages.

## Status

**v1.0.2 — production-ready preservation build.**

The game rules, level generation, capture logic, tree behavior, scoring and movement are source-derived from the original Java implementation. Browser-specific changes are documented separately and are not represented as historical behavior.

This browser restoration is a **modified and ported version** of Shai Shapira's original 2012 Terramancers. The HTML5/JavaScript restoration was created and modified in **2026**; it is not presented as an unmodified upstream release.

The original LPC archive remains byte-for-byte preserved with SHA-256:

`100a77340a9004a271ccd8a00e2387a368ade52e7a96882da0feaa01147f081a`

## Play

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output. Any other static HTTP server pointed at
`public/` works too — no build step is required. GitHub Pages can publish
`public/` as-is; `.nojekyll` is included.

## Controls

- Player 1: arrow keys
- Player 2: W / A / S / D
- `Esc` or the **Menu** button: leave the current match and return to the main menu
- Touch devices: on-screen directional controls appear automatically

In single-player mode only the Player 1 touch pad is shown. In local multiplayer both pads are available.

## Languages

The browser shell supports **English and Italian**. It initially follows the browser language when possible and provides a language switch in the main menu.

English remains the historical reference language; localization is a browser adaptation.

## Parity highlights

Preserved behavior includes:

- 32×32 tiles;
- six terrain families and three distinct random terrain assignments per match;
- the original Easy / Medium / Hard obstacle ratios and 6 / 8 / 10 tree counts;
- horizontal and vertical Reversi-style capture only;
- original border construction and obstacle rules;
- original 0.8 pixels per simulation tick movement;
- intentionally un-normalized diagonal movement;
- point-only collision checks;
- original score calculation, including a single-player tie counting as a loss;
- local two-player mode and symmetric multiplayer obstacle generation;
- nominal **180 simulation ticks/s** (`60 FPS × 3 ticks per frame`);
- walking animation advanced on an independent **60 Hz historical repaint clock**, so 120/144 Hz displays do not speed it up.

An active match also keeps its logical screen size after it starts. Browser resize or phone rotation only scales/letterboxes that frozen scene; the map and gameplay are not regenerated mid-match.

## Browser adaptations

The following are intentional platform adaptations rather than claims about the 2012 executable:

- Java AWT/Swing → Canvas 2D;
- responsive letterboxing after resize/orientation change;
- touch controls;
- `Esc` / Menu exit from a running match;
- accessible Instructions and About screens;
- English/Italian UI;
- browser-safe handling of the historical Exit command;
- corrected case-sensitive lookup of historical sprite filenames;
- HTML menu shell instead of a pixel-identical reproduction of the Java `UIUtils` buttons.

See `reference/audit/PRESERVED_VS_RECONSTRUCTED.md` for the formal boundary.

## Tests

Run:

```bash
npm run check
```

The production suite currently contains **20 tests** covering the parity core, tree cadence, animation cadence, difficulty constants, spawn positions, map dimensions, scoring, end-game behavior, responsive scene fitting, preservation of the original ZIP, and a headless browser-shell flow for menus, localization and touch-control visibility.

No third-party test framework is required; the suite uses Node's built-in test runner.

## Executable archaeology

The preserved `Terramancers.jar` was also launched at 800×600 from a temporary copy of the archive. On a case-sensitive Linux filesystem, temporary lowercase aliases were needed for historical sprite filename mismatches; `/reference` itself was not modified.

The captured original menu is preserved at:

`reference/audit/captures/original-java-menu-800x600.png`

At 800×600 the Java source generates an 832×608 arena and centers it, producing the small intentional clipping visible in the original executable. The browser parity renderer preserves the same logical-coordinate behavior.

See `reference/audit/EXECUTABLE_PARITY.md` for details.

## Licensing

The original program is GPL-3.0-or-later. The browser source is distributed under **GPL-3.0-or-later** as a modified/ported version. For historical LPC artwork, the archive's own `COPYING.TXT` dual-licenses all non-software content CC-BY-SA-3.0 / GPL-3.0-or-later — independently re-verified against the included, hash-matched archive, not just this audit's summary; attribution and provenance are preserved separately. See:

- `PROVENANCE.md`
- `THIRD_PARTY_NOTICES.md`
- `reference/audit/LEGAL_AUDIT.md`
- `reference/audit/ASSET_PROVENANCE.md`

Historical files under `reference/` retain their original notices and licenses.
