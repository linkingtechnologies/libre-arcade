# Third-party notices

## Original software
**Virtual Toybox Puzzle Collection / Spinning Tile Puzzle** — © 2010 Jonathan Hulka. The relevant original Java sources state GNU GPL, either version 3 or (at your option) any later version. The unmodified recovered artifacts and their SHA-256 hashes are preserved under `reference/`.

The small clockwise/counter-clockwise cursor images in `public/assets/icons/` are byte-for-byte copies from the original GPL-distributed `puzzlegames.jar` and are retained to preserve the original interaction cue.

## Photographs
The ten bundled photographs and thumbnails are the historical assets distributed with the original collection. The later upstream attribution identifies them as © **JS Nature Photos**, licensed under **Creative Commons Attribution-ShareAlike 3.0 US (CC BY-SA 3.0 US)**. See `LICENSES/JS-Nature-Photos-attribution.txt` and `LICENSES/CC-BY-SA-3.0-US.html`.

The game code and photographs retain their respective licenses; the photograph license is not replaced by the software license.

## Analytics

The one remote script is the collection's **GoatCounter** page-view snippet (`gc.zgo.at`, counts sent to `grugnetto.goatcounter.com`) in `public/index.html`, added when the game joined the collection. It is not part of the game, is not covered by this project's license, and is the page's only network request; removing that single `<script>` tag leaves the game with no remote dependency. `test/production-smoke.cjs` lists every remote script in the page and allows exactly that one.
