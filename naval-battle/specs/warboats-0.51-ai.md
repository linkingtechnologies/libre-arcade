# Warboats 0.51 AI archaeology

## Provenance

- Project: Warboats
- Release: 0.51-ascii
- Date in changelog: 2009-11-30
- Author: Trevor Chart
- Preserved archive: `reference/warboats-0.51/warboats-0.51-ascii.tar.gz`
- SHA-256: `a6e09b4b291621c47b449810fe49b8880a86277e9135263a4d59e72149dac174`
- Relevant original files: `warboats/AI.c`, `warboats/AI.h`, `warboats/engine.c`, `warboats/engine.h`

## Licence

The source-file headers in both `AI.c` and `engine.c` grant GNU GPL version 2 **or any later version**. The archive also contains the GPLv3 licence text in `license/gpl.txt`. The JavaScript port can therefore be distributed under BattleLab's GPLv3 licence.

## Fleet

Warboats initializes five ships with lengths:

`5, 4, 3, 3, 2`

No no-touching rule is enforced; only out-of-bounds placement and overlap are rejected. Adjacent ships are therefore historically valid and matter to AI behaviour.

## Difficulty map

### Level 1

Randomly selects unknown cells. It stores hit information, but does not use it for targeting because `AIFire()` only enters target mode when `skill > 1`.

### Level 2

Scans hit-but-not-sunk ships from index 4 down to 0, intentionally prioritising the smaller ships. It randomly picks one of the two remembered endpoints and one of four orthogonal directions, retrying until an unknown legal cell is selected.

### Level 3

After a second hit on a ship, `AIStore()` infers whether the two stored endpoints have the same x-coordinate. It then restricts target fire to the two directions matching that orientation.

### Level 4

Keeps the Level 3 target logic and adds a checkerboard/parity filter when no ship is currently being targeted. One of the two diagonal parities is chosen at initialization. Hunt shots landing on the rejected parity are discarded and regenerated.

## Historical stall bug

The faithful port reproduces an edge case in the original source.

Because ships may touch, a shot selected while pursuing ship A can hit adjacent ship B. `AIStore()` records that hit against B. With Level 2 in particular, later hits can replace both remembered endpoints for B so that every orthogonal neighbour of those endpoints is already known or outside the board while B is still afloat elsewhere.

Original `AIFire()` wraps selection in a `do ... while` and has no escape from this state, so it can spin forever. BattleLab cannot allow a benchmark process to hang indefinitely, therefore the faithful JavaScript player uses a large bounded retry guard and raises `HistoricalAiStallError`. The Arena records this as an **AI stall**, not as an ordinary loss or algorithmic fix.

Do not add a fallback random shot to the faithful player. A repaired variant, if added later, must have a different name.

## RNG note

Warboats' `engine.c` wraps C `rand()` in its own `RNG(low, high)` rounding/wrap formula. BattleLab preserves that formula but feeds it from the deterministic BattleLab PRNG. This isolates AI logic from platform-specific libc random sequences while keeping benchmarks reproducible.
