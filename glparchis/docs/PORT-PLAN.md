# Browser restoration plan

## Scope

Standalone **glParchis** preservation/restoration. It is not a Goose-game component.

## Technology

- HTML5 + vanilla JavaScript
- no framework
- fully client-side
- Canvas/SVG/DOM presentation; WebGL is not required for parity
- responsive desktop/mobile layout
- English + Italian UI
- local hot-seat and multiple CPU players

## Parity-first order

1. Port board/route data and turn state.
2. Port movement legality and compulsory-move rules.
3. Port capture, barriers, safe squares, +20/+10, exact finish and victory.
4. Port starter roll and 3/4/6/8 seat configuration.
5. Port original AI priorities and numerical difficulty thresholds unchanged.
6. Add deterministic seeded RNG and scripted dice.
7. Build clean procedural/SVG presentation.
8. Add clean audio only after provenance is explicit.
9. Add responsive UI and IT/EN copy.
10. Only after parity tests pass, consider optional AI improvements as a separate mode.

## Minimum regression suite

- leave home only with 5;
- compulsory home exit on 5;
- start-square capture case;
- six grants reroll;
- six counts as seven when all pawns are out;
- six forces own barrier to open;
- three-sixes penalty and final-ramp exception;
- barrier blocks traversal;
- safe square blocks ordinary capture;
- capture bonus = 20;
- finish bonus = 10;
- overshoot finish is illegal;
- victory only with all four pawns home;
- starter tie rerolls;
- mixed human/CPU seats and disabled seats;
- deterministic seeded AI choices.
