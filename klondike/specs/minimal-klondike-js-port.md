# MinimalKlondike JavaScript port

Upstream: `ShootMe/MinimalKlondike`, commit
`8983a1375aa15c5ca7f8c3df054aef37218f85c8` (MIT).

## Implemented mapping

| C# source | JavaScript port |
|---|---|
| `Board.SetDeal` / `SetupInitial` | `boardFromMinimalDeal` |
| `CheckTableau`, `CheckStockAndWaste`, `CheckFoundation` | `availableSolverMoves` and optional talon macros |
| `MakeMove` | immutable `applySolverMove` |
| `GameState` tableau canonicalisation | `solverStateKey` |
| `MinimumMovesRemaining` | `minimumMovesRemaining` |
| `Heap<MoveIndex>` and bounded `Solve` | `MinHeap` and `solveMinimalKlondike` |
| deal generation | deterministic `shuffledMinimalDeal` |

The original compact card and pile structs are intentionally represented by
plain arrays and objects so the port can be audited and later moved into a Web
Worker. Deal encoding, triangular tableau order, alternating-colour rules,
foundation rules, draw-one/draw-three and waste recycling are preserved.

## Current differences

- The JS closed set uses canonical strings rather than packed structs/hash maps.
- It returns `unknown` at a state limit and does not yet certify impossible deals.
- It finds a valid solution but does not yet prove that the solution is minimal.
- The core is synchronous and auditable; the browser runs it in a temporary
  Web Worker so generation and hints do not block the game interface.

The test suite parses and replays a complete solution found by the port. At
runtime the browser worker shuffles candidates from fresh random seeds and
accepts only those for which the JS search reaches all 52 foundation cards.
Only games generated and cached by that browser may be reused; the application
bundle contains no executable catalog of preselected deals. Packed-state
performance and minimality proof remain optimization work rather than missing
game rules.

See `certification/random-deals-latest.json` and `specs/certification.md` for
the bilingual 200-deal draw-one/draw-three cross-certification campaign.
