# ConnectLab player API v1

A player definition exposes metadata, capabilities and `create(options)`. An instance exposes `chooseMove(position, context)` and optional `reset()`.

`position.board` is seven columns of six cells, top-to-bottom. Cells are `0`, `1` or `2`; `position.player` identifies the actor. A decision is `{ column }`, zero-based. Optional fields include `score`, `nodes`, `depth` and `elapsedMs`.

Adapters may translate the position into an original representation but must not alter the restored search, evaluation, move ordering or tie-breaking. Random algorithms receive `context.rng`; they must not call ambient randomness during Arena execution.

The core validates every returned move. An illegal move is an adapter failure, never silently corrected.
