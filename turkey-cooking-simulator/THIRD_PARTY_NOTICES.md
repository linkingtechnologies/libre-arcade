# Third-party notices

## The original game

*Turkey Cooking Simulator*, by Robert J. Chen (programming), Benjamin Kwok (art), Scott R. Mobley (math and dialogue) and Sheen Kao (finite elements),
<https://github.com/fernjager/game-off-2013>, commits `13afa1230761fa24d13d9df4324ccafb504398bc` (the one the game follows, 1 December 2013, 23:25) and `56bcde6458af8957f8e439d98df8361a43d2f6e5` (the one the restoration package followed, 06:50 the same day).

- **Its code** is under the GNU General Public License version 3 (its `LICENSE`). None of the files read says "or later". Six code files, its
  `index.html`, its `README.md` and its `LICENSE` of each commit are kept byte for byte in `reference/original/` and `reference/package-baseline/`, for reference and for the oracles
  (`reference/SOURCE.md`, `reference/ORIGINAL_SHA256.txt`, `reference/package-baseline/SHA256.txt`). They stay under the original's licence.
- **Its artwork** is, according to its README, licensed Creative Commons Attribution-NonCommercial (BY-NC) by Benjamin Kwok, unless its credits page says otherwise.
  It is **not redistributed and not used**: the page draws its own pictures.
- **Its sound** is attributed item by item on its credits screen, which was read: *Turkey in the Straw* and *Waterford* are public domain, eleven Freesound effects are Creative Commons 0, and its `Audio Sources.txt` says that, unless noted, all sounds and music are in the public domain (`PROVENANCE.md` lists them). **Twelve of its MP3 files are used and redistributed here, unchanged**, in `public/sounds/` (the effects its `soundmanager.js` plays and its two tunes; `public/sounds/README.txt` lists them with hashes and the original paths). The page synthesizes three cues for which the original has no sound (probe, save, oven light) with the Web Audio API.
- **Its dialogue corpus** (`js/stories.js`) has no statement of its own. It is **not redistributed and not used**.

## The restoration package

`turkey-cooking-simulator-complete-rc1.zip`: the page's stylesheet and most of its JavaScript modules (changed where `docs/development/CHANGES.md` says), the package's earlier port and documents in
`docs/development/package/`, and `HOW_TO_PLAY.md`. They say `GPL-3.0-only` and are kept as received; the port's code is GPL-3.0-only (`LICENSE`).

## Libraries

None at run time: plain HTML, CSS and ES modules, no framework, no font, no CDN. The development tools (ESLint, `@eslint/js`) are in `devDependencies` and are not part of the game.

## The collection

The visit counter in `public/index.html` is GoatCounter (<https://www.goatcounter.com>), as in every game of the collection.
