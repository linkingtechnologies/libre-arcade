# Changelog

## Unreleased

- Joined the Libre Arcade collection: restructured `index.html`, `src/`,
  `assets/` and `data/` into the shared `public/` → `game/` layout, renamed
  the project's own `scripts/` (the Wikimedia board-fetcher utilities) to
  `tools/` to free up `scripts/` for the collection's standard
  `serve.mjs`/`build.mjs`, and added `dev`/`build`/`start`/`lint`/`check`
  npm scripts and an ESLint config. Added the site-wide GoatCounter
  analytics snippet, narrowing `test/release-contract.test.js`'s
  no-HTTP-dependency check to exempt exactly that beacon rather than
  disabling it.
- Added `PROVENANCE.md`/`SOFTWARE_ARCHAEOLOGY.md` linking back to the
  collection's own philosophy document. Independently re-verified this
  project's own unusually careful provenance claims rather than trusting
  them at face value: re-downloaded `Ganzenbord_pd.svg` directly from
  Wikimedia Commons and confirmed byte-for-byte identity with the bundled
  copy, confirmed the live Commons license/authorship pages for both board
  artworks match this project's documentation exactly, and confirmed all
  six "studied, not bundled" software references under `reference/`
  contain only provenance notes with no actual archive present. See
  `PROVENANCE.md`.
- Fixed one genuine lint finding: `tools/fetch-original-boards.mjs` imported
  `readFile` from `node:fs/promises` without ever using it — removed, no
  behavior change.
- Fixed documentation gaps found on a follow-up pass: `reference/QUARANTINE.md`
  existed and was accurate but was linked from neither `ARCHAEOLOGY.md`'s own
  documentation map nor `reference/README.md`; `public/assets/boards/README.md`
  was a stale pre-1.0 leftover still describing a `local/` folder and a
  `ganzenbordspel-inspired.svg` placeholder that no longer exist (their
  absence is exactly what `test/release-contract.test.js` asserts); and
  several `reference/*/PROVENANCE.md` files and `reference/README.md` still
  said `/src`/`/assets`/`/data` instead of `public/src`/`public/assets`/
  `public/data` after the restructuring above.
- `SHA256SUMS.txt` at the repository root reflects the original delivered
  v1.0.0 file layout and is kept as a historical snapshot rather than
  regenerated after this restructuring, the same way this collection treats
  other games' pre-integration hash manifests.
- No gameplay, rules, or license-scope conclusions changed.

## 1.0.0 — production repository package

- freezes the manually calibrated Ganzenbord layout;
- includes both locally bundled historical board themes and their provenance/checksums;
- finalizes responsive setup/sidebar behaviour for short desktop and mobile viewports;
- finalizes local audible dice, movement and victory feedback;
- finalizes inclusive player identities using large geometric symbols, patterns and colours;
- adds the top-level archaeology dossier and production-safe reference/quarantine documentation;
- cleans the root README for standalone repository use.

Detailed UI-development notes from the pre-1.0 iterations remain under `specs/ui-v*.md` as project history.
