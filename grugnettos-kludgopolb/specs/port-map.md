# Port map: KludgopolB (Java) to JavaScript

Baseline: the KludgopolB release set of 2012-12-24 from SourceForge. The audited
archives are identified by hash in
[`../reference/EXTERNAL_ARTIFACTS.md`](../reference/EXTERNAL_ARTIFACTS.md) and
are not redistributed, so the Java names below are the ones this project's own
source comments and specs record, not a listing that can be re-derived from the
public package. See [`../PROVENANCE.md`](../PROVENANCE.md).

## Verification level

Per the collection's verification hierarchy (`../../AGENTS.md`):

- **Trading, valuation and profiles: level 3, documented source-level
  equivalence review.** The Java was read function by function and transcribed,
  not redesigned. No run of the original Java against the port is recorded in
  this project, so no executable-oracle (level 1) comparison is claimed and the
  port's outputs are not known to match the original's. The transcription is
  careful about numeric behaviour: `addJavaLong` and `trunc` in
  `src/core/trading.js` reproduce Java's narrowing of a compound assignment to
  `long`.
- **Everything marked "not parity-complete" below: unverified against the
  source.** It is playable and tested for internal consistency, but it is a
  stand-in until a line-by-line port replaces it (see
  [`parity.md`](parity.md)).
- **Pazifik: behavioural specification, not a port.** See
  [`pazifik.md`](pazifik.md).

## Map

| Original (Java) | JavaScript | Status |
| --- | --- | --- |
| `gui/outofgame/PlayerSelectionWindow.java` CPU profile values | `src/players/profiles.js` (`CPU_PROFILES`) | Transcribed: Mimrock, Zilla, Queen, Wallace, Hans, Lost Soul, Lemming |
| `PlayerCPU` (one class configured into seven profiles) | profile-driven decisions in `src/core/game.js`, `src/core/valuation.js`, `src/core/trading.js` | Preserved as parameterisation of a shared heuristic |
| `PlayerCPU.buytendancy` | none | Never assigned or consumed elsewhere in the recovered source; not invented, noted in [`ai.md`](ai.md) |
| Property valuation (price plus rent weighted by landing frequency, group-completion bonus) | `propertyValue`, `siteSetBonus` in `src/core/valuation.js`; `currentSiteGainCost`, `currentSiteSetGain` in `src/core/trading.js` | Ported; the Java class carrying it is not named in this project's docs |
| Hub and service valuation (service uses E(2d6) = 7) | `currentHubGainCost`, `currentServiceGainCost` in `src/core/trading.js` | Ported concept |
| Auction valuation with a small random uplift | `propertyValue(..., { randomUplift })` | Uplift ported; auction scheduling and timing are not parity-complete |
| `Property` defaults: 50% pledge gain, 5% redeem interest | `pledgeGain`, `redeemPrice` in `src/core/trading.js` | Constants reproduced |
| `PlayerCPUTrader` | `proposeCpuTrade` in `src/core/trading.js`; `Game.attemptTrade` in `src/core/game.js` | Ported: every eligible target is considered, worthwhile proposals are kept and shuffled, one is offered |
| `CurrentState.removefromtrade` | `removeFromTrade`, `partitionSelectedSites` in `src/core/trading.js` | Ported: group-aware filtering |
| `CurrentState.getTotalGainCostLoss` | `totalGainCostLoss` | Ported |
| `CurrentState.getTradingChanges` | `tradingChanges` | Ported: target properties are valued first, then trader properties on the updated ownership |
| `CurrentState.getTotalGain` | `totalGain` | Ported |
| `TradeAccepterWindow`, CPU target branch | `targetAcceptsCpuTrade` in `src/core/trading.js` | Ported: independent stochastic acceptance; an empty proposal is cancelled before the target decides |
| Rule that a site cannot be traded while its group is developed | `canTradeIndexes` | Ported |
| 2d6 movement, doubles, three doubles to detention; ownership, rent, groups, progressive development rents; pledge and liquidation path | `src/core/game.js` | Ported concepts per [`parity.md`](parity.md) |
| Auction scheduling and timing, automatic purchase policy, development decisions, debt liquidation order, event-card effects, detention exit strategy, pledge-interest effects in trades | `src/core/game.js` | Implemented, not parity-complete |
| Detention-release cards in trades; pending-purchase permutations in the trade dialog; limited-embellishment inventory auctions; configurable rule presets; the original `.conf` parser | none | Not ported |
| Several independent unseeded `java.util.Random` instances | `SeededRng` streams derived from one game seed (`src/core/rng.js`) | Deliberate deviation: no decision formula changed, games become replayable |
| UK/US board definitions and card stacks | none | Not used; the game plays on an original Grugnetto board, see [`board-design.md`](board-design.md) |
| Original Java GUI windows | `public/src/ui/` | Replaced, not ported; no original behaviour to be faithful to |
| JAtlantik r36 `atlantik.ai.SimpleAI` | Pazifik branches selected by `profile.strategy === 'pazifik-simple-ai'` in `src/core/game.js` and `src/players/profiles.js` | Behavioural reimplementation from documented behaviour; no code ported |
