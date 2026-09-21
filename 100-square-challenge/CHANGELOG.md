# Changelog

## Unreleased

- First public version, joined to the Libre Arcade collection. The delivered package had an empty changelog and the page nested under `public/100-square-challenge/`.
- Moved the page to `public/` (`index.html`, `styles.css`, `src/`, `licenses/`, `SOURCE.md`) as the collection layout requires, and repointed the Node tests and the two Python tests at it (path changes only). The 13 Node tests of the delivered package pass (14 with the oracle re-run test added below) and `test/http_smoke.py` passes; `test/browser_smoke.py` needs Playwright and was not run.
- Added `package.json` (`dev`, `build`, `start`, `test`, `lint`, `check`; `test` is still `node --test test/*.test.js`), `scripts/serve.mjs`, `scripts/build.mjs`, an ESLint config, a `.gitignore`, the GoatCounter snippet in `public/index.html` and a "Play here" link in `README.md`. The README no longer says the game has no analytics: the page now carries the collection's snippet, and `THIRD_PARTY_NOTICES.md` says so.
- Re-ran the original TAJJAVA classes headless (Java 1.8.0_503) with a small harness, `tools/oracle/OracleHarness.java`. All 15 scenarios of `test/fixtures/oracle_original_jar.txt` reproduced exactly; the output is stored in `tools/oracle/rerun-output.txt` and `test/oracle-rerun.test.js` keeps it consistent with the log.
- Checked the license headers directly (6 Java files AGPL version 3 or later, 6 in the later snapshot GPL version 3 or later) and the two SourceForge project pages. Added `PROVENANCE.md`, `specs/port-map.md`, `SOFTWARE_ARCHAEOLOGY.md`, `STORY.md` and `AGENTS.md`.
- No change to the game logic, the interface, the strings, the sounds or the preserved reference files.
