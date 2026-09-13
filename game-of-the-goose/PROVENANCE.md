# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, board layout, tile events, local turn/state logic | [Game of the Goose](reference/game-of-the-goose-e8b804f/) by Robert Riesebos (`rriesebos/game-of-the-goose`) | GitHub `main` at commit `e8b804ffd3baa999416409fdec98cfc9e01ce87b`, independently re-fetched and git-blob-hash-verified — see `reference/README.md` | `ISC` (declared in `package.json`; no standalone `LICENSE`/`COPYING`/`NOTICE` file exists anywhere in the audited tree) | Preserved unmodified in `reference/game-of-the-goose-e8b804f/`; rules/events/local-play logic ported to browser-native ES modules in `public/src/` — see `RESTORATION_NOTES.md` and `JS_AUDIT.md` |
| `img/goose.svg`, `img/player0.svg`…`player5.svg`, `src/roll-a-die/` | same source | same commit | No embedded or per-file attribution found | **Not ported.** Preserved only inside `reference/`; the runtime uses newly drawn inline SVG geese and CSS-pip dice instead — see `ARCHAEOLOGY.md` |
| `boardgame.io`, `confetti-js`, `koa-static`, `esm` runtime dependencies and the online lobby/multiplayer server | same source | same commit | third-party npm packages / same ISC-declared code | **Not ported.** This restoration is a local-only, backend-free static page; see `THIRD_PARTY_NOTICES.md` |
| Web UI, local 1–6 player state machine, IT/EN catalog, inline SVG artwork, CSS dice | this repository | — | GPL-3.0-or-later (this repository's own `LICENSE` carries the plain GPLv3 text) | New reconstruction work |

## Licensing: independently re-verified, not just re-stated

The delivered restoration package did not include a `reference/` tree at
all — its own docs described the untouched upstream snapshot as belonging to
"a separate archaeology/reference package" that this delivery didn't
contain. Rather than accept `UPSTREAM_NOTICE.md`/`LICENSE_AUDIT.md`'s claims
on faith, the live public repository was fetched directly and checked before
anything else in this restoration was accepted:

- `raw.githubusercontent.com/rriesebos/game-of-the-goose/e8b804f.../package.json`
  was read directly and declares `"author": "Robert Riesebos", "license":
  "ISC"` verbatim.
- The **complete recursive git tree** at that commit (37 files) was fetched
  from the GitHub REST API and contains no `LICENSE`, `COPYING`, or `NOTICE`
  file anywhere — confirmed by listing every path, not by trusting a summary.
- The commit archive was downloaded independently with `curl` and its
  extracted files' **git blob SHA-1 hashes** (`git hash-object`) were
  compared against the GitHub API's own tree response for `package.json`,
  `src/roll-a-die/roll-a-die.js`, `img/goose.svg`, and `src/rulesets.js` —
  all four matched exactly, byte-for-byte.
- The quarantined files were opened directly: `img/goose.svg` carries no
  embedded copyright comment and its DOCTYPE/structure is consistent with
  untraced converted clipart rather than original art; `src/roll-a-die.js`
  is hand-vendored (it is not listed as an npm dependency in `package.json`)
  with no header attribution of any kind.

Full detail, including why the audit's own zip-SHA-256 claim couldn't be
reproduced and isn't a meaningful check for a live git host in the first
place, is in `reference/README.md`.

## What was not ported, and why

- **`boardgame.io` server-authoritative multiplayer, Socket.IO, the lobby
  server, and `confetti-js`** — this restoration is a static, backend-free
  page; local 1–6 player turn state is held entirely in the browser instead
  (`public/src/local-client.js`), matching how every other game in this
  collection runs.
- **`img/goose.svg` and the six `img/playerN.svg` pieces** — unattributed,
  replaced with new inline SVG geese drawn for this restoration.
- **`src/roll-a-die/`** — unattributed, hand-vendored dice-rolling code,
  replaced with restoration-owned HTML/CSS pip dice.
- **`screenshots/`** — README illustration images only, not part of the
  playable application; preserved in `reference/` for the historical record.
