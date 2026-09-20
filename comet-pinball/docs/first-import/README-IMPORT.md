# Comet Pinball — first repository import

Copy `public/comet-pinball/` into the statically hosted public area and `projects/comet-pinball/` into the source and archaeology area. Only the `public/` directory should be served by GitHub Pages. The source tree includes reproducible physics tests and historical evidence; it is not part of the public game's runtime.

This is the first public commit. `projects/comet-pinball/CHANGELOG.md` has a single initial-publication entry, not a local development timeline. The public game is bilingual: English is selected by default, an Italian browser selects Italian, and the in-game EN/IT switch saves an explicit preference when storage is available.

The original shaded JAR is **not included**. Its bundled third-party resources and font atlases are not all cleared for redistribution. Keep that binary out of the public repository; its upstream location and SHA-256 are recorded in `projects/comet-pinball/reference/releases/README.md` and `JAR-LICENSE-REVIEW.md`. The 22 remaining frozen historical files are preserved without rewriting.

Run `python3 projects/comet-pinball/tools/verify-public.py` to check that runtime files match across both trees. Run `for test in tests/*.js; do node "$test" || exit 1; done` from `projects/comet-pinball/`. The UI browser gates also require Playwright and Chromium. The historical full-game differential, specific launch-lane entry/overlap cases, real-device acceptance and the binary's redistribution rights remain separate open matters. Do not label this import a certified 1.0.
