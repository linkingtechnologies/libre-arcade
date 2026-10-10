# Markus Thill TD n-tuple porting notes

## Historical agent

The selected `C4.TCL-EXP-lam0.0` export contains two learned value functions: one for positions where player one is to move and one for player two. Each uses 70 eight-cell n-tuples. Every sampled cell has four states: unreachable empty, player one, player two and directly reachable empty. Mirrored features are evaluated in addition to the original tuple orientation.

The Java agent sums active LUT weights and applies its historical interpolated `tanh`. For a move it evaluates the resulting after-state using the table belonging to the opponent's turn, reverses the sign for player two and keeps the first best value encountered. Immediate wins bypass the network.

## Sparse browser representation

The two original text files contain 9,175,040 weight slots, mostly zero. `tools/build-thill-weights.py` parses the preserved ZIP and emits a packed sparse representation containing every non-zero index and its IEEE-754 single-precision value. The result contains 740,863 weights in 4,446,306 bytes before base64 wrapping. No quantization, pruning or retraining is performed.

At runtime the adapter performs binary search inside each sorted sparse table. This keeps the browser dependency-free and synchronous, as required by the common player contract.

## Compatibility and verification

Lookahead 0 is the closest historical inference mode. Optional levels 1–3 reproduce the documented idea of searching ahead and evaluating leaves with the trained n-tuple network.

`test/markus-thill-td-parity.mjs` checks model dimensions, the exact non-zero count, seven independently generated linear evaluation vectors, the learned center opening and an immediate tactical win. The selected original archive is protected by SHA-256.
