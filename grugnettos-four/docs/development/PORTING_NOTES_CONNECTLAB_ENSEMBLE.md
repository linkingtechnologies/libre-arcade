# ConnectLab Ensemble

## Purpose

M22 is an original GPLv3 ConnectLab player, not a recovered historical engine. It asks five independently preserved families for a move and exposes every vote:

- Markus Thill TD n-Tuple;
- Markus Thill AlphaBeta;
- GNOME Velena Full Integration;
- Allis Threat-Space;
- Stratzilla alpha-beta.

These advisors were chosen to span learned value functions, exact-capable bitboard search, strategic rules/proof numbers, selective threat proofs and conventional heuristic minimax. No advisor is silently replaced by a private model.

## Decision policy

Immediate wins and a single forced block bypass voting. Before votes are counted, the ensemble computes every move that does not concede an immediate opponent win; votes for excluded moves are retained in telemetry with `accepted: false` but contribute no weight.

Base weights are 4 for TD, 2 for AlphaBeta, 2 for Velena, 1.5 for Allis and 1 for Stratzilla. A completed exact AlphaBeta result receives weight 5, an Allis win/double-threat proof receives 4 and a PN-validated Velena rule proof receives 3. Equal totals use stable center-first order.

## Effort profiles

| Effort | TD lookahead | AlphaBeta nodes | Velena | Allis horizon | Stratzilla depth |
|---:|---:|---:|---:|---:|---:|
| 1 | 0 | 1,000 | 1 | 3 | 3 |
| 2 | 0 | 10,000 | 2 | 5 | 4 |
| 3 | 1 | 100,000 | 3 | 7 | 5 |

The ensemble remains bounded and is not advertised as perfect. Its seeded behavior comes from the Velena fallback; all votes, safety rejections, node counts and totals are returned with the decision.

## Verification

Tests cover immediate wins, forced blocks, an intentionally dominant unsafe advisor, weighted selection, five-advisor telemetry, seeded replay, legal output and profile validation. All historical advisor parity suites remain active.
