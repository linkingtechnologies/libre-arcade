# Provenance

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Simulation, level data, rules | Disk Field by Jeremy Appleyard ("Tigga"), PyWeek 5 (2007) | Post-contest `1.01` (25 Sep 2007). `1.0` is the contest submission and is compared, not ported | Custom informal grant in the package README (quoted below); not an SPDX license | Ported to JavaScript in `public/js/engine.mjs` (byte-pinned) and `public/js/levels.mjs` (generated from the original level module by `tools/export_levels.py`); see `specs/port-map.md` |
| Selected original Python modules | same source | same release | same custom grant | Bundled in `tools/oracle_compat/v1.01/lib/` as the executable oracle. Not byte-identical to the archive, see "The bundled Python is adapted" below |
| Source diff 1.0 → 1.01 and the original READMEs / change log | same source | both releases | same custom grant | `archaeology/stratigraphy/stratigraphy-v1.0-v1.01.patch` and `archaeology/upstream-text/`, kept as research records |
| Font `MAKISUPA.TTF`, music `tradeyourkid.ogg`, five WAV samples, three `thud*.ogg` sounds, two icons | same source (bundled third-party or unattributed assets) | same release | Restricted or unverified per file, see `archaeology/inventories/asset-license-audit.csv` | **Not redistributed**, not present in this repository, not referenced by `public/`. Replaced by procedural Canvas lettering and synthesized Web Audio |
| Menu, selector, options, credits, touch controls, IT/EN strings, progress storage, audio, arcade lettering | this repository | — | GPL-3.0-or-later | New reconstruction work |

## The license, and what kind of evidence we have

The upstream package has no `LICENSE` or `COPYING` file. Its README (both
1.0 and 1.01) ends with:

> Do whatever you like. Would like it if you gave me some sort of credit.

The two READMEs are preserved verbatim in `archaeology/upstream-text/`. That
is the evidence for the grant: the author's own package text, copied out of
the archive by whoever prepared this dossier. It is **not** an SPDX license,
so nothing here relabels the historical code as GPL. The port's own new code
is GPL-3.0-or-later (this collection's choice), and the historical excerpts
keep the upstream grant. The credit wording reads as a request rather than a
condition; the game and its documentation credit the author regardless.

There is no "or later" question to check, because the upstream grant is not
a copyleft license.

What was **not** re-verified when this game was integrated into the
collection: the two archive SHA-256 values in `reference/upstream-index.csv`
and `archaeology/inventories/manifest.json` (the archives themselves are
private and were not re-downloaded), and the PyWeek results, ratings and
timeline quoted in `archaeology/reports/2026-09-17-original-audit.md`. The
in-repo hashes are internally consistent (see the next section), which is a
weaker statement than an independent download check.

## The bundled Python is adapted

`tools/oracle_compat/v1.01/lib/` holds seven original modules
(`DfArrow`, `DfConstants`, `DfDisk`, `DfLevelData`, `DfObjects`, `DfVector`,
`DfWorld`). Comparing them against the per-file SHA-256 values in
`archaeology/inventories/manifest.json` during integration showed:

- **Five are the original bytes with LF line endings.** `DfArrow`,
  `DfConstants`, `DfDisk`, `DfVector` and `DfWorld` hash to exactly the
  manifest's v1.01 values once every LF is converted back to CRLF.
- **Two carry small further differences.** `DfLevelData.py` and
  `DfObjects.py` are 6 and 1 bytes longer than the originals after the same
  CRLF restoration, so they are not merely re-lined. `tools/export_levels.py`
  describes this source as "minimally adapted". The exact edits cannot be
  itemized from this repository; doing so needs a diff against the private
  `DiskField v1.01.zip`.

Both facts matter for reading the oracle results: the oracle runs these
modules under current Python and NumPy with headless stubs (`tools/oracle_compat/stubs/`),
not under the 2007 interpreter and libraries.

## Baseline and snapshots

The archaeological baseline is **1.01**. Physics, constants, level data and
core object mechanics are byte-identical between 1.0 and 1.01 (all sixteen
files under the original `data/` are too), so 1.0 and 1.01 differ only in
compatibility, rendering and performance code. Eight earlier PyWeek
snapshots (`v0.2b` to `v0.8b`) and two Windows binaries are indexed in
`reference/upstream-index.csv` but were **never fetched or hashed**; nothing
here claims them as recovered.

## What was not ported, and why

- **Historical font, music, samples, icons**: see the table above. The
  license notice shipped with `MAKISUPA.TTF` requires written permission
  before it is included in redistributed software or collections, and no
  permission is on record. The music, five samples and three thud sounds have
  no redistribution terms in the package.
- **Fossil code paths** (crumble walls, disk blades, shrink/grow, power-up
  colors, `WallGenerator`): never reachable from the 17 active levels in the
  original, so not revived. Listed in `archaeology/reports/2026-09-17-original-audit.md`.
- **Python's Mersenne Twister sequence for level 7 (`Dodge!`)**: the port keeps
  the same distribution (ten `random()` draws at construction) but not the
  bit-for-bit sequence. The oracle compares the seeded level instance
  instead.
- **Fixed-function OpenGL rendering and the desktop `Quit game` entry**: the
  browser renders with Canvas 2D, and the fourth menu slot is `Credits`.
- **The 2009 browser/Flash successor** by the same author: a later game, not
  part of this port. No source for it was found.
- **`DfMain`, `DfSplash`, `DfSoundManager`** (menus, selector, audio): not
  part of the executable oracle. The behavior was reimplemented from reading
  them, with the selector's preview semantics checked by `tests/m2-static-checks.mjs`.

## Open acceptance items

Automated gates pass; these do not have automated coverage and remain manual
(`docs/PRODUCTION_CHECKLIST.md`): a human play-through of all 17 levels,
touch and short-landscape checks on real hardware, audio unlock on
Safari/iOS and Chrome/Android, and a check of the deployed URL.
