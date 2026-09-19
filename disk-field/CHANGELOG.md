# Changelog

## Unreleased

- Joined the Libre Arcade collection: added the shared `dev` / `build` /
  `start` / `lint` / `check` npm scripts, `scripts/serve.mjs` and
  `scripts/build.mjs`, an ESLint config, `.claude/` and `/game/` in
  `.gitignore`, the GoatCounter snippet and the "Play here" link.
- `npm test` now runs `node --test tests/*.mjs`, one subtest per existing
  check script (the same nine scripts the previous chained command ran). It
  needs Node.js 22+ for the glob.
- Added `PROVENANCE.md`, `specs/port-map.md`, `SOFTWARE_ARCHAEOLOGY.md`,
  `STORY.md` and `AGENTS.md`.
- Recorded that the seven Python modules under `tools/oracle_compat/v1.01/lib/`
  are not byte-identical to the archive: five match the manifest hashes once
  LF is restored to CRLF, two carry small further differences. Corrected the
  wording in `THIRD_PARTY_NOTICES.md` and `PUBLISHING.md`.
- Removed two unused declarations from `tests/m2-static-checks.mjs` so the
  suite passes lint. No change to game logic: the only edit under `public/` is
  the GoatCounter snippet in `index.html`, and `engine.mjs` and `levels.mjs`
  are still byte-identical to the pinned hashes.
- Added `.gitattributes` marking `archaeology/upstream-text/*` and the
  `archaeology/stratigraphy/*.patch` as `-text`. The collection's root
  `* text=auto` would otherwise rewrite the CRLF line endings inside those
  preserved upstream files on commit, so they would no longer hash to the
  values in `archaeology/inventories/manifest.json`.
- `REPO_MANIFEST_SHA256.txt` regenerated for the new layout. It hashes the
  files as they sit in the working tree, so text files that `text=auto`
  converts (for example the oracle CSVs, which are CRLF) can hash differently
  after a checkout with other line endings.

## 0.6.2 (as delivered)

Selector layout hotfix on top of the M6.1 audio-start hotfix. Full milestone
history: `docs/milestones/`. Release status and the remaining manual
acceptance items: `docs/PRODUCTION_CHECKLIST.md`.
