# Elemental One

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/elemental-one/public/index.html)**

A small puzzle-platformer by Zaven Muradyan, made along the theme of Ludum
Dare 28, "You Only Get One" (2013 to 2014,
[original repository](https://github.com/voithos/elemental-one), MIT). You
can carry one element at a time: pick up a powergem, then use its element to
remove the blocks of the same kind that bar the way to the star, through four
levels and an end screen.

This is a **restoration**, not a remake. The original JavaScript, Phaser
1.1.3 and the four levels are used byte for byte (checked by
[`test/integrity.test.mjs`](test/integrity.test.mjs)). What is new is a thin
shell around them: title screen, pause, restart, mute, English and Italian,
responsive scaling and touch buttons. Two assets could not be redistributed
and were replaced: the Minecraftia font (personal use only) and `jump.wav`
(no licence on record).

Controls: arrows move and jump, `Z` picks up a gem, `X` drops it, `Space`
releases your element, `Enter` starts. `P` pauses, `M` mutes. Touch screens
get the same keys as on-screen buttons.

## Running it

```bash
npm run dev
```

Open `http://localhost:8080/`. `npm run build` packages `public/` into `game/`
for any static web server (it is a plain copy); `npm start` builds and serves
that output. Nothing needs to be built to play `public/`.

## Checking it

```bash
npm run check          # lint + all tests (the browser and parity tests need Chrome)
npm run parity         # original vs restored, frame by frame
```

`E1_SKIP_BROWSER=1` skips the Chrome tests, `E1_FAST=1` runs only the four
level scenarios in the parity test.

## What is in this folder

| Path | |
|---|---|
| `public/` | the playable game (served as it is) |
| `reference/` | upstream snapshot at commit `609636d…`, unchanged, minus six files that cannot be redistributed |
| `specs/design.md` | every decision and why |
| `ARCHAEOLOGICAL-BASELINE.md` | what the original is and how it plays |
| `PROVENANCE.md`, `SOURCE-MANIFEST.json` | exact source, hashes |
| `LICENSE-AUDIT.md`, `ASSET-PROVENANCE.md` | licence verdict per file |
| `GAMEPLAY-PARITY.md`, `TEST-REPORT.md` | what was verified, how, and what was not |
| `tools/`, `test/`, `scripts/` | bundler, oracle harness, tests, static server |
| `screenshots/` | browser captures from the tests |

## License

The game is MIT and the shell is MIT; art, music, effects and the font keep
their own licences, listed in [`public/LICENSE`](public/LICENSE) and
[`public/CREDITS.md`](public/CREDITS.md). This folder's own tooling
(`scripts/`, `tools/`, `test/`) is MIT, except `tools/make-jump.mjs` and the
sound it writes (GPL-3.0-or-later, like the collection).

## History

See [`CHANGELOG.md`](CHANGELOG.md).
