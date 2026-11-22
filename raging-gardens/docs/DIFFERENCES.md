# Original versus restored

Everything that differs from the original game (v0.9.10 head, which has the same rules as the Game Off 2012
submission), and why. Anything not listed here is meant to be identical, and the gameplay state is tested
to be (see `specs/port-map.md`).

## Presentation (new, by necessity)

| Original | Here | Why |
|---|---|---|
| Artwork by Stremena Tuzsuzova | New pictures drawn by `src/art.js`: same sizes (tiles 64 x 64, rabbits 32 x 48, carrots 32 x 32, totem 48 x 48, cloud 64 x 64 x 8), same frame counts, same depth order, a white ninja rabbit with a red headband and brown rivals | All rights reserved; no redistribution grant. **These are not the historical pictures** and must not be presented as such |
| Ten sound effects (edited Freesound clips) | Synthesised with Web Audio at the same moments (pull, fart, scream, "aaaah" for the totem, laughter, burp) | Licences unverifiable per file, two NonCommercial |
| Music: a low-bitrate transcode of "Trouble in the Garden" | The CC0 original, full quality | The transcode's provenance is a derivative of this file |
| Splash screen, menu with painted buttons, in-game frame with timer and carrot icons | A plain menu and a header with timer and carrot count | Those were artwork |
| jQuery UI dialogs (How to play, Credits) | Full-screen panels | No jQuery |
| English only | English and Italian, browser language detected, switchable, remembered in `libre-arcade-lang` (shared with the arcade page) | Requirement |
| Keyboard and mouse (menu touch events from v0.9.6) | Keyboard, plus on-screen d-pad and three buttons on touch devices, each button an independent pointer (several can be held) | Requirement |
| No pause (the engine paused on window blur) | Pause and resume (P, Esc, button); also on blur or tab hidden. Restart, game over screen with the score, music and effects toggles | Requirement |
| Online leaderboards (Playtomic, then Clay.io, then Game Jolt; Facebook in the fork) | A best score kept in the browser (`localStorage`) | The services are dead or off-limits; no network |
| Original field 1024 x 768 on desktop, 960 x 704 when `Modernizr.touch` | 1024 x 768 logic everywhere, scaled by CSS to fit, no page scroll | One set of rules; the original's smaller touch field was a layout accommodation |
| HTML overlay for the "no carrots" message | The same wording, drawn by an HTML element with a 0.8 s fade | |

## Engine, time and input (behaviour that could differ, and does so deliberately)

| Original | Here | Effect |
|---|---|---|
| Game clock read from `Date.now()` | Clock counted in frames (20 ms each) | Identical at 50 frames per second, which is what Crafty's fixed timer gives. While paused, the original's clock kept running and the game could end while the player was away; here pausing stops time |
| Crafty `timer`: catches up with at most 5 steps | The same cap, then it forgets the backlog | Same |
| Timer text from `toFixed(0)` of the seconds left | Seconds left rounded up | The original could show 60 seconds |
| Window blur: Crafty reset key state without sending key-up to the game, leaving a direction stuck | All keys are released on pause | A bug of the engine, not a rule |
| `Date.now() % 2` to choose between two variants of a sound | Chosen at random, separately from the game's random numbers | Cosmetic |
| `Math.random()` everywhere | A seeded generator (`mulberry32`) in `src/rng.js`; `?seed=N` replays a game; a normal page picks its seed from `crypto.getRandomValues` | Reproducibility, required |
| `carrotsCoordsQueue` shared between games of one page session (a Backbone `defaults` array) | Empty at the start of each game | The original's first game after a page load. The shared array made replays in one session start with positions already forbidden; this was read from the source, not run |
| Letter keys by `keyCode` | By physical key, then by the character typed | AZERTY and similar layouts still reach Z, Q, W |
| Arrow keys scrolled the page unless blocked by `traps.js` | Arrow, Z, Q, W keys are consumed while playing | Same intent |

## Preserved on purpose

Everything in `specs/port-map.md` marked "as in the original": Q and W on release; Z held; carrots claimed
for good; the first eight carrot positions forbidden for the whole game; the push measured from the
enemy's corner; the strict collision test; entity order; the 301 frames of the totem; 4 enemies and 4
carrots at the start, +2 enemies and +1 carrot every 30 s up to 16 and 11; carrots 100 health pulled at 2
(player) or 2.25 (enemy) per frame; 3 minutes; score = carrots in hand at the end.

## Not reproduced

The Safari warning ("sound is not supported"), the FPS counter, the Game Jolt, Clay.io, Playtomic and
Facebook integrations, `gamemix` and analytics scripts of the original page.
