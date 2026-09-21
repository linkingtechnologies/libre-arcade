# AGENTS.md

- License: this game is AGPL-3.0-or-later, like the original TAJJAVA it adapts, unlike the collection's GPL-3.0-or-later default. Do not relabel it GPL, and do not treat the GPL header of the later `squarechallenge` snapshot as relicensing the AGPL original. Keep `LICENSE`, `public/licenses/AGPL-3.0.txt` and `public/SOURCE.md`: the AGPL asks that users of the page can get its corresponding source, and the page links to them from its Credits dialog. Keep the JavaScript readable, with no minification.
- `reference/` is preserved evidence, unchanged: `SHA256SUMS.txt` records the five files. Never edit or repack them.
- Historical rules and documented corrections stay separate. The rules in `public/src/game.js` follow the Java original; the four corrections (Undo disabled before move 1, Undo of move 1 offers the corner, New game clears every flag, clicks on a finished board are ignored) are asserted separately in `test/parity.test.js` and listed in `specs/PARITY.md`. Never describe them as features of the Java game.
- Do not add a solver, hints, levels, scoring, a timer, random boards or a backend. The witness paths in `test/fixtures/` are tests, never hints, and the runtime must not read `test/`.
- The oracle log (`test/fixtures/oracle_original_jar.txt`) is what the original did. If you change it, re-run the original with `tools/oracle/` first; `test/oracle-rerun.test.js` checks the stored re-run against the log.
- No frameworks, bundler or external libraries. The only remote reference in `public/` is the collection's GoatCounter snippet and the Libre Arcade credit link.
- `test/browser_smoke.py` needs Playwright and Chromium and writes `test/desktop.png` and `test/phone.png`; `test/http_smoke.py` needs only Python.
- `npm run check` (lint plus the Node tests) must pass before packaging. The game still needs one look on its final hosted address before it is called finished.
