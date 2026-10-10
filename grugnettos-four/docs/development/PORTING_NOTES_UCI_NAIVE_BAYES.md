# UCI Connect-4 → dependency-free Naive Bayes

M14 introduces supervised learning, a family not represented by the first
thirteen players. The immutable upstream artifact is a labelled dataset, not a
playable program, so the GPLv3 adapter and trainer are original ConnectLab code.

The trainer counts each categorical value (`x`, `o`, `b`) for each of 42 cells
conditioned on each outcome (`win`, `loss`, `draw`). Browser inference sums
log-probabilities with selectable Laplace smoothing α = 0.5, 1 or 2. Each legal
afterstate is evaluated as `P(win) - P(loss)` for player one, with sign reversed
for player two. Equal values use deterministic centre-first ordering.

UCI numbers cells bottom-to-top within columns; ConnectLab stores them
top-to-bottom. `encodeUci()` performs the explicit reversal. Immediate wins and
single forced blocks are handled before classification, because the dataset
explicitly excludes positions with a forced next move.

The full-data resubstitution accuracy at α=1 is 48,779 / 67,557 (72.204%). This
is a reproducibility diagnostic, not an unbiased test score. More importantly,
the source contains only eight-ply positions: use at any other game phase is
out-of-distribution. The player is therefore a historical/data-science exhibit,
not a solver and not claimed to be optimal.
