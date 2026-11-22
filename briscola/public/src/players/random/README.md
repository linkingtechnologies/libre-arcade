# Random baseline

`RandomAdapter` is a BriscoLab-native benchmark control, not a historical AI
port. On every turn it selects one card uniformly from the cards in the public
`PlayerObservation.hand`.

The RNG is BriscoLab's `SeededRandom`, so Arena simulations are reproducible and
can assign independent player seeds when seats are swapped.

This baseline is intentionally weak. Its purpose is to make benchmark results
easier to interpret: an integrated AI should normally outperform uniform random
play by a meaningful margin.
