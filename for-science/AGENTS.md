# AGENTS.md

## Mission

Preserve **For Science!** faithfully before improving it. This is a
software-archaeology project, not a redesign.

## Hard rules

- Never edit files under `/reference`.
- Treat 1.0.1 as the primary parity baseline and PyWeek final2 as the historical
  comparison baseline.
- Keep browser code framework-free and client-side.
- Use Canvas 2D unless a verified original behavior genuinely requires something
  else.
- Keep original asset licenses intact; never claim the whole repository is GPL-only.
- Preserve upstream quirks when they affect observable gameplay. If fixing one
  later, gate it behind a clearly named non-parity mode or document the deliberate
  divergence.
- Do not strengthen the original AI inside `public/src/ai/original-ai.js`; add
  any modern AI as a separate player/module.
- Add a regression test before changing scoring, matching, costs, damage, timeout,
  shuffle or AI decisions.

## Current known upstream quirks to preserve

- duplicate score records from directional match scanning;
- bonus-money double multiplication for long non-money matches;
- shield value may exceed 100 internally;
- refill does not auto-score cascades;
- AI may wait for timeout when it cannot find one of its hard-coded move patterns;
- the turn clock is discrete and times out after the original 101 `>0.2s` ticks,
  not an idealized continuous 20-second timer;
- attack impact jitter must consume RNG even though it does not affect damage.

## Parity guardrails

- Keep `public/assets/original` byte-identical to
  `reference/postcompo-1.0.1/game/data`; transformations belong in rendering code,
  never in copied asset files.
- Preserve Python `int()` then `//` semantics in pointer hit testing;
  browser-friendly enlarged hit boxes are not parity.
- Reset the board-click gate only after a rendered game frame, matching upstream
  `clicked` handling.
- Keep meteor side/flip selection and the explosion early-kill behavior covered by
  `visual-parity.test.js`.
- Regenerate `test/fixtures/python27-oracle.json` only through
  `tools/regenerate-python27-oracle.py`; never derive oracle fixtures from the
  JavaScript implementation under test.
- Do not claim executable visual parity until the untouched Python 2.7/Cocos
  baseline has actually been run and captured. Use `specs/visual-parity.md` for
  that future protocol.

## Production guardrails

- Keep production-only UX changes outside the game-rule core whenever possible.
- The How to Play screen is browser reconstruction derived from upstream
  documentation; do not treat it as an original 2013 menu.
- Menus must remain inert until mandatory visual assets are ready.
- Web Storage is optional; failure to access it must never prevent startup.
- Audio failures should degrade individual sounds rather than fail the game.
- Keep fullscreen UI synchronized with the browser's real fullscreen state.
- Localization is a browser-shell feature: preserve English as the historical fallback, keep Italian strings in the i18n table, and never alter `/reference` for translation.
- `npm run check` must pass before packaging a release.
