# Production checklist

## Runtime

- [x] Plain HTML5 + JavaScript modules; no framework.
- [x] No backend or build step required.
- [x] No external assets, analytics, cookies or network API calls.
- [x] Restrictive self-only CSP and no-referrer policy.
- [x] Local SVG favicon and page metadata.
- [x] Web Audio starts only after user interaction.
- [x] Audio preference, language and high scores persist locally.

## UX

- [x] Italian and English UI dictionaries have matching structure.
- [x] Dedicated How to play dialog.
- [x] Keyboard gameplay controls.
- [x] Touch gameplay controls.
- [x] Intro/credits screens advance by touch as well as keyboard.
- [x] Mobile virtual keyboard works for high-score names.
- [x] Pause/resume and post-game flow are reachable without a keyboard.
- [x] Player-facing menus avoid archaeology/implementation jargon.

## Responsive/accessibility

- [x] Fixed viewport shell prevents document vertical scrolling.
- [x] Canvas dynamically fits available space at 4:3.
- [x] Phone portrait/landscape, tablet and desktop viewport checks passed.
- [x] Visible keyboard focus states.
- [x] Focusable canvas with accessible label/help text.
- [x] Screen-state announcements through an aria-live region.
- [x] Dialogs use native `<dialog>` focus handling.

## Preservation/legal

- [x] Historical source-code and textual reference files are preserved unchanged under `/reference/dkbk`; quarantined binary media/screenshots are omitted from the public package.
- [x] Historical code is GPL-2.0-or-later and GPLv3-compatible.
- [x] Runtime does not load `dkbk.dat`.
- [x] Repo-safe archive omits quarantined historical binary/media package.
- [x] Replacement graphics/audio are clearly documented as reconstructions.
- [x] Original archive SHA-256 remains documented.

## QA

- [x] 34 deterministic Node tests pass.
- [x] Six-level end-to-end progression test passes.
- [x] Source-derived level-1 trace passes.
- [x] JavaScript syntax checks pass.
- [x] Runtime source contains no `dkbk.dat` reference.
- [x] Representative viewport layout checks pass without document scroll.

## Remaining research item, not a production blocker

- [ ] Build and instrument the Allegro 4 reference executable on a suitable external environment for executable-to-executable trace comparison.
