# Disk Field M6 — production checklist

## Automated gates

- [x] Historical oracle: 7/7 cases pass.
- [x] Vector field oracle: 85/85 samples pass.
- [x] Discrete collision / black-hole / completion events match oracle cases.
- [x] 17/17 levels stable for up to 1,200 ticks under stress input.
- [x] 17/17 levels construct with finite goal coordinates.
- [x] 17/17 levels expose a valid goal completion predicate.
- [x] Selector preview does not simulate disk motion.
- [x] `Dodge!` preview is randomized like the original selector.
- [x] Deterministic `?seed=` remains available for QA.
- [x] Unlock chain reaches all 17 levels and cannot regress.
- [x] Corrupt progress values are clamped safely.
- [x] Corrupt language values safely fall back to IT/EN.
- [x] Missing/closed/failing Web Audio cannot stop gameplay.
- [x] Public tree contains no quarantined historical audio/font files or references.
- [x] `engine.mjs` and `levels.mjs` hashes remain pinned to the validated M3 baseline.
- [x] Preserved 1.0 and 1.01 ZIP hashes remain unchanged.
- [x] JavaScript modules pass Node syntax/runtime regression tests.

## Browser/UX hardening

- [x] Fixed 30 Hz simulation remains independent of render cadence.
- [x] Hidden tab pauses active gameplay.
- [x] Held input is cleared on blur/visibility loss.
- [x] Touch controls use pointer capture and coarse-pointer sizing.
- [x] iOS-style safe-area insets are accounted for.
- [x] Short landscape viewport gets compact controls.
- [x] IT/EN accessibility labels update with language.
- [x] Pause, sound, and music toggles expose `aria-pressed`.
- [x] Sounds and music persist independently.
- [x] Complete procedural replacement sound set is wired to UI/collision/hole/completion events.
- [x] Main Canvas typography uses code-generated arcade glyphs; no font file is bundled.
- [x] Browser zoom is not disabled by viewport metadata.
- [x] End screen auto-dismisses after the historical ~5 seconds.

## Solvability/release acceptance

- [x] Permanent canonical replay proof reaches `world.finished === true` for all 17 levels; replay corpus and validator are included in the test suite.

## Manual acceptance before final release

- [ ] Human play-through of levels 1–17 on desktop keyboard.
- [ ] Human play-through / spot-check on a real touch phone or tablet.
- [ ] Check short landscape orientation on physical mobile hardware.
- [ ] Confirm browser audio unlock behavior after first gesture on Safari/iOS and Chrome/Android.
- [ ] Inspect final deployment URL for caching/path mistakes.

The unchecked items are acceptance tests, not known defects.
