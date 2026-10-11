# Restoration notes

This document records source-derived behavior and deliberate browser adaptations without preserving internal development history.

## Game model

The restoration keeps the historical 9×8 logical field, the five original active-card masks, the CRC-style 32-bit PRNG, the non-Fisher-Yates deal routine, Solitaire miss budgets, 2-player majority rule, and shared PRNG use across deal, AI and B/random-cursor behavior.

## Timing and input

Gameplay runs on the source-derived NTSC-like frame clock. Flip, mismatch, unflip, pair collection, CPU pauses, cleared/game-over holds, directional autorepeat, two-controller handoff and B/random-cursor behavior follow the 0.02 code paths.

The browser adds mouse/touch input and a shared-device Continue button. These are additive adaptations and do not replace the historical keyboard mappings.

## CPU

Vs. CPU uses the original imperfect-memory "Artificial idiocy" model: the AI stores revealed card identities, deliberately forgets positions according to `aiNoiseLevel`, searches for remembered pairs, and pauses before its second choice.

## Story presentation

Opponent portraits, table layout, palettes, title graphics and English dialogue are reconstructed from the preserved 0.02 assets and assembly data. Italian text is a Libre Arcade translation.

Two historical text quirks are intentionally documented:

- the opening text falls through into the four instruction lines because there is no terminator between the tables;
- Susan's losing dialogue lacks a terminator and can fall through into her following winning text.

## Graphics

The playfield renderer transcribes the original 4×4-tile card construction, 24-pixel logical spacing, symbol palettes, score boxes, arrow behavior, flip metasprites, collection motion and game-over wipe. The deterministic board oracle image is generated from the original graphics and source constants.

The browser scales the native 256×240 canvas to the largest fit inside the available viewport. It prefers whole-number scales at 2× and above for crisp pixel art, while allowing fractional scaling on smaller screens.

## Audio

No WAV/MP3/OGG assets are bundled. SFX and music are synthesized at runtime from the historical source tables. Web Audio approximates NES timbre; sequence data, pitch-divider logic, timing, ties and gameplay triggers are source-derived.

## Title and menus

The title screen and mode/difficulty flow are reconstructed from the historical packed nametable, tile atlas and menu logic. Story starts directly; Solitaire, 2 Players and Vs. CPU pass through difficulty selection.

## Preservation boundary

The original `ConcentrationRoom-0.02.zip` is kept unchanged under `/reference`. A separate patch documents the 2016 post-release Terriblegate source fix. Browser-specific UI, translations, responsive scaling, local language/difficulty preferences, Help and Credits remain clearly separate from the historical baseline.
