# Nova Pinball — Web Restoration 1.0.1

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/nova-pinball/public/index.html)**

A framework-free HTML5 + JavaScript restoration of **Nova Pinball v0.2.3** by Wesley "keyboard monkey" Werner.

The goal is preservation first: keep the historical table, rules, mission chain, scoring and overall presentation recognizable, while replacing media or dependencies whose redistribution terms are unclear. The project is fully client-side and deploys directly to GitHub Pages.

## Play locally

With Node.js installed:

```sh
npm run dev
```

Then open `http://localhost:8080`. This uses the dependency-free static server in
`scripts/serve.mjs`, the same one every game in this collection uses.

## Controls

- **Z / Left Arrow** — left flipper
- **M / Right Arrow** — right flipper
- **Space** — launch / nudge
- **Esc** — pause
- Touch controls are available on touch devices.

The historical desktop release used Left/Right Shift. The web restoration deliberately uses Z/M plus arrow keys to avoid triggering Windows Sticky Keys.

## What 1.0.0 includes

- the 58-component historical table geometry;
- 6-ball game, launch lane, TILT and Safe Mode;
- historical Ball/Table camera modes;
- full mission chain through Red Giant, Fusion, Black Hole, Wormhole and Supergravity;
- dynamic Matter Jettison branch and true multiball;
- historical scoring model and persistent 8-entry high-score table;
- source-faithful pre-launch table pan, in-canvas `Score`/`Balls` HUD and 36 px green LED message display;
- Mission Hints modes: LED / Lights / Both / None;
- historical-style ball-cursor menu, teal pause presentation, animated About screen and Game Over table-scroll transition;
- procedural Canvas presentation guided by the historical palette and asset proportions;
- 18 reconstructed Web Audio sound roles corresponding to the effects actually used by v0.2.3;
- procedural 5×7 dot-matrix HUD/LED lettering, with no historical font binary embedded;
- optional modern CC0 background music: Dreamy Orbit, Arcade Pulse and Wormhole Drive;
- IT/EN UI, fullscreen, responsive touch controls and fail-safe browser storage.

The bottom controls are centered on their own row; keyboard instructions are kept separately underneath. Main and pause menus are intentionally scroll-free at normal desktop/fullscreen sizes and compress on shorter viewports.

## Intentional differences

- The browser physics solver is a new framework-free implementation rather than LÖVE Physics/Box2D. Historical numerical constants are retained where they map directly; mechanical feel is validated against the original executable.
- Persistence uses guarded JSON/localStorage instead of historical `pickle.lua`.
- Original raster images, font binaries, WAVs and tracker modules are **not redistributed**.
- The original Beyond soundtrack remains documented but excluded because surviving materials do not establish redistribution/sublicensing terms clearly enough for this modified public port.
- The three bundled CC0 tracks are optional **modern replacements**, not historical Nova Pinball music. `None` remains the archival/default music choice.
- The desktop `Leave` menu entry is omitted because a normal browser page cannot reliably close its own tab/window.
- The historical loading/splash sequence is documented but not reproduced.
- The small control strip below the 800×600 game surface is a browser/accessibility adaptation.

## GitHub Pages

No build step is required. Keep `public/index.html` as the game's entry point; the collection publishes each game's `public/` folder through **Settings → Pages** (branch deployment) or any equivalent static host.

The included `.nojekyll` file keeps Pages in plain-static mode.

## Validation

With Node.js installed, run all regression checks from the repository root:

```sh
for f in tests/*.mjs; do node "$f"; done
```

On Windows PowerShell:

```powershell
Get-ChildItem tests\*.mjs | ForEach-Object { node $_.FullName }
```

The distribution audit rejects historical/quarantined media, embedded original archives and runtime network dependencies. It permits only the three declared modern CC0 OGG files with their frozen SHA-256 values.

## Archaeology and provenance

The public repository contains the archaeological record but not the original binary/media archives themselves. Start with:

- `docs/HISTORY.md` — upstream timeline and baseline commits;
- `docs/UPSTREAM_CREDITS.md` — people/projects credited by upstream, including later LÖVE 11.2 maintenance;
- `reference/MANIFEST.md` — exact original filenames, sizes, hashes and official download URLs;
- `docs/ARCHAEOLOGY.md` — preservation/restoration notes;
- `docs/PRESERVATION_MATRIX.md` — preserved / ported / reconstructed / replaced / quarantined matrix;
- `docs/PARITY_SPEC.md` — frozen gameplay and mechanics baseline;
- `docs/UI_PARITY.md` — presentation/UI source audit;
- `docs/ASSET_REFERENCE.md` — historical visual reference without redistributed media;
- `docs/AUDIO_PARITY.md` — historical SFX roles and reconstruction mapping;
- `docs/MODERN_MUSIC.md` — optional modern soundtrack and divergence notes;
- `docs/RELEASE_AUDIT.md` — final 1.0.0 production-readiness audit;
- `NOTICE.md` — provenance and licensing summary.

The original release archives are intentionally not embedded in the GitHub distributable. A researcher can reacquire the exact audited artifacts from upstream and verify them using `reference/MANIFEST.md`.

## Historical upstream credits

Original game by **Wesley "keyboard monkey" Werner**. The later project page credits **Eric Ahnell** for the 2019 LÖVE 11.2 compatibility update. Historical upstream credits also name **Beyond** (music), **Sizenko Alexander** (Advanced LED Board-7), **Nate Halley** (Erbos Draco Open NBP), **Steve Dekorte** (Lua File Pickler) and **Tomas Pettersson** (SFXR).

These credits are preserved in full in `docs/UPSTREAM_CREDITS.md`; crediting a historical contributor does not imply that their original media is redistributed in this package.

## License

The web restoration is distributed under **GPL-3.0-or-later**. The optional modern music files are separately released under **CC0-1.0**; see `public/assets/music-modern/CREDITS.md` and `public/assets/music-modern/LICENSE-CC0.txt`.
