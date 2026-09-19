# Disk Field — Libre Arcade preservation port (v0.6.2)

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/disk-field/public/index.html)**

HTML5/vanilla JavaScript/Canvas 2D/Web Audio preservation port of **Disk Field**, Jeremy Appleyard (Tigga), PyWeek 5 (2007). The behavioral baseline is the post-contest **v1.01**. All 17 original levels and their original simulation rules are retained. Menu and audio are newly implemented and use no historical recordings or font files.

## Play

Serve the `public/` directory over HTTP (ES modules do not work reliably when opening `index.html` directly as a file). With Node.js installed:

```bash
npm run dev
```

Open `http://localhost:8080/`, interact once to enable browser audio, and use Left/Right or the on-screen touch controls to rotate the field. `P` pauses; `R` restarts. **Musica** and **Suoni** are independent toggles. The game supports Italian and English and stores progress locally.

## Test

```bash
npm test        # the regression suite only
npm run check   # lint + the regression suite
```

Requires Node.js 22+ (`node --test` with a file glob; the suite itself has no runtime dependencies; `npm install` only adds ESLint for `npm run lint`). `npm run build` copies `public/` verbatim into a throwaway, gitignored `game/` for deploying this game alone; `npm start` builds and serves that copy. Includes original-Python-derived oracle traces, level stress checks, UI/audio logic checks, and a replay proving completion for **17/17 levels** on the port engine. `Dodge!` is proven for a seeded configuration, not every possible random draw. Tests pin the SHA-256 of `public/js/engine.mjs` and `public/js/levels.mjs`. The optional upstream ZIP hash checks run only if the historic archives are supplied separately in a private `reference/archives/` directory.

## Archaeology (included in this repository)

The complete **publicly shareable** archaeology dossier is in [`archaeology/README.md`](archaeology/README.md): original 1.0/1.01 comparison, chronological PyWeek index, per-file SHA-256 manifest, full source/text patch, physics/level reconstruction, abandoned features, rights audit and original READMEs/CHANGELOG. The historic oracle observations and complete solvability replays live in `tests/`. Port milestones are indexed under `docs/milestones/`. `reference/` contains **metadata only**: the original asset-containing archives are deliberately excluded.

## Publish / rights

The **static site root** is `public/`. This repo includes metadata-only `reference/` but no original archives or historical audio/font assets. Original source archives remain in the private archaeology workspace. See `THIRD_PARTY_NOTICES.md`, `PUBLISHING.md`, and `LICENSE`. The new port is GPL-3.0-or-later; the upstream source and its historical assets retain their original terms. Keep original author attribution in the game and documentation.

**Release status:** automated gates pass; real human end-to-end play-through, iOS/Android audio and landscape tests, and final deployed-site checks remain manual acceptance gates. See `docs/PRODUCTION_CHECKLIST.md`.
