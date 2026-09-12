# Arena benchmark contract

The Arena exists only for AI-vs-AI simulation and measurement. It is deliberately
separate from the human-play browser UI.

## Location

- scripts: `arena/scripts/`
- canonical/historical results: `arena/results/`

## Comparative benchmark rules

For a head-to-head comparison:

1. use the same game seed for both seating arrangements;
2. play each seed twice with the players swapped;
3. give stochastic players separate deterministic player seeds when supported;
4. use only normal public `PlayerObservation` data;
5. validate every action through the normal game engine;
6. report wins, draws, total points, average points, seed start, and seed count.

Round robin with `N` players and `S` seed pairs produces:

```text
N * (N - 1) / 2 * S * 2 games
```

With 8 players and 1,000 seed pairs this is 56,000 games.

## Determinism

Canonical JSON results must contain no timestamps or machine-specific metadata.
Identical code, models, seeds, and parameters should produce byte-equivalent
result data where all players expose controllable randomness.

BriscolaBot's browser ONNX model retains its original internal `Multinomial`
behavior. Arena uses the documented deterministic policy runtime built from the
same actor parameters and samples with BriscoLab's controlled RNG.

## Outputs

Scripts write both:

- `.json` for machine processing;
- `.md` for human review/Git hosting.

Generated results must never be stored alongside source scripts.
