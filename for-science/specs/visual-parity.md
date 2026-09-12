# Visual parity protocol

## Purpose

This document separates what has been verified directly from the preserved source
from what still requires an archival Python 2.7/Cocos runtime for screenshot/video
comparison.

## Source-verified geometry

Primary anchors are `game/scenes.py`, `game/menu.py`, and the vendored
`cocos/scenes/transitions.py` in `/reference/postcompo-1.0.1`.

- Logical viewport: 640×480.
- Board origin: x=150, bottom-origin y=446.
- Tile: 32 px with 2 px step padding (34 px pitch).
- Python `int()` is applied to virtual mouse coordinates before `//` cell math.
- Asset column hit testing uses x=90, 32 px division and a 34 px vertical pitch.
- Only one board click is accepted per rendered frame via upstream `clicked`.
- Dr X meteor: starts at (0, 480) with horizontally flipped meteor image.
- Dr Z meteor: starts at (640, 480) with unflipped meteor image.
- Cow sprite is horizontally flipped in the loaded source asset and rotates twice
  during its 2 s travel action.
- Explosion is horizontally flipped and is killed at the end of the parallel
  2 s scale branch, before its nominal delayed fade finishes.
- Menu → game and Menu → Demo both use a 1.0 s fade-to-black transition with the
  scene switch at 0.5 s.

`test/source-anchors.test.js` asserts these source constructs remain present so a
future cleanup cannot silently detach the browser behavior from its evidence.

## Deterministic capture hooks

For browser capture without changing user-facing UI:

- `?seed=123` selects a fixed Python-compatible integer RNG seed.
- `?autostart=game&seed=123` starts normal play directly.
- `?autostart=demo&seed=123` starts Demo directly.

These parameters exist only for parity/testing and are intentionally not shown in
menus.

## Recommended future executable-vs-browser capture

When an archival machine/VM with Python 2.7 and the original Pyglet/Cocos stack is
available:

1. run the untouched 1.0.1 tree from `/reference` at 640×480;
2. instrument only outside `/reference` to set the same integer random seed before
   `GameScene` board creation;
3. capture original and browser at the same logical milestones rather than relying
   solely on wall-clock frame numbers;
4. compare at minimum: menu fade midpoint, board intro start/end, `Ready?`, first
   human turn, valid swap midpoint/end, invalid swap return, match flight/gravity,
   each weapon at 50% travel, explosion at 1.0/1.5/1.99 s, first timeout, second
   timeout shuffle, and each game-over branch;
5. compare logical state (board, scores, shield, active player and next RNG values)
   alongside images, so a visual difference cannot hide a state divergence;
6. record renderer differences separately from game-rule differences.

## Current limitation

This restoration session did **not** run the original executable: the environment
has no usable Python 2.7 runtime for the preserved Cocos/Pyglet application, and a
compatible runtime could not be installed here. No claim of screenshot-by-screenshot
executable parity is therefore made.

What baseline 0.3 does verify is stronger than visual guesswork: the transformations
above are tied to preserved source, deterministic cross-language fixtures verify the
state/RNG paths, and the browser copies all 35 original data files byte-for-byte.
