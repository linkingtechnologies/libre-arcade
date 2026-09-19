# Sound

Short sound effects for what happens between players. Sound is a second channel only: every event already has its visible message, popup or review line, so nothing depends on hearing it.

## Behaviour

- On by default at a low volume. The toolbar select offers off / low / medium / high (0, 0.5, 0.75, 1 of full scale), saved in `grugnettos-kludgopolb.soundLevel` and removed by **Reset local data**.
- Audio is created on the first press or key (browser autoplay policy) and keeps retrying on later presses until the browser lets it run; a suspended context is resumed when a cue is due. If Web Audio is missing or a file fails to load, the game is simply silent.
- A CPU turn is computed in one go, so what it did is queued and played one beat at a time about 480 ms apart (260 ms with fast animations), together with the floating amounts (see `money-pops.md`). A packet keeps at most its last twelve beats, and starting a new game or loading a save clears the queue.
- Events involving the human play at full level; events between CPU players play at 70%.
- Money is directional for the human: a lower coin when they pay (rent, travel cost, Base Camp fee), a higher double coin when they are paid.

## Event to cue

| Event | Cue |
| --- | --- |
| `TURN_STARTED` (human only) | `yourTurn` |
| `DICE_ROLLED` (higher pitch on doubles) | `dice` |
| `START_PASSED` | `startPassed` |
| `PROPERTY_ACQUIRED` | `purchase` |
| `AUCTION_ENDED` (with a winner) | `auction` |
| `RENT_DUE`, and `PAYMENT` for travel cost or Base Camp fee | `pay` or `receive` |
| `CARD_DRAWN` | `adventure` or `setback` |
| `EMBELLISHMENT_BUILT` or `_GRANTED` / `_SOLD` / `_LOST` | `build` / `sellBuild` / `loseBuild` |
| `PROPERTY_PLEDGED` / `PROPERTY_REDEEMED` | `pledge` / `redeem` |
| `TRADE_PROPOSED` / `_ACCEPTED` / `_DECLINED` | `tradeAsk` / `tradeYes` / `tradeNo` |
| `SENT_TO_BASE` | `baseCamp` |
| `PLAYER_BANKRUPT` | `bankrupt` |
| `GAME_ENDED` | `victory` |

Silent on purpose: `CASH_CHANGED`, `TURN_ENDED`, `SPACE_LANDED`, `PLAYER_MOVED`, `PROPERTY_TRANSFERRED`, `AUCTION_LIMIT_SET`, `DETENTION_DECISION`, `DETENTION_CARD_USED`, an unsold auction, and `PAYMENT` for rent or purchases (covered by `RENT_DUE` and `PROPERTY_ACQUIRED`). A test fails when the core starts emitting an event that is neither mapped nor listed as silent.

## Files

`src/ui/sound.js` holds the event-to-cue routing and the Web Audio player. `config/sounds.json` says what each cue sounds like: a list of layers with a file, delay, pitch and gain, so a cue can be retuned or swapped without touching code. The files and their licences are listed in `licensing.md`.
