# Milestone 3 — game flow, persistence and responsive UI

## Scope

Milestone 3 turns the M2 mechanics engine into a complete browser **game-flow shell** while keeping historical audiovisual assets and historical level layouts out of the runnable port.

Implemented:

- ordered `.gms` campaign progression;
- same-level retry after a loss;
- finite credits and `-1` infinite credits;
- cumulative completed-level timing;
- pause-aware level timer in original tenths-of-a-second units;
- fastest-times ordering by highest completed level, then lowest cumulative time;
- browser persistence for settings and fastest times;
- responsive IT/EN interface;
- keyboard, pointer and touch controls;
- clean-room synthesized Web Audio feedback;
- three new clean-room demonstration levels loaded from `.lvl` files.

The runnable demonstration campaign is **not** a reconstruction of the 61 historical layouts. Those remain preserved/quarantined under `/reference` and documented in the audit.

## Credits semantics

The source-derived parity rule is treated as attempts remaining:

- `-1`: infinite retry;
- values greater than 1: retry is available and consumes one credit when selected;
- value 1: a loss ends the run.

A retry reloads the same campaign entry. A successful level advances to the next `.gms` entry and adds that completed level's elapsed time to the cumulative run time.

## Timer

`LevelTimer` uses a wall-clock millisecond input but stores/exposes `Math.trunc(elapsedMs / 100)`, matching the original 1/10-second unit. Pause duration is removed from elapsed time.

Failed-attempt time is not added to the completed-level cumulative time. This follows the source-derived game-flow specification; native runtime comparison remains required before final parity certification.

## Fastest times

The original logical ranking is preserved:

1. higher completed-level count ranks first;
2. for equal progress, lower cumulative time ranks first.

The historical `bubbletrain.hsc` representation is **not copied**. The browser uses a new JSON structure in `localStorage` under `bubble-train.fastest-times.v1`. This is a platform mapping, not an attempt to claim binary persistence parity.

## Settings

Browser settings persist under `bubble-train.settings.v1`:

- language: English / Italian;
- credits: 3, 5, 10 or infinite;
- synthesized clean-room sound on/off.

Changing credits affects the next new run, not an already-running campaign.

## Audio

No historical WAV/OGG files are used. `CleanAudio` synthesizes short oscillator/envelope cues for fire, match, bomb, level transition, win and loss. It intentionally has no dependency on quarantined sound assets.

## Clean-room demonstration campaign

`demo/clean-room-game.gms` references three new levels under `demo/levels/`.

They exist to exercise game flow and controls and are intentionally simple, newly authored layouts. They are not copies, traces or transformations of the historical Bubble Train level designs.

## Automated coverage

Milestone 3 freezes at **51 passing tests**. New M3 coverage includes:

- pause-aware timer;
- campaign ordering;
- cumulative timing;
- finite and infinite credits;
- retry behavior;
- deterministic but distinct retry streams;
- fastest-time ordering and persistence;
- settings persistence;
- terminal-run insertion into ranking;
- loading all clean-room campaign data;
- IT/EN translation availability;
- dependency-free synthesized-audio fallback.

## Browser verification

The local static server was verified to serve the M3 HTML, module entry point and clean level XML successfully. A Chromium headless screenshot attempt was not usable in this container because the installed Chromium process did not terminate correctly in the headless environment; this is an environment limitation, not counted as browser parity evidence.

## Still not parity-certified

- native executable differential captures;
- exact original menu visual/layout parity;
- historical 61-level content (quarantined);
- historical themes/art/fonts/audio (quarantined);
- original `bubbletrain.hsc` byte format;
- final accessibility/device matrix and long-session playtesting.
