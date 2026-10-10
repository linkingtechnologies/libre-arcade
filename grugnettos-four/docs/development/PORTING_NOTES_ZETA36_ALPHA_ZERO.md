# Zeta36 AlphaZero porting notes

## Historical identity

- Project: `Zeta36/connect4-alpha-zero`
- Preserved revision: `511150874845335c8687a1a4a8e6bcbc43207fe3`
- Last revision: 2018-04-22
- Copyright: Samuel Gravan; upstream credits portions to Ken Morishita
- License: MIT
- Original stack: Python 3.6, Keras 2.0.8, TensorFlow 1.3

Unlike the retrained M8 and M9 agents, M10 includes the upstream `BestModel`: `model_best_config.json` and `model_best_weight.h5` are preserved unchanged.

## Network preserved

- input: two `6×7` planes, current player then opponent;
- initial `3×3`, 128-channel convolution;
- two 128-channel residual blocks;
- policy head: `1×1×2`, batch normalization, ReLU, dense softmax to seven columns;
- value head: `1×1×1`, batch normalization, ReLU, dense 256, tanh scalar;
- 48 tensors, 2,430,348 bytes, losslessly retained as float32.

`tools/convert-zeta36-model.py` repacks the HDF5 tensors without quantization. An independent NumPy/HDF5 oracle generates policy/value vectors; browser inference agrees within `4e-7`.

## Search preserved and bounded

The port retains current-player input orientation, policy priors, value perspective conversion, persistent search statistics, PUCT selection, legal-action masking, terminal backup and most-visited final choice. Interactive upstream settings use `c_puct = 1`, no root noise and 50 simulations, with a possible second thinking loop.

Pure JavaScript convolution is intentionally dependency-free but slower than the original GPU TensorFlow runtime. ConnectLab therefore exposes deterministic budgets of 2, 4 and 8 simulations. This is an explicit browser budget adaptation: the default two-simulation player is not presented as equivalent in strength to upstream's 50–100 simulations.

Parallel virtual loss is omitted because the browser adapter searches sequentially. With no parallel workers, virtual loss has no algorithmic role.
