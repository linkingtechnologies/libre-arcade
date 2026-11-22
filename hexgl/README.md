# HexGL

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/hexgl/public/index.html)**

A futuristic 3D racing game in plain WebGL by Thibaut Despoulain (BKcore),
2012, restored and re-hosted here. MIT.

This is a **restoration**, not a reimplementation: the game in
[`public/`](public/) is the original code, taken from the 2026
[HexGL-2026](https://github.com/flowerz88/HexGL-2026) fork of
[BKcore/HexGL](https://github.com/BKcore/HexGL), with its Firefox OS and
AppCache leftovers removed and the fork's touch controls actually connected.
Full list of changes: [`specs/design.md`](specs/design.md). Where it comes
from, and the licence evidence (including some stale headers and two assets
without a stated licence): [`PROVENANCE.md`](PROVENANCE.md). Authorship and
libraries: [`public/CREDITS.md`](public/CREDITS.md).

## Controls

- **Keyboard**: arrow keys to accelerate, brake and steer; Q or A is the left
  airbrake, D or E the right one. Pick the mode in the start menu.
- **Touch**: hold to accelerate, drag left or right to steer, drag down to
  brake (left, right or both airbrakes depending on where you drag).
- Gamepad and Leap Motion modes are also in the menu.

## Running it

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for any static web server; `npm start` builds and serves that.
`npm run check` runs lint and the tests. The game needs WebGL.

## License

MIT, see [`LICENSE`](LICENSE). Nine source files still carry an old CC BY-NC
header from before the author's 2015 switch to MIT, and the ship model and
track texture have no licence of their own: read
[`PROVENANCE.md`](PROVENANCE.md) before reusing them.
