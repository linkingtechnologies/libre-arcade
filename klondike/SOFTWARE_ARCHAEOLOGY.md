# The software archaeology behind Grugnetto’s Klondike

This is Klondike's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why an unresolved search is reported as *unknown* rather than
*impossible* — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## Recovering a forgotten solitaire

Grugnetto’s Klondike started with a simple question: could we turn an old open-source solitaire into a modern browser game without losing its history? The first piece we found was [rjanjic/js-solitaire](https://github.com/rjanjic/js-solitaire), a compact MIT-licensed JavaScript implementation of Klondike with only eight commits. Its [last upstream commit was made on 26 March 2021](https://github.com/rjanjic/js-solitaire/commit/f67a187afd2cff31ed8d04929d544fa2f032f457). We recovered the game model, its interpretation of the Klondike rules and the original card sprite. The untouched source is kept in the project as a historical snapshot. We also run the original code in our tests and compare its behaviour with the restored engine, instead of relying only on visual similarity.

## Restoring an old solver

The second project had a different job. [ShootMe/MinimalKlondike](https://github.com/ShootMe/MinimalKlondike) is an MIT-licensed Klondike solver originally written in C#. Its [last upstream commit was made on 20 April 2023](https://github.com/ShootMe/MinimalKlondike/commit/8983a1375aa15c5ca7f8c3df054aef37218f85c8). We converted its solver architecture to JavaScript and moved the search into a Web Worker, so it can analyse moves without freezing the game. Every deal is randomly generated in the browser. There are no pre-built games hidden in the package. A deal is offered only after the solver has found a complete winning sequence and the restored engine has replayed it successfully. The search has a fixed limit. If that limit is reached, the result is recorded as *unknown*, not *impossible*. This means that some valid deals may be discarded because they take too long to analyse, but an unverified deal is never presented as solved.

## Preserving human intelligence

We built a new interface around these recovered components, with a responsive table, touch controls, draw-one and draw-three modes, undo, hints, safe auto-completion, automatic saving, statistics, sounds, interchangeable card decks and support for Italian and English. Grugnetto’s Klondike is both a playable game and a record of how two developers — one in 2021, one in 2023 — approached the same problem from very different directions.
