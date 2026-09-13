# Game of the Goose — Restored Edition

A restored edition of Robert Riesebos' **Game of the Goose**, playable by 1–6 people on the same device. It is responsive and available in Italian and English.

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/game-of-the-goose/public/index.html)**

See [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the recovery story and [`PROVENANCE.md`](PROVENANCE.md) for exactly what was and wasn't ported.

## Run it

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output. Any other static HTTP server pointed at
`public/` works too. Do not open the HTML through `file://`; browser ES
modules require HTTP(S).

## GitHub Pages

Publish `public/` (or the built `game/` output). `index.html`, `create.html`, `game.html`, `css/` and `src/` are already the deployable application. There is no server-side component.

## Verification

```bash
npm run check
```

The tests check JavaScript syntax, browser-module paths, local-only wiring, responsive breakpoints, IT/EN catalogs, rules/events, movement across every board tile and deterministic full-game simulations.

See `RESTORATION_NOTES.md`, `JS_AUDIT.md`, `LICENSE_AUDIT.md` and `UPSTREAM_NOTICE.md` for preservation details.


### Graphic restoration

The restored edition keeps the upstream board geometry and pseudo-isometric presentation, but replaces unresolved upstream player artwork with newly drawn inline SVG geese, adds original special-tile pictograms, and uses CSS-rendered pip dice. No external runtime artwork, icon pack, or webfont is required.
