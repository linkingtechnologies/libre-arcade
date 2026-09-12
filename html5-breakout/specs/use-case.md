# UC-ARCADE-BREAKOUT — Play Breakout

## System context

One tab of the **libre-arcade** plugin (tab "Breakout", dashboard id `html5-breakout`). Not a game built for this plugin — a vendored [html5-breakout](https://github.com/toivjon/html5-breakout) (MIT, archived) canvas game, embedded with the local modifications listed in `specs/html5-breakout/design.md` (its own CSS scoped under `#app`, a local `scale.js` fitting the canvas to the viewport after the game's own sizing runs, and — unlike every other game in this plugin — a small, additive edit to `game.js` itself, adding a "GAME OVER" screen and a way back to the welcome scene; see that spec's own "Local modifications" for why this one exception was made).

## Goal

Let the operator play the classic Breakout brick-smashing game, solo or with a second player taking turns, from within CAMILA WorkTable.

## Primary Actor

Anyone with access to the libre-arcade plugin — no special permission required. This game keeps no persisted state across sessions (no `localStorage`); the on-screen high score resets on reload.

## Preconditions

- User is logged into CAMILA WorkTable with access to the libre-arcade plugin.

## Postconditions — Success

- A game board sized to ~90% of the browser viewport (aspect ratio determined by the game's own sizing — see `specs/html5-breakout/design.md`) is shown, centered via a fullscreen takeover.

## Postconditions — Error / Partial failure

- If `game.js` fails to execute, the canvas stays blank — there is no custom error UI, since there is no application logic of ours in the loop beyond fitting the canvas to the viewport after the game itself has sized it.

## Main Success Scenario

### Step 1 — Land on the Breakout tab

1. User opens the "Breakout" tab, or clicks its tile on the Home tab.
2. The welcome scene renders on the canvas: title and a one/two-player selection prompt (press 1 or 2).

### Step 2 — Choose player count

1. User presses "1" or "2" to select the number of players.
2. Gameplay begins immediately in the court scene.

### Step 3 — Play

1. User presses the left/right arrow keys to move the paddle, spacebar to launch the ball — same controls upstream always used (`KEY_LEFT`/`KEY_RIGHT`/`KEY_SPACEBAR` in `game.js`), unmodified here.
2. Each player has three balls per game; a round ends when the ball reaches the bottom of the screen or the last brick is destroyed.
3. Brick color determines points (yellow, green, orange, red); the ball speeds up after the first hit on an orange brick, again after the first on a red one, and again after several paddle/wall hits.
4. In two-player mode, players alternate rounds; the active player's score blinks when points are scored, and the active-player indicator blinks when turns change.
5. The game ends once every player has lost all three balls, followed by an ending animation: the paddle stretches to the full court width and the ball keeps bouncing without breaking bricks.

### Step 4 — Game over

1. A "GAME OVER" message and a "Press [enter] to return to the menu" prompt appear over the ending animation — local addition, not upstream (see `specs/html5-breakout/design.md`).
2. Pressing Enter returns to the welcome scene (Step 1), ready to start a new game — also a local addition; upstream had no way back short of reloading the page.

## Extensions

- **1a.** This game shows no HTML text of its own beyond the canvas — no title, instructions, or credits render as page chrome; "how to play" only needs documenting here, in this spec.
- **2a.** Two-player mode is turn-based, not simultaneous — upstream's own design, not a limitation introduced by this integration.
- **3a.** Upstream also implements a hidden extra level (see `game.js` comment lines 347–353 in the vendored file) — left exactly as upstream built it, not documented further here since it's an easter egg, not a primary flow.
