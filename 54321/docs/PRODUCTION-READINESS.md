# Production readiness — release candidate

Scope: the five games publicly advertised by 54321 v1.0.2001.11.16.

## Release gate

- [x] Flip-Flop 2D/3D/4D
- [x] Bomb Squad 2D/3D/4D
- [x] Maze Runner 2D/3D/4D
- [x] Peg Jumper 2D/3D/4D
- [x] Tile Slider 2D/3D/4D
- [x] Easy / Medium / Hard behavior covered by parity tests
- [x] Wrap on/off covered by model tests
- [x] Maze generation always connected; Hard remains a perfect maze
- [x] Peg board payloads checked against all 18 historical `.peg` files
- [x] Runtime original PNGs checked byte-for-byte against `/reference`
- [x] Responsive shell uses a fixed logical canvas and avoids intentional document scrolling
- [x] Touch adaptations for interactions that relied on right-click
- [x] English/Italian UI and help
- [x] Optional dimensional aid for all five games in 3D/4D; disabled by default and non-solving
- [x] Source-generated movement sound reconstructed with Web Audio; user-toggleable
- [x] No framework, build service or backend dependency
- [x] `/reference` remains immutable
- [x] `npm test`: 58/58 passing
- [x] `node --check src/ui/app.js` and model modules pass syntax checking

## Browser QA note

The project is standard static HTML/CSS/ES modules/Canvas/Web Audio. Automated model and asset checks run locally. The execution environment used to prepare this milestone applies an organization policy that blocks Chromium from opening both localhost and `file:` URLs, so a real Chromium screenshot/click-through could not be completed here. Before publishing, perform a final manual smoke pass on the actual hosting URL in Chrome/Edge, Firefox and mobile Safari/Chrome.

Suggested five-minute smoke pass:

1. Open each game and start a new game in 2D, 3D and 4D.
2. Toggle Easy/Medium/Hard and Wrap.
3. In every game, enter 3D/4D and enable “Dimensional help”; confirm blue local and gold higher-dimensional relations appear, with dashed outlines on Wrap crossings.
4. In Bomb Squad verify the aid never reveals bomb contents, then verify Reveal/Flag on touch or responsive emulation.
5. In Peg Jumper select a peg and confirm the aid distinguishes the jumped peg from the green landing cell.
6. In Tile Slider verify dimensional legal-slide highlights and the solved-position preview.
7. Change language IT/EN and reload; preference should persist when storage is enabled.
8. Resize/orient the page and confirm there is no page-level vertical scrollbar.

## Not blockers for the advertised-game release

- The original bitmap font is intentionally not used because its precise Blue Vinyl source/license is unresolved.
- The original scripted `.hlp` presentation is represented by browser help text rather than recreated screen-for-screen.
- The 2001 main menu is replaced by a compact browser game selector.
- The hidden `Life` easter egg is preserved in `/reference` but its exact secret activation flow is not exposed in the production selector.

## Legal status

Technical readiness does not change the licensing conclusion. The original custom copyleft terms are preserved and documented; repository-wide GPLv3 compatibility remains unasserted. Do not replace this status with a blanket GPL-3.0 notice without resolving that question first.

- [x] Player-facing string audit: browser title, ARIA labels, help and outcome overlays localized EN/IT

## Final repository packaging check

- [x] Detailed archaeology dossier included under `docs/archaeology/`.
- [x] `.gitignore` included; historical archives under `/reference` are intentionally not ignored.
- [x] Extracted 2001 reference tree byte-identical to the previous preservation milestone.
- [x] Exact uploaded archive SHA-256 verified: `dc47644f5bdd67cf44d03349b5c599f5caa3132a6dacd0838c2d78a7d20d1110`.
- [x] Archive checksum manifests use repository-relative paths.
- [x] No `TODO`/`FIXME` markers outside the preserved historical tree.
- [x] Local resources referenced by `public/index.html` exist.
- [x] Restructured into the Libre Arcade collection's `public/` → `game/` layout; `npm run check` re-verified green after the move (58/58 tests, syntax, lint).
