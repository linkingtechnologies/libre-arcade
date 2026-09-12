# UC-ARCADE-HTML5SNAKE — Play Snake Arcade

## System context

One tab of the **libre-arcade** plugin (tab "Snake Arcade", dashboard id `html5-snake`). Not a game built for this plugin — a vendored [html5-snake](https://github.com/JDStraughan/html5-snake) (MIT) canvas game, embedded with the small local modifications listed in `specs/html5-snake/design.md` (a dead IE-polyfill `<script>` removed, its own CSS scoped under `#app`, and a small local `size.js` script sizing the canvas to the viewport).

## Goal

Let the operator play a classic wall-collision Snake game from within CAMILA WorkTable — deliberately distinct from the other Snake tile (react-simple-snake), which wraps around the board's edges instead of ending the run on wall contact.

## Primary Actor

Anyone with access to the libre-arcade plugin — no special permission required. This game keeps no persisted state at all (no high score, no `localStorage`); nothing is shared or server-side.

## Preconditions

- User is logged into CAMILA WorkTable with access to the libre-arcade plugin.

## Postconditions — Success

- A game board sized to ~80% of the browser viewport (4:3, grid-aligned) is shown, centered via a fullscreen takeover — see `specs/html5-snake/design.md`'s "Why fullscreen...".

## Postconditions — Error / Partial failure

- If `game.js` fails to load, the canvas stays blank — there is no custom error UI, since there is no application logic of ours in the loop beyond sizing the canvas (`size.js`) before `game.js` itself runs.

## Main Success Scenario

### Step 1 — Land on the Snake Classic tab

1. User opens the "Snake Classic" tab, or clicks its tile on the Home tab.
2. The game board renders immediately with the starting snake already moving.

### Step 2 — Play

1. User presses arrow keys, WASD, or HJKL (vim-style) to change direction; the snake moves continuously on a fixed tick that speeds up as the score rises.
2. Eating food grows the snake by one segment and increases the score, shown live on the board itself.
3. Touching any wall, or the snake's own body, ends the run immediately — no wrap-around.
4. On game over, a message is shown on the board; pressing Enter or Space starts a new run.

## Extensions

- **1a.** This game shows no text of its own beyond the live score number — no title, instructions, or credits render on-page (see `specs/html5-snake/design.md`'s "What's NOT carried over"); "how to play" only needs documenting here, in this spec.
