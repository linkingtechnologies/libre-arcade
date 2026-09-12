# Grugnetto’s Klondike

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/klondike/public/index.html)**

## Licensing

Project-authored integration code is released under `GPL-3.0-or-later`.
Preserved and derived third-party material keeps its original MIT or CC0-1.0
license. Exact file-level ownership and licensing are declared in
[`REUSE.toml`](REUSE.toml); complete license texts are in [`LICENSES/`](LICENSES/),
and provenance is documented in [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

Copyright © 2026 Umberto Bresciani.

“Grugnetto”, “Grugnetto’s Klondike”, and the associated logos and character
identity are trademarks of Umberto Bresciani. Trademark rights are separate
from the GPL software license; see [`TRADEMARKS.md`](TRADEMARKS.md).

## English

A playable bilingual restoration built from two inactive MIT-licensed projects:

- `rjanjic/js-solitaire` supplies the historical Klondike engine and card sprite;
- `ShootMe/MinimalKlondike` supplies the solver architecture used to test random deals generated at runtime;
- Grugnetto’s Klondike integrates them with a Web Worker, responsive table, undo, hints, autosave, timer and local statistics.
- Modern optional conveniences include verified auto-completion, synthesized sounds, reduced-motion support and abandon-game confirmation. They are kept outside the preserved historical engine.

The untouched source snapshots live in `reference/`. Exact commits, ownership and the boundary between preserved, ported and new code are documented in [`PROVENANCE.md`](PROVENANCE.md) and [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

### Verification

- `npm test` — regression, executable-original oracle and cross-engine tests;
- `npm run certify` — focused engine and solver certification;
- `npm run certify:random` — deterministic sample of 100 draw-one and 100 draw-three deals. A deal is certified only after its complete solution wins in both the JS solver model and the restored historical engine.

The solver is bounded: `unknown` means “not solved within this limit”, never “impossible”.

### Building the public game

The browser-ready standalone game is kept in [`public/`](public/).
It uses native ES modules, so that directory is source-controlled and does not
need a separate bundling step or any particular hosting platform: any web
server that serves static files (nginx, Apache, `python3 -m http.server`,
GitHub Pages, a CDN, …) is enough.

```sh
npm ci
npm run build
```

`npm run build` only packages `public/` into `game/`; there is nothing to
compile. Do not edit `game/`: make changes in `public/` and rebuild.
Opening `index.html` directly with a `file://` URL is unsupported because the
game uses ES modules and a Web Worker; serve it through an HTTP server —
`npm run dev` starts a dependency-free static server on `http://localhost:8080/`
for local use, and `npm start` does the same against the packaged `game/`.

## Italiano

Un restauro bilingue e giocabile costruito a partire da due progetti MIT non più sviluppati:

- `rjanjic/js-solitaire` fornisce il motore storico di Klondike e lo sprite delle carte;
- `ShootMe/MinimalKlondike` fornisce l’architettura del solver usata per verificare distribuzioni casuali generate durante l’esecuzione;
- Grugnetto’s Klondike li integra con Web Worker, tavolo responsive, annulla, suggerimenti, salvataggio automatico, cronometro e statistiche locali.
- Le comodità moderne opzionali comprendono completamento automatico verificato, suoni sintetizzati, rispetto della riduzione del movimento e conferma di abbandono. Restano separate dal motore storico conservato.

I sorgenti originali non modificati sono in `reference/`. Commit esatti, titolarità e separazione fra codice conservato, convertito e nuovo sono documentati in [`PROVENANCE.md`](PROVENANCE.md) e [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

### Verifica

- `npm test` — regressioni, oracolo sull’originale eseguito e prove incrociate fra motori;
- `npm run certify` — certificazione mirata di motore e solver;
- `npm run certify:random` — campione deterministico di 100 partite pesca uno e 100 pesca tre. Una partita viene certificata soltanto se la soluzione completa vince sia nel modello JS del solver sia nel motore storico restaurato.

Il solver è limitato: `unknown` significa “non risolta entro questo limite”, mai “impossibile”.
