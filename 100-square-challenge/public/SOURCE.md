# 100-Square Challenge — source & license

Historical reference: **TAJJAVA v0.1 (2011)**, by Jasen Borisov.
Browser adaptation: Libre Arcade contributors (2026).

Both the historical TAJJAVA source and this browser adaptation are available
under **GNU AGPL version 3 or later**. The complete license text is available
in [`licenses/AGPL-3.0.txt`](./licenses/AGPL-3.0.txt).

The complete corresponding browser source is delivered as readable, unminified
files alongside this page:

- [`src/game.js`](./src/game.js) — board state and legal moves.
- [`src/app.js`](./src/app.js) — input handling and accessible presentation.
- [`src/i18n.js`](./src/i18n.js) — English and Italian.
- [`src/sound.js`](./src/sound.js) — optional, muted-by-default synthetic sound effects.
- [`styles.css`](./styles.css) — responsive design.
- [`index.html`](./index.html) — document and layout.

The Java original's first-move Undo and completed-game restart defects are
corrected in this browser adaptation; its geometric rules remain unchanged.
The full project archive also includes the original unaltered Java archive and
sources under `reference/tajjava-v0.1/`, the later incomplete GPLv3-declared
snapshot separately under `reference/squarechallenge-incomplete/`,
`THIRD_PARTY_NOTICES.md`, original-behavior regression tests and audit notes.

Original project: https://sourceforge.net/projects/tajjava/
Libre Arcade: https://linkingtechnologies.github.io/libre-arcade/
