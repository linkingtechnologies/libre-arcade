# AGENTS.md

## Goal
Maintain a faithful browser port of PSY PONG 3D 0.9 before adding optional modern presentation changes.

## Non-negotiable preservation rules

- Keep gameplay state and physics independent from WebGL.
- Do not silently "fix" source-observed historical quirks; document them in `specs/PARITY.md` and gate intentional changes behind explicit options.
- Keep deterministic tests for collision, scoring, CPU and random events.
- Do not add the historical `menu.bmp`, `background.bmp` or `spiral.bmp` to the public repository unless their redistribution rights are independently established.
- Do not add frameworks or runtime package dependencies without a strong reason.
- Keep the game fully client-side.

## Historical reference

The preserved upstream C source is under `reference/original-source/psypong3d-0.9/`. It is GPL-3.0-or-later. The legal audit and original archive hashes are under `reference/audit/`.

## Development

Run `npm run check` after gameplay changes. `public/src/core/` must remain importable by Node without DOM/WebGL globals so deterministic tests can execute headlessly.
