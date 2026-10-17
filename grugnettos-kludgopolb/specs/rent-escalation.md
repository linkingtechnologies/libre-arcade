# Growing rents

An optional rule, on by default in the browser game, that raises every rent as a game goes on so that long games end. It is a deviation from the KludgopolB original, which has no such rule (see [`parity.md`](parity.md)), and it is documented here and in [`balance.md`](balance.md), which shows why it exists.

## Why

Without it, a game between two players who each own complete, fully embellished Worlds never ends: the same money passes back and forth and neither side can run out (in the two stalled games inspected, one of the two survivors held more than 20,000 coins). About 3% of four-player games between strong players end this way, and about a quarter of the games with Pazifik at the table, because Pazifik never proposes a trade and normally refuses incoming ones, so Worlds stay split and nobody's rent is high enough to break anyone.

## The rule

- From round **40**, and every **20** rounds after that, every rent is multiplied by **1.25** again. So ×1.25 from round 40, ×1.5625 from 60, ×1.953125 from 80, ×2.44 from 100.
- It applies to Place rents at every Embellishment level (and so to the doubled rent of a complete World), to Portal rents, and to the dice multiplier of Special places. Prices, Embellishment costs, pledge and redeem values, the Home salary and the Base Camp fee do not change.
- Each rent is rounded to a whole coin from its printed value (`round(printed × multiplier)`, never compounded on already rounded values). A Special place's multiplier is not rounded, but what it charges is (`round(multiplier × dice)`).
- The CPU friends see the new rents in their own valuations and trade maths, like anyone else would.

## Where it lives

- `src/core/escalation.js`: the rule as pure functions of the round (`DEFAULT_RENT_ESCALATION`, `rentLevelAt`, `rentMultiplierAt`, `nextRentRiseRound`, `normalizeRentEscalation`).
- `src/core/game.js`: the `rentEscalation` option. The engine keeps the printed rents (`baseRents`) and, whenever the round changes, rewrites its own copy of the board from them, so everything that reads the board (rent charged, CPU valuation, trade maths) agrees. All round changes go through the `roundNumber` setter, whichever loop advances the game.
- `src/core/valuation.js`: `rentTerms(..., { multiplier })` is the one rent rule, used by the engine (which passes nothing, its board is already scaled) and by the board display (which holds the printed board and passes the multiplier). A test checks that both give the same number at every step.
- The option is off unless asked for, so `npm run sim`, the arena and the older specs behave as before. The browser game asks for it unless the player unticks **Growing rents** on the New game screen (remembered in `grugnettos-kludgopolb.rentEscalation`).

## What the player sees

- The New game screen has the choice, ticked, with a one-line explanation.
- The header shows a label: "Rents grow from round 40" before the first rise, then "Rents ×1.56", with the next rise in its tooltip. On a phone only the multiplier is shown once rents have risen.
- Every rise shows a message ("Rents are rising: ×1.95. Next rise in round 100") and is announced to screen readers.
- Tiles and the place details show the current rents, and the details say that the table includes the rise.
- The manual explains it in the Places section, in the four languages.

## Saves

The rule is part of the game snapshot (`rentEscalation`, or `null`). A save written before the rule existed has no such field and carries on without it, with its printed rents. A restored game is rescaled from its round number.

## Not tried

Other forms were tried in simulation and left aside: lowering the Home salary by 20 coins every 20 rounds from round 40 also ends four-player games but trims the long tail less (the slowest tenth of games 113 rounds instead of 92), and ends far fewer games at tables of players who never trade. The study also tried compensating later seats with extra starting coins, which does not work (see `balance.md`).
