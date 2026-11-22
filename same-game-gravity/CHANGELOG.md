# Changelog

## 1.1.0 (2026-11-22): restoration for Libre Arcade

Version number kept from the original ("1.1"), patch level for the restoration.

- Source: upstream commit `8fc4b57`, preserved in `reference/`.
- Removed: jQuery 1.5.2 and plugins, jPlayer, Modernizr, md5, Google Analytics, remote scores, Twitter sharing, app-store links, "update your browser" page.
- Replaced: mp3/ogg sounds (no known author) with CC0 wav files; `keys.png` with localised text.
- Fixed: clicks beside the board froze the game; the score screen crashed after Continue in a new session.
- Added: pause, mute, EN/IT/FR with auto-detection, touch (pointer events), responsive layout, `?seed=` reproducible boards, storage fallback.
- Tests: oracle against the original code, unit tests, asset and i18n checks.
