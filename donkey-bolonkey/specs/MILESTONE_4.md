# Milestone 4 — clean audio and six-level end-to-end parity

## Completed

- Added a Web Audio replacement layer with no bundled audio files.
- Preserved the historical **sound event semantics**: title cue, looping crusher motor during a run, bubble exchange, donkey scream after a valid hand, crusher impact, red STOP alarm, and the level-change crazy alarm.
- Replacement timbres are deliberately new synthesis and are **not** claimed as audio parity.
- Added an audio on/off control persisted in localStorage.
- Fixed a source-parity bug: `reset_level()` in C calls `init_donkeys()`, so death-donkey animations are now cleared when a level changes.
- Preserved the C program's internal final transition to level 7: `++player->level` occurs before `reset_level(7)` fails and sets FINAL.
- Added an end-to-end state test that traverses counters from levels 1 through 6 and reaches the historical final state.
- Added monotonically increasing gameplay event ids so browser audio can consume each event exactly once, including input events between simulation ticks.

## Native build attempt

The environment has GCC but does not have Allegro 4 headers/libraries (`allegro.h`, `allegro-config`, or a pkg-config entry). Debian still publishes Allegro 4 development packages, so a native comparison remains feasible on a machine where dependencies can be installed. No executable-to-executable trace is claimed in this milestone.

Suggested external build path:

```sh
sudo apt install build-essential liballegro4-dev
cd reference/dkbk
make -f makefile.uni
```

The historical makefile may need small compatibility adjustments for a modern compiler/Allegro 4.4 installation; such build-only changes must stay outside the preserved `/reference` copy.

## Preservation boundary

Preserved: event locations/timing decisions and game-state behavior derived from the C source.

Reconstructed: every audible waveform, browser audio unlocking, volume mix, and audio preference storage.
