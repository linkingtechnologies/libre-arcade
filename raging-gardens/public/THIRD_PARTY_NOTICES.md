# Third-party notices

Raging Gardens (this restoration) is distributed under the GNU General Public License, version 3 or
any later version (see `LICENSE`). It contains, or is derived from, the following third-party
work. Each keeps its own licence; none of it is relicensed by the GPL of this project.

## 1. The original game: Raging Gardens (Petar Petrov, 2012), MIT

The game logic in `src/sim.js` is a port of the original's `tilemap.js`, `player.js`, `enemy.js`
and of the game loop in `scene.game.js` (https://github.com/petarov/game-off-2012). The original
files are kept verbatim in `reference/original/src/`. The Facebook adaptation
(https://github.com/alunix/RagingGardensFB) carries the same code with the header changed to
"Copyright (c) 2013 Dvubuz Games"; the original copyright is the one preserved here.

```
The MIT License

Copyright (c) 2012 Petar Petrov

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```

The original's README states that the MIT licence covers the game **without its game art**. The art is
not part of this distribution (section 5).

## 2. javascript-astar (Brian Grinstead), MIT

`src/astar.js` is a transcription of `lib/graph.js` and `lib/astar.js` shipped by the original
(https://github.com/bgrins/javascript-astar, "Freely distributable under the MIT License"; the file
headers name no year). The terms of the MIT licence quoted in section 1 apply, with Brian Grinstead
as the copyright holder.

## 3. Binary heap (Marijn Haverbeke), CC BY 3.0

The binary heap in `src/astar.js` is by Marijn Haverbeke, from "Eloquent JavaScript" (1st edition,
appendix 2, https://eloquentjavascript.net/1st_edition/appendix2.html), "(c) Marijn Haverbeke",
licensed under Creative Commons Attribution 3.0 (https://creativecommons.org/licenses/by/3.0/) as that
page states (read 2026-11-22), with the modifications made in javascript-astar. Attribution is given
here and in the file header.

## 4. Music: "Trouble in the Garden" (Augmentality, Brandon Morris), CC0

`assets/music/trouble-in-the-garden.ogg`, from https://opengameart.org/content/trouble-in-the-garden,
submitted there by HaelDB. The page offers the work under OGA-BY 3.0 or CC0; it is used here under
CC0 1.0 (https://creativecommons.org/publicdomain/zero/1.0/), so no attribution is required. It is
credited anyway. This is the original file, not the low-quality transcode the 2012 game shipped.

## 5. Not included

- **The original artwork** (all `art/` files, the favicon and the promo icon): "All images are (c)
  Stremena Tuzsuzova" (the original's `art/LICENSE`); the artist's website states "All Rights
  Reserved". No permission to redistribute was found, so none of it is used. The pictures of this
  version are new and are drawn by `src/art.js`.
- **The original sound effects**: edited derivatives of nine Freesound clips whose licences differ
  (two CC BY-NC, one deleted, the rest CC BY or CC0), with no record of which clip became which
  file. Not used; the effects are synthesised by `src/audio.js`.
- **Libraries the original loaded** (CraftyJS, jQuery, jQuery UI, Backbone.js, Underscore.js,
  RequireJS, Modernizr, QUnit, the Game Jolt API client) are not distributed and not needed. Copies
  of the MIT-licensed ones that the oracle tests run are kept in `reference/` (not shipped).
