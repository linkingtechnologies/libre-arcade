# Giacomelli πG / πH / πC

Faithful BriscoLab ports of the three deterministic policies published by Piero Giacomelli in
*Beyond the Briscola Advantage: A Monte Carlo Dominance Test for Deterministic Strategies in Two-Player Briscola Game* (2026).

Upstream source: `https://github.com/pgiacome/BriscolaPaperSourceCode`  
Upstream language/runtime: C# / .NET 8  
Upstream license: MIT.

- **πG — Greedy**: cheapest non-trump lead; as follower, cheapest in-suit winner, otherwise cheapest winning trump, otherwise cheapest card.
- **πH — Hoarder**: same conservative lead; only spends a trump as follower when the opponent card is worth at least 10 points.
- **πC — Counter**: πH plus public-card memory and the published `carico` trap on lead.

The adapter preserves πC's initial exposed-trump memory even after that card is later drawn.
