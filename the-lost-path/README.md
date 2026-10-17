# The Lost Path

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/the-lost-path/public/index.html)**

A small 2D maze game by Ghazi
([The Lost Path](https://github.com/wrksp8/TheLostPath), MIT): a new random
maze every run, a view that stays centred on you, and a countdown set at five
seconds per tile of the shortest route. Restored and re-hosted here.

`src/script.js` in [`public/`](public/) is upstream's own file with two small edits (maze size and timer made adjustable, defaults unchanged).
Google Analytics was removed; a torch, three difficulty levels, touch controls, a menu with instructions and credits, and an Italian/English switch were added.
Full account: [`specs/design.md`](specs/design.md). Authorship:
[`public/CREDITS.md`](public/CREDITS.md).

Controls: arrow keys, or drag a finger on the screen. Pick Easy, Normal or Hard at the start (on Normal and Hard the finish only shows when you are close). The maze is dark and only a torch lights the corridors near you; Shift+D shows every path.

## Running it

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output.

## License

The game is MIT, see [`public/LICENSE`](public/LICENSE). This folder's own
dev tooling (`scripts/`, `test/`, `eslint.config.mjs`) is separately MIT, see
[`LICENSE`](LICENSE).

## History

See [`CHANGELOG.md`](CHANGELOG.md).
