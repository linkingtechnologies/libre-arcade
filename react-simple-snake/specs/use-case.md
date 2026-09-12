# UC-ARCADE-SNAKE — Play Snake

## System context

One tab of the **libre-arcade** plugin (tab "Snake", dashboard id `react-simple-snake`). Not a game built for this plugin — a vendored [react-simple-snake](https://github.com/MaelDrapier/react-simple-snake) (MIT) React component, embedded via this plugin's own thin entry point (`app.js`) with no changes to the component's own behavior.

## Goal

Let the operator play a classic Snake game from within CAMILA WorkTable, same as any other libre-arcade game.

## Primary Actor

Anyone with access to the libre-arcade plugin — no special permission required. The game persists its own high score in the browser's own storage (`localStorage["snakeHighScore"]`, set directly by the vendored component); nothing is shared or server-side.

## Preconditions

- User is logged into CAMILA WorkTable with access to the libre-arcade plugin.

## Postconditions — Success

- The Snake board is shown, sized to the tab's own content box (not fullscreen — see `specs/react-simple-snake/design.md`'s "Sizing"), and playable with arrow keys or WASD.
- The high score persists across visits in the browser running the CAMILA session.

## Postconditions — Error / Partial failure

- If any of the vendored ES module files fail to load, the board never mounts and `#app` stays empty — there is no custom error UI, since there is no application logic of ours in the loop to render one (the entry point is a single mount call, not a state machine).

## Main Success Scenario

### Step 1 — Land on the Snake tab

1. User opens the "Snake" tab, or clicks the Snake tile on the Home tab.
2. The vendored component mounts and renders its own board, sized to ~60% of the tab's content box width, with a starting snake and one apple placed on the board.

### Step 2 — Play

1. User presses arrow keys or W/A/S/D to change direction; the snake moves continuously in its current direction on a fixed tick.
2. Eating an apple grows the snake by one segment, increases the score, and speeds the tick up slightly; a new apple appears elsewhere on the board.
3. The snake wraps around the board's edges rather than dying on contact with them — the game only ends if the snake's head touches its own body.
4. On game over, a message shows the final score and the (locally stored) high score; pressing Space restarts.

## Extensions

- **1a.** This game's own UI text ("HIGH-SCORE", "SCORE", "GAME OVER", "Press Space to restart") stays English-only regardless of the CAMILA session's language — see `specs/react-simple-snake/design.md`'s "Other technical notes".
