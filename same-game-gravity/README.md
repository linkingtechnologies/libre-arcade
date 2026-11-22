# Same Game Gravity

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/same-game-gravity/public/index.html)**

A ball-removal puzzle with a twist: gravity can point in four directions.
Remove groups of two or more same-colour balls, turn the board with the arrow
keys (or the buttons at its sides) and clear the grid before the 20-second
countdown runs out. By Gaëtan Renaudeau (@greweb), 2011, GPL v3
([original repository](https://github.com/gre/same-game-gravity)), restored here.

*Restored* in the sense of the collection's [`AGENTS.md`](../AGENTS.md): the
original engine, not a clone. The 2011 code ran as it was; what was replaced is
what time broke: jQuery and four jQuery plugins, jPlayer, Modernizr, analytics,
the Twitter score sharing and the remote scoreboard. Zero runtime dependencies,
no CDN, no server, plain static files.

## What changed, and what did not

Board sizes, colour counts, random generation, the group rule, gravity, the
animation timings, the countdown, the score formula and the end-of-game
heuristic are the original code. `npm test` runs the 2011 `game.js` and the
restored one through the same seeded games on a virtual clock and requires
identical renderer calls, events and boards, frame by frame.

Added around it: pause (button, `P`, or automatic when the tab is hidden),
mute, English / Italian / French (the original's own French) with browser
detection, touch input, a layout that fits phones in portrait and landscape
without scrolling, and an optional reproducible board (`?seed=123`).
Two latent bugs were fixed: a click beside the board froze the game, and
the score screen could crash after "Continue" in a new session (the second one found by reading the source, not by running it).

| Document | What |
|---|---|
| [`specs/design.md`](specs/design.md) | Every deviation from upstream, and what was deliberately left alone |
| [`AUDIT.md`](AUDIT.md) | How the original works, what was obsolete, the bugs found |
| [`ASSETS.md`](ASSETS.md) | Licence and provenance of every asset and the GPL compliance notes |
| [`TEST_REPORT.md`](TEST_REPORT.md) | Automated and browser checks, and what is not covered |
| [`reference/SOURCE.md`](reference/SOURCE.md) | Exact upstream commit, archive checksum, frozen snapshot |
| [`CHANGELOG.md`](CHANGELOG.md), [`STORY.md`](STORY.md) | History, and the story of the restoration |

## Run

```powershell
npm install
npm run dev      # serves public/ on http://localhost:8080
npm run check    # lint + tests
npm run package  # dist/same-game-gravity-1.1.0.zip, ready for a static host
```

## Licence

GPL v3 only (upstream has no "or later" notice). The Chewy font is Apache-2.0,
the two new sounds are CC0. See [`ASSETS.md`](ASSETS.md) and [`public/CREDITS.md`](public/CREDITS.md).
