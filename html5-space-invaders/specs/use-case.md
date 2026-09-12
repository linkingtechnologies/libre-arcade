# UC-ARCADE-SPACEINVADERS — Play Space Invaders

## System context

One tab of the **libre-arcade** plugin (tab "Space Invaders", dashboard id `html5-space-invaders`). Not a game built for this plugin — a vendored [html5-space-invaders](https://github.com/toivjon/html5-space-invaders) (MIT, archived) canvas game, embedded with the local modifications listed in `specs/html5-space-invaders/design.md` (its own CSS scoped under `#app`, a local `scale.js` sizing the canvas to the viewport, a local `bootstrap.js` replacing upstream's own inline starter, and a print-time-only rewrite of one sprite-sheet path — `game.js` itself is byte-for-byte unmodified on disk).

## Goal

Let the operator play the classic Space Invaders arcade game, solo or with a second player taking turns, from within CAMILA WorkTable.

## Primary Actor

Anyone with access to the libre-arcade plugin — no special permission required. This game keeps no persisted state across sessions (no `localStorage`); the on-screen high score resets on reload.

## Preconditions

- User is logged into CAMILA WorkTable with access to the libre-arcade plugin.

## Postconditions — Success

- A game board sized to ~90% of the browser viewport (native 672:768 aspect ratio preserved) is shown, centered via a fullscreen takeover — see `specs/html5-space-invaders/design.md`'s "Why fullscreen".

## Postconditions — Error / Partial failure

- If `game.js` fails to execute, the canvas stays blank — there is no custom error UI, since there is no application logic of ours in the loop beyond sizing the canvas and starting the game.

## Main Success Scenario

### Step 1 — Land on the Space Invaders tab

1. User opens the "Space Invaders" tab, or clicks its tile on the Home tab.
2. The welcome scene renders on the canvas: title, score/hi-score, and a one/two-player selection prompt.

### Step 2 — Choose player count

1. User selects one or two players (on-canvas prompt).
2. A "prepare to play" scene shows briefly for the active player, then gameplay begins.

### Step 3 — Play

1. User presses the arrow keys to move the ship left/right, spacebar to shoot, Enter to confirm menu choices — same controls upstream always used (`game.KEY_LEFT`/`KEY_RIGHT`/`KEY_SPACEBAR`/`KEY_ENTER` in `game.js`), unmodified here.
2. Aliens advance and fire back (rolling, plunger, and squiggly shot patterns); a flying saucer periodically crosses the top of the board for bonus points.
3. Four destructible shields provide cover; each takes damage pixel-by-pixel where hit.
4. Losing all three lives ends that player's turn; in two-player mode, play passes to the other player if they still have lives left.
5. Game ends once every player has lost all their lives; pressing Enter on the game-over screen returns to the welcome scene.

## Extensions

- **1a.** This game shows no HTML text of its own beyond the canvas — no title, instructions, or credits render as page chrome (see `specs/html5-space-invaders/design.md`'s "Other technical notes"); "how to play" only needs documenting here, in this spec.
- **2a.** Two-player mode is turn-based, not simultaneous — upstream's own design, not a limitation introduced by this integration.
