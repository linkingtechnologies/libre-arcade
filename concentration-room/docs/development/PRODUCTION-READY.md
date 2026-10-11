# Production-ready checklist

## Player experience

- [x] Main title launches all four historical modes.
- [x] Difficulty selection available for Solitaire, 2 Players and Vs CPU.
- [x] Story starts directly as in 0.02.
- [x] English and Italian player UI.
- [x] Help/Guida available without leaving the page.
- [x] Credits/legal available without cluttering the title screen.
- [x] Libre Arcade and GPL links are clickable.
- [x] Mouse/touch and historical two-pad keyboard controls available.
- [x] Shared-device Continue button available for 2P handoff.
- [x] Audio toggle explicit and off until a user gesture.
- [x] Game pauses while Help/Credits are open.
- [x] No debug/hash/oracle/development-history labels in player-facing UI.

## Responsive / accessibility

- [x] No vertical page scrolling.
- [x] Native 256×240 canvas scales to the largest viewport fit.
- [x] Integer scaling preferred at 2× and above for crisp pixel art.
- [x] Fractional fit allowed below 2× for small screens.
- [x] Narrow- and short-screen toolbar compaction.
- [x] Help/Credits use internal scrolling when necessary.
- [x] Visible `:focus-visible` outline.
- [x] Localized ARIA labels.
- [x] Modal background UI inert while Help/Credits are open.

## Local data

- [x] Only language and difficulty persisted.
- [x] Invalid stored preferences fall back safely.
- [x] Difficulty clamped to historical 0–4 range.
- [x] Reset removes preferences and restores defaults.
- [x] No score/story/game state persisted.

## Preservation / legal

- [x] Original 0.02 ZIP preserved unchanged under `/reference`.
- [x] Original archive and ROM SHA-256 documented.
- [x] GPL-3.0-or-later license preserved.
- [x] Original authors/graphics credits preserved.
- [x] Third-party/upstream notices present.
- [x] No AI-generated artwork.
- [x] Historical and browser-adaptation layers distinguished in docs.

## QA

- [x] Behavioral oracle tests pass.
- [x] State-machine tests pass.
- [x] AI/story tests pass.
- [x] Story-presentation tests pass.
- [x] Historical-audio tests pass.
- [x] Title/menu tests pass.
- [x] Visual-parity tests pass.
- [x] Final-parity tests pass.
- [x] Production-ready tests pass.
- [x] JavaScript parses with Node syntax checks.
- [x] Local HTTP server serves application and core assets.
- [ ] Automated Chromium screenshot certification is not claimed in this runtime because the installed headless Chromium does not terminate reliably during capture.

## Verdict

**Commit-ready**, subject to a final human browser playthrough on the target Libre Arcade deployment environment.
