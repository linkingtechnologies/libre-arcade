# UI v0.15 — viewport-fit layout

## Goal

Keep the active game inside the visible browser viewport instead of sizing the historical board from available width and forcing vertical page scrolling.

## Desktop

At widths above 860px the app shell is a `100svh` two-row grid (header + game surface) and the page itself does not scroll.

On short laptop/desktop viewports (<= 760px high):

- the board frame is sized from the available **height**, not just width;
- the board and side panel are centered as one compact composition;
- the duplicate turn badge over the board is removed;
- board explanation chips, theme caption and legend are hidden;
- the event history and local-data maintenance action are hidden from the play surface;
- player cards become one-line/dense while preserving current/warning states;
- dice, Roll, Replay, players and game setup remain available.

A second breakpoint at <= 640px high reduces chrome and padding further.

## Mobile active-game mode

When a match exists, the root gets `.game-active`. On phones the active-game screen becomes:

1. compact header;
2. height-fitted board;
3. compact player grid;
4. fixed primary Roll bar.

Setup, replay card duplication, log and maintenance controls leave the normal flow while playing. They are not removed from the application; the goal is simply to avoid page scrolling during the match.

## Invariants

- no gameplay/core changes;
- board coordinate maps remain unchanged;
- no change to save compatibility;
- no change to deterministic RNG;
- calibration mode remains available via `?debugBoard=1`.
