# Computer-player behaviour

The original AI is a probabilistic heuristic, not minimax, MCTS or machine learning.

For legal movable pawns it applies these priorities, with a difficulty-dependent random gate before priorities 1–4:

1. capture if possible;
2. reduce the number of threats;
3. move from an unsafe square to a safe square;
4. move an unprotected/unsafe pawn;
5. fallback: move the most advanced legal pawn.

The legal candidates are initially sorted by route progress descending.

## Difficulty

The historical thresholds are preserved exactly:

- 40
- 55
- 70 (default)
- 85
- 100

The browser UI uses friendly labels instead of exposing percentages. This changes presentation only, not AI behaviour.

## Historical priority-2 bug

Phase 4 resolves the last AI-parity ambiguity by following the 20181125 source bug-for-bug.

`SetAmenazas` tries to evaluate an opponent pawn with `estaAutorizadaAMover()`. That reaches `puedeMover()`, which rejects a pawn whenever `ficha.jugador != mem.jugadores.actual`. During `IASelectFicha`, `mem.jugadores.actual` is the AI player whose pawn is being evaluated, so ordinary opponent threats (1–7, 10 and 20) are rejected and do not increase the threat count.

There is one narrow surviving start-square branch. On another player's start square, with two pawns already present and at least one pawn of the start-square owner still at home, the original may record one threat. The Python source also tests the tuple returned by `puedeComer()` directly rather than its Boolean element, making that tuple truthy even when it contains `(False, None)`. The JavaScript restoration preserves this observable behaviour intentionally.

This means priority 2 is mostly inert in normal play. It is **not corrected** in the faithful AI mode. A future improved AI, if ever added, must be a separate mode rather than silently changing the preserved player.

## Randomness

The original reseeds Python's PRNG from the current microsecond for dice throws and AI probability checks. The historical die also supports a `fake` queue for predetermined values.

The browser restoration injects a deterministic PRNG and retains scripted dice in the core/test API. Normal games use a fresh hidden seed. This keeps ordinary play random while making regression tests reproducible.
