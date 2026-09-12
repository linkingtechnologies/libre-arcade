# Libre Arcade — Agent Guidelines

Collection-wide conventions. Each game's own `AGENTS.md` (where present, e.g.
`briscola/AGENTS.md`) governs that game's internals; this file governs
everything that should stay consistent *across* games. Read
[`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the philosophy
behind these rules, not just the rules themselves.

## Every game is a fully independent folder

- Its own `package.json`, `node_modules`, tests, licensing files. No shared
  runtime, no shared `node_modules`, no game importing another game's code.
- No framework or hosting-platform lock-in: plain HTML/CSS/JS, servable by
  any static web server. Don't reach for a bundler, a framework, or a
  platform-specific deploy mechanism "just because" — if a game doesn't need
  one to run, it shouldn't gain one.

## The `public/` → `game/` contract (do not deviate)

- `public/index.html` is the game itself, **directly at the root of
  `public/`** — never `public/<name>/index.html` with a redirect stub at
  `public/index.html`. One file, no indirection, regardless of what the
  game's own folder or brand is called. (Klondike and Netris both violated
  this at first — Klondike inherited the nesting from an old Next.js setup,
  Netris copied Klondike without needing to — and were flattened later at
  real cost. Don't reintroduce it for a new game.)
- `npm run build` copies `public/` to `game/` verbatim — no bundling, no
  transformation. `game/` is gitignored: a throwaway export for deploying
  *this one game alone* somewhere else, stripped of `reference/`/`specs/`/
  `test/`. Never hand-edit it, and never assume it exists — it's a build
  artifact, not part of the committed tree.
- `public/` is what's actually committed and immediately playable with zero
  build step — that's why the collection's own root `index.html` links to
  `<game>/public/index.html`, not `<game>/game/index.html`. A zero-build
  static host (GitHub Pages included) serves the repo as committed; if the
  arcade page linked to `game/`, every link would 404 until someone ran
  `npm run build` in every single game folder first.
- Every game's `package.json` exposes the same script names, doing the same
  things, so muscle memory carries over between games:
  - `dev` — serve `public/` directly (live editing, no build step)
  - `build` — package `public/` into `game/`
  - `start` — `build` then serve `game/` (previews exactly what ships)
  - `test` — `node --test`
  - `lint` — `eslint .`
  - `check` — `lint && test` (and `&& certify` where a certification step exists)
- A ready-made `scripts/serve.mjs` (dependency-free `node:http` static
  server) already exists in every game folder — copy it for a new one
  rather than writing another.
- Every game's own `.gitignore` (and the root one) excludes `.claude/` —
  Claude Code's local session/runtime metadata, never meant to be published.
  Copy an existing game's `.gitignore` for a new one rather than starting
  from a bare one; a root-level `.claude/` was once missed this way.

## Three ways a game ends up here — know which one you're building

1. **Ported**: re-implemented in JavaScript from a non-JS original (or a JS
   original too stale/coupled to port as-is). Needs: `reference/<name>/`
   (frozen, untouched upstream snapshot), `specs/port-map.md`
   (function-by-function mapping), `PROVENANCE.md`, `THIRD_PARTY_NOTICES.md`,
   `SOFTWARE_ARCHAEOLOGY.md` (this game's own recovery story, linking back
   to the root one). See `klondike/`, `briscola/`, `netris/`.
2. **Restored**: the original JS/HTML/CSS itself, vendored and cleaned for
   safe embedding (telemetry/ads stripped, vulnerable deps bumped) but
   otherwise untouched. No `reference/` — `public/` already *is* the
   original code. Needs: `specs/design.md` (every change and why),
   `public/CREDITS.md` (authorship, license). See `hextris/`,
   `html5-breakout/`, `html5-snake/`, `html5-space-invaders/`,
   `react-simple-snake/`.
3. **Built here**: original work for this collection, not a restoration. No
   `reference/`, no port-map. See `grugnetto-go/`.

Don't blend these. A restored game that needed one small fix documents that
fix in `specs/design.md`; it doesn't grow a `reference/` folder to look more
like a port.

## Licensing discipline

- `LICENSE` at each game's root carries the **full license text**, not a
  truncated version pointing elsewhere — copy it from another game's
  `LICENSE`/`LICENSES/` folder that already has the right one verified,
  don't paraphrase or shorten it.
- **Never assume a copyleft license's "or later" permission** — verify it in
  the actual upstream source (a header comment, `COPYING`'s own text) or in
  an authoritative secondary source (a Debian `debian/copyright` naming the
  exact clause), and say in `PROVENANCE.md` which kind of evidence you have.
  A plain `GPL-2.0`-titled `COPYING` file without an explicit "or later"
  statement means the port stays `GPL-2.0-only` — it does not become
  `GPL-3.0` by assumption. (Netris's own `sr.c`/`engine.js` port went through
  exactly this check before being declared `GPL-2.0-or-later`.)
- **Never assume a project is abandoned from a downstream packager's update
  cadence.** Debian (or any distro) can stop repackaging a project for
  reasons that have nothing to do with upstream activity. Check the actual
  upstream release history (the project's own site, its real VCS/file
  host) before writing "abandoned since <year>" anywhere. Getting this wrong
  once already cost a full restoration attempt in this collection (LTris:
  assumed dead from 2013 Debian packaging, actually continuously developed
  through 2025).
- Never use a trademarked game's name ("Tetris", etc.) as a folder name, a
  page title, or any of our own branding — only as attribution when it's
  literally the historical project's own name (`netris/`, because Netris is
  what its author called it). See `SOFTWARE_ARCHAEOLOGY.md` for why this
  matters beyond just trademark risk.

## Verification hierarchy (strongest first)

1. Executable oracle — run the actual original code and diff behavior
   against it (Klondike's `js-solitaire`, BriscoLab's Python/Ruby sources).
2. Hand-computed exact values for anything that's pure arithmetic (an RNG's
   output sequence for a fixed seed) when no compiler/runtime for the
   original language is available.
3. Careful, documented source-level equivalence review — reading the
   original function-by-function and transcribing it, not redesigning it,
   when neither of the above is possible (Netris: no C compiler in this
   environment).

Record which level applies in `specs/port-map.md` or equivalent. Don't imply
oracle-level confidence when the real evidence is level 3.

## Root-level files (this collection, not any one game)

- `README.md` — the index: every game, every original source, shared
  conventions, and the "License" section explaining root `LICENSE` (GPL v3,
  covering this collection's own root-level code and every game's own new/
  ported code) versus each game's vendored third-party files, which keep
  their original license and are not relicensed by it.
- `LICENSE` — full GPL v3 text for this collection's own root-level files.
  Not a claim that every file in every game folder is GPL — check that
  game's own `LICENSE`/`THIRD_PARTY_NOTICES.md` for its vendored material.
- `SOFTWARE_ARCHAEOLOGY.md` — the shared philosophy; each game's own
  `SOFTWARE_ARCHAEOLOGY.md` (ported games) tells that game's specific story
  and links back here.
- `index.html` — the arcade landing page, one tile per game, linking to
  `<game>/public/index.html` (or `<game>/index.html` for the ones without a
  `public/` layer, e.g. `briscola/`).

## "Play here" links (GitHub Pages)

This collection is published at `https://linkingtechnologies.github.io/libre-arcade/`.
The root `README.md` carries a `**[▶ Play here](.../libre-arcade/)**` link
right under the title, pointing at the arcade landing page. Every game's own
`README.md` carries the same line right under its own title, pointing
directly at that game's page (skipping the arcade menu) — reuse the exact
path segment its card in the root `index.html` links to, prefixed with the
Pages base URL. Add this line for every new game before considering it done.
- `package.json` + `scripts/serve.mjs` here are a **local preview
  convenience only** — not a build, not a shared dependency for any game.

## Analytics (GoatCounter)

Every game's own `public/index.html` (or bare `index.html` for the games
without a `public/` layer) carries the same GoatCounter snippet just before
`</body>`, and so does the root `index.html`:

```html
<script data-goatcounter="https://grugnetto.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
```

This is inlined per-game on purpose, not loaded from one shared file — see
"Every game is a fully independent folder" above. A shared
`<script src="/analytics.js">` would 404 the moment a single game is copied
out and served on its own, which this collection explicitly supports.

If a game declares a `Content-Security-Policy` meta tag, it must allow the
beacon explicitly or the browser silently drops it with no visible error:
- `script-src` needs `https://gc.zgo.at`
- `connect-src` needs `https://grugnetto.goatcounter.com`

A game whose own tests assert "no remote dependencies" or scan for `https://`
in its HTML needs that assertion narrowed to exempt these two domains
specifically (see `donkey-bolonkey/test/production.test.js` for the pattern),
not deleted outright — the point of that test is to catch *other* accidental
remote calls creeping in, not to forbid analytics.

Add the snippet for every new game before considering it done, the same way
"Play here" links are required above.
