# Port map

This map links the preserved implementation to the headless extraction.

| Original function/state | Extracted equivalent | Status |
| --- | --- | --- |
| `state.cards`, `state.colors`, `state.types` | `createCards`, `COLORS`, `SUITS` | Preserved |
| `resetGame` random comparator | `referenceShuffle` | Preserved, intentionally biased |
| `dealCards` | `createReferenceGame` | Preserved |
| stock click in `handleClick` | `drawThree` | Preserved |
| `restartDeal` | `recycleWaste` | Preserved without reversal |
| `getCardLocation` | `locate` | Preserved without DOM references |
| `getAvailableDestinations` | `availableDestinations` | Preserved, including Ace quirk |
| `moveCardTo` | `moveTo` | Preserved suffix movement |
| short-click auto move | `clickCard` | Preserved first-destination priority |
| `gameFinish` | `isWon` | Preserved rule, animation not yet ported |

The extraction removes DOM elements from game state but does not silently fix
historical behavior. Modern rules belong in a separate adapter.

## Executable certification

`tests/helpers/original-oracle.mjs` executes the frozen upstream `src/index.js`
inside a minimal controlled DOM. `tests/original-oracle.test.mjs` then feeds the
exact shuffled cards into the port and compares complete state snapshots.

The current certificate covers five independent deals, every draw-three step,
waste recycling, all exposed-card destinations for four further deals,
destination priority, and a mixed sequence of automatic click moves. The
original code—not a hand-written fixture—is the expected-result oracle.
