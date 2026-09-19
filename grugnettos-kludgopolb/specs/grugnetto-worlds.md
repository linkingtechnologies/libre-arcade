# Grugnetto Go! world integration

Version 0.3 replaces the provisional generic board theme with the four worlds from the user-supplied current Grugnetto Go! sources.

| ID | Italiano | English | Board sites |
| --- | --- | --- | ---: |
| world1 | Prato di Casa | Home Meadow | 4 |
| world2 | Bosco degli Scoiattoli | Squirrel Forest | 4 |
| world3 | Dune Dorate | Golden Dunes | 4 |
| world4 | Miniera di Pietra | Stone Mine | 4 |

The board keeps 32 spaces, but the property economy is now organized around these four worlds rather than abstract color groups. Internal `hub` and `service` types remain unchanged for KludgopolB AI parity; their player-facing terminology is now **Portali** and **Luoghi speciali**.

## Art reused from Grugnetto Go!

Original Grugnetto art is kept separate from GPL code under `assets/grugnetto/` and remains all-rights-reserved. The game board references the original coin as its currency icon and the idle Grugnetto illustration as the human token artwork. Selected Kenney CC0 scenery is copied under `assets/third_party/kenney/` for visual hooks for each world. RC39's `grugnetto-islands` layout also maps every visual position to one local icon asset actually used in the corresponding Grugnetto Go level, while the illustrated board background remains presentation-only.

As of board package v1.4, the three Portal (`hub`) spaces use Grugnetto Go's own per-world goal-flag artwork (`assets/grugnetto/flags/flag_green_a.png`, `flag_blue_a.png`, `flag_red_a.png`) as their space icon, in place of the earlier generic swirl symbol — the same green/blue/red flags a player plants at the end of a level in world1/world2/world4. World3 (Dune Dorate) has no Portal of its own on this board; its own narrative "Grande Portale" is the distinct `neutral` space already using the heart collectible icon, unrelated to the three flagged `hub` spaces.
