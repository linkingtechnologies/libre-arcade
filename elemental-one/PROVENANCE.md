# Provenance

## Source

| | |
|---|---|
| Project | Elemental One, "You Only Get One Element" |
| Author | Zaven Muradyan, 2013 to 2014 |
| Repository | https://github.com/voithos/elemental-one |
| Pinned commit | `609636d84f8abb20e49fdf00ab42428f4805d27b` (2015-08-16, "Consolidate and demystify asset attribution and licenses. See #1") |
| Acquired | 2026-11-22, as `https://codeload.github.com/voithos/elemental-one/zip/609636d84f8abb20e49fdf00ab42428f4805d27b` |
| Archive SHA-256 | `aa64f706f30f4d4686c340040080b99fe66bb1f3bda188f3052f1a7843c76ce7` (12,142,335 bytes) |
| Code licence | MIT, Copyright (c) 2014 Zaven Muradyan |

The archive was also cross-checked against a `git clone` checked out at the same commit: every file was identical apart from line endings that the clone's `core.autocrlf` rewrote. The archive (LF) is the reference.

## What is in `reference/`

`reference/elemental-one-609636d/` is the archive extracted, **minus six files** that must not be redistributed (hashes kept in `SOURCE-MANIFEST.json`, reasons in `LICENSE-AUDIT.md`):

- `assets/fonts/minecraftia-webfont.{eot,svg,ttf,woff}` (personal-use-only font)
- `assets/sounds/jump.wav` (no licence on record)
- `assets/images/starring.png` (no attribution upstream; page background, not used by the game)

`.gitattributes` marks `reference/` as `-text` so Git never rewrites its bytes; `test/licensing.test.mjs` re-hashes every retained file against `SOURCE-MANIFEST.json`.

## What is in `public/` and where each part comes from

| Part | Origin | Evidence |
|---|---|---|
| `js/game.js` | **Generated** by `tools/bundle.mjs`: the six upstream `src/*.js` modules embedded byte for byte inside a 10-line CommonJS wrapper | `test/integrity.test.mjs` (byte equality with `reference/` and AST equality with upstream's own `build/all.js`) |
| `js/phaser.js` | Upstream `deps/phaser.js`, unchanged (Phaser 1.1.3) | byte equality test |
| `assets/tilemaps`, `sprites`, `tilesets`, `images`, `sounds` (except `jump.wav`) | Upstream files, unchanged | hashes in `SOURCE-MANIFEST.json` (`upstream-verbatim`) |
| `assets/sounds/jump.wav` | **Replacement**, synthesized by `tools/make-jump.mjs` | deterministic script |
| `fonts/Jersey10-Regular.ttf`, `fonts/OFL.txt` | **Replacement** font from `google/fonts` (`ofl/jersey10`) | SIL OFL 1.1 text included |
| `index.html`, `css/arcade.css`, `js/arcade.js`, `js/i18n.js` | **Integration layer**, new here | MIT |
| `LICENSE`, `CREDITS.md` | New here | |

Files deliberately not copied from upstream: `index.html`, `index.dev.html`, `style.css` (replaced by the shell), `Gruntfile.js`, `package.json`, `build/`, the `.tmx` Tiled sources, unused Kenney sheets (`enemies`, `hud`, `p2`, `p3`), `README.md`, `IDEAS.md`, `ATTRIBUTION.md` (its content is carried into `CREDITS.md` and `LICENSE-AUDIT.md`).

## What was changed in the historical game

**Nothing in its code or levels.** Every behavioural change is outside it and is listed in `specs/design.md`. The two places where the page differs from upstream's page, by necessity, are:

1. the font family name `minecraftiaregular` (used in the unchanged source) now resolves to Jersey 10 through `@font-face` in `css/arcade.css`;
2. `jump.wav` has the same path and name but different content.

## Verified versus assumed

Verified: commit, archive hash, upstream licence text, code identity (tests above), `happy.mp3` identical to the OpenGameArt file.
Assumed (stated, not proven): provenance of the sprite sheets (Kenney, CC0) and of the four effect sounds beyond what upstream's `ATTRIBUTION.md` declares. See `LICENSE-AUDIT.md`.

## Note for contributors

Upstream's own `.gitignore` (kept in `reference/` unchanged) lists `build`, so Git ignores `reference/elemental-one-609636d/build/`. That folder (upstream's committed Browserify bundle) is needed by `test/integrity.test.mjs` and `test/parity.test.mjs`, so it was added with `git add -f`; already-tracked files are not affected by the ignore rule.
