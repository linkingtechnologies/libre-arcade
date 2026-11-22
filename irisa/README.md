# Irisa

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/irisa/public/index.html)**

A turn-based puzzle by Matthew Miner, made for the Global Game Jam 2017
([irisa](https://github.com/mminer/irisa), MIT). Get the purple circle to the
green pentagon while red stars follow you one step at a time. Twenty levels,
walls, paired teleporters, freeze clocks and a pickup that turns enemies into
walls and walls into enemies. Restored for Libre Arcade.

## Historical background

Irisa was written in two days in January 2017 with Vue 2 for the page and
about 300 lines of game logic. The author's README says it "currently lacks
mobile controls", and it only made sound in Chrome. The repository has one
commit after the jam, in 2018, which adds the MIT license.

## What was kept and what changed

The game's own modules (`store.js`, `entities.js`, `levels.js` and the rest)
are upstream's, loaded directly as ES modules. Only the drawing was replaced
(Vue became about 90 lines of plain DOM) so the 2017 bundle, Vue 2 and webpack
are no longer needed. Added: title, pause, restart, mute, English and Italian
(Italian for Italian browsers), a touch pad and swipe, a layout that fits
phones, tablets and desktops, and an end screen in place of `alert()`.
One upstream defect is fixed (restarting with R leaked the previous level's
timers and freeze counter). Everything is itemised in
[`specs/design.md`](specs/design.md).

## How to play

Arrow keys or W A S D move one square. R restarts the level, P or Esc pauses,
M mutes. On a touchscreen use the on-screen arrows or swipe on the board. The
rules are on the title screen in both languages.

## Running it

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` copies `public/` to
`game/`; `npm start` builds and serves that; `npm run zip` writes
`dist/irisa-1.0.0.zip` (the contents of `public/` plus the checksum manifest).
No bundler, no runtime dependency, nothing is fetched from another site.

## Checking it

```bash
npm install
npm run check      # lint + 35-odd tests
npm run manifest   # rewrites MANIFEST.sha256.txt after any file change
```

The tests run upstream's own `store.js` (from `reference/`) next to the port
and compare every state after every action, search all 20 levels for a win,
and drive the page in headless Chrome (needs Chrome; skipped otherwise). The
hand checklist is in [`docs/MANUAL_TEST_CHECKLIST.md`](docs/MANUAL_TEST_CHECKLIST.md).

## Documents

[`PROVENANCE.md`](PROVENANCE.md) audit, license and asset report ·
[`specs/design.md`](specs/design.md) changes and why ·
[`reference/SOURCE.md`](reference/SOURCE.md) commit, URL, checksums ·
[`MANIFEST.sha256.txt`](MANIFEST.sha256.txt) every shipped file ·
[`public/CREDITS.md`](public/CREDITS.md) credits ·
[`STORY.md`](STORY.md) · [`CHANGELOG.md`](CHANGELOG.md)

## License

New code in this folder: GPL-3.0-only, see [`LICENSE`](LICENSE). Upstream's
code, levels and images stay MIT, Copyright (c) 2018 Matthew Miner, see
[`public/LICENSE`](public/LICENSE). The sounds are upstream's (CC0 per
upstream's README, see [`PROVENANCE.md`](PROVENANCE.md)).
