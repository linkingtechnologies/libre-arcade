# Software archaeology dossier

## What is archaeological in 🐽’s Goose?

🐽’s Goose is **not a direct port of one historical program**. It is a new browser implementation produced through a software-archaeology workflow. The project preserves and studies three distinct kinds of evidence:

1. **traditional Game of the Goose rules and variants**;
2. **historical board artwork and geometry**;
3. **earlier open-source digital board/race games**, used as behavioural, architecture or UX references only when their legal status permits study but not redistribution/reuse.

The modern JavaScript engine, UI, audio, accessibility layer and Grugnetto-family presentation are newly authored for this repository.

## Preserved historical artwork

### Ganzenbord — Pmathijssen, 2008

Runtime path: `public/assets/boards/original/Ganzenbord_pd.svg`

- Source family: Wikimedia Commons `File:Ganzenbord_pd.svg`.
- Rights: public-domain dedication.
- Published Commons SHA-1: `2324f0f685f17a39771bb4b42617b52dc0b2953f`.
- Bundled SHA-1: `2324f0f685f17a39771bb4b42617b52dc0b2953f`.
- Bundled SHA-256: `483f65d3ebfb456a9f3c3973391c1344d19b3f772386946689c583c8571786c2`.
- The exact artwork is preserved locally; the runtime has no dependency on Commons.
- The final 1–63 overlay is the manually calibrated map in `public/data/board-layouts/ganzenbord-pd.json`.

### Ganzenbordspel — Daan Hoeksema, ca. 1910–1920

Runtime path: `public/assets/boards/original/Ganzenbordspel.jpg`

- Source family: Wikimedia Commons `File:Ganzenbordspel.jpg`.
- Historical artwork: Daan Hoeksema (1879–1935), ca. 1910–1920.
- Rights: public-domain historical artwork / PD-old.
- Bundled representation: 2048×1470 JPEG supplied during the project.
- Full-resolution Commons source documented as 6421×4609.
- Bundled SHA-256: `b3de3ad4694963427bb70567327662641669c7adeb0589964c377d664cee73fc`.
- Its 1–63 overlay is independently calibrated in `public/data/board-layouts/ganzenbordspel.json`; it is not copied from the Ganzenbord geometry.

Detailed provenance is in `reference/ganzenbord-pd/` and `reference/ganzenbordspel/`.

## Rules reconstruction

The implementation records a stable “classic baseline” in `specs/rules.md` rather than presenting every local/historical variant as universally canonical. The important distinction is explicit:

- **historical/traditional baseline**: 63 spaces, two dice, exact finish, geese and the conventional special spaces used by this project;
- **chosen implementation details**: the exact occupied-space behaviour and the precise timing used by the browser engine;
- **modern safety extension**: if every player becomes permanently blocked and no delayed turn can resolve the game, the longest-blocked player is released. This is documented as a Grugnetto’s Goose extension, not passed off as an ancient rule.

This separation is deliberate archaeology: uncertain or variant historical behaviour is documented instead of silently normalized.

## Software references studied

The public package retains an evidence record even when the original archive itself cannot safely be redistributed.

| Reference | What it contributed to study | Current public-package status |
| --- | --- | --- |
| `zaccaro1980/goose-game` | Goose behaviour/parity reference | snapshot identified; GPLv3/ISC metadata conflict; source not bundled |
| `rriesebos/game-of-the-goose` | visual/UX and rule-variant study | archive audited; package says ISC but SVG provenance unresolved; archive not bundled |
| SnakesLadders | turn flow, Human/CPU and dice handling | SourceForge GPLv3 metadata but no licence text in archive; assets unresolved; not bundled |
| LudoX 2.1/2.2 | local-player, AI and state/UI comparison | SourceForge says GPLv2; only/or-later unresolved; not bundled |
| glParchis 20181125 | multiplayer state, UI/statistics and piece-management comparison | GPLv3 strongly evidenced for package/code; asset ledger incomplete; full archive not bundled |
| Tibetan Sho | comparison with another traditional race game | SourceForge GPLv3 metadata; exact source/asset audit incomplete; not bundled |

For exact archive names, pinned snapshot, hashes and evidence, see `reference/manifest.json` and each `reference/*/PROVENANCE.md`.

## Admission policy

A historical artifact enters the distributable `/reference` collection only when the relevant gate is satisfied:

- exact artifact/snapshot identified;
- SHA-256 recorded where the artifact was locally available;
- code licence checked directly where possible;
- licence version (`only` vs `or-later`) resolved when material to compatibility;
- assets audited independently from code;
- third-party media provenance checked;
- redistribution status sufficiently clear.

Project-page metadata alone is treated as discovery evidence, not as permission to relicense an archive. Unclear historical media stay out of the production ZIP.

## Preserved versus reconstructed versus new

### Preserved

- the two admitted historical board artworks;
- their provenance and cryptographic hashes;
- audit/provenance records for all studied software references;
- the final coordinate calibration associated with each bundled board representation.

### Reconstructed from study

- the documented classic rule baseline;
- parity expectations and edge-case behaviour;
- normalized board geometry mapping historical artwork to modern tokens/animation.

### Newly authored

- deterministic JavaScript core and RNG;
- CPU player used by this game;
- responsive UI and bilingual text;
- save/replay system;
- Web Audio synthesis and local PCM WAV fallbacks;
- SVG game icons and pawn presentation;
- colour + symbol + pattern player identity system;
- automated tests and release tooling.

No quarantined historical source archive is compiled into, copied into or required by the runtime.

## Reproducibility

The runtime board images are local and checksum-documented. Gameplay RNG is deterministic and serializable; a save preserves the exact RNG state. Automated tests verify both core behaviour and release constraints. The board calibrator remains available through `?debugBoard=1`, making the mapping from a historical scan to the modern coordinate layer inspectable instead of opaque.

## Repository archaeology map

- `reference/manifest.json` — machine-readable audit/admission matrix.
- `reference/*/PROVENANCE.md` — per-repertory notes.
- `reference/QUARANTINE.md` — the six studied archives kept out of this production package, and why.
- `specs/reference-audit.md` — audit narrative and legal separation rules.
- `specs/archaeology.md` — evidence policy.
- `specs/parity.md` — behavioural parity goals.
- `specs/rules.md` — implemented rule baseline.
- `THIRD_PARTY_NOTICES.md` — redistributed third-party/public-domain material.
- `public/assets/boards/original/SHA256SUMS.txt` — checksums of admitted board files.

That separation is the core preservation rule of the project: **the evidence survives without being confused with the reconstruction**.
