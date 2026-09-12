# Milestone 3 — front-end flow, banners, hi-scores and trace parity

## Implemented

- Historical front-end state order from `main.c` / `title.c`:
  - warning screen;
  - title screen;
  - controls screen on the first run only;
  - game;
  - credits after final completion;
  - hi-score screen;
  - return to title.
- Title animation timing from `title.c` is preserved as timing/state, while the art is a clean procedural reconstruction.
- Five-banner cycle from `banner.c`:
  - starts from historical banner slot 5;
  - first display after the strict `> 6 seconds` threshold;
  - interference for 60 ticks;
  - steady display for 60 ticks;
  - vertical collapse phase;
  - hidden after the strict `> 2.5 seconds` threshold.
- Banner images themselves are **not** copied from `dkbk.dat`; five clean procedural banner motifs are used instead.
- Historical hi-score rules from `hiscore.c`:
  - ten rows;
  - initial `David A. Capello / 100` entries;
  - strict `score > existing score` insertion;
  - 22 printable characters maximum for a name;
  - insertion point name editing with Enter/Backspace.
- Browser persistence uses localStorage as an explicit platform adaptation.
- Final-completion flow now shows credits before the hi-score table, matching `main.c`.
- Runtime rendering order now keeps late particles before player bubble/HUD rendering, closer to `main.c`.

## Trace parity

`test/fixtures/c-source-derived-level1-trace.json` records deterministic level-1 snapshots at selected historical timing boundaries. The trace is anchored to the preserved C source and covers:

- initial immediate spawn;
- the 600 ms movement cadence;
- spawn-frequency accumulation;
- donkey grid positions;
- banner 6-second trigger;
- banner interference/steady/collapse boundaries.

This is a **source-derived trace oracle**, not yet an executable-to-executable comparison. A native Allegro 4 build is not part of this workspace, so binary trace capture remains a later archaeology task.

## Intentional browser adaptations

- Escape on the title screen cannot reliably close a browser tab. The port records the exit request and shows a short browser-specific note instead.
- Header buttons and touch controls are accessibility/platform additions.
- The historical title sound and all original banner/title bitmaps remain unused because the clean runtime must not depend on the quarantined `dkbk.dat` media set.
- Text is available in Italian and English while the original was English-only.
