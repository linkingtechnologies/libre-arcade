# Grugnetto’s Goose — classic rules baseline (v0.3)

This file records the rules currently implemented by the playable core. Historical variants remain subject to the archaeology audit; changes must be explicit rather than silently replacing this baseline.

## Board and dice

- Start is logical position 0.
- The classic path contains 63 spaces.
- Two six-sided dice are used.
- The player must reach space 63 exactly.
- An overshoot bounces backwards from 63 by the excess.

## Special opening roll

On a player's first roll only:

- 3 + 6 (in either order) sends the player to 26;
- 4 + 5 (in either order) sends the player to 53.

## Special spaces

- Geese: 5, 9, 14, 18, 23, 27, 32, 36, 41, 45, 50, 54, 59. Repeat the same movement; effects may chain.
- Bridge: 6 → 12.
- Inn: 19. Miss the next two turns.
- Well: 31. Remain blocked until another player lands there and replaces the prisoner.
- Maze: 42 → 39.
- Prison: 52. Remain blocked until another player lands there and replaces the prisoner.
- Death: 58 → Start.

## Occupied spaces

On an ordinary resting space, landing on another player swaps that player's position with the mover's turn origin.

For Well and Prison, the incoming player replaces and releases the currently blocked player.

## Deadlock safety extension

If every player is blocked and no delayed turn can resolve the situation, the player who has been blocked longest is released. This is a Grugnetto’s Goose safety extension and must not be presented as an undocumented historical rule.
