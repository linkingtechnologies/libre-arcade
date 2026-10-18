# The package's milestones, summarised

The restoration package `turkey-cooking-simulator-complete-rc1.zip` (SHA-256 `5a5883690f19da28af75e302beb97ac7dfcc703b16a8b8fe0b8d640716760d6e`) was built in twelve milestones. It carried, for each, a report, a description of its
"behavioural oracle", a file of recorded test results, "recheck" files that re-ran earlier milestones, and a list of SHA-256 hashes: about 50 files. They said the same things many times over, so they were
**replaced by this page**. The zip is the record of the originals; nothing in them is used by the game or by `npm test`. What was kept from `archaeology/` is `tests/` (the twelve test scripts,
`legacy-reference.js`, `scenarios.js`, `generate-oracle.js` and the recorded `oracle.json`), because `test/package.test.mjs` runs them.

The figures below are the package's own claims, from its own results files, about its own port (the earlier commit). What was found when they were checked is in `../../specs/port-map.md` and `../../PROVENANCE.md`.

| M | What it added | The package's recorded result |
|---|---|---|
| 1 | The thermal core `thermal-model.js` (density 1050, cp 2000, convection 9, conductivity 0.412; skin 0.85 R, body 0.45 R, core 0.01 R; the transient-sphere series, water loss, cook states, the 80-second re-anchoring), checked against `legacy-reference.js`, a hand transcription of the baseline's `model.js`, in 12 scenarios (T01 to T12) | 12/12, tolerance 1e-10 absolute and 1e-11 relative. **Here: stops at T03** (a last-digit difference in a recorded fraction); the original's own `model.js` agrees with the port exactly |
| 2 | `runtime.js`: the one-second scheduler in a "legacy" mode (a tick only if more than 1000 ms passed, which is how the 2013 browser loop stalled) and a fixed-step mode (the one the page uses), the door (closed, peek, open), the probe, the 20-minute skip (1200 ticks), the alarm | 10/10 |
| 3 | `gameplay-state.js`: wallet, the market and its prices, one turkey, stuffing and frills modifiers, Casual and Hardcore (x20), the legacy score with its quirks (core scored with the skin's table), the save format | 12/12 |
| 4 | `game-session.js`: the whole game as a session with no interface (shop, cook, skip, alarm, door, probe, serve), with an action log | 14/14 |
| 5 | Saving and resuming from the thermal state, and a replay of the action log | 12/12 (60/60 cumulative) |
| 6 | The first page: one 960x600 canvas, pointer mapping, no scrolling, save, language and sound controls, drawn placeholders | 12/12 |
| 7 | An adaptive page (landscape 960x600, portrait 600x960, compact landscape), the market in three groups, a kitchen organised around the oven | 14/14 |
| 8 | A procedural kitchen, a day and night cycle from the cook time, an oven glow from the oven temperature, the turkey drawn from the skin's condition, steam, smoke and flames, the oven light (`I`) | 15/15 |
| 9 | Market icons, owned items shown in the kitchen, stuffing and frills drawn on the turkey, synthesized sound cues (buy, probe, door, alarm, save, light, serve, error) | 16/16 |
| 10 | Temperature meters with a 165 F line for the core (informational only), the last probe reading kept, an urgent alarm, a flash on interactions, a serving summary with a grade | 18/18 |
| 11 | A release-candidate audit; one fix: switching language also changes `<html lang>`. Its browser smoke test could not run (the audit environment blocked local navigation) and was left as a manual gate | 18/18 (and 135/135 for M1 to M10 re-run). **Here: not run** (it reads `/mnt/data/...` and builds paths in a POSIX-only way) |
| 12 | Release engineering for `1.0.0-rc1`: version, no runtime dependencies, viewport, focus, language, storage, credits, no original assets, licence files, "manual QA checklist documented", "release status explicit RC1" | 18/18. **Here: 16/18**; R17 and R18 look for text that the package's README no longer has |

## What the package said about itself

- The thermal, runtime, gameplay and session modules were "certified" at M1 to M5 and "unchanged byte for byte" from M8 on. True as far as the package's own files go (`package/game/src/js/`). "Certified" means that they agree with `legacy-reference.js`, a transcription by the same authors. It does not mean that they were compared with the original, which first happened here: the thermal model was exact for the commit the package named (`../../test/package-baseline-oracle.test.mjs`), and the game now follows a later commit (`../../test/model-oracle.test.mjs`).
- The baseline commit `56bcde6` is called "historical". It is from the morning of 1 December 2013; the authors changed the model, the score and the oven door later that day (`../../reference/SOURCE.md`). The milestone reports do not mention this. The game here follows the last commit of that day, so the package's model, score and door were replaced (`CHANGES.md`).
- The release was "RC1 candidate from the automated and core perspective, pending a manual cross-browser smoke". The browser checks made here are in `../../PROVENANCE.md` (headless Chrome only).
- The original's artwork (CC BY-NC) was never used; the dialogue was not ported; the page's pictures are procedural and its sounds synthesized. These claims were checked (`../../test/production.test.mjs`) and hold.
