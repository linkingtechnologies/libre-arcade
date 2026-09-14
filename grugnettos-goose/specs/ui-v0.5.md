# UI v0.5 — visual archaeology pass

## Goal

Refine the visual identity of Grugnetto’s Goose without changing the gameplay model.

The target feeling is:

- warm tabletop presentation;
- readable classic board-game atmosphere;
- simple, non-technical UI;
- stronger differentiation of special spaces;
- clearer player state at a glance.

## Main changes

### Board

- keep the 8×8 square spiral;
- preserve the central medallion;
- use warmer paper/wood tones;
- give special spaces distinct but soft color families;
- keep number, icon and label readable on each square;
- add a compact board-info strip (`2 dice`, `exact finish`, `2–4 players`).

### Player panel

- convert plain rows into small player cards;
- show Human/Computer role as a badge;
- show current/waiting/blocked/miss-turns as a status badge;
- keep square position visible at all times.

### Legend

- keep it always visible below the board;
- render each item as a pill to match the tabletop language.

### Constraints

- no external art dependencies;
- no gameplay logic in the UI;
- responsive at mobile widths;
- compatible with reduced motion;
- bilingual IT/EN.
