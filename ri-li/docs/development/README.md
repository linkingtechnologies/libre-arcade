# docs/development/

The notes of the restoration package this game started from, and the list of what was changed in its JavaScript.

- `package/` holds everything of the package that is not the page and its modules, **unmodified**: its readme, changelog, licence (`COPYING`) and third-party
  notices, its documents (`docs/`: the archaeology, validation and playthrough notes), its reports of the playthrough of the 50 levels (`reports/`), its 12 test
  scripts (`test/`: parity with a trace of the original, rendering of all levels, assets, soak, progression, campaign and the playthrough, with the 50 routes in
  `playthrough_solutions.json` and the golden files; `tests/`: smoke, audio, preferences, publication shell and renderer) and its reference material (`reference/`: the
  original's `levels.dat`, the original's tracker music and WAV effects, and a note on the source). `SHA256SUMS.txt` there names every file of the package with its hash;
  the page and its modules (`index.html`, `styles.css`, `src/`, `data/`, `ui/`, `assets/`, `audio/`) are the ones in `../../public/`, changed where `CHANGES.md` says.
- The notes use the package's own milestone labels and some of them say things that the comparison with the original has since shown to be untrue or too strong:
  that the page is "certified" because a list of keys, one for each level, collects 1,042 of 1,042 wagons (it is a run of the page and not of the original, and 14 of the 50 lists
  no longer hold when the page's arithmetic is the original's), that the core agrees with the original in 16,265 comparisons (they are one level for ten seconds), and that the
  graphics are the original's (the sprites are, byte for byte; the table of scores, the options screen and the language menu were not drawn as the original draws them). They are kept as
  history, not as a description of this folder. What was checked in this repository is what `../../PROVENANCE.md` says.
- `CHANGES.md` lists the files of the package's page that were changed here, with their hashes before and after, and what changed in each.
- `../../test/package.test.mjs` runs the package's 12 test scripts, unmodified, against `../../public/` in a temporary copy of the package's layout: eight still pass, and the four that do not are
  listed at the top of that file, each with the line it stops at and the reason.

The facts of this integration are in `../../PROVENANCE.md`, `../../specs/port-map.md` and `../../CHANGELOG.md`.
