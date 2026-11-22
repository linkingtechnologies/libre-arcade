# Third-party notices

| Component | Where | Licence | Copyright line (as found in the file / upstream) |
|---|---|---|---|
| Quintus game engine | `public/scripts/lib/quintus-all.js` | MIT (header: "MIT license or GPLv2 License"; MIT chosen) | (c) 2012 Pascal Rettig, Cykod LLC |
| Underscore.js (bundled in Quintus) | same file | MIT | (c) 2009-2012 Jeremy Ashkenas, DocumentCloud Inc. |
| Simple JavaScript Inheritance (bundled in Quintus) | same file | MIT | John Resig, <http://ejohn.org/> |
| Easing functions `Q.Easing` (bundled in Quintus, line ~2267: "Code ripped directly from Tween.js") | same file | MIT (tween.js `LICENSE`, read 2026-11-22 at github.com/sole/tween.js) | (c) 2010-2012 Tween.js authors; easing equations (c) 2001 Robert Penner, <http://robertpenner.com/easing/> (the licence file states this; it contains no separate BSD block) |
| stats.js | `public/scripts/lib/stats.min.js` | MIT (upstream project licence; the minified file only names the project) | mrdoob |
| Boogaloo font | `public/fonts/Boogaloo-Regular.ttf` | SIL OFL 1.1 (`Boogaloo-OFL.txt`) | (c) 2011 John Vargas Beltrán |
| Jolly Lodger font | `public/fonts/JollyLodger-Regular.ttf` | SIL OFL 1.1 (`JollyLodger-OFL.txt`) | (c) 2012 Font Diner |
| Graphics | `public/images/` | CC BY 4.0 | Paweł Madeja |
| Sound effects (4) | `public/audio/` | CC0 | Kenney, <https://www.kenney.nl> |

Also named in Quintus comments but carrying **no copied code**: a 2D matrix reference (heygrady/transform wiki) and the SAT collision write-up (sevenson.com.au); credited here as sources only.

Verification status: the Quintus header and the original README were read; the standalone MIT licence texts for Quintus, Underscore and Resig are **not shipped upstream** and the stats.js licence text was **not** fetched in this restoration (open point, see `PROVENANCE.md`). The tween.js licence was read and is the same MIT text.

## MIT licence (applies to the four MIT components above, each with its own copyright line)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
