# BriscolaBot v3 model assets

This directory contains the original upstream MIT-licensed
`briscola-bot-v3.onnx` model used by the normal browser player plus two derived
benchmark artifacts generated from that exact binary.

## Upstream model

- file: `briscola-bot-v3.onnx`
- size: 474,612 bytes
- SHA-256: `ab6fed4667cb9ddbacdd394d717108233ab2dbdced7ee4440d0bdfbce1cb53d2`
- input: `input`, `float32[1,202]`
- output: `action`, `int64[1]`
- actor: 162 -> 256 -> 256 -> 40 with Mish activations
- final selection: legal mask + categorical `Multinomial`

The browser loads this original model lazily only when BriscolaBot is selected.

## Deterministic benchmark artifacts

`briscola-bot-v3-policy.bin` contains the six actor tensors extracted directly
from the ONNX initializers, in this order:

1. `actor.0.weight` `[256,162]`
2. `actor.0.bias` `[256]`
3. `actor.2.weight` `[256,256]`
4. `actor.2.bias` `[256]`
5. `actor.4.weight` `[40,256]`
6. `actor.4.bias` `[40]`

It contains exactly 117,800 little-endian float32 values (471,200 bytes).
`briscola-bot-v3-policy.json` records offsets and source-model SHA-256.

`briscola-bot-v3-logits.onnx` is a derived graph with the same nodes and weights
but exposes `/Where_output_0`, the masked 40 policy logits immediately before
the upstream stochastic sampling path. It is included for inspection and future
runtime validation; the Node benchmark uses the compact extracted weights.

All hashes are recorded in `SHA256SUMS`.
