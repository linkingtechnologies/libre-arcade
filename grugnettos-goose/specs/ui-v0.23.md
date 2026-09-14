# UI v0.23 — tactile audio and victory feedback

## Goal

Make turns feel physical without introducing third-party audiovisual assets or changing deterministic gameplay.

## Dice

- Web Audio only;
- fixed multi-hit clatter synchronized with the dice roll animation;
- no gameplay RNG is consumed by sound generation.

## Pawn movement

- one short synthesized step/landing cue for each crossed square;
- four-pitch cycle avoids repetitive metronome character;
- pitch cycling is audio-only state and cannot affect the seeded game.

## Victory

Normal-motion presentation lasts roughly 1.8 seconds and combines:

- deterministic CSS confetti over the board;
- glow around square 63;
- a visual clone of the winning pawn performing three short jumps over the finish square;
- the existing live-event winner banner, enlarged for the final event;
- synthesized win chime.

With reduced motion enabled, confetti and jumping are suppressed and square 63 receives a temporary static highlight instead.

No image, sound sample or animation library is required.
