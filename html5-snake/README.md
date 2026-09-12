# HTML5 Snake

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/html5-snake/public/index.html)**

The classic, unforgiving Snake — wall contact ends the run instantly, no
wrap-around — by Jason D. Straughan
([html5-snake](https://github.com/JDStraughan/html5-snake), MIT) — restored
and re-hosted here.

`game.js` in [`public/`](public/) is byte-for-byte upstream's own file. The
fixed-size canvas was made to size itself to the viewport instead (a new,
separate `size.js`, not an edit to the game), and a dead 2016-era CDN
`<script>` was removed. Full account: [`specs/design.md`](specs/design.md).
Authorship: [`public/CREDITS.md`](public/CREDITS.md).

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
