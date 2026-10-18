# docs/development/

The notes of the restoration package this game started from, and the list of what was changed in its JavaScript.

- `MILESTONES.md` summarises the package's twelve milestones in one page. The package's ~50 per-milestone files (reports, behavioural-oracle descriptions, recorded results, recheck outputs and hash lists) were replaced by it; the zip (SHA-256 in that page) is the record of the originals.
- `package/` holds what is left of the package, otherwise **unmodified**: its `README.md`; `archaeology/tests/` (its test scripts `m1.test.js` to `m12.test.js` with `legacy-reference.js`, `scenarios.js`, `generate-oracle.js` and the recorded `oracle.json`); and `game/` (its `README.md`, `HOW_TO_PLAY.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, `package.json`, `SHA256SUMS`, `docs/PRESERVATION_NOTES.md` and its `reference/`). Its page and modules, `game/src/`, are kept here as they came (the port of the original's earlier commit `56bcde6`); `../../public/` started from them and has changed (`CHANGES.md`).
- The package's own notes (its README, `game/docs/PRESERVATION_NOTES.md`, and the milestone reports summarised in `MILESTONES.md`) use its milestone labels and old paths (`src/...`), and some of what they say is not what was found: that the baseline is "historical"
  and the port "faithful" without saying that the authors replaced the thermal model and the score later on the same day (`../../reference/SOURCE.md`); that the milestone
  tests pass (M1 and M12 do not, on the package's own files: `../../specs/port-map.md`); that its `reference/original/README.md` is the original README (it is an edited copy). They are kept as history,
  not as a description of this folder.
- `CHANGES.md` lists the files of the package's page that were changed here (to follow the original's last commit of the day, and to add the units), with their hashes before and after.
- `../../test/package.test.mjs` runs the package's test scripts, unmodified, against the package's own `game/src/` in a rebuilt copy of its layout; the outcomes it expects are
  explained at the top of that file. `../../test/package-baseline-oracle.test.mjs` runs the package's `thermal-model.js` against the original's `model.js` of the commit the package followed.

The facts of this integration are in `../../PROVENANCE.md`, `../../specs/port-map.md` and `../../CHANGELOG.md`.
