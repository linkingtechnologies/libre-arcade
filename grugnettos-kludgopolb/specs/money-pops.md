# Floating amounts

When money moves, an arcade-style amount floats up on screen: a green `+100` for money received, a red `−120` (a real minus sign) for money spent. The human's own amounts are larger.

- Each amount appears twice: over the player's cash in their card (or in the phone dock) and over their pawn on the board. A place is skipped when it is off screen, for example when the board is panned away from the pawn.
- What shows is what moved: every `CASH_CHANGED` event, plus the cash of an accepted trade (which moves cash without such an event: the trader pays when it is positive). A test replays whole games and checks that the amounts shown add up to the amounts moved for every player.
- Amounts appear with the sound of their transaction, one beat at a time, like the sounds (`sound.md`): a purchase is credited to the purchase and not to the dice roll before it, a rent to both the payer and the owner, a trade to both players. Money with no matching event (a plain payment) forms a beat of its own with a coin sound, so nothing moves in silence.
- CPU turns are computed in one go and reviewed in the right-hand column, so their amounts are played back paced like their sounds (about 480 ms per beat, 260 ms with fast animations) instead of all at once.
- With reduced motion the amounts do not move: they stay in place for the same time and disappear.
- The layer is decorative (`aria-hidden`): the live region and the review keep announcing the same events in words.

The grouping lives in `src/ui/feedback.js`, the drawing in `src/ui/app.js` (`showMoneyPop`) and `src/ui/app.css` (`.money-pop`).
