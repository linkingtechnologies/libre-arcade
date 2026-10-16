# Lan Master — M14 Playability Acceptance / 1.0 RC1

## Result

**PASS — release candidate.**

M14 certifies the M13 web payload with a substantially stronger end-to-end playability gate. No gameplay, graphics, audio, level, transition or UI source was changed for M14.

## What was exercised

### Historical passcodes

- 49/49 level passcodes were entered through the real HTML passcode input.
- Every code launched the intended level (2 through 50).
- The historical `6502` code opened the ending.
- All 49 level passcodes are unique four-digit values.

### Complete campaign

A single browser session started from New Game and traversed:

`Level 1 -> Level 2 -> ... -> Level 50 -> ending -> main menu`

For each level, its independently certified solved witness was copied into the active production board, after which the normal production trace/clear/table/hide/reveal progression advanced the game. This is intentionally different from claiming 50 levels were manually solved: the witness injection is a QA accelerator, while the entire progression and ending state machine are the real application code.

### Real-control solves

Representative levels were also solved without witness injection into the active board. The harness computed the rotations required from the actual scrambled board and then performed every change through the production input path:

- Level 1: 5 player rotations;
- Level 11: 10 player rotations in the tested desktop session;
- Level 25: 44 player rotations;
- Level 50: 95 player rotations.

These cover the early game, the beginning of automatic degradation, a mid/late game board, and the final level.

### Mobile controls

On a touch-emulated 390×844 viewport, Level 11 was solved using the visible on-screen A/B/SEL controls (11 rotations in that independently seeded session). No document overflow or page JavaScript error was observed.

### Settings / language

- EN -> IT switch persisted to the scoped `lanmaster.lang` setting.
- Reset Settings removed that scoped preference and returned the UI to English.

## Non-regression / frozen payload

M14 leaves these byte-for-byte identical to M13:

- `index.html`;
- every file under `src/`;
- every file under `reference/`.

Therefore M14 changes only QA tooling, release metadata and documentation. The 50 levels, RNG, connectivity, timers, automatic rotations, NES rendering, FamiTone-derived audio, transitions and M13 keyboard/focus hardening are frozen.

## Automated regression

All prior M8-M13 suites pass, as do the new M14 static release test and playability gate.

The M14 browser gate uses exact production files assembled in-memory because the managed Chromium policy returns `ERR_BLOCKED_BY_ADMINISTRATOR` for direct `file://` navigation. The harness injects a test-only hook into the in-memory copy of `app.js` so exact fixed ticks and internal state can be inspected. The distributed `src/app.js` contains no such hook.

## RC1 boundary

M14 is suitable as **1.0 RC1**, not yet a claim of universal device certification. Remaining final acceptance:

- physical Android phone;
- physical iPhone;
- real Safari/Firefox/Chromium direct hosted or local-file navigation;
- speaker/headphone listening for music/SFX/DPCM;
- human sustained play/readability/heat/latency check.

The separate M7.2 source + NESASM 3.1 byte-identical native ROM rebuild also remains open as an archaeological reproducibility item.
