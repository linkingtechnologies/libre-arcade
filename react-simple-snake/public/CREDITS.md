# Credits

## react-simple-snake

The game itself. Vendored here with local modifications — see [`specs/react-simple-snake/design.md`](../../specs/react-simple-snake/design.md) (relative to the plugin root) for the full list of what changed from upstream and why.

- **By**: Maël Drapier
- **Source**: https://github.com/MaelDrapier/react-simple-snake
- **License**: MIT — see [`LICENSE`](LICENSE) in this folder

## Vendored libraries (`vendor/`)

| Library | Version | License |
|---|---|---|
| [React](https://react.dev/) | 17.0.2 | MIT |
| [React DOM](https://react.dev/) | 17.0.2 | MIT |
| [object-assign](https://github.com/sindresorhus/object-assign) | 4.1.1 | MIT |
| [scheduler](https://www.npmjs.com/package/scheduler) | 0.20.2 | MIT |

React 17 (not a later major version) matches react-simple-snake's own declared peer dependency (`^17.0.1`) — see `specs/react-simple-snake/design.md` for why `vendor/react-simple-snake.esm.js` itself is a hand-wrapped copy of upstream's own published build rather than a straight ESM vendor copy like these four.

**Vulnerability check (2026-08-09)**: none of the four have any known CVE affecting the vendored version. React 19's CVE-2025-55182/-55183/-55184 (React Server Components RCE/DoS/source exposure) do not apply — those target `react-server-dom-*` packages and React 19.x specifically; this integration is client-side-only React 17, no server components anywhere. Re-check before bumping any of these versions, and re-check `react-simple-snake` itself (0.2.2, unmaintained since ~2021) periodically since it isn't actively patched upstream.
