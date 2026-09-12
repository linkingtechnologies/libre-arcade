# Archaeology record

## Identification

- Title: 54321
- Original author: Patrick Stein / nklein software (as stated by the original README)
- Historical release: 1.0.2001.11.16
- Original technology: C++ with SDL / SDL_image, documented with Noweb
- Context: 1 MB SDL Game Programming Contest

## Upstream status

The original public release remains 1.0.2001.11.16. Historical FreeBSD packaging lists the port without a maintainer. New OS/2/SDL2 work published in 2026 is treated here as downstream preservation/porting of the same old game release, not a resumed upstream game-development line.

Useful external records:
- https://www.freshports.org/games/54321
- https://libregamewiki.org/54321
- https://discourse.libsdl.org/t/the-sdl-game-contest-results/5820
- https://ecsoft2.org/54321

## Technical character

Despite 3D/4D gameplay terminology, 54321 has no polygonal 3D renderer. Dimensions are logical dimensions represented by multiple SDL 2D boards. A faithful browser implementation therefore needs Canvas 2D, not WebGL.

## Completeness

The five advertised puzzle games are implemented in the source tree: Flip-Flop, Bomb Squad, Maze Runner, Peg Jumper and Tile Slider. A sixth compiled `Life` implementation exists as a hidden/easter-egg path and should not be promoted to the normal five-game menu in faithful mode.


## Peg Jumper data-file finding

Peg Jumper is unusual among the currently ported games because its starting positions are historical data rather than generated layouts. The source selects one of 18 files (`b2-*`, `b3-*`, `b4-*`, each in three skill levels and wrap/non-wrap forms). Inspection shows each `n`/`w` pair has identical meaningful cell data: wrap mode changes topology only.

The Noweb source also exposes a small original defect: `stepsTaken` is declared and incremented/displayed, but is never initialized by `Peg::reset()`. This project preserves the evidence in `/reference` while making the browser counter deterministic and documenting that fix.

## Tile Slider source finding

Tile Slider confirms how deliberately 54321 encoded higher-dimensional information into a 2D display. The tile value is converted to four base-4 coordinates. The SDL view uses the first two coordinates to select the tile center artwork and the next two to select the border artwork. In 4D, a single 36×36 tile therefore communicates all four target coordinates without any polygonal rendering.

The original shuffle does not generate a puzzle by performing legal slide moves. Instead it leaves the blank in the solved final cell and performs an even number of arbitrary transpositions among non-blank tiles: 2, 4 or 8 depending on difficulty. The Noweb prose explicitly states that the counts must be even to retain an even permutation.

The movement rule is also broader than a conventional one-tile 15-puzzle move: any tile collinear with the blank can be clicked, causing the entire intervening line to slide. Wrap mode applies the shared `Cube::determineAxis()` directional rule and can slide across opposite edges.

## Hidden Life easter egg — activation evidence

`Life` is not merely dead code: `main.cpp` has a real `MainMenuView::MAX_GAME` branch that constructs `LifeController`. The hidden activation is intentionally indirect:

1. `peg.cpp` increments global `__wonCount` only when Peg Jumper is won on skill level `2` (Hard).
2. `help.cpp` XORs every character of each loaded help-file base name into global `__counter`.
3. `mainmenuController.cpp` selects `MAX_GAME` when a click misses all five normal game boxes, remains left of the sidebar, `__counter == 76`, and `__wonCount == 1`; it then sets `__wonCount = 2`.
4. `main.cpp` interprets `MAX_GAME` as `LifeController`.

The normal five game boxes cover the top and bottom of the 600×600 play area plus the central 300×200 middle box, leaving side strips in the middle row where the secret click can miss every advertised game.

The browser restoration preserves this evidence but does not invent a simplified menu entry for Life. Reproducing the exact help-navigation sequence that yields XOR value 76 is a separate parity task.
