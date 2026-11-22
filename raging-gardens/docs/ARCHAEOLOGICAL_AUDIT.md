# Archaeological audit

Investigation of 22 November 2026. The prose version of the story is `SOFTWARE_ARCHAEOLOGY.md`; this is the
record of what was found, how, and with what confidence.

## Sources

| | `petarov/game-off-2012` | `alunix/RagingGardensFB` |
|---|---|---|
| URL | https://github.com/petarov/game-off-2012 | https://github.com/alunix/RagingGardensFB |
| Cloned head | `25ee1691752bb110f09a5f2256d477a67a0671ad`, 28 Nov 2015, "Add safari fix" | `068e56189dd18fbcca1df56f3308ee4a88260aac`, 3 Mar 2013, "Edited copyright message." |
| Commits | 179 (the first ones are GitHub's own Game Off template) | 36 |
| Author | Petar Petrov (commits of 2012 under "Petrov"; later "Petar Petrov") | Same code, a fork from 12 Feb 2013; header "(c) 2013 Dvubuz Games" |
| Role | The game, made 26 Oct to 2 Dec 2012 for the GitHub Game Off 2012 | Facebook-canvas adaptation of the game (its `HISTORY`: "v1.0.8 Game ported to Facebook"), PHP index, Facebook login and hiscores |

Every file of both trees is listed in `reference/SOURCES.json` with git blob id, SHA-256, size, kind, licence
reasoning and whether it is kept, fetched or excluded (210 files; `node scripts/fetch-original.mjs`
reproduces and verifies them). 
## Relationship and the earliest complete version

- The first playable game is spread over the commits of 14 to 30 November 2012. The version submitted
  to the Game Off is v0.9.3 (`HISTORY`: "Released for GitHub Game-Off-2012"); the last 2012 commit is
  `6a3ae42` (2 December 2012, "Fixed hiscore window not showing up after game finishes").
- Comparing, comment- and whitespace-insensitively, the five gameplay files at `6a3ae42`, at `499f958`
  (v0.9.5) and in the Facebook fork: **the Facebook fork differs only by header, base class, app ids,
  timer comment** (18 changed lines in total, and the same 18 against `6a3ae42`, `f30e959`, `50131ef` and `499f958`, so those four are the same game).
- Between `6a3ae42` and the head: 107 changed lines in the five gameplay files, all engine API
  (Crafty's `animate` to `reel`), the touch branch, timer display, scene reset fixes. No rule, number
  or algorithm changed.
- `config.js` at `6a3ae42` has `showfps: true` and renders with DOM; the head renders on canvas. Not
  gameplay.
- Conclusion: the three versions play the same game. **The head `25ee169` is the baseline** because it
  runs on Crafty 0.6.3, which is available and reproducible; the Game Off submission would need Crafty 0.5.3.

## Is anything server-side essential?

No. `index.php` of the Facebook fork only injects the cache-busting suffix and the Facebook scripts;
`channel.php` and `fb.js`, `hiscore-fb.js` handle Facebook login and score publishing. The game code
(`tilemap`, `player`, `enemy`, `scene.game`, `gfx`, `config`, `bootstrap`) has no server calls. The original
repository's `hiscore.js` talks to Game Jolt (formerly Playtomic and Clay.io) for scores only.

## The game as the original defines it

Read from the source and then confirmed by running it:

- 1024 x 768 field of 64-pixel tiles (16 x 12), a border row and column kept free of scenery (spawn area
  tiles 1..14 x 1..10), 27 pieces of scenery of six kinds at random free tiles; 3 minutes (`180 * 1000`).
- Player: speed 2 px per frame on each axis (so diagonals are faster), hit box 16 x 8 at the feet;
  pulls at 2 health per frame from carrots of 100; Q costs 1 carrot, repels enemies closer than 64 px
  (measured corner to centre) by 25 px, who then rest 30 frames; W costs 2 carrots, one totem at a time, 301
  frames; no carrot, a burp.
- Enemies: speed 2, pull 2.25 per frame; start 4 and +2 every 30 s up to 16; target the nearest unclaimed
  carrot by feet distance, walk A* tile paths (diagonals allowed), then the last pixels straight; spawn on
  the border of the field.
- Carrots: 4 at first, +1 per 30 s up to 11; one spawn attempt per 1.02 s (every 51 frames).
- Score: carrots in hand at the end (the original's leaderboard stored this number).

## Rendering, input, physics, AI, audio, state

| Aspect | Original | Here |
|---|---|---|
| Rendering | Crafty canvas (or DOM in 2012), sprite sheets | Canvas, generated sprites |
| Input | Crafty `KeyDown`/`KeyUp`, no repeat; `traps.js` blocks scrolling | Same semantics in `sim.js`; DOM listeners in `main.js` |
| Physics | None beyond per-axis 2 px moves and reverting the player on contact | Same |
| Collision | Crafty SAT on small boxes, strict | `overlaps` |
| AI | A* tile path then straight approach; nearest unclaimed carrot; claim forever | Same code |
| Audio | Crafty audio, `Date.now() % 2` variants | Web Audio synthesis; CC0 music |
| State | Backbone models plus entity attributes; scenes | One `Game` object |

## Reference gameplay recorded

Nineteen full games (`idle-1`, `greedy-1/2/4/6/7/8/9`, `mash-3/5`, `brawl-10/11/12`, and, with a starting stock of 40 carrots, `hunter-13/14/15/16` and `brawl-17/18`) were recorded from the
original: seed, the key events and the state after each of 9000 frames. Their fingerprints are
`tests/golden/`. Screenshots of the original were not taken (its art cannot be redistributed); the oracle's
page loads the art only because Crafty needs the sprite sizes.

## Confidence

High that the logic matches in the situations the oracle exercised (level 1). Lower for situations the
scripted players never produced (see `specs/port-map.md`, "What it does not cover"). Unknown: how the
original behaved in browsers of 2012 under load; the oracle assumes exact 20 ms steps.
