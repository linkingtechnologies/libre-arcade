# docs/development/

The notes of the restoration package this game started from, and the list of what was changed in its JavaScript.

- `package/` holds everything of the package that is not the page and its modules, **unmodified**: its readme, version note, licence
  and third-party notices (`README.md`, `VERSION.txt`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, `package.json`), its reports and test
  results for milestones M9 to M32 (`docs/`), its test fixtures (`fixtures/`), its 24 test runners (`tests/`), its one tool (`tools/`) and
  its metadata-only reference (`reference/`). The page and its modules (`index.html`, `src/`, `web/`, `data/`) are the ones in
  `../../public/`, changed where `CHANGES.md` says.
- The notes use the package's own milestone labels and old paths (`src/...`, `web/...`), and some of them say things that the comparison
  with the original has since shown to be untrue: that the deterministic core is "frozen" and "certified" (it needed four corrections of the rules, and the page one of the seeds;
  `../../specs/port-map.md` lists them), that it is "byte-identical" from one milestone to the next (the six tests that pin those bytes
  fail now, on purpose), and that the player's stages start from the seed 1 (the original never reseeds). They are kept as history, not
  as a description of this folder. Several of them (M11, M12) describe a comparison with the ROM made with a tracer that is not part of
  the package, and whose traces are not either: what was checked in this repository is what `../../PROVENANCE.md` says.
- `CHANGES.md` lists the files of the package's page and modules that were changed here, with their hashes before and after, and what
  changed in each.
- `../../test/package.test.mjs` runs the package's 24 test runners, unmodified, against `../../public/`: it puts the package's layout
  together in a temporary directory (the package's files from `package/`, the page and its modules from `public/`) and runs them there.
  Thirteen cases are expected to fail, for reasons given at the top of that file.

The facts of this integration are in `../../PROVENANCE.md`, `../../specs/port-map.md` and `../../CHANGELOG.md`.
