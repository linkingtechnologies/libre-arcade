# PoIAna agents

This folder integrates the pretrained agents shipped by Ivan Ravasi's PoIAna
Briscola game. The upstream game exposes 23 ONNX models as selectable opponents.
BriscoLab keeps each model as a separate player identity.

## Upstream contract

The adapter is based directly on the supplied upstream files preserved under
`reference/poiana/`:

- `OnnxState.cs`: exact 519-value one-hot observation layout;
- `OnnxOpponentStrategy.cs`: ONNX input name/shape and integer action output;
- `Hand.cs` behavior (documented in the adapter): action index 0..2 is decremented
  until it refers to an existing card when the hand contains fewer than 3 cards;
- `SelectorMenu.cs`: model names and published win rates;
- `briscola-rl` training sources: Gymnasium observation/action spaces and ONNX export.

The original ONNX files are bundled unchanged under `assets/models/poiana/`.
For deterministic Node/Arena execution BriscoLab also stores `*-policy.bin`
files containing the six float tensors extracted verbatim from each ONNX graph.
The evaluator mirrors the graph: two 64-unit ReLU layers and either a 3-action
DQN head or, for `toasty-pine` and `devout-paper`, a 50-quantile QR-DQN head.

## Important fidelity quirk

The Godot application passes a 1-based trick counter to the model, except when
PoIAna itself leads the first trick, when the value is still zero. BriscoLab
preserves this deployed behavior in `poianaTurn()` rather than silently
normalizing it to the training environment's zero-based counter.

The win-rate values shown in the browser are upstream PoIAna metadata. They are
not interchangeable with BriscoLab Arena results.
