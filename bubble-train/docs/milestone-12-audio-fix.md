# Milestone 12 — browser audio reliability fix

## Problem

Manual testing of the M11 clean RC reported no audible music or sound effects. Two concrete issues were identified:

1. procedural music was attenuated both by the music bus and by each voice envelope, yielding an extremely low effective output level;
2. Web Audio unlock was attempted only once on the first pointer event, so a rejected/suspended context could leave all later cues silent.

## Fix

- Raised the procedural music bus to a normal audible mix level.
- Increased SFX envelopes moderately.
- Audio unlock now retries on pointer, touch and keyboard interaction.
- `cue()` queues effects while the context is unavailable/suspended and flushes them once the context reaches `running`.
- Starting a game explicitly requests audio unlock.
- Sound Off still immediately mutes music and effects and clears pending cues.

## Validation

Two regression tests use a fake suspended `AudioContext`:

- queued effects survive suspension and play after unlock;
- gameplay music schedules voices with a non-muted bus level.

Full suite: **66/66 passing**.
Full release gate: PASS, including historical hashes, asset checks, 61-level soak test and HTTP smoke.

A final manual audible check remains required because automated tests cannot physically verify the user's speakers/output device.
