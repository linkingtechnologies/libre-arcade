# Credits

## html5-space-invaders

The game itself. Vendored here with minimal local modifications — see [`specs/html5-space-invaders/design.md`](../../specs/html5-space-invaders/design.md) (relative to the plugin root) for the full list.

- **By**: Jon Toivonen ([toivjon](https://github.com/toivjon)) — development blog entry: https://toivjon.wordpress.com/2017/09/17/html5-space-invaders/
- **Source**: https://github.com/toivjon/html5-space-invaders (archived by its author)
- **License**: MIT — see [`LICENSE`](LICENSE) in this folder (reproduced verbatim from upstream's own `LICENSE` file, including its blank copyright-holder line — that's how upstream shipped it, not an omission introduced here)

## Vendored libraries

None — `game.js` has zero dependencies, no build step, no bundler; `space_invaders_spritesheet.png` is upstream's own single art asset, vendored unmodified. Two small local files were added, `scale.js` and `bootstrap.js` — neither is a third-party dependency, see their own header comments and `specs/html5-space-invaders/design.md`.

## Vulnerability check (2026-08-09)

Not applicable — no third-party runtime dependencies to check. `game.js` itself is plain DOM/Canvas APIs only, unmaintained since ~2017 (upstream repo is archived) but has no dependency surface to go stale.
