# Heal'em All: restoration roadmap

Adjusted after the M1 findings. Each milestone ends in something independently testable. **Only M1 is done.**

## M1: source recovery and original execution (done, awaiting review)
Frozen snapshot with checksums; license inventory; original runs in Chrome; baseline traces and screenshots; blockers listed.

## M2: compatibility restoration (next)
Scope, exactly the table in `COMPATIBILITY-ISSUES.md`:
* Create `public/` (arcade contract: `public/index.html` at the root, no build step). Start from `reference/upstream-master/app` minus audio, promo images, `.coffee` (kept in `reference/`).
* **C5 muted start-up** (load without audio and without errors), C4 analytics removed + `ga` stub, C3 fonts localised (after reading each font's license), C1 CSS, C6 sizing/resize, C7 cache-busting, C8/C9 page metadata.
* Keep `game.js` as close to upstream as possible; put new code in a separate `compat.js`.
* `specs/design.md` listing every change and why; `public/CREDITS.md`; `PROVENANCE.md`; `THIRD_PARTY_NOTICES.md`.
* **Gate:** the page loads with zero console errors and zero non-local requests; P1-P3 and P5-P8 still match the M1 baseline. Muted build is clearly marked "audio pending".

Rights: audio is replaced by `replacement-audio/` (decision 2026-11-22; nobody is contacted). M2 must wire the WAVs in (C5), then a person auditions them and swaps any that sound wrong.

## M3: gameplay parity
Implement the test layers in `PARITY-TEST-PLAN.md`: Playwright harness in the game's own `package.json` (dev dependency), P1-P12, recorded input for the six levels, level-completion checks, the zombie-mode controls question, bullet range vs viewport. Output: a parity report that states, per mechanic, whether it was compared by execution.

## M4: Libre Arcade integration
`npm run dev/build/start/test/lint/check` as in the other games; arcade tile; "Play here" link; GoatCounter snippet with the CSP notes from `AGENTS.md` (there is no CSP yet, so nothing to widen) while the Google Analytics removal is already done; EN default, IT when `navigator.language` starts with `it`;
responsive layout and touch; offline via Service Worker (needs C7); credits screen outside the game UI; `STORY.md`; per-game `SOFTWARE_ARCHAEOLOGY.md`.
Localisation touches canvas strings in the original (e.g. "I need the key", level summary labels): done through a string table that leaves layout, timing and meaning intact; its effect on text width must be checked on the HUD info label.

## M5: publication certification
Final rights check (audio resolved or still muted, Madeja confirmation), SHA-256 manifest of `public/`, automated tests and browser E2E green, `SHA256SUMS.txt`, `LICENSE` and notices complete, root README/index updated. **Fail-closed:** if any audio or the artwork confirmation is still open, publish muted/with the declared-license graphics only, or do not publish, per the owner's decision.

## Effort estimate (one developer, realistic)

| Milestone | Estimate |
|---|---|
| M2 | 1-2 days |
| M3 | 2-3 days |
| M4 | 1-2 days (+ translation review) |
| M5 | 0.5-1 day |
| Rights follow-up (emails, searching OpenGameArt/SoundBible/Freesound) | elapsed time dominated by replies; effort ~0.5 day |
| **Total** | **about 5-8 working days**, plus waiting time for the rights questions |

Audio replacement, if the sources are never found, is an extra decision and extra work (not estimated; M1 forbids generating assets).
