# Wok

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/wok/public/index.html)**

A browser preservation port of **Wok 1.0**, the SDL game by Kenta Cho. See
[`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the recovery story
and [`PROVENANCE.md`](PROVENANCE.md) for exactly what was and wasn't ported.

Move the wok with the mouse or touch. Catch the falling balls, then throw them
through the right side. Throw several balls in quick succession to build the
score multiplier. If any ball falls through the bottom, the run ends.

## Run

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output. Any other static HTTP server pointed at
`public/` works too — no build step or framework is required. It is
suitable for GitHub Pages as-is.

## Preservation layout

- `reference/original/` — original compressed archive, unchanged.
- `reference/wok-1.0/` — extracted original source, unchanged.
- `public/assets/original/` — unmodified convenience copies of the historical graphics and audio.
- `public/assets/runtime/` — browser-compatible derived media; the legacy beta-Vorbis music is decoded to PCM WAV without an additional lossy encoding stage.
- `public/src/` — clean JavaScript web port (plain browser scripts, no bundler).
- `specs/` — archaeology, legal audit and parity notes.
- `test/` — parity-oriented automated checks.

The new web code is GPL-3.0-or-later. The historical source and assets retain
their original copyright and license notices; see `PROVENANCE.md` and
`THIRD_PARTY_NOTICES.md`.

## Tests

```bash
npm run check
```
