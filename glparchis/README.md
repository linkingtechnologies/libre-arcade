# glParchis restoration — Phase 5

This repository preserves **glParchis 20181125** and contains a faithful, framework-free browser restoration.

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/glparchis/public/index.html)**

## Status

**Phase 5 is production ready for static hosting.** The game supports the historical 3/4/6/8-seat boards, four pawns per player, local human/CPU mixing, the original rule set and AI behaviour, viewport-aware responsive Canvas rendering, IT/EN UI, local save/resume and optional clean-room Web Audio effects.

The legal split is intentional: upstream source/rule/board data are GPLv3, while parts of the historical media set have unresolved or problematic provenance. The playable browser build therefore does **not** load the original raster icons, textures, avatars or WAV files. The untouched historical source/archive remains under `reference/` for archaeology.

## Run locally

```bash
npm run dev
```

Then open `http://localhost:8080/`. `npm run build` packages `public/` into
`game/` for deployment to any static web server; `npm start` builds and
serves that packaged output. Any other static HTTP server pointed at
`public/` works too. The build is suitable for static hosting such as
GitHub Pages.

## Tests

```bash
npm run check
```

The suite covers deterministic RNG, start-player ties, compulsory exit on 5, 6→7, barriers, safe squares, capture +20, finish +10, exact finish, three-6 penalties, AI priorities and the historical threat-analysis bug, clean-room audio mapping, UI-copy safeguards, route integrity and complete CPU-only games on 3/4/6/8 boards.

## Privacy/static-hosting behaviour

The playable application performs no network request beyond the site-wide, cookie-free GoatCounter analytics beacon (see the root repository's `AGENTS.md`). The original global-statistics/update HTTP features are intentionally omitted. Save data and the sound preference remain in browser `localStorage` only.

## Archaeology and legal documentation

- `docs/AUDIT.md` — source/license/completeness audit
- `docs/ASSET-AUDIT.md` — original media audit and quarantine findings
- `docs/RULES.md` — rules reconstructed from source
- `docs/AI.md` — original AI and preserved priority-2 bug
- `docs/PARITY.md` — parity matrix
- `docs/PORT-STATUS.md` — production-readiness status
- `docs/WEB-ASSET-POLICY.md` — what is reused, redrawn, synthesized or quarantined
- `reference/` — untouched upstream source tree and original tarball with checksums

## License

The restoration code is distributed under **GPL-3.0-only**, matching the conservative interpretation used for the audited 20181125 package. Historical third-party media retained inside the untouched reference archive must be considered separately; see the asset audit.
