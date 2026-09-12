# Cuperativa Briscola AI

Faithful JavaScript port of the `:master` algorithm found in:

`CuperativaSoloRuby/src/games/briscola/alg_cpu_briscola.rb`

Source snapshot analyzed: `CuperativaSoloRuby-master`, 2021-04-03.
Original license: **MIT** (see `MIT.LICENSE` in the original repository).

## Separation

- `CuperativaAI.js`: faithful algorithm port; it still uses original labels such as `_Ab`, `_3d`, `_Fs`.
- `CuperativaCard.js`: original deck-label mapping, ranking, and point values.
- `CuperativaAdapter.js`: the only component that knows both BriscoLab `PlayerObservation` and the Cuperativa state format.

The original algorithm mainly uses heuristic weights, current score, the exposed
trump card, the number of cards remaining in the stock, and `strozzi_on_suite`
(how many Ace/Three cards of each suit are still unaccounted for). The weights
and R1...R12 rule ordering are intentionally preserved, including quirks of the
original Ruby implementation.
