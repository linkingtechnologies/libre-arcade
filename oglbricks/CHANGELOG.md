# Changelog

## Unreleased

- First public version, joined to the Libre Arcade collection.
- Flattened the layout onto the collection contract. The package shipped the game twice, six byte-identical files in `src/` and the same six under `public/oglbricks/`, kept in step by `tools/sync_public.py` and a test that compared them. `public/` is now the game itself (`index.html`, `style.css`, `js/`), and the copier and that test are gone. The tests and tools were repointed: 38 of the 39 delivered Node tests pass unchanged, the missing one being the equality test that no longer has two sides.
- Added the collection's scripts (`dev`, `build`, `start`, `test`, `lint`, `check`), `scripts/serve.mjs`, `scripts/build.mjs`, an ESLint config, a `.gitignore` covering `/game/` and `.claude/`, the GoatCounter snippet and a "Play here" link. `COPYING` became `LICENSE`, byte-identical.
- Strengthened the page's remote-script assertion in `test/site.test.mjs`, which matched only an explicit `http:` or `https:` and would have let a protocol-relative URL through. It now lists every remote script and allows exactly the analytics beacon.
- Added `PROVENANCE.md`, `specs/port-map.md`, `SOFTWARE_ARCHAEOLOGY.md`, `STORY.md`, `AGENTS.md` and a screenshot, and condensed `specs/` from 19 files to four. What changed during integration, and what it cost, is in `SOFTWARE_ARCHAEOLOGY.md`; the milestone history and the open discrepancies are in `specs/AUDIT.md`.
- No change to the game rules, the 27-shape catalog, the score formula, the save schema, the strings or the sounds.
