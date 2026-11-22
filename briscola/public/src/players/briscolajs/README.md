# Briscola.js S0 / S1

Behavioral reconstruction of the AI contained in Calogero Miraglia's historical
`briscola.js` browser demo bundle.

## Archaeological finding

The deployed demo contains three generic search modules / strategies:

- `minimax_decision`: full terminal Minimax (present in the bundle, not selected
  by the single-player UI);
- `alpha_beta_search`: the same full terminal search with alpha-beta pruning;
- `S0`: handcrafted heuristic;
- `S1`: the actual single-player CPU, using `S0` while `n_round < 18` and
  `alpha_beta_search` from round 18 onward.

`S0` leads the first card from six ordered buckets: zero-point non-trumps,
zero-point trumps, 2-4 point non-trumps, 2-4 point trumps, 10-11 point
non-trumps, 10-11 point trumps. Within a bucket it prefers the weaker card. When
replying it chooses the card maximizing the immediate score differential after
that trick.

At round 18 the stock is exhausted. BriscoLab reconstructs the opponent's
remaining hand strictly from public information (full deck minus own hand,
played cards and current table) before alpha-beta. No private engine state is
exposed to the adapter.

## Licensing boundary

The recovered upstream repository/package and deployed bundle contain no
explicit license for the author's own Briscola.js code. Therefore BriscoLab does
**not** redistribute the upstream bundle or copy its source. The files in this
directory are a fresh GPL-3.0-only behavioral implementation of the documented
algorithmic behavior. Keep the upstream licensing status marked `UNVERIFIED` in
provenance records unless an explicit grant is recovered.
