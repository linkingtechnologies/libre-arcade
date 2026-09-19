# Parity ledger

This document separates behaviour already ported from behaviour that is still provisional.

## Ported / grounded in the Java source

- Seven CPU profiles and their numeric parameters: Mimrock, Zilla, Queen, Wallace, Hans, Lost Soul, Lemming.
- Property valuation model: purchase price + rent × empirical landing frequency, with group completion bonus.
- Hub valuation concept.
- Service valuation concept using expected 2d6 roll = 7.
- Auction valuation includes a small random uplift in the original code.
- 2d6 movement, doubles, three doubles causing detention.
- Ownership, rent, site groups and progressive development rents.
- Pledge concept and liquidation path.
- CPU trade proposal generation from `PlayerCPUTrader`.
- Group-aware trade filtering from `CurrentState.removefromtrade`.
- Trade portfolio valuation (`getTotalGainCostLoss`, `getTradingChanges`, `getTotalGain`).
- Independent CPU target acceptance from `TradeAccepterWindow`.
- Original rule preventing a site trade while its colour/group contains buildings.

## Restoration-level deterministic adaptation

The original used several unseeded Java RNG instances. Grugnetto's KludgopolB deliberately derives deterministic RNG streams from one game seed, so identical seeds produce identical games and AI decisions.

## Implemented but not yet parity-complete

- Auction scheduling/timing.
- Automatic purchase policy.
- Development decisions.
- Debt liquidation order.
- Event-card effects.
- Detention exit strategy.
- Pledge-interest effects when pledged properties change hands in a trade.

These remain isolated so they can be replaced with line-by-line ports of the corresponding Java logic.

## Not yet ported

- Detention-release cards in trades.
- Pending-purchase permutations during a trade dialog.
- Limited-embellishment inventory auctions.
- All configurable rule presets.
- Original `.conf` parser.

## Restoration-level additions (not ports)

These have no counterpart in the Java original's decision logic and are covered by their own tests rather than by parity with the source:

- The versioned save/resume contract (`src/core/save.js`) and the `GameController` state machine (`src/core/controller.js`).
- The four-language browser UI (`src/ui/`) for human players, on the original Grugnetto board.
