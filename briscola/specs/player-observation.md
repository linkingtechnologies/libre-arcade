# PlayerObservation

`BriscolaGame.getObservation(playerId)` exposes only information legally
available to that player.

Current shape:

```js
{
  playerId,
  phase,
  isMyTurn,
  isLeading,
  hand,
  opponentHandCount,
  scores: {
    mine,
    opponent
  },
  table,
  playedCards,
  stockCount,
  visibleTrump,
  trumpSuit,
  trickNumber
}
```

## Semantics

- `hand`: only the requesting player's cards.
- `opponentHandCount`: count only; never opponent cards.
- `scores`: public accumulated scores.
- `table`: cards currently played in the unresolved trick.
- `playedCards`: cards from completed tricks.
- `stockCount`: number of hidden stock cards, excluding the separately exposed
  trump card.
- `visibleTrump`: exposed trump while still on the table; `null` after drawn.
- `trumpSuit`: public trump suit for the entire game.
- `trickNumber`: public trick counter.

## Memory

An adapter may remember information that was public earlier. Example: QBriscola
retains the identity of the originally exposed trump after that card is drawn.
This is legal because the information was previously visible.

An adapter must never reconstruct or infer exact hidden cards from private engine
state supplied outside this observation contract.
