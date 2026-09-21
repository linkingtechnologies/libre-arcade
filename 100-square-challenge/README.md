# 100-Square Challenge — Libre Arcade browser restoration

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/100-square-challenge/public/index.html)**

Static, client-side HTML5 + JavaScript adaptation of the playable
**100-Square Challenge from TAJJAVA v0.1 (March 2011)** by **Jasen Borisov**.
This release does **not** claim to port the later incomplete standalone
`squarechallenge` SourceForge snapshot, which lacks a playable game engine.
Its GPLv3 source header does not relicense the original TAJJAVA source.

## Play and publish

For local play, run from the project root:

```sh
npm run dev
```

Open `http://localhost:8080/`. The browser loads ordinary ES modules; opening
`public/index.html` directly with `file://` may not work because of browser
module security rules.

For a **standalone static deployment**, copy *the contents* of `public/` into
the desired web directory (`npm run build` does that into a throwaway,
gitignored `game/`). No build step, server-side code, external libraries or
cookies are used by the game itself.
The only browser storage is a local `intro-seen` flag to avoid showing the
instructions again after the first play; it contains no game or personal data.
If browser storage is unavailable, the introduction appears again on a later
visit, but the game remains playable.

The first time you press Play, the How to play dialog opens automatically;
closing it (or pressing Start playing) remembers that the instructions have
been seen. How to play remains accessible in the header at all times. The
first-play dialog follows the EN/IT language chosen before pressing Play.

With a mouse or touch screen, select a highlighted square. With a keyboard,
use arrow keys to move the focus and Enter or Space to choose a square.
English is the default; Italian is selected when the browser's first preferred
language is Italian. You can toggle EN/IT at any time. Optional modern Web Audio tones for a valid move, a full board and a dead end are **off by default**; the header sound button enables/disables them. There is no music, no sound file and no persistent audio setting. The game has no analytics of its own; like every game in this collection, its page carries the collection's privacy-friendly GoatCounter page-view snippet, the one remote script (see `THIRD_PARTY_NOTICES.md`).

## Historical scope and documented corrections

- The 10×10 board starts empty with `(0,0)` highlighted. The first click places
  1 there; after that each number goes in an **unoccupied chess-knight target**
  at offset `(±1,±2)` or `(±2,±1)` from the last square. The available squares
  are highlighted. A path ends upon reaching 100 or when there is no free
  next move. The game has single-step Undo, Start new game and Main menu.
- No random board, scoring algorithm, solver, hint system, levels, time limit,
  backend or AI were added. The menu reopens the existing board, as in the
  historical version.
- **Documented quality corrections, not historical behavior**: Undo of the
  first move restores the empty board with `(0,0)` highlighted (the Java
  original proposed the wrong squares). New game clears *all* game-end and
  Undo flags (the Java original retained them), and tapping a completed/blocked
  board does not silently discard it. Undo is disabled before the first move.
  See `specs/PARITY.md` for original oracle observations vs restored behavior.
- The responsive visuals, controls, EN/IT strings and status text are
  browser-facing adaptations, including the first-play instructions overlay.
  The original Java code remains untouched in `reference/` and its recorded behavior is preserved in the audit fixtures.

## Source and verification

- `public/`: deployable page and unminified source files.
- `reference/tajjava-v0.1/`: **unchanged** historical Java source archive, JAR,
  README and HELP, with hash records in `SHA256SUMS.txt`.
- `reference/squarechallenge-incomplete/`: unchanged later six-file snapshot,
  preserved solely for genealogical comparison.
- `test/fixtures/`: historical witness paths and oracle log, never used by the
  running browser game. `test/parity.test.js` tests both unchanged rules and
  explicitly documented corrections. `specs/` contains scope and QA limits.

From the project root:

```sh
npm run check    # ESLint, then the Node tests
python3 test/browser_smoke.py
python3 test/http_smoke.py
sha256sum -c SHA256SUMS.txt
```

The browser test requires Playwright and a local Chromium binary; the game
itself does not. Details, including the environment-specific restriction on
browser navigation to local HTTP, are in `specs/QA.md`. The HTTP test confirms
that the unmodified separate HTML, CSS, JS, license and source-note files are
served correctly, but does **not** substitute for a browser opening a real
static host. Verify the game once on the actual Libre Arcade deployment.

## License and attribution

Original TAJJAVA v0.1 Java source: Copyright (C) 2011 Jasen Borisov,
**GNU AGPL version 3 or later**, per the original headers and README.
Browser adaptation: Copyright (C) 2026 Libre Arcade contributors,
**GNU AGPL version 3 or later**. The original archives are preserved intact;
the readable browser source and complete AGPLv3 text are supplied in the
public deployment. Consult `THIRD_PARTY_NOTICES.md`, `public/SOURCE.md` and
`specs/PROVENANCE.md` before redistributing or mixing with other repository
code. Do not relabel the historical AGPL engine as GPLv3 based on the separate
later snapshot. No third-party artwork, custom fonts, audio files, or external
JavaScript dependencies are bundled. The optional sound effects are a modern
accessibility/UX addition, not a feature claimed for the 2011 Java game.

Historical upstream: https://sourceforge.net/projects/tajjava/

Later incomplete project: https://sourceforge.net/projects/squarechallenge/

Libre Arcade: https://linkingtechnologies.github.io/libre-arcade/
