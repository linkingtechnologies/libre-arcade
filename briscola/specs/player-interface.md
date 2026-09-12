# Player interface

Every integrated machine player exposes:

```js
async chooseAction(observation)
```

The current Briscola action schema is:

```js
{
  type: "PLAY_CARD",
  cardId: "denari-3"
}
```

An adapter may also return optional diagnostic data:

```js
{
  type: "PLAY_CARD",
  cardId: "denari-3",
  debug: {
    algorithm: "ExampleAI",
    rule: "R4"
  }
}
```

`debug` is non-semantic: the engine must never require it to validate or execute
the action.

## Required behavior

- Reject or fail clearly when called outside the player's turn.
- Select only a card contained in `observation.hand`.
- Never read hidden engine state.
- Implement `reset()` if the player or adapter keeps cross-turn state that must
  be cleared at the start of a new game.

The asynchronous method shape is intentional: heuristic players can resolve
immediately while browser ML runtimes or future human/network players may need
asynchronous work.
