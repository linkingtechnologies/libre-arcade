# Verification and its limits

## Executed automated checks

1. `npm test`: Node's built-in test runner exercises 10 original gameplay groups plus 3 sound groups: 15 historical
   rule/oracle scenarios (with four documented UI/state corrections), a
   24-square dead end, a 100-square completion, 15 independent mathematical
   witness paths, move legality, repeat restart and menu-state continuity.
2. `python3 test/browser_smoke.py`: headless Chromium + Playwright, with the
   *unchanged page, CSS and JS source contents* assembled into an inline test
   document. Checks six viewports (1280×800, 375×667, 320×568, 320×480,
   740×360, 800×320), EN/IT selection and switching, overflow, real touch
   emulation on a mobile viewport, pointer and keyboard controls, dialog,
   menu continuity, first-move Undo, complete 100-step path and 24-step
   dead-end through the DOM, sound opt-in/out with a deterministic Web Audio double,
   IT/EN credit links, cleaned menu copy, first-play help and manual reopening. This mocks oscillator creation,
   not actual speaker playback.
3. `python3 test/http_smoke.py`: real local HTTP file serving, correct bytes
   and response status for index, stylesheet, each separately served JS ES
   module (including sound), license and source notices, plus directory index and missing file.
4. `sha256sum -c SHA256SUMS.txt`: byte-for-byte integrity of preserved upstream
   archives. `node --check` validates all four JavaScript source modules.

## Important environment limitation

This test environment's Chromium blocks navigations to `file://` and local
HTTP endpoints with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. The inline browser
UI test therefore cannot independently establish that Chromium will import
individual ES modules *over a real HTTP navigation* even though the HTTP
assets are served correctly and the game module works in Node. The tests are
complementary, not a claim of a successful full browser+HTTP end-to-end run.

**Before publishing**, open the static-hosted `public/` (in the Libre Arcade
collection: `100-square-challenge/public/`) URL in a normal browser and confirm first render, one valid move, Undo, New
game, EN/IT and a smartphone view and the mute/unmute button (including actual speaker output).
Browser verification here mocks audio scheduling, not device sound. No source files need to be changed unless
that host-specific smoke check reveals a real issue.

A Playwright mobile viewport is emulation, not testing on a physical phone.
Historical original-JAR oracle comparisons were performed in the separate
archaeological audit; the browser adaptation did not alter or rerun the Java binaries.

## First-play instructions check

The first Play opens the EN/IT How to play dialog. Dismissing it writes only
`libre-arcade.100-square-challenge.intro-seen.v1=1` into localStorage; no game
state, analytics, user identifier or audio preference are stored. The same
in-page menu -> Play path must not re-open help. The header help button always
opens the regular help dialog. With storage disabled, the help is shown on a
future page visit, but the game remains playable. A fresh browser profile or
clear-site-data operation restores the first-play dialog. The persistence test
uses a deterministic localStorage double because this environment blocks browser
navigation to HTTP origins; it does not certify browser storage on the published
website.
