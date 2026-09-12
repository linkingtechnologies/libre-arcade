# Hextris

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/hextris/public/index.html)**

A hexagonal, Tetris-inspired puzzle game by Logan Engstrom, Garrett Finucane,
and the [Hextris](https://github.com/Hextris/hextris) contributors —
restored and re-hosted here, GPL-3.0.

This is a **restoration**, not a reimplementation: the game in
[`public/`](public/) is the original vendored source with telemetry, ads, a
remote-code-execution script injector, and dead libraries/fonts removed, two
vulnerable bundled dependencies upgraded, and its CSS scoped so it can be
embedded safely — nothing about how the game itself plays was changed. Full
list of what changed and why: [`specs/design.md`](specs/design.md). Full
authorship and third-party library/font breakdown:
[`public/CREDITS.md`](public/CREDITS.md).

## Running it

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output.

## License

The game is GPL-3.0-only — see [`public/LICENSE.md`](public/LICENSE.md).
This folder's own dev tooling (`scripts/`, `test/`, `eslint.config.mjs`) is
separately MIT and does not apply to the game itself — see
[`LICENSE`](LICENSE).

## History

See [`CHANGELOG.md`](CHANGELOG.md).
