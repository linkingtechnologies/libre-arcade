# Licence audit (M2)

Audit date 2026-11-22. Scope: every file in `public/` and every file kept in `reference/`.
Method: upstream's `ATTRIBUTION.md` (read file by file), the licence text in each file or on its source page (OpenGameArt pages fetched on the audit date), and byte-level comparison where a source file could be found.

## Evidence levels used below

- **A: matched.** The shipped file is byte-identical to a file on a page that states the licence.
- **B: declared.** Only upstream's `ATTRIBUTION.md` names author and licence; the bytes could not be matched to the source page.
- **C: none.** Nothing states a licence. Not shipped.

## Verdicts

| Asset (upstream path) | Declared licence | Evidence | Verdict |
|---|---|---|---|
| `src/*.js`, `assets/tilemaps/*`, level data | MIT, Zaven Muradyan | repository `MIT-LICENSE.txt`, `package.json` | **Ship** (notice kept in `public/LICENSE`) |
| `deps/phaser.js` (Phaser 1.1.3) | MIT, Photon Storm 2013 | `@license … MIT License` in every Phaser file header; upstream repo carries no separate `license.txt` | **Ship**, notice in `public/LICENSE` |
| Pixi.js 1.x inside Phaser | MIT | author header Mat Groves; Phaser 1.1.3 distributed under MIT with it | **Ship** (B) |
| PolyK inside Phaser | MIT, Ivan Kuckir 2012 | full licence text sits in `phaser.js` | **Ship** (A, in-file) |
| `assets/sprites/*`, `assets/tilesets/*` (Kenney) | CC0 1.0 | B: upstream names `www.kenney.nl`, OpenGameArt; Kenney's packs are CC0 | **Ship** |
| `assets/images/menubackground.png`, `occluder.png`, `preloadbar.png` | not listed | the menu background is visibly made of Kenney tiles; the other two are plain gradient/bar graphics; upstream README says the attribution file covers only "some" assets | **Ship**; treated as the author's own work under the repository's MIT, with CC0 parts (assumption, see risks) |
| `assets/sounds/happy.mp3` | CC BY 3.0, rezoner | **A**: identical size (3,628,910 bytes) to the file on OpenGameArt "Happy Arcade Tune", which states CC BY 3.0 | **Ship** with credit |
| `assets/sounds/happy.ogg` | CC BY 3.0, rezoner | B: conversion of the same work | **Ship** with credit |
| `assets/sounds/air.wav` | CC0, remaxim | B | **Ship** |
| `assets/sounds/water.wav` | CC BY 3.0, kurt | B | **Ship** with credit |
| `assets/sounds/earth.wav` | CC BY 3.0, qubodup | B | **Ship** with credit |
| `assets/sounds/fire.wav`, `pickup.wav` | CC BY-SA 3.0, GPL 3.0, GPL 2.0, p0ss | B: the licence triple is exactly the one on p0ss's "Spell Sounds Starter Pack" page; the shipped `.wav` files are not byte-identical to that pack's `.ogg` files | **Ship** with credit, used under CC BY-SA 3.0 / GPL 3.0 |
| `assets/sounds/jump.wav` | **none recorded** (absent from `ATTRIBUTION.md`) | C | **Quarantined**: not in `reference/`, not in `public/`. Replaced by a synthesized sound at the same path |
| `assets/images/starring.png` | **none recorded** | C | **Quarantined**; not needed (the shell has its own background) |
| `assets/fonts/minecraftia-webfont.*` | "Free for personal use" (Andrew Tyler) | upstream's own words | **Prohibited**: not in `reference/`, not in `public/`; hashes only |
| `assets/sprites/{enemies,hud,p2,p3}_spritesheet.png`, `hud_spritesheet.xml` | CC0 (Kenney) | B | Kept in `reference/`; not shipped (unused by the game) |

On the audio claims: for air, water, earth, fire and pickup the facts come from upstream's `ATTRIBUTION.md`. What I could cross-check: p0ss's "Spell Sounds Starter Pack" page states exactly the CC BY-SA 3.0 / GPL 3.0 / GPL 2.0 set upstream lists for fire and pickup; kurt's "stream-sounds" page (a `stream-waterfall.zip`) states CC BY 3.0, the licence upstream lists for `water.wav`; I found no page that I could tie to remaxim's `air.wav` or qubodup's `earth.wav`. In no case could I match the bytes: the shipped `.wav` files are not the `.ogg` files in those packs (they were converted or edited by upstream's author). This is evidence level B and it is the one place where this restoration trusts upstream's declaration.

## The font

Minecraftia is documented upstream as "Free for personal use". Redistribution in a public repository and web page is not personal use, so it is not shipped and not kept in `reference/`.

Replacement: **Jersey 10** by Sarah Cadigan-Fried, Copyright 2023 The Soft Type Project Authors, SIL Open Font License 1.1, taken from `google/fonts` (`ofl/jersey10`, metadata `license: "OFL"`). Why this one: a pixel font with mixed case and a clear "Z" (the first candidate, Pixelify Sans, drew `"Z"` in the level-1 hint like a `2`, and Silkscreen is capitals only). `@font-face { size-adjust: 125% }` keeps the unchanged 18/25/45 px text of the source about as large as it was.

Effect on gameplay: none. Text is centred on fixed anchors (`anchor 0.5`) and no collision, physics or level geometry depends on text size. Checked by the parity oracle (the text objects have identical positions in both builds).

## Redistribution conditions kept

- MIT notices: `public/LICENSE` (Muradyan, Photon Storm, Mat Groves, Ivan Kuckir, this integration layer), plus the headers left inside `phaser.js`.
- CC BY 3.0 attributions: `public/CREDITS.md` and the in-game Credits screen (rezoner, kurt, qubodup).
- CC BY-SA 3.0 / GPL for p0ss's two sounds: attribution kept; the sounds are unmodified and stay separate files, the ShareAlike condition applies to those files, not to the game code.
- OFL: `public/fonts/OFL.txt` shipped next to the font; the font is not sold alone and keeps its name.

## Fail-closed checks

`test/licensing.test.mjs` fails if a file appears in `public/` that is not on its allowlist, if any file differs from `SOURCE-MANIFEST.json`, if any Minecraftia file or font format other than the one allowed font ships, if a withheld file reappears in `reference/`, if upstream's `jump.wav` reappears, or if the page references any remote host other than the documented ones.

## Residual risks (for the maintainer to accept)

1. Evidence level B for air, water, earth, fire, pickup and the `.ogg` theme. If the maintainer wants stricter evidence, those five files are small and could be replaced the way `jump.wav` was.
2. The three images in `assets/images/` have no separate notice upstream.
3. Phaser 1.1.3 is distributed here without a separate `license.txt` (upstream's repository did not include one); the licence is the MIT named in its headers.
4. The page includes the collection-wide GoatCounter snippet required by the repository's `AGENTS.md` (maintainer decision: it stays). It is a single async script, not needed for play, and it does nothing when blocked. It is the only third-party request the page makes.
