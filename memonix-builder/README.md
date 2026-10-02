# Memonix: Builder

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/memonix-builder/public/index.html)**

Faithful standalone HTML5 restoration of **Builder**, one of the four modes in **Memonix 1.6** by Michael Kurinnoy / Viewizard Games.

## Preserved gameplay

- 11 historical `housedata` templates;
- centered 2×2, 4×4, 6×6 and 8×8 boards;
- five original difficulty settings;
- source-faithful Builder generator, including the historical `Ltr` / `Rtr` dependencies and D0/D1 cached-facade behaviour;
- historical first-run template-selection quirk;
- finite remaining-piece inventory across Windows, Walls, Doors and Roof;
- preview/countdown, manual Start, drag/drop, click/tap placement and right-click removal;
- Mist help on D0–D2;
- D4 wrong placement marker for about 500 ms followed by a complete reconstruction clear;
- exact matrix win condition and local best times by difficulty and board size.

## Historical presentation

The restoration uses recovered Memonix artwork for the title screen, Builder preview, Start/Game screens, selector panel, error overlays and winner dialog. `mainmenu.jpg` is preserved unchanged; Builder remains in its historical menu slot. The other suite slots and lower controls are documented standalone adaptations for Instructions, Options, Credits, EN/IT, audio, scores and New Game.

## Libre Arcade requirements

- vanilla HTML5 + JavaScript, no framework and no build step;
- fixed historical 800×600 canvas scaled responsively to the viewport with no page scroll;
- pointer/touch input;
- complete EN/IT interface;
- sound toggle;
- local-score persistence and complete local-data reset;
- Libre Arcade attribution only in Credits, with a clickable project link.

## Run

```sh
npm run dev      # serve public/ at http://localhost:8080
```

No build step is required to play: `public/` runs as-is with native ES modules. Any static web server works as well (`python3 -m http.server 8080` from `public/`, nginx, GitHub Pages). Do **not** open `index.html` over `file://`: browser module security blocks the local imports.

`npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

## Tests

```sh
npm test     # node --test
npm run lint
npm run check   # lint + test
```

The test suite has no external npm dependencies.

## Archaeology

The original source/runtime bundle is preserved under `/reference` together with its license and SHA-256. `docs/BEHAVIOR_ORACLE.md`, `docs/GAMEPLAY_PARITY.md`, `docs/VISUAL_PARITY.md`, `docs/MENU_FIDELITY.md`, the template files and asset manifests document the reconstruction. See `PROVENANCE.md` and `SOFTWARE_ARCHAEOLOGY.md` for the independent verification trail.

## License

The HTML5 restoration code is distributed under **GPL-3.0-only**. The recovered Memonix 1.6 source license notice (`reference/Memonix-License.txt`) names GNU GPL version 3 with no "or later" clause, so this port cannot claim the "or later" permission; see `PROVENANCE.md`. Original Memonix authorship and recovered artwork provenance are documented in `THIRD_PARTY_NOTICES.md`.
