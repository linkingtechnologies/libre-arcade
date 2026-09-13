# Changelog

## Unreleased

- Joined the Libre Arcade collection: restructured into the shared
  `public/` → `game/` layout, added `dev`/`build`/`start`/`lint`/`check` npm
  scripts (built on the collection's own `scripts/serve.mjs`/
  `scripts/build.mjs`), an ESLint config, and `PROVENANCE.md`/
  `SOFTWARE_ARCHAEOLOGY.md` linking back to the collection's own philosophy
  document. Added the site-wide GoatCounter analytics snippet to all three
  pages (`index.html`, `create.html`, `game.html`).
- The delivered package did not include a `reference/` tree — its own docs
  described the untouched upstream snapshot as belonging to a separate
  archaeology package that wasn't part of this delivery. Independently
  fetched the exact audited commit from the live `rriesebos/game-of-the-goose`
  GitHub repository instead of trusting the bundled audit's summary,
  verified its complete file tree and license absence via the GitHub API,
  cross-checked git blob SHA-1 hashes of four key files against the
  downloaded archive, and added the result as `reference/game-of-the-goose-e8b804f/`
  with its own `reference/README.md` documenting the method — see
  `PROVENANCE.md`.
- Fixed lint findings surfaced by the shared ESLint config: two unused
  `addEventListener` callback parameters removed, two `catch (_) {}` blocks
  converted to bare `catch {}` (ES2019 optional catch binding) with their
  existing explanatory comments kept, and missing browser globals
  (`HTMLElement`, `structuredClone`, `CustomEvent`, `URL`, etc.) declared.
  Added a narrow `no-unused-vars` override for `public/src/rulesets.js`
  covering its `(G, ctx)` condition/event callback table, whose two leading
  parameters are part of a fixed calling convention used uniformly by
  `game.js` even when a specific rule doesn't need one of them — no
  behavior change.
- Removed `start-local.cmd`/`start-local.sh` and the game's own
  `scripts/serve-static.js` (superseded by the standard `npm run dev`) and
  the nested `.github/workflows/verify.yml` (GitHub Actions only reads
  workflows from the repository root, so a per-game copy inside this
  monorepo would never actually run).
- No gameplay, rules, or AI content changed.
