# Browser backend contract (v1)

Milestone 0.8 freezes the browser-facing contract used by the future interactive UI. `src/core/` contains no Node built-ins; filesystem loading lives in `src/node/board-loader.js` and is only for Node scripts/tests.

## Entry point

```js
import { GameController, serializeSave, deserializeSave } from './src/core/index.js';
```

Create a match with 2-8 participants:

```js
const controller = GameController.create({
  board,
  seed: 12345,
  participants: [
    { type: 'human', name: 'Grugnetto' },
    { type: 'cpu', profile: 'Zilla' },
    { type: 'cpu', profile: 'Queen' }
  ]
});
```

Historical CPU `profile` values are: `Mimrock`, `Zilla`, `Queen`, `Wallace`, `Hans`, `Lost Soul`, `Lemming`.

Call `controller.advance()` until the controller returns a `pendingDecision`. CPU turns are performed automatically. Human turns pause only at an explicit decision.

Each call returns:

```js
{
  status: 'running' | 'complete',
  pendingDecision: object | null,
  events: [...],
  state: controller.getPublicState()
}
```

The UI should render from `state`, animate/notify from `events`, and answer `pendingDecision` through `dispatch(action)`.

## Pending decisions and actions

### `ROLL_DICE`

```js
controller.dispatch({ type: 'ROLL_DICE' });
```

### `DETENTION_ACTION`

The UI offers rolling or paying the displayed Base Camp fee.

```js
controller.dispatch({ type: 'ROLL_DICE' });
controller.dispatch({ type: 'PAY_DETENTION' });
```

### `BUY_PROPERTY`

Contains `spaceId`, `index`, `price`, `cash`, and `cashableWealth`.

```js
controller.dispatch({ type: 'BUY' });
controller.dispatch({ type: 'AUCTION' });
```

Direct buying intentionally requires enough liquid cash; the player can manage pledges during normal turn actions. Declining enters the auction flow.

### `AUCTION_BIDS`

Contains every human bidder and its maximum cashable bid. The current backend uses a deterministic maximum-bid auction contract; CPU maximums retain the KludgopolB valuation logic.

```js
controller.dispatch({
  type: 'RESOLVE_AUCTION',
  bids: { 0: 120, 3: 80 }
});
```

### `TURN_ACTIONS`

Contains currently available development, pledge, redeem, sale, and trade targets.

```js
controller.dispatch({ type: 'BUILD_EMBELLISHMENT', index: 7 });
controller.dispatch({ type: 'SELL_EMBELLISHMENT', index: 7 });
controller.dispatch({ type: 'PLEDGE_PROPERTY', index: 7 });
controller.dispatch({ type: 'REDEEM_PROPERTY', index: 7 });
controller.dispatch({
  type: 'PROPOSE_TRADE',
  targetId: 2,
  traderToGive: [7],
  targetToGive: [12],
  cash: 30
});
controller.dispatch({ type: 'END_TURN' });
```

A positive trade `cash` means the proposing player pays the target; a negative value means the target pays the proposer. Human-to-CPU offers use the same historical CPU acceptance model as CPU trading.

### `TRADE_OFFER`

Used both when a CPU offers a trade to a human and for human-to-human offers.

```js
controller.dispatch({ type: 'ACCEPT_TRADE' });
controller.dispatch({ type: 'DECLINE_TRADE' });
```

CPU turns genuinely pause here and resume after the human decision.

## Structured events

The UI does not parse trace strings. Core actions emit typed data events. Current event types include:

- `TURN_STARTED`, `TURN_ENDED`, `GAME_ENDED`
- `DICE_ROLLED`, `PLAYER_MOVED`, `SPACE_LANDED`, `START_PASSED`, `SENT_TO_BASE`
- `CARD_DRAWN`
- `PAYMENT`, `CASH_CHANGED`, `RENT_DUE`
- `PROPERTY_ACQUIRED`, `PROPERTY_TRANSFERRED`, `PROPERTY_PLEDGED`, `PROPERTY_REDEEMED`
- `AUCTION_ENDED`
- `EMBELLISHMENT_BUILT`, `EMBELLISHMENT_SOLD`, `EMBELLISHMENT_GRANTED`, `EMBELLISHMENT_LOST`
- `TRADE_PROPOSED`, `TRADE_ACCEPTED`, `TRADE_DECLINED`
- `PLAYER_BANKRUPT`

Events contain stable player ids, board space ids/indexes and numeric values; presentation text remains in board locale files.

## Save/load

The save format is JSON and versioned independently from the board:

```js
const json = serializeSave(controller);
const restored = deserializeSave({ board, json });
```

A save contains the complete deterministic state required to resume the same game: game RNG, each CPU decision RNG, shuffled event decks and cursors, properties/pledges/embellishments, money/positions, statistics, turn/round counters and any pending UI decision. Loading refuses a different board id or `contentVersion`.

`serializeSave(controller, { pretty: true })` is useful for debugging; production UIs can store the compact default string in local storage or another persistence layer.

## Compatibility policy

- Backend contract/save schema: version 1.
- Current default board: `grugnetto-32-worlds-v1.4`, content `1.4.1` (mechanically identical to the earlier `v1.3`/`1.3.0`; revisions v1.0–v1.3 are no longer packaged).
- Board text remains independent of mechanics and is available in IT/EN/FR/DE.
- Node-only helpers must never be imported by browser UI code.

The contract is considered production-ready for the current Grugnetto ruleset. Historical KludgopolB parity work remains separately documented in `parity.md` and does not change this UI contract silently.
