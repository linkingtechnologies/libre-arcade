# Themed event decks

The playable board (v1.4, mechanically identical to v1.3) has two independent eight-card decks. Each deck is shuffled once with the game's seeded RNG. Cards are then drawn sequentially, so each card appears exactly once in every eight draws from that deck before the sequence cycles.

This means a specific card has a 12.5% share of its own deck cycle. It does **not** mean it has a 12.5% chance per turn: a player must first land on a matching event space.

## Board frequency

A 2,000,000-turn movement simulation (500 deterministic runs × 4,000 turns) with the v1.1–v1.3 movement effects produced:

- Adventure spaces: about **5.83%** of resolved landings;
- Setback spaces: about **5.99%**;
- either event deck: about **11.82%**.

These figures are empirical board-traffic estimates, not hard-coded chances.

## Adventures

| ID | Effect |
|---|---|
| a1 | +45 coins |
| a2 | travel forward to the next Portal and resolve it |
| a3 | +20 coins, then move forward 1 and resolve |
| a4 | add one free Embellishment to an eligible owned Place in a completed world; if impossible, +20 coins |
| a5 | travel forward to the Grand Portal and resolve it |
| a6 | +6 coins per owned Place |
| a7 | +55 coins |
| a8 | travel forward to Grugnetto's Home, without the pass-start salary |

## Setbacks

| ID | Effect |
|---|---|
| i1 | -40 coins |
| i2 | -6 coins per owned Place; if none, -15 |
| i3 | move back 3 spaces and resolve |
| i4 | go to Base Camp |
| i5 | -20 coins, then travel forward to the next Portal and resolve |
| i6 | -8 coins per owned Embellishment; if none, -15 |
| i7 | travel forward to Picnic Spot and resolve it |
| i8 | lose one owned Embellishment; if none, -25 coins |

## Determinism

Target selection for grant/loss effects is deterministic. A free Embellishment prefers the least-developed eligible Place, then the strongest revenue gain adjusted by landing weight. Embellishment damage prefers the most-developed Place, then higher build cost. No extra unseeded randomness is introduced.

The event mechanics contain no localized prose. Each locale config stores the player-facing card copy as `events.<id>.title` and `events.<id>.text`. Card IDs remain the stable join between mechanics and presentation.

## v1.4 copy refresh

Board package v1.4 keeps every field in this document unchanged (mechanics, effects, board frequency) and only revises the sixteen cards' `text` in all four languages, adding explicit crossover references to Grugnetto Go worlds, creatures and collectibles (e.g. the frogs at Frog Pond, the Portal's flag, the apple waiting at the Picnic Spot) on top of the existing world-flavor copy. Titles are unchanged from v1.3.
