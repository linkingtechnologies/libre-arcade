# Original gameplay specification

## Presentation

- Fixed logical resolution: **640×480**.
- 2D Cocos2d/Pyglet rendering; there is no 3D engine, track format, or vehicle physics.
- Browser reconstruction uses Canvas 2D at the same logical resolution and scales responsively.

## Board

- 10×10 cells.
- 32×32 tile art with 2 px spacing.
- Six tile types: money, shield, cow, meteorite, rocket, laser.
- Initial board is purely random. Existing matches are not removed automatically.
- Only two orthogonally adjacent cells may be swapped.
- A swap is valid only if the original directional scan sees a match of 3+ through one of the two swapped cells.
- Invalid swaps are reversed and the same turn continues; the timer does not reset.
- After a valid match, matched cells disappear, gravity pulls cells downward, and gaps are filled randomly.
- **There are no automatic cascade scores after refill.**

## Scoring/resources

- Money tile: `$5 × matched-cell count` for each score record.
- Non-money tile: one usable resource of that tile type per scoring event, even if the same tile type generated multiple score records.
- For non-money score records longer than 3, upstream adds an “extra money” record. Due to the original `add_score()` implementation, this bonus is multiplied by 5 again. This quirk is intentionally preserved.

## Assets / actions

| Action | Money cost | Effect |
| --- | ---: | --- |
| Shield | $10 | +15 shield |
| Orbital Cow | $30 | 15–30 damage |
| Meteor Burst | $20 | 10–25 damage |
| Rocket | $10 | 10–15 damage |
| Laser Beam | $5 | 5–10 damage |

Using an action consumes one matching resource and the money cost. Shield repair can raise the internal shield value above 100; only the drawn shield bar is clamped. This upstream quirk is preserved.

## Turns

- Dr X/player 0 moves first.
- Normal game: player 0 is human, player 1 is AI.
- Demo: both players are AI.
- Turn timer uses a discrete `elapsed > 0.2` update. Because `time` starts at 100 and timeout occurs only after decrementing below zero, it takes 101 update ticks: roughly **20.2 seconds** under ideal scheduling.
- A valid match or action resets the consecutive-timeout counter.
- After one timeout, play passes to the other player.
- Two consecutive timeouts trigger a completely new random board before play continues.

## AI 1.0.1

- Searches hand-coded patterns for legal swaps rather than evaluating all successor boards.
- Prioritizes money, then shield, then longer combos.
- Repairs when shield <45 if a shield resource is usable.
- Aggressive attack mode when money >90 or enemy shield <25.
- In normal attack mode it only considers laser and rocket.
- In aggressive mode it may consider laser, rocket, meteorite and cow with hard-coded weights.
- If it cannot find a board move, it simply waits for timeout.
