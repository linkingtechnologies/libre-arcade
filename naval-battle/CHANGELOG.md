# Changelog

## 1.0.0 — 2026-09-11

First production release of **🐽’s Naval Battle**.

- renamed the player-facing game from 🐽’s Battleship to 🐽’s Naval Battle;
- simplified Italian/English player-facing copy;
- retained five friendly difficulty names: Easy, Normal, Hard, Expert, Classic;
- removed technical AI names and seed details from gameplay screens;
- eliminated page scrolling in the tested desktop/mobile game views;
- retained deterministic historical AI/Arena behaviour behind the player UI;
- kept automatic recovery from the rare historical Warboats targeting stall;
- added a Playwright UI smoke/regression test for desktop and mobile layouts;
- preserved original archaeology material under `/reference` and technical notes under `/specs`.

Validation matrix for the release candidate:

- core/AI test suite: pass;
- UI smoke: 1365×768, 390×844, 360×640: pass;
- replay/new-game/language flow: pass;
- 200-game OS4-vs-random Arena: pass;
- 100-game-per-pair Warboats round robin: pass.

Gnome Batalla Naval is retained only in `specs/candidates.md` as a rejected GPLv3-port candidate. Its placeholder reference folders, adapter stub, alternate fleet profile and source-map notes were removed from the production release.
