# Historical references

`/reference` is the archaeology index for 🐽’s Goose. It is intentionally **not an indiscriminate dump** of every historical archive examined during research.

Originals are preserved locally during investigation, but this production repository redistributes a historical artifact only after code licence **and** asset provenance/redistribution status are sufficiently clear. For references that remain quarantined, this directory keeps the artifact identity, hash when available, evidence, observed role and admission decision.

The machine-readable matrix is `manifest.json`; `QUARANTINE.md` lists the six studied archives kept out of this production package and why.

## Software-reference status

| Reference | Direct artifact examined | Licence evidence | Asset evidence | Original archive bundled? |
| --- | --- | --- | --- | --- |
| `goose-game` | pinned repository snapshot identified | conflicting GPLv3 / ISC signals | minimal | no |
| `game-of-the-goose` | yes | package metadata says ISC | SVG provenance unresolved | no |
| SnakesLadders | yes | SourceForge says GPLv3; archive carries no licence text | BMP/WAV/ICO unresolved | no |
| LudoX 2.1/2.2 | yes | SourceForge says GPLv2; only/or-later unresolved | PNG provenance unresolved | no |
| glParchis 20181125 | yes | GPLv3 directly evidenced | complete per-asset ledger not closed | no |
| Tibetan Sho | public release/docs identified | SourceForge says GPLv3 | exact source/asset audit pending | no |

The original filenames and SHA-256 values for locally examined archives are retained in `manifest.json`, allowing a local copy to be matched without redistributing it here.

## Admitted historical artwork

Two historical artworks *are* redistributed because their status is sufficiently clear and they are used by the runtime:

- `public/assets/boards/original/Ganzenbord_pd.svg` — Pmathijssen, 2008, public-domain dedication; exact Commons file checksum-verified;
- `public/assets/boards/original/Ganzenbordspel.jpg` — Daan Hoeksema, ca. 1910–1920, public-domain historical artwork; bundled 2048×1470 representation documented separately from the full-resolution Commons source.

Their provenance records live in `ganzenbord-pd/` and `ganzenbordspel/`. Checksums are also recorded in `manifest.json`, `THIRD_PARTY_NOTICES.md` and `public/assets/boards/original/SHA256SUMS.txt`.

## Rule

Reference material may be valuable for behavioural comparison, parity testing, architecture study or historical context **without** granting permission to copy code or assets. The new implementation therefore lives separately under `public/src` and `public/data`.
