# Provenance

## What this is
*Heal'em All* is a platformer made by Krzysztof Urbas (programming, story) and Paweł Madeja (graphics) for GitHub Game Off 2013, theme "change": zombies are healed back into humans, the hero can turn into a zombie, six levels, written in CoffeeScript on the Quintus engine. This folder is a **restoration**: the original JavaScript running in current browsers, with the changes listed in `specs/design.md`.

## Where each thing comes from
| Thing | Source | Evidence |
|---|---|---|
| `public/scripts/game.js` | `krzysu/game-off-2013` `master` `66950cd`, three patches | `scripts/derive-public.mjs`, `test/public.test.mjs`; the compile from the 48 `.coffee` files was reproduced exactly (coffee-script 1.6.3) in M1 |
| `public/scripts/lib/*`, images, data, levels | same commit, byte for byte | `SOURCE-MANIFEST.json` hashes |
| `public/styles/main.css` | `gh-pages` `2f8629d`, the author's deployed CSS | same |
| `public/audio/*.wav` | Kenney (CC0) and synthesis | `replacement-audio/README.md`, `LICENSE-AUDIT.md` |
| `public/index.html`, `compat.js`, `CREDITS.md` | written here | `specs/design.md` |
| `reference/` | git bundle, trees and tars of the two upstream commits | `SOURCE-MANIFEST.json`, snapshot checksum `50345e61c2697b5fd2a0508f4cf42b8b9eebc2da348baf0f1f10b46b76cf7da3` |

## Licensing evidence
* Code: GPL-3.0, declared in the README and `LICENSE` by upstream commit `66950cd` (2019-07-24), committed by Krzysztof Urbas (PR #1). "Or later" was not assumed.
* Graphics: CC BY 4.0, same commit, artist Paweł Madeja. **Accepted risk:** the relicensing was committed by Urbas; no statement from Madeja himself was found, and the 2013 README said "all rights reserved" for the graphics. The curator decided to rely on the repository owner's declaration. Nobody was contacted.
* Quintus (MIT or GPLv2 per its header), Underscore, Resig inheritance, stats.js: MIT. The standalone licence texts are not shipped upstream; `THIRD_PARTY_NOTICES.md` carries the MIT text. The stats.js licence text itself was not fetched.
* Sound: the 14 original files are **quarantined** (no author or licence recoverable; searched in public sources only). Replaced as described above.

## Open points
1. The new sounds have not been auditioned by a person after wiring (`replacement-audio/audition.html`).
2. The font files are the current ones from github.com/google/fonts, not necessarily byte-identical to the 2013 Google-served versions (the glyphs used are Latin).
3. Quintus embeds tween.js easing code (MIT, licence read, copyright lines recorded). Closed.
3b. Madeja's graphics confirmation (accepted risk above).
4. `favicon.ico` of the original has no stated origin: not shipped.

## Fonts
Boogaloo and Jolly Lodger, the two fonts the original drew its text with, are local, unmodified copies from github.com/google/fonts (`ofl/boogaloo`, `ofl/jollylodger`), downloaded 2026-11-22 with their OFL.txt. Authors per those files: John Vargas Beltrán (Boogaloo), Font Diner (Jolly Lodger). Ubuntu, which the original also declared, is not used by any code and is not shipped.
