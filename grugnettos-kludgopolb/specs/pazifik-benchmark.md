# Pazifik benchmark — Grugnetto board v1.3

Pazifik is a clean behavioural reimplementation of the documented **JAtlantik r36 `atlantik.ai.SimpleAI`** strategy. The implementation does not translate or import JAtlantik Java code.

> Historical AI reimplementation based on the documented behavior of JAtlantik r36 SimpleAI.

## Method

The benchmark uses the frozen **Grugnetto board v1.3** and the same engine used by the playable game. Results are reproducible from `scripts/benchmark-pazifik.js`.

Three samples are preserved:

- `pazifik-benchmark-600.json`: 50 head-to-head games against each of the seven KludgopolB friends (350 games total), plus 30 games with all eight CPU agents, turn cap 600.
- `pazifik-benchmark-1500-pair.json`: 20 head-to-head games per opponent, turn cap 1500, used to check whether apparent stalls disappear with a much larger cap.
- `pazifik-benchmark-1500-multi.json`: 20 all-eight games, turn cap 1500, used for crowded-game survival and bankruptcy measurements.

A game reaching the turn cap is recorded as a **strategic stall/capped game**, not as an engine deadlock. The engine remains responsive and deterministic; the usual cause is property fragmentation combined with Pazifik's historically faithful refusal to trade.

## Findings

### Relative strength

Across the 350 head-to-head games at cap 600, Pazifik completed a win in **49 games (14%)**. Pairwise completed-win rates ranged from **6% vs Hans** to **20% vs Zilla**. Many two-player matches did not finish within the cap, so completed-win rate should not be read as a conventional win probability.

In the longer all-eight sample (20 games, cap 1500), Pazifik:

- won **0/20** games;
- went bankrupt in **90%** of games;
- had average final rank **5.1 / 8**;
- was the first bankruptcy in **15%** of games;
- was among the first two bankruptcies in **35%** of games.

This supports the player-facing **Easy** classification.

### Match duration and stalls

Two-player games are Pazifik's unusual case. At cap 600, **56%–90%** of matches reached the cap depending on the opponent. Raising the cap to 1500 did not remove the pattern: **55%–90%** still reached the cap.

This is not a code deadlock. Pazifik never proposes trades and normally refuses incoming trades. On a board whose worlds contain four locations, ownership can become split so that neither side completes a world, development remains limited, and repeated pass-start income inflates cash balances.

All-eight games are more decisive. In the 20-game cap-1500 sample, **75%** reached a natural winner, with an average of **760.7 turns** and median **599 turns**. Pazifik's own high bankruptcy rate usually removes it well before the end.

### Auctions

Pazifik is aggressive when buying directly but conservative in auctions. In the 350 head-to-head sample it saw only **139 auctions** and participated in **134**. It won essentially none against normal opponents; most of its auction wins were against Lemming, often for **1 coin**.

The historical rule is preserved directly in parity tests: Pazifik bids exactly `highestBid + 1` only while that next bid is strictly below both nominal property price and its current cash.

### Cash and development

Pazifik's average sampled cash in the long all-eight sample was about **1438 coins**, but it still went bankrupt in 90% of games. In long two-player capped games, average cash rises into the thousands because stalled ownership causes repeated pass-start income; those values are therefore not evidence of good money management.

Pazifik's building rule is genuinely aggressive **when a complete world exists**. In head-to-head samples it built roughly **1.4–8.7 embellishments per game**, depending on opponent/sample. In the long all-eight sample it averaged **0 embellishments**, because it rarely completed a four-location world and it never trades to finish one. The apparent contradiction is strategic, not an implementation error: it builds immediately whenever it is actually allowed to build.

## Player-facing interpretation

Pazifik is best described as an **easy, deterministic, impulsive builder**:

- buys almost anything it can pay for outright;
- builds immediately once it controls a full world;
- preserves almost no liquidity;
- bids cautiously relative to its direct-buy behaviour;
- does not trade;
- is highly predictable;
- is weak in crowded games;
- can make two-player games unusually long because it refuses to trade.
