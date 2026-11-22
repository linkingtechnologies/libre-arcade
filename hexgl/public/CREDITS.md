# Credits

## HexGL

The game itself, vendored here with the local modifications listed in
[`specs/design.md`](../specs/design.md).

- **By**: Thibaut Despoulain (BKcore), with contributions from townxelliot,
  mahesh.kk, Licson Lee (audio engine) and others in the upstream history
- **Original source**: https://github.com/BKcore/HexGL (last commit 2021-03-21)
- **Base used here**: https://github.com/flowerz88/HexGL-2026 at commit
  `9eb7647` (2026-07-25), a fork that adds a full-screen gesture touch layer
  (`mobile-controls.js`, `css/mobile-controls.css`) and removes the original
  page's Google Analytics
- **License**: MIT, see [`LICENSE`](LICENSE). The licence history, including
  nine source files whose headers still say CC BY-NC, is in
  [`PROVENANCE.md`](../PROVENANCE.md)

## Graphics (in-game credits screen)

| Asset | Author | Licence |
|---|---|---|
| HexMKI base model (ship) | Charnel | **Not stated anywhere in the repository.** Covered only by the upstream README's "code and resources are MIT" |
| Track texture | Nobiax | **Not stated anywhere in the repository.** Same caveat |

If either author objects, remove the asset and tell us. See the risk note in
[`PROVENANCE.md`](../PROVENANCE.md).

## Sound (`audio/`, text from `audio/LICENSE`)

| File | Author | Licence |
|---|---|---|
| `boost.ogg` | IFartInUrGeneralDirection | CC BY 3.0 |
| `wind.ogg` | kangaroovindaloo (cut and adjusted by Licson Lee) | CC BY 3.0 |
| `destroyed.ogg` | beman87 (adjusted by Licson Lee) | CC BY 3.0 |
| `crash.ogg` | qubodup | Public domain |
| `bg.ogg` | mu6k (adjusted by Licson Lee) | Public domain |

All converted to OGG Vorbis by baleboy.

## Libraries (`libs/`)

| Library | Used? | Licence |
|---|---|---|
| [Three.js](https://github.com/mrdoob/three.js) r50dev (`Three.dev.js`) | Yes, loaded by `index.html` | MIT |
| `Three.r53.js` | No (shipped upstream, never loaded by the page) | MIT |
| `ShaderExtras.js`, `postprocessing/*` (alteredq) | Yes | MIT; the "film" shader comment states CC BY 3.0 (Pat Shearon, Georg Steinrohder) |
| `Detector.js` (alteredq, mr.doob) | Yes | MIT |
| [Stats.js](https://github.com/mrdoob/stats.js) r10 | Yes | MIT |
| [DAT.GUI](https://github.com/dataarts/dat.gui) | Yes | Apache-2.0 (Data Arts Team, Google Creative Lab) |
| [Leap Motion JS client](https://github.com/leapmotion/leapjs) 0.4.1 | Yes (Leap Motion control mode) | Apache-2.0 |

## Font (`css/`)

Bebas Neue (Dharma Type), packaged by Font Squirrel, 2012.

## Touch layer

`mobile-controls.js`, `css/mobile-controls.css` and the small changes to
`Utils.js` and `Audio.js` come from the HexGL-2026 fork above and are covered
by its repository's MIT licence (the fork added no separate notice). The two
calls that actually connect them in `launch.js` were added in this collection.
