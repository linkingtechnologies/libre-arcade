# Provenance: archaeological audit, licenses and assets

## Source

| | |
|---|---|
| Original | Irisa by Matthew Miner, Global Game Jam 2017 |
| Repository | https://github.com/mminer/irisa |
| Commit | `4dada410bae9df2cc849e6808663b6043d3e7fb3` (25 May 2018, adds the MIT license; the game's last change is `bd323e9`, 26 January 2017) |
| Archive | https://github.com/mminer/irisa/archive/4dada410bae9df2cc849e6808663b6043d3e7fb3.zip, SHA-256 `a0963021385d4302f5a9b02b375a5c91c547f18c1de53d440ccdbcd349104bae` |
| Cloned and read | 22 November 2026 |
| Frozen copy | `reference/irisa-4dada41/`, 41 files with per-file checksums in `reference/SHA256SUMS.txt`; details in `reference/SOURCE.md` |
| Project still reachable | the repository, yes; http://matthewminer.com/irisa answers with a page that says only "Irisa" |

## Audit of the original (phase M0)

Architecture: Vue 2 render functions (`src/index.js`, `src/components/*`) over a
plain object store (`src/store.js`). Built with webpack 2, Babel 6 and cssnext
into a committed `static/bundle.js`. Runtime dependency: Vue 2 (inside the
bundle). Not run from the original bundle: the bundle was checked against the
source (every level row and the end message are in it), and the source's logic
was executed directly as the oracle.

Mechanics, read from `store.js` (nothing added):

- 10x10 board, 20 levels, one move at a time (100 ms lock), four directions, no diagonals for the player.
- After a move: teleport, pick-up, then every enemy steps one square toward the player on both axes. An enemy that lands on a wall disappears. Enemies that overlap disappear and leave a wall. Touching an enemy loses, reaching the door wins; win or loss waits 2 s and then reloads the level or loads the next.
- Teleporters come in pairs. Freeze clocks (1 to 4) stop enemy movement for that many moves. Reverse swaps walls and enemies and adds one frozen move.
- Keys: arrows, W A S D, R. Level dots reach only completed levels unless `localStorage.dev = "true"`.
- Sound: six MP3s, played only when the user agent contains "chrome".
- Finish: `alert()` then reload.

Defects and interventions:

| # | Finding | How verified | Action |
|---|---|---|---|
| 1 | R, or a level dot, during the 100 ms after a move runs that move's enemy step on the new level | test (`oracle.test.mjs`, last test) | fixed: new level cancels pending timers |
| 2 | Restarting while enemies are frozen starts the new level frozen | same test | fixed: counter reset |
| 3 | No sound outside Chrome (UA check) | read | removed the check, after the first gesture |
| 4 | No touch controls (author's own README) | read | pad and swipe |
| 5 | `alert()` and `location.reload()` at the end | read | in-page finish screen |
| 6 | A key released while the window is unfocused stays "held" | read | cleared on blur |
| 7 | Level dots are 2vmin wide: too small to tap | read, screenshots | invisible larger target |
| 8 | Stepping on the door while frozen wins only after the freeze ends | read, oracle | **kept**, it is upstream's behaviour |
| 9 | `checkForWinOrLoss()` is never called | read | left as is (dead code) |

Baseline screenshots of the original were not captured: running its bundle was
not needed for the oracle and no screenshot of the final page is claimed to be
pixel-identical to it. The upstream `screenshot.png` is in `reference/`. See the
verification levels in `specs/design.md`.

## Licenses

| Part | License | Evidence |
|---|---|---|
| Irisa code, levels, SVG images | MIT, Copyright (c) 2018 Matthew Miner | `LICENSE` in the repository at the commit, full text in `public/LICENSE`. The images have no separate notice, so they are taken to be the author's and covered by the repository license (not independently confirmed). |
| Sound effects (6 MP3) | CC0 per upstream README ("Kenney's Digital Audio pack") | Kenney's pack page states "Creative Commons CC0" and his support page states his assets are public domain (read 22 November 2026). The MP3s carry no origin tags; that they come from that pack is upstream's statement, not checked file by file. |
| Global Game Jam | no terms specific to the Irisa entry could be read; the site's general statement is "all projects are protected under a Creative Commons license" | The entry page `globalgamejam.org/2017/games/irisa` now redirects to `v3.globalgamejam.org`, which GGJ has taken offline (HTTP 403 and a notice, 22 November 2026; see https://globalgamejam.org/news/updating-our-global-game-jam-archive-policy), and the Internet Archive has no capture of it (only two 2025 captures of the redirect, whose target is not archived either). The statement above is in the GGJ FAQ as archived on 16 February 2018 (https://web.archive.org/web/20180216204417/https://globalgamejam.org/faq). It names no particular Creative Commons variant and is a site-wide policy, so it does not say what the author chose for this entry. The author's own explicit grant is the MIT `LICENSE` in his repository. |
| Vue 2 (MIT) | was inside the original bundle | not shipped here |
| New code (`clock.js`, `sound.js`, `i18n.js`, `app.js`, `render.js`, new CSS, tests, scripts) | GPL-3.0-only | `LICENSE`; MIT notices of upstream kept in `public/LICENSE`, `public/CREDITS.md` and file headers |

MIT and GPL-3.0 are compatible; the combined work is distributable under
GPL-3.0 while upstream's files keep their MIT notice.

Trademarks: none involved ("Irisa" is the author's own name for the game).

## Open points

- Which Creative Commons variant, if any, the Global Game Jam attached to the Irisa entry: the entry page is offline and not archived. The author's MIT grant in his own repository is the license relied on.
- That the six MP3s are really from the Kenney pack (upstream's word only).
- Safari audio performance, the reason for upstream's Chrome-only check, was not measured.
- Firefox and a real phone browser were not run in this session; Chrome (desktop and emulated touch) was.
