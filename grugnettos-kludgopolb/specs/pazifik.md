# Pazifik — historical AI behavioural reimplementation

Pazifik is an additional friend of Grugnetto based on the documented behaviour of **JAtlantik r36 `atlantik.ai.SimpleAI` (2007)**.

**Historical AI reimplementation based on the documented behavior of JAtlantik r36 SimpleAI.**

This is not code derived from or translated from the JAtlantik Java implementation.

## Behaviour preserved

- Direct purchase: BUY only when `cash > price`; otherwise request AUCTION.
- Auction: bid exactly `highestBid + 1` only while that next bid is strictly below both the nominal property price and cash. The equivalent ceiling is `min(price - 1, cash - 1)`.
- Development: when the current engine permits a build and raw cash covers the build cost, build immediately. No reserve, ROI, landing probability, opponent or future-risk analysis.
- Detention: use a release card first if available; otherwise PAY when `cash > 50`; otherwise ROLL. The current Grugnetto board has no release-card event, but the branch is retained for parity/future compatibility.
- Trading: never proposes trades and normally declines incoming CPU trade offers.
- Debt adapter: sell developments in fixed board order, then pledge properties in fixed board order, then allow normal bankruptcy. It does not call another KludgopolB AI as a fallback.
- Strategy decisions are deterministic. Dice, shuffled card decks and the other players remain game randomness, not Pazifik decision randomness.

## Integration

Pazifik uses the same `CPU_PROFILES`/`Game` player interface as the seven KludgopolB agents. `profile.strategy === "pazifik-simple-ai"` selects the historical behaviour at the existing decision points; there is no second game engine or parallel AI runtime.

The current KludgopolB auction engine represents CPU bidding by a deterministic maximum willingness to pay and resolves the winning price at one coin above the next-best ceiling. For Pazifik, its exact repeated `+1` rule is therefore represented by the strict historical ceiling while parity tests exercise the literal `highestBid + 1` decision function.
