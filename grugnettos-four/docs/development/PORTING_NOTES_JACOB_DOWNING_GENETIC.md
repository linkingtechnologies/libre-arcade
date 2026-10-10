# Jacob Downing genetic neural network porting notes

## Historical identity

- Project: `jacobjdowning/genetic-connect-four`
- Preserved revision: `0b0f78f20c807f25fcfa027a02e407bd0b96b64c`
- Revision date: 2019-04-15
- License: MIT
- Original language: Python 3 + NumPy

The project evolves a population of 50 fully connected `42 → 25 → 7` networks. Every ordered pair plays once per season. The best five to ten networks survive; children are created by node-wise crossover and two mutated nodes. Hidden and output layers use ReLU, followed by output softmax. A network sees its own pieces as `+1`, its opponent as `-1`, and selects the largest output.

## Reproducible snapshot

The repository contains no trained `population.json`. `tools/train-downing-genetic.py` invokes the preserved trainer with explicit NumPy and Python seeds. The bundled model uses:

- seed `20190415`;
- 100 generations after the initial season;
- population 50;
- two mutated nodes per child;
- final internal league record 79–19.

Weights remain JSON `float64` values. JavaScript inference is tested against the original Python/NumPy implementation to `1e-12` on multiple positions.

## Adapter boundary

The original policy may choose a full column; in its own game loop that immediately loses the game. ConnectLab's common contract permits only legal columns and has no resignation result. The adapter therefore retains the complete seven-output ranking but selects the highest-ranked legal column when the historical maximum is full. Such decisions report `adapterFallback: true` and preserve `historicalColumn` in the Arena trace.

This is the only material runtime adaptation. It is documented rather than hidden.
