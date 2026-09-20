# Changelog

## Unreleased

- Joined the Libre Arcade collection. The delivered package carried the runtime twice, in `projects/comet-pinball/` and in `public/comet-pinball/`, kept in step by `tools/verify-public.py`. After checking that every runtime and legal file was byte-identical between the two, they were merged into the single `public/` copy required by the collection layout. `tools/verify-public.py` and the delivered `PUBLIC-SHA256.txt` were removed as redundant; the two archive-level import notes were kept under `docs/first-import/`.
- Repointed the Node tests, the Node tools and the two Python browser gates at `public/` (path changes only). `tests/credits-libre-arcade-license.js` and `tests/i18n.js` no longer compare a source copy with a public copy; the first now checks that the legal notices in `public/` match the project root. The 38 Node tests pass. The Python gates were not re-run (they need Playwright and Chromium).
- Added `package.json` (`dev`, `build`, `start`, `test`, `lint`, `check`; CommonJS, no `"type": "module"`), `scripts/serve.mjs` (with an `audio/mpeg` type for the MP3), `scripts/build.mjs`, an ESLint config, `.claude/` and `/game/` in `.gitignore`, the GoatCounter snippet in `public/index.html` and a "Play here" link in `README.md`.
- Fixed four lint findings in tests and tools without changing behavior: a needless regex escape, an unused variable in two tests and unused destructured fields in one tool. The engine files `public/js/physics.js` and `public/data/playfield.js` were not touched (an ESLint override records why).
- Added `PROVENANCE.md`, `specs/port-map.md`, `SOFTWARE_ARCHAEOLOGY.md`, `STORY.md` and `AGENTS.md`. Checked upstream directly: the `LICENSE` is Apache-2.0 ("Copyright 2012 Comet Engineering, Patrick Haring & Christian Bürgi"), the frozen commit exists and the GitHub repository is archived. Confirmed that the music is byte-identical to the Mechanical Night Pinball loop.
- `NOTICE` (project root and `public/`) no longer names the old `projects/comet-pinball/` path. `README.md` and `TESTING.md` describe the new layout.
- `MANIFEST-SHA256.txt` regenerated for the new layout. The delivered manifest also listed the 13 PNGs under `reports/browser-generated/`, which the delivered `.gitignore` excludes (the browser gates recreate them), so a fresh checkout could never have matched it; the regenerated manifest lists only tracked files. Added one screenshot folder, `screenshots/`, for the arcade index.

## Initial release

- First public version of Comet Pinball HTML5, with English and Italian interface options.
