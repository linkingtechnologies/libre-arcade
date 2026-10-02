# Memonix: Pair

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/memonix-pair/public/index.html)**

Faithful standalone HTML5 restoration of **Pair**, one of the four modes in **Memonix 1.6** by Michael Kurinnoy / Viewizard Games.

## Preserved gameplay

- centered 2×2, 4×4, 6×6 and 8×8 boards;
- three historical difficulty settings;
- Easy uses four copies of each selected symbol on boards larger than 2×2, while 2×2 uses ordinary pairs;
- Normal uses ordinary pairs;
- Hard restores the complete original board after a mismatch, including pairs already completed;
- matching and mismatching selections remain face-up for about 500 ms before resolution;
- preview/countdown precedes timed play, with manual Start available;
- no move counter, matching the original;
- best score is the lowest completion time, stored separately for every size/difficulty combination.

## Historical presentation

The restoration uses recovered Memonix artwork for the title screen, Pair preview, Start/Game screens, card back/faces, empty cells and winner dialog. `mainmenu.jpg` is preserved unchanged and Pair remains in its historical suite slot. The other suite windows and lower controls are documented standalone adaptations for Instructions, Options, Credits, EN/IT, audio, scores and New Game.

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

No build step is required to play: `public/` runs as-is with native ES modules, and it has no network dependencies at runtime. Any static web server works as well (`python3 -m http.server 8080` from `public/`, nginx, GitHub Pages). Do **not** open `index.html` over `file://`: browser module security blocks the local imports.

`npm run build` packages `public/` into a gitignored `game/` folder for standalone deployment; `npm start` builds and then serves `game/`.

## Tests

```sh
npm test     # node --test
npm run lint
npm run check   # lint + test
```

The test suite has no external npm dependencies.

## Archaeology

The original source/runtime bundle is preserved under `/reference` together with its license and SHA-256. `docs/BEHAVIOR_ORACLE.md`, `docs/GAMEPLAY_PARITY.md`, `docs/VISUAL_PARITY.md`, `docs/MENU_FIDELITY.md` and the asset manifests document the reconstruction. See `PROVENANCE.md` and `SOFTWARE_ARCHAEOLOGY.md` for the independent verification trail.

## License

The HTML5 restoration code is distributed under **GPL-3.0-only**. The recovered Memonix 1.6 source license notice (`reference/Memonix-License.txt`) names GNU GPL version 3 with no "or later" clause, so this port cannot claim the "or later" permission; see `PROVENANCE.md`. Original Memonix authorship and recovered artwork provenance are documented in `THIRD_PARTY_NOTICES.md`.
