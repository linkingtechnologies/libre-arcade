# Accessibility notes — v0.7

Implemented in the release candidate:

- keyboard-visible `:focus-visible` treatment;
- skip link to the game controls;
- bilingual ARIA labels for board, menu, legend, settings and dialog close control;
- current player exposed with `aria-current`;
- game log exposed as a polite live log;
- token identity uses colour **and** a player symbol;
- reduced-motion option plus `prefers-reduced-motion` default;
- higher-contrast media-query adjustments;
- 44–48px minimum touch targets for primary mobile controls;
- fixed mobile roll control so the main action remains reachable on small screens;
- no information is intended to rely only on colour.

The board remains visually dense by nature; the player panel and event log provide a text alternative for current position/state.


## Player-piece identity (v0.32)

Player pieces never rely on hue alone. The four local player slots combine three independent cues:

| Slot | Symbol | Surface pattern |
| --- | --- | --- |
| 1 | circle `●` | solid |
| 2 | triangle `▲` | diagonal stripes |
| 3 | square `■` | dots |
| 4 | diamond `◆` | crosshatch |

The same symbol/pattern identity is reused on the board, in the player list, in setup previews and in live turn notices. Piece controls/graphics expose localized ARIA labels including player name, shape and pattern. Forced-colors mode keeps the symbol as the primary differentiator even when authored colors/patterns are overridden.
