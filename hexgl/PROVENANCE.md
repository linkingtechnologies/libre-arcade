# Provenance

## What was vendored

| | |
|---|---|
| Original | https://github.com/BKcore/HexGL, by Thibaut Despoulain (BKcore). Last commit 2021-03-21, `6addc95` ("Merge pull request #52 from i-khan/master") |
| Base used here | https://github.com/flowerz88/HexGL-2026, a fork (commit author shown as `Butterfly88`), at commit `9eb7647ef07284fa367d5802c530ce0d353eeb23` (2026-07-25) |
| What the fork adds | 15 commits on top of `6addc95` (2026-07-24/25): a gesture touch layer, an `Audio.resume()` helper, a wider touch-device check, Google Analytics and Open Graph tags removed from the page, `package.zip`/`package.webapp` deleted, a new `.htaccess` and README |
| Inspected by | `git diff 6addc95 HEAD` read in full for every code file (`mobile-controls.js`, `css/mobile-controls.css`, `index.html`, `bkcore/Audio.js`, `bkcore.coffee/Utils.js`); no network calls, no `eval`, no redirects |
| Found at that commit | the fork's headline feature is **dead code**: nothing calls `MobileControls.bind()` or `Audio.resume()`, and `launch.js`/`HexGL.js` are identical to the original. The README also lists orientation permissions and low-quality defaults on touch devices that are not in the code. This collection connects the first two (see `specs/design.md`) and does not implement the rest |

This is the "Restored" kind of game: the original code vendored with minimal
changes, not a port. There is no `reference/` folder, because `public/` is
already the original code.

## Licence of the code: MIT, with a trail of evidence

The repository's `LICENSE` and README say MIT. Nine files still carry an old
header saying otherwise:

```
bkcore/hexgl/{CameraChase,Gameplay,HexGL,HUD,Ladder,RaceData,ShipControls,ShipEffects}.js
bkcore/hexgl/tracks/Cityscape.js
  @license ... Creative Commons Attribution-NonCommercial 3.0 Unported License
```

Evidence that the author relicensed the whole code base to MIT in 2015 and
the headers were simply never updated (all read directly from the git history
of the clone, `git log`/`git show`):

1. **2012-10-05 to 2015**: the README said "HexGL's code and resources are
   licensed under the Creative Commons Attribution-NonCommercial 3.0",
   adding "This is not a definite choice, and the game may end up under the
   MIT license someday."
2. **2015-08-29, commit `2cb8b75`** by Thibaut Despoulain, "Update license to
   MIT": the README now reads "HexGL's code and resources are now licensed
   under the MIT License" (same "unless specified in the file" qualifier).
3. **2015-08-29, commit `c8e65a6`** by the same author, "Create LICENSE": the
   MIT text, "Copyright (c) 2015 Thibaut Despoulain".
4. **Merge `62b7166`**, pull request #32 "Switch to the MIT License", merged
   by the author the same day. Issue #29 ("License change request") was
   closed by the author with "completed in #32".
5. Those two commits touched only `README.md` and `LICENSE`. The nine source
   headers were not edited, before or since. That is why the "unless specified
   in the file" qualifier technically still points at them.

From a summary of the upstream issue tracker (not read page by page by us):
issue #25 (2014) and #29 (2015) asked for MIT; in #29 the requester said
"you can keep the media under CC BY-NC for now"; the author did not say
whether media was included. Upstream issue #76 (2026) asks the author to
confirm the headers or remove them and has no reply from him. The author has
not been active on the repository since 2021.

**Our reading:** the author's own README statement and licence file are
unambiguous and later than the headers, so the code is MIT. This is an
inference from repository evidence, not an explicit statement about the nine
headers. If the author ever says otherwise, those files must come out.

## Assets (this is where the real risk is)

| Asset | Licence evidence | Status |
|---|---|---|
| `audio/*.ogg` | `audio/LICENSE` (kept in `CREDITS.md`): public domain and CC BY 3.0, with named authors | Clear; credited |
| Ship model `geometries/ships/feisar` (HexMKI, by Charnel) | None stated. Only the upstream README's "code and resources are MIT" | **Unverified**: the author of the game may not have been able to relicense a third party's model |
| Track texture (by Nobiax) | None stated | **Unverified**: same |
| Other textures and models | Not attributed to anyone else in the repository; presumed the game author's own work | Presumed MIT |
| `libs/*` | Their own headers; see `public/CREDITS.md` | Clear |

The ship and the track are the game: without them there is nothing to play,
so they are kept, with the risk written down here and in `CREDITS.md`. If
either author objects, remove the asset and replace or drop the game.

## Third-party notes

- `libs/ShaderExtras.js` contains one shader (`film`) whose comment says
  CC BY 3.0 (Pat Shearon, Georg Steinrohder). Attribution is in `CREDITS.md`.
- Upstream `.coffee` sources are shipped next to their compiled `.js`. The
  page loads the `.js` files only. See `specs/design.md` for the drift note.
