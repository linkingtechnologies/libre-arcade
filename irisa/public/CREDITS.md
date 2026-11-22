# Credits

## Irisa

- **Game, levels, graphics and game logic**: Matthew Miner, made for the Global Game Jam 2017.
- **Source**: https://github.com/mminer/irisa (commit `4dada410bae9df2cc849e6808663b6043d3e7fb3`)
- **License**: MIT, Copyright (c) 2018 Matthew Miner. Full text in [`LICENSE`](LICENSE) in this folder.

The files under `js/game/` are upstream's `src/` modules; `store.js`, `util.js`
and the import paths carry small, marked changes (see `specs/design.md` in the
game's folder). `levels.js`, `constants.js`, `glyphs.js`, `gamestate.js` and
`keycodes.js` are unchanged, and `entities.js` differs only in one import path.
The ten images in `assets/img/` are upstream's own SVG files, unchanged.

## Sound effects

The six files in `assets/audio/` are upstream's, unchanged. Upstream's README
says they come from Kenney's [Digital Audio](https://kenney.nl/assets/digital-audio)
pack, which Kenney publishes under Creative Commons CC0 (public domain). The
files carry no tags that name their origin, so that attribution is upstream's
word, not something this restoration could check file by file. CC0 needs no
attribution; it is given anyway.

## Libre Arcade

- **Restoration for Libre Arcade**: the title, pause and end screens, the
  English and Italian texts, the touch pad and swipe controls, the responsive
  layout, the pausable timers and the tests. GPL-3.0-only, see the
  collection's `LICENSE`.
- Vue 2, which upstream used to draw the page, is **not** part of this version.

## Not credited, because not there

No third-party code, font, image or sound beyond the above is included, and
the page makes no request to any other site except the collection's own
visit counter.
