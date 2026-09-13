# JavaScript audit

The restored edition is a plain static HTML/CSS/JavaScript application.

## Architecture

- Native browser ES modules with explicit `.js` paths.
- No build step.
- No backend requirement.
- No boardgame.io or Socket.IO runtime dependency.
- Local 1–6 player state and turns are handled in the browser.

## Checks

- Every browser import is relative, has a `.js` extension and resolves to an existing file.
- Every local HTML `src` / `href` reference resolves.
- All JavaScript files pass `node --check`.
- Modern and Classic rules are regression-tested.
- Every legal dice result is tested from every board tile.
- Deterministic full games are simulated for both rule sets.
- The local start / roll / move flow is tested.
- Public-facing copy is checked for obsolete multiplayer/debug wording.
