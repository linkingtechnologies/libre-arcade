# HexGL: design and changes

HexGL is a **restored** game: the original code, vendored from the HexGL-2026
fork (see [`PROVENANCE.md`](../PROVENANCE.md)), with the small changes below.
Nothing about how the game plays was changed.

## What changed from the HexGL-2026 fork

| Change | Why |
|---|---|
| `launch.js`: after `hexGL.init()`, call `bkcore.MobileControls.bind(hexGL)` | The fork ships `mobile-controls.js` but never calls it, so its gesture layer never ran. On touch devices (and with the TOUCH control mode) the layer now replaces the old `TouchController`. On desktop with keyboard it does nothing |
| `launch.js`: call `bkcore.Audio.resume()` in the "Click/Touch to continue" handler | The fork adds `Audio.resume()` for mobile autoplay policies but never calls it. This is the user gesture that unlocks audio |
| `index.html`: title `HexGL` (was `HexGL 2026`), `<link rel="icon" href="favicon.png">`, the shared GoatCounter snippet | Collection conventions. The fork had removed the original icon link (it was an absolute URL on the author's site) |
| Removed `.htaccess`, `manifest.webapp`, `cache.appcache`, `icon_*.png` | Apache-only caching rules, a Firefox OS manifest, an AppCache manifest (deprecated and removed from browsers) and icons used only by that manifest. Nothing loads them |
| Removed `libs/Editor.html` and `libs/Editor_files/` | A saved copy of the author's shader-editor page, never referenced by the game |
| Removed the fork's `README.md` | Replaced by this folder's `README.md`; its text is summarised in `PROVENANCE.md` |

Kept although unreferenced: `libs/Three.r53.js` (the page loads `Three.dev.js`),
`replays/` (no reference found in the code), the Leap Motion library (the game
still offers a Leap Motion control mode).

## Already removed by the fork

Google Analytics and the Open Graph/Facebook meta tags in `index.html`;
`package.zip` and `package.webapp` (Firefox OS packaging).

## Left as it is

- `bkcore/hexgl/HexGL.js` builds Twitter and Facebook share URLs pointing at
  `hexgl.bkcore.com`, but the page has no `finish-twitter`/`finish-fb`
  elements, so that code never runs. Not touched.
- Nine source headers still say CC BY-NC. See `PROVENANCE.md`.
- The fork's README promises orientation permission handling and LOW quality
  by default on touch devices. The code does not do that, and we did not add
  it. Touch devices therefore default to the TOUCH controls (this existed
  upstream) at VERY HIGH quality; the player can pick a lower quality from
  the menu.
- The `.coffee` sources (`launch.coffee`, `bkcore.coffee/**/*.coffee`) are
  shipped as upstream had them but are **not** recompiled: `launch.js` and
  `bkcore.coffee/Utils.js` were edited directly and no longer match their
  `.coffee` originals. The page only loads the `.js` files.
- The fork's `Utils.isTouchDevice` fix (`navigator.maxTouchPoints`, was
  the misspelled `MaxTouchPoints`, plus a coarse-pointer check) was left in.

## How the touch layer works (`mobile-controls.js`)

A full-screen `#mobile-gesture-layer` overlay captures pointer events. Holding
accelerates (`shipControls.key.forward`), dragging left or right sets the
analog steering (`stickVector.x`, -100..100, dead zone 8 px), dragging down
more than 55 px releases the throttle and engages the airbrakes: left, right
or both depending on the horizontal offset. It swaps in a virtual
`touchController` so `ShipControls` keeps using its existing steering code.
Tapping after the game is over reloads the page.

## Verification

Level 3 in the collection's hierarchy: no oracle to run, since the game
logic is untouched. Checked: `npm test` (page references, wiring, no remote
calls other than GoatCounter); loaded in the browser pane with mobile
emulation: touch controls selected by default, the gesture layer appears,
the virtual controller is installed, audio context `running` after the first
tap, and a drag changes the ship's speed. Not checked on a real phone.
