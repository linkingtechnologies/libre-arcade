# Technical archaeology notes

## Important correction: there is no 3D rendering engine

54321 is **not** a polygonal 3D game. Its three- and four-dimensional modes are logical/data-model dimensions rendered as collections of ordinary 2D boards ("tiers") using SDL blits.

For faithful browser rendering, WebGL is unnecessary; Canvas 2D is sufficient and closer to the original rendering model.

## Core n-dimensional engine

The central `Cube` model has:
- side length: 4;
- maximum dimensions: 4;
- maximum cells: `4^4 = 256`;
- dimensions exposed by the normal games: 2D, 3D, 4D;
- orthogonal neighbors only: up to `2 * dimensions`;
- optional wrap-around along each axis;
- index ↔ coordinate conversion utilities;
- wrapped distance/direction helpers.

Array sizes are explicitly precomputed for 1D through 4D: 4, 16, 64, 256.

## Rendering

- SDL 1.x surfaces and SDL_image.
- Main game board area: 600×600 logical pixels.
- Sidebar begins at x=600.
- Sprites/tiles are PNGs loaded directly and blitted without a 3D API.
- Higher dimensions are represented by spatially arranged 2D tiers.

## Input

Primary interaction is mouse-driven.
- left click: primary action;
- right-click or Shift-click: alternate action in games that need it (for example Bomb Squad flags and Tile Slider goal preview);
- sidebar buttons change dimension, difficulty, wrap, reset/new action, help/menu;
- original program supports fullscreen, with `-window` to start windowed on supported builds.

## Audio

The audio system opens a mono 8-bit signed SDL device at 8 kHz and synthesizes a short "ding" buffer algorithmically. No third-party sound files are required.

## Data formats

### Help

`.hlp` files are simple line-oriented scripts containing commands such as:
- `image`
- `subimage`
- `text_center`
- `button`
- `update`

They encode both text and layout for the in-game manual.

### Peg Jumper boards

`.peg` files describe prebuilt Peg Jumper board configurations for 2D/3D/4D and wrap/non-wrap variants. These are project data files, not racing tracks.

### Source

The canonical documented sources are `.nw` Noweb files. Generated `.cpp`/`.h` sources are included alongside them. The archive also includes a generated developer PDF.

## No track format / no vehicle physics

Because 54321 is a puzzle collection:
- track format: **N/A**;
- vehicle physics: **N/A**;
- 3D mesh/scene engine: **N/A**.

The relevant fidelity targets are instead cube topology, neighbor semantics, puzzle generation, movement rules, board data, input behavior, and 2D tier layout.
