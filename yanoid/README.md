# Yanoid

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/yanoid/public/index.html)**

A browser port of **Yanoid 0.3.0**, the version submitted to the SDL Game Development Contest 2001. See [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the recovery story and [`PROVENANCE.md`](PROVENANCE.md) for exactly what was and wasn't ported.

The first goal is gameplay parity with the contest release. Later Yanoid 0.3.5 features are documented but intentionally kept out of Contest mode. The current **0.2.4 milestone** is source-audited and parity-hardened, with newly authored bitmap typography and chiptune audio plus explicit browser audio unlocking; see `STATUS.md` for the remaining native-runtime validation caveat.

## Run

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output. Any other static HTTP server pointed at
`public/` works too — no build step, backend, framework or package install
is required for the game itself.

Controls:

- Left / Right: move paddle
- Space: fire when a shot power-up is active
- Escape: pause/resume
- Effects and music have independent toggles and saved preferences
- Touch controls are provided on mobile/tablet

## Test

Requires a recent Node.js only for tests:

```bash
npm run check
```

## Layout

- `/reference` — the extracted, SHA-256-verified Yanoid 0.3.0 source, minus ten specific files with unresolved or third-party-reused provenance (see `THIRD_PARTY_NOTICES.md`); raw tarballs are not redistributed
- `/public/assets` — selected Yanoid gameplay graphics plus the newly authored 5×7 bitmap font; the ten ambiguous historical files are excluded
- `/public/src` — framework-free HTML5/JavaScript port
- `/specs` — archaeology, parity and reconstructed-presentation documentation
- `/test` — deterministic tests for historical rules, edge cases, public-release hygiene and asset completeness
- `CHANGELOG.md` — milestone-by-milestone parity findings and corrections

## Public-release policy

Neither upstream tarball is redistributed, since a byte-identical archive would still contain the ten files below. `reference/yanoid-0.3.0/` instead preserves the rest of the verified 0.3.0 source tree in full — see `reference/README.md` for the exact SHA-256 values and how to fetch/verify the complete originals independently.

The browser game does not use, and the ten omitted files never appear anywhere in this repository: the historical SDL_Console fonts (`ConsoleFont.png`, `LargeFont.png`), `yanoid.xm`, and seven third-party WAV files. The SDL_Console *source* and the libsge-derived pixel-collision *fragment*, by contrast, are ordinary code with the same unresolved-license note as the fonts — they remain in `reference/yanoid-0.3.0/` as historical evidence, simply unused by the port.

## License

The original Yanoid code was audited as GPL-2.0-or-later — independently re-verified against a freshly downloaded, hash-matched copy of the archive, not just the audit's own summary. This port is distributed under **GPL-3.0-or-later**. See `LICENSE`, `PROVENANCE.md`, `THIRD_PARTY_NOTICES.md`, and `specs/ARCHAEOLOGY.md`.
