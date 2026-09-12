# HTML5 Breakout

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/html5-breakout/public/index.html)**

The classic brick-smashing arcade game, one or two players, by the original
[html5-breakout](https://github.com/toivjon/html5-breakout) author (MIT,
archived) — restored and re-hosted here.

The game in [`public/`](public/) is upstream's own `game.js`/`styles.css`
with one small, additive, documented exception: upstream never drew a "GAME
OVER" screen or offered a way back to the menu, so a minimal one was added.
Everything else is exactly as its original author built it. Full account:
[`specs/design.md`](specs/design.md). Authorship:
[`public/CREDITS.md`](public/CREDITS.md).

## Running it

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output.

## License

The game is MIT — see [`public/LICENSE`](public/LICENSE). This folder's own
dev tooling (`scripts/`, `test/`, `eslint.config.mjs`) is separately MIT —
see [`LICENSE`](LICENSE).

## History

See [`CHANGELOG.md`](CHANGELOG.md).
