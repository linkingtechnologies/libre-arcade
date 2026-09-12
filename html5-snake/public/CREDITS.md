# Credits

## html5-snake

The game itself. Vendored here with minimal local modifications — see [`specs/html5-snake/design.md`](../../specs/html5-snake/design.md) (relative to the plugin root) for the full list.

- **By**: Jason D. Straughan ([JDStraughan.com](http://JDStraughan.com))
- **Source**: https://github.com/JDStraughan/html5-snake
- **License**: MIT — see [`LICENSE`](LICENSE) in this folder (reproduced from the upstream README, which has no separate `LICENSE` file of its own)

## Vendored libraries

None — `game.js` has zero dependencies, no build step, no bundler. The only local change from upstream is removing a dead IE-conditional `<script>` tag that pointed at `html5shiv.googlecode.com` (Google Code shut down in 2016; the domain no longer resolves) — see `index.html`'s own comment.

## Vulnerability check (2026-08-09)

Not applicable — no third-party runtime dependencies to check. `game.js` itself is small (210 lines), plain DOM/Canvas APIs only, unmaintained since ~2013 but has no dependency surface to go stale.
