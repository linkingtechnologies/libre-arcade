# Reference behavior: rjanjic/js-solitaire

This document records observable and code-level behavior before porting.

## Architecture

- One mutable `state` object stores all 52 cards and every pile.
- Cards are represented by numeric indexes; DOM elements are stored inside the
  same objects as rules state.
- The seven tableau piles are named `desk`; foundations are named `finish`;
  stock and waste are `deal.pile` and `deal.deal`.
- Rendering uses nested DOM cards and a generated base64 sprite sheet.
- The build uses Babel 6, Webpack 2, node-sass 4 and Yarn.

## Preserved game behavior

- The stock deals three cards per click.
- The waste can be recycled without a pass limit.
- Tableau builds downward with alternating colors.
- Only Kings may enter an empty tableau column.
- Foundations build upward by suit.
- Moving a tableau suffix reveals the newly exposed card.
- A short click automatically chooses the first available legal destination.
- Holding a card for 200 ms begins mouse dragging and highlights all legal
  destinations.
- Victory triggers a Windows-Solitaire-style bouncing-card animation.

## Historical quirks to test explicitly

- Shuffling uses `Array.sort()` with a random comparator, which is biased and
  not reproducible.
- An Ace may start any empty foundation; foundation identity is established by
  the first Ace rather than by a fixed printed suit.
- Input is mouse-only and relies on global `window.onmousemove/onmouseup`.
- No undo, saved game, draw-one option, timer or statistics are present.
- Rules and DOM operations are tightly coupled, so the reference cannot be
  imported as a headless engine without extraction.

These quirks are evidence, not defects to silently erase. A faithful port must
first reproduce them or document every intentional deviation.

