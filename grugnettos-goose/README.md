# 🐽’s Goose

A browser-native Game of the Goose built as a **software-archaeology project**: historical boards, rules and earlier software implementations are studied and documented separately from a modern HTML5/JavaScript implementation written for this repository.

The visible game title is **🐽’s Goose**. The repository/internal project name remains **Grugnetto’s Goose**.

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/grugnettos-goose/public/index.html)**

See [`SOFTWARE_ARCHAEOLOGY.md`](SOFTWARE_ARCHAEOLOGY.md) for the recovery story and [`PROVENANCE.md`](PROVENANCE.md) for exactly what was and wasn't ported.

## Play

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output. Any other static HTTP server pointed at
`public/` works too.

For board-coordinate inspection/calibration:

```text
http://localhost:8080/?debugBoard=1
```

The project is suitable for static hosting such as GitHub Pages.

## Gameplay

- 2–4 local human/CPU players;
- deterministic seeded RNG and same-seed replay;
- save/continue with exact RNG state;
- classic 63-space route with exact finish and overshoot bounce;
- opening 3+6 → 26 and 4+5 → 53;
- Goose, Bridge, Inn, Well, Maze, Prison and Death spaces;
- occupied-space exchange and Well/Prison replacement;
- Italian and English UI;
- responsive desktop/mobile presentation;
- local audio with Web Audio plus project-authored WAV fallbacks;
- reduced-motion support;
- player identity based on **symbol + pattern + colour**, never colour alone.

The exact implemented rules are recorded in [`specs/rules.md`](specs/rules.md).

## Historical boards

Two historical board artworks are bundled locally and require no runtime network access:

- `public/assets/boards/original/Ganzenbord_pd.svg` — Pmathijssen, 2008, public-domain dedication, exact Wikimedia Commons file verified by SHA-1;
- `public/assets/boards/original/Ganzenbordspel.jpg` — Daan Hoeksema, ca. 1910–1920, public-domain historical artwork; bundled as the locally supplied 2048×1470 representation.

Artwork and game logic are independent. Each board has its own normalized 1–63 coordinate map under `public/data/board-layouts/`. `ganzenbord-pd.json` contains the final manual calibration used by the game.

See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and the corresponding records under [`reference/`](reference/).

## Software archaeology

The archaeology layer is intentionally separated from the new implementation:

```text
/reference               provenance, hashes and admission status of historical references
/specs                   rules, parity, legal/asset audit and development archaeology notes
/public/assets/boards/original
                         historical artworks cleared for redistribution
/public/src              new project code
/public/data             new rule/layout data used by the modern implementation
/test                    deterministic and release-contract tests
```

Start with [`ARCHAEOLOGY.md`](ARCHAEOLOGY.md). The machine-readable evidence/admission matrix is [`reference/manifest.json`](reference/manifest.json).

Historical archives whose licence version or asset provenance is not sufficiently clear are **not redistributed** in this production package. Their filenames, hashes and audit conclusions are retained so a locally held original can be matched without silently relicensing or republishing it.

## Verification

```bash
npm run check
```

The production release contract checks deterministic gameplay, reference/admission policy, local runtime assets, historical board layouts, accessibility identifiers and responsive UI contracts. Runtime game code does not use `Math.random()`, and the playable game's only external HTTP dependency is the site-wide, cookie-free GoatCounter analytics beacon (see the root repository's `AGENTS.md`) — no board artwork, audio or gameplay data is fetched remotely.

## Licence

New project code is released under the **GNU General Public License v3.0**; see [`LICENSE`](LICENSE).

Historical/public-domain artwork and other third-party material keep their own status and attribution as documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md) and [`reference/`](reference/). The GPL declaration for the new project must not be read as relicensing historical reference material.
