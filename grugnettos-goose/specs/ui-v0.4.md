# UI / feel specification — v0.4

v0.4 keeps the v0.3 spiral board and deterministic gameplay core unchanged while adding a presentation timeline driven only by core events.

## Animation contract

The UI reads the event stream returned by `Game.rollCurrent()` and never decides gameplay outcomes.

- `DICE_ROLLED`: animate the two dice, then settle on the core-provided faces.
- `TOKEN_MOVED`: animate one board space at a time, including the exact visual path through square 63 during a bounce.
- `GOOSE_TRIGGERED`: highlight the Goose, then continue from that Goose using the following movement event.
- `BRIDGE_TRIGGERED`: jump visually from 6 to 12.
- `MAZE_TRIGGERED`: jump visually to 39.
- `DEATH_TRIGGERED`: return visually to Start.
- delay/block events: give short penalty feedback.
- `PLAYER_WON`: highlight the finish and board.

Animations never alter `GameState`, dice values, destinations or turn order.

## Reduced motion

The setup panel exposes **Reduced motion / Animazioni ridotte**. When active, movement and dice transitions are effectively instantaneous while state changes and game messages remain identical. The preference is stored locally and system `prefers-reduced-motion` is used as the initial default when no explicit preference exists.

## Audio

All v0.4 effects are synthesized at runtime with the Web Audio API. No audio files are bundled.

Effects cover:

- dice;
- individual movement steps;
- Goose;
- Bridge;
- penalties;
- Death;
- swaps;
- victory.

Audio can be disabled from the setup panel and the preference is stored locally.
