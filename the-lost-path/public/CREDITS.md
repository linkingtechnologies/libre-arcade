# Credits

## The Lost Path

The game itself. Vendored here with minimal local changes; see
[`specs/design.md`](../specs/design.md) for the full list.

- **By**: Ghazi ([@mgks](https://github.com/mgks))
- **Source**: https://github.com/wrksp8/TheLostPath (originally published as
  `mgks/TheLostPath`; GitHub redirects the old address to the new one)
- **Snapshot**: commit `767e15d8a1cdb689e0ac56d703ccbe7fde977605`, 2025-01-08
- **License**: MIT, see [`LICENSE`](LICENSE) (copied unmodified from upstream)

## Vendored libraries

None. `src/script.js` has no dependencies and no build step.

## Added here

`src/touch.js`, `src/torch.js`, `src/difficulty.js`, `src/menu.js`, `src/menu.css` and `src/i18n.js` (the Italian and English interface text) are new and not by the original author, and `src/script.js` has two small edits by Libre Arcade (see `specs/design.md`).

## Vulnerability check (2026-10-17)

Not applicable: no third-party runtime dependencies. The only remote
reference upstream had (Google Tag Manager) was removed.
