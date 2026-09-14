# UI v0.24 — audible Web Audio + scrollable setup

## Audio reliability

- Unlock Web Audio on the first pointer or keyboard gesture, in addition to explicit roll/toggle unlocks.
- Resume every non-running AudioContext state rather than assuming only `suspended` needs attention.
- Route synthesized cues through a master gain node.
- Increase dice clatter and pawn-step levels so they remain clearly audible on laptop/mobile speakers.
- Enabling Audio plays a short confirmation cue.
- Audio synthesis remains independent from the seeded gameplay RNG.

## Setup scrolling

The page remains viewport-locked during desktop play. When the setup card grows, its content scrolls internally instead of increasing document height. The New Game / Continue actions are sticky at the bottom of that internal scroll region.
