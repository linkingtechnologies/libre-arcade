# docs/development/

The notes of the restoration package this game started from, and the list of what was changed in its JavaScript.

- `package/` holds everything of the package that is not the page and its modules, **unmodified**: its readme, changelog, version note,
  licence and third-party notices, its reports for milestones M13 to M16 and its production checklist, its release metadata
  (`release.json`), its 11 test runners and the results they printed (`tests/`), the 50 solved boards that its tests use (`tests/witnesses/`), its three browser
  tools in Python (`tools/`) and its reference material (`reference/`: the compressed pictures, the character sheet, the levels as JSON and the
  notes of the author). `SHA256SUMS.txt` there names every file with its hash. The page and its modules (`index.html`, `src/`) are the ones in
  `../../public/`, changed where `CHANGES.md` says.
- The notes use the package's own milestone labels and old paths (`src/...`), and some of them say things that the comparison with the original
  has since shown to be untrue: that its behaviour is certified (the comparison with the ROM found two things wrong in the rules, and
  many in the order in which the page does things within a frame, `../../specs/port-map.md`), that the transitions are the original's
  (they were right in their sequence and wrong in some of the frame counts), and that a file is "byte-identical" from one milestone to the next (the three tests that
  pin those bytes fail now, on purpose). They are kept as history, not as a description of this folder. What was checked in this repository is what
  `../../PROVENANCE.md` says.
- `CHANGES.md` lists the files of the package's page and modules that were changed here, with their hashes before and after, and what changed in each.
- `../../test/package.test.mjs` runs the package's test runners, unmodified, against `../../public/`: it puts the package's layout together in a temporary
  directory (the package's files from `package/`, the page and its modules from `public/`, the author's ROM from `../../reference/`) and runs them there. Five
  of the 11 still pass; the six that do not are listed at the top of that file, each with the line it stops at and the reason.

The three tools in Python and the milestone reports mention a browser run on a managed machine and are not repeated here: `../../PROVENANCE.md` says how the page was driven in a real browser for this integration.

The facts of this integration are in `../../PROVENANCE.md`, `../../specs/port-map.md` and `../../CHANGELOG.md`.
