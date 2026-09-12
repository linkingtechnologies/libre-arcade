# AGENTS.md

## Project principles

1. Preserve historical source artifacts unchanged under `/reference`.
2. Never edit files inside `/reference`; derive ports into `/src/players`.
3. Keep game rules in `/src/core`, independent of UI and AI.
4. Every historical AI must implement the common `nextShot(state)` adapter.
5. Determinism is mandatory for tests and Arena. All randomness must come from an injected PRNG.
6. A faithful historical port must document source file, source version, relevant function names, intentional quirks, and any unavoidable semantic differences.
7. Fixes or strengthened algorithms must be separate players; never fold them silently into a faithful port.
8. Browser target: HTML5 + ECMAScript modules, no frameworks, no backend required for local play or Arena.
9. Documentation and code comments are English.
10. Third-party licensing must be recorded before upstream code is copied into the port.
11. GPL-2.0-only historical source may be preserved and studied under `/reference`, but must not be copied or line-by-line translated into BattleLab's GPL-3.0-only `/src` tree.
