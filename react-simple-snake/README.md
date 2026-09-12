# react-simple-snake

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/react-simple-snake/public/index.html)**

The relaxed Snake variant — wraps around every edge, only dies by biting its
own tail — a React component by Maël Drapier
([react-simple-snake](https://github.com/MaelDrapier/react-simple-snake),
MIT) — restored and re-hosted here.

The component's own published build (`lib/snake.js`, unmodified) is vendored
under [`public/vendor/`](public/vendor/) with a minimal CJS-to-ESM shim, next
to a small local entry point that mounts it. No CDN at runtime — React,
ReactDOM and the component itself are all vendored files. Full account:
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
