# Changelog

## Unreleased

- Joined the Libre Arcade collection: restructured `index.html`, `main.js`,
  `src/`, `assets-clean/` and `data/original-levels/` into the shared
  `public/` → `game/` layout (the level data moves inside `public/` so the
  folder stays self-contained when copied out and served on its own — a
  first for this collection, since every other game keeps its historical
  data outside `public/`). Added `dev`/`build`/`start`/`lint`/`check` npm
  scripts (built on the collection's own `scripts/serve.mjs`/
  `scripts/build.mjs`) and an ESLint config, alongside this project's own
  existing `serve`/`soak`/`release:check`/`http:smoke` archaeology-grade QA
  tooling, whose internal paths (`tools/serve.mjs`, `tools/release-check.mjs`,
  `tools/release-soak.mjs`) were updated for the new layout and re-verified
  to still pass unchanged. Added `PROVENANCE.md`/`SOFTWARE_ARCHAEOLOGY.md`
  linking back to the collection's own philosophy document, and the
  site-wide GoatCounter analytics snippet.
- Independently re-verified this delivery's own unusually thorough audit
  rather than trusting it at face value: extracted the referenced AmigaOS4
  archive and confirmed 93/94 source files' GPL-2.0-or-later headers,
  `List.h`'s lack of any license grant, all three embedded WAV
  copyright/conversion credits, the bitmap-font filenames, and byte-identity
  of all 66 historical `.lvl`/`.gms` files, matching every specific claim in
  `THIRD_PARTY_NOTICES.md` exactly. Independently re-hashed both historical
  executables (OS4 PowerPC, GP2X ARM) cited in
  `docs/executable-parity-report.md` and confirmed the GP2X binary's
  retained debug symbols include the named functions. See `PROVENANCE.md`.
- Fixed a one-level relative-path bug in `public/data/original-levels/README.md`
  (`../../specs/...` → `../../../specs/...`) introduced by nesting the data
  folder one directory deeper inside `public/`.
- Completed an incomplete assertion in `tools/http-smoke.mjs`: a path-
  traversal probe was fetched and commented as a security check but its
  response was never actually inspected; it now fails the smoke test if the
  server exposes a file outside its served root.
- Fixed lint findings surfaced by the shared ESLint config: one intentionally
  unused `nowMs` parameter's dead default value removed, one empty `catch {}`
  given an explanatory comment — no behavior change.
- No gameplay, physics, or license-scope conclusions changed.
