# HTML5 Space Invaders

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/html5-space-invaders/public/index.html)**

The classic alien-shooting arcade game, one or two players, by the original
[html5-space-invaders](https://github.com/toivjon/html5-space-invaders)
author (MIT, archived) — restored and re-hosted here.

`game.js` in [`public/`](public/) is byte-for-byte upstream's own file,
unedited; the canvas is CSS-scaled (not resized) to fit any viewport while
its internal 672×768 coordinate space — which the game's own drawing code
assumes — stays untouched. Full account:
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
