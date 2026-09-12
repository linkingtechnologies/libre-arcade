# Credits

## html5-breakout

The game itself. Vendored here with local modifications — see [`specs/html5-breakout/design.md`](../../specs/html5-breakout/design.md) (relative to the plugin root) for the full list. Note: unlike every other vendored game in this plugin, `game.js` here is **not** byte-identical to upstream — a small, additive edit adds a "GAME OVER" screen and a way back to the welcome scene, since upstream had neither (requested live; see that spec's own "Local modifications" and "Returning to the welcome scene" sections for the full account, including a state-reset bug the change required fixing).

- **By**: J. Toiviainen ([toivjon](https://github.com/toivjon)) — development blog entry: https://toivjon.wordpress.com/2017/07/08/html5-breakout/
- **Source**: https://github.com/toivjon/html5-breakout (archived by its author)
- **License**: MIT — see [`LICENSE`](LICENSE) in this folder (reproduced verbatim from upstream's own `LICENSE` file, including its blank copyright-holder line — that's how upstream shipped it, not an omission introduced here)

## Vendored libraries

None — `game.js` has zero dependencies, no build step, no bundler, no external assets of any kind (no sprite sheet, no audio — everything is drawn with plain canvas primitives). One small local file was added, `scale.js` — not a third-party dependency, see its own header comment and `specs/html5-breakout/design.md`.

## Files in this folder (2026-08-09 audit)

Six files, all in active use — no unused/stray files found:

| File | Used by |
|---|---|
| `game.js` | Loaded by both `index.html` and `dashboard-html5-breakout.inc.php` |
| `scale.js` | Loaded by both, after `game.js` |
| `styles.css` | Loaded by both |
| `index.html` | Standalone entry point |
| `LICENSE` | Required by MIT's own attribution terms |
| `CREDITS.md` | This file |

## Vulnerability check (2026-08-09)

Not applicable — no third-party runtime dependencies to check (confirmed again after the `game.js` edit above: still zero `eval`/`document.write`/`innerHTML`/`localStorage`/network calls/external references of any kind, in `game.js` or `scale.js`). `game.js` itself is plain DOM/Canvas APIs only, unmaintained since ~2017 (upstream repo is archived) but has no dependency surface to go stale.
