# Game engine contract

`BriscolaGame` is authoritative for the two-player Briscola match.

It owns:

- the canonical 40-card deck;
- deterministic shuffle seed;
- player hands and hidden stock;
- exposed trump and trump suit;
- turn and leader state;
- trick resolution;
- draw order (trick winner draws first);
- score accumulation;
- end-of-game result;
- action legality.

The exposed trump is the final drawable card. The complete deck contains 120
points.

Players do not mutate engine state directly. A player selects an action and the
caller submits `cardId` to `BriscolaGame.playCard()`. The engine validates turn
ownership and card presence before mutating state.

`getPublicState()` is intended for presentation/debugging. `getObservation()` is
the player information boundary and must be used for AI decisions.
