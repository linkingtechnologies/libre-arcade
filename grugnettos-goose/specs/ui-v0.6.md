# UI v0.6 — original asset identity

## Goal

Replace the remaining emoji-dependent board identity with original vector assets created specifically for Grugnetto’s Goose.

## Assets

The project now contains original SVG icons for:

- Goose;
- Bridge;
- Inn;
- Well;
- Maze;
- Prison;
- Death;
- Finish;
- favicon;
- generic pawn silhouette.

All SVGs live under `assets/icons/` and are project-original. No external icon pack is used.

## Rendering approach

Special-space icons are rendered as CSS masks, allowing one source SVG to inherit contextual colors while remaining sharp at any size.

Player pieces use one original pawn silhouette plus:

- a unique color;
- the existing unique player symbol.

This means players are not distinguished by color alone.

## Constraints

- no gameplay changes;
- no third-party runtime assets;
- SVGs must remain lightweight and editable;
- board and controls remain usable on mobile;
- animation continues to consume core events only.
