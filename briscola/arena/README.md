# BriscoLab Arena

The Arena is BriscoLab's technical simulation area. It is intentionally not part
of the human-play web UI.

## Compact core round robin

The historical/default group is the current 16-player core set, including
πG/πH/πC, CardFramework Cpu0/1/2, and Briscola.js S0/S1. The 23 PoIAna checkpoints stay outside
this default command so an ordinary benchmark does not silently expand to the
full 39-player registry.

```bash
npm run arena:round-robin -- [seedPairs] [seedStart] [outputBase]
```

Example:

```bash
npm run arena:round-robin -- 1000 1 arena/results/round-robin-16players
```

## PoIAna family round robin

Runs all 23 PoIAna models against one another using their deterministic pure-JS
neural evaluator. The default is deliberately 100 seed pairs because there are
253 distinct pairings.

```bash
npm run arena:poiana -- [seedPairs] [seedStart] [outputBase]
```

Example:

```bash
npm run arena:poiana -- 100 1 arena/results/poiana-23players
```

## Head-to-head

Any of the 39 registered identities can be used:

```bash
npm run arena:head-to-head -- <playerA> <playerB> [seedPairs] [seedStart] [outputBase]
```

Examples:

```bash
npm run arena:head-to-head -- qbriscola briscolabot-v3 10000 1
npm run arena:head-to-head -- poiana-blooming-bird briscolabot-v3 1000 1
npm run arena:head-to-head -- poiana-toasty-pine poiana-devout-paper 1000 1
```

## Single-player benchmark

```bash
npm run arena:player -- <player> [seedPairs] [seedStart] [outputBase]
```

The comparison opponent set is the compact 16-player core/historical registry. This is
useful for measuring one PoIAna model against the previously established
BriscoLab baseline without automatically benchmarking it against the other 22
PoIAna checkpoints.

## Deterministic PoIAna inference

The browser uses the original `.onnx` files through ONNX Runtime Web. The Arena
uses `PoianaDeterministicRuntime`, a dependency-free evaluator fed by float
weights mechanically extracted from those same ONNX graphs. This keeps CLI
benchmarks reproducible and avoids introducing an ONNX Node runtime dependency.

The normative benchmark rules are in [`../specs/arena-benchmark.md`](../specs/arena-benchmark.md).
