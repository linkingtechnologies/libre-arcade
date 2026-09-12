# PSY PONG 3D

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/psypong3d/public/index.html)**

A browser restoration of **PSY PONG 3D 0.9** by Quetzy Garcia, preserving the original gameplay rules and source-observed behavior before any optional graphical modernization. See [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the recovery story and [`PROVENANCE.md`](PROVENANCE.md) for exactly what was and wasn't ported.

## Run

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output. Any other static HTTP server pointed at
`public/` works too — no framework or runtime dependency is required. The
project is suitable for static hosting such as GitHub Pages.

## Controls

- F1: Human vs CPU from the menu
- F2: Human vs Human from the menu
- Q / A: Player 1
- Up / Down: Player 2
- Space: pause
- Escape: menu
- Touch controls appear automatically on phones/tablets. Single-player only shows the human player's controls.

The options and language are stored locally in the browser. A normal new match gets a fresh random seed. For deterministic parity/debug runs, append `?seed=123` to the URL.

## Preservation principles

- Pure client-side HTML/CSS/JavaScript.
- WebGL is used only for 3D rendering.
- Gameplay, collision, AI, scoring, RNG and timing live in renderer-independent modules.
- Deterministic seeded simulation supports parity tests.
- Historical third-party textures are not redistributed; the renderer uses newly created replacement artwork documented under `assets/`.
- Original code evidence and the legal audit are under `reference/`.

## Replacement artwork

The public web build includes three new replacement assets under `public/assets/`: a fullscreen game background, a floor vortex texture and a menu background. They were created specifically for this restoration and are kept separate from the historical media. See `public/assets/ASSET_PROVENANCE.md`.

## Timing note

The original game advances gameplay from its render/display loop and sleeps for 5,000 microseconds at the end of a frame. Its absolute speed was therefore partly frame-rate dependent. This port uses a deterministic **5 ms source-derived reference step** and preserves the original per-step movement formulas. A side-by-side run of the native 0.9 executable would be the only way to calibrate perceived pacing against one specific historical machine; no arbitrary speed correction has been introduced.

## Browser behavior

The game provides a localized WebGL-unavailable screen rather than failing blank. A human match pauses when the page is hidden, and held inputs are cleared when focus is lost.

## Tests

With a recent Node.js installation:

```bash
npm run check
```

The suite covers level timing, exact level-1 ball movement, camera timer cadence, wall/paddle collision, scoring, warp and deterministic simulation/AI behavior.

## License

This preservation port is distributed under **GPL-3.0-or-later**, consistent with the original source headers. See `LICENSE`, `PROVENANCE.md`, `THIRD_PARTY_NOTICES.md`, and `reference/audit/LEGAL_AUDIT.md`.
