# Changelog

## 1.0.0 (2026-11-22)

- Restored Irisa (commit `4dada41`) for Libre Arcade: upstream's game modules
  as native ES modules, Vue 2 and the webpack bundle dropped.
- New: title, pause, restart, mute, English and Italian, touch pad, swipe,
  responsive layout, end screen.
- Fixed: R and the level dots no longer leak old timers or the freeze counter
  into the new level; sound plays outside Chrome; a key released while the
  window was unfocused no longer stays "held".
- Tests: oracle against upstream's `store.js`, exhaustive solvability of the
  20 levels, headless Chrome session. Full list in `specs/design.md`.
