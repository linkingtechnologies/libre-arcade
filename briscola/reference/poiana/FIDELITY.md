# PoIAna fidelity notes

## Observation contract

`OnnxState.FlatOneHot()` produces exactly **519 float32 values**. BriscoLab's
`PoianaVectorizer.js` follows the same segment order and one-hot cardinalities:

1. briscola card: 31
2. hand: 3 × 31
3. hand size: 4
4. my points: 121
5. order: 2
6. opponent hand size: 4
7. opponent points: 121
8. remaining deck cards: 41
9. table: 2 × 31
10. turn: 40

Total: 519.

Italian BriscoLab ranks 8/9/10 map to the upstream Jack/Knight/King enum values
11/12/13. Suits map Spade→Swords(1), Denari→Coins(2), Coppe→Cups(3),
Bastoni→Batons(4).

## Action contract

The ONNX policy returns one integer action in `0..2`, meaning the current hand
index. The upstream `Hand.TakeCard()` repeatedly decrements the predicted index
when the hand has fewer slots remaining; BriscoLab preserves this behavior.

## Deterministic Arena evaluator

All six neural-network tensors are extracted verbatim from each supplied ONNX
graph into a `*-policy.bin` file. The evaluator mirrors the graph operations:

- 21 models: 519 → 64 ReLU → 64 ReLU → 3 Q-values → ArgMax.
- `toasty-pine` and `devout-paper`: 519 → 64 ReLU → 64 ReLU → 150 quantile
  values → reshape `[50,3]` → mean over 50 quantiles → ArgMax.

For the 21 DQN models that have corresponding Stable-Baselines3 checkpoints in
the supplied `briscola-rl` snapshot, every one of the six exported ONNX tensors
was compared with the checkpoint `q_net` tensor and matched **bit-for-bit
(21/21 models)**. Aliases present upstream were accounted for:

- `selfplay-best.onnx` ↔ `best_model.zip`
- `mild-aardvark.onnx` ↔ `mild-aaldvark.zip`

The two QR-DQN models do not have same-name checkpoints in the supplied training
snapshot; their evaluator structure is derived directly from their supplied ONNX
graphs, including reshape `[50,3]`, `ReduceMean(axis=1)`, and first-index ArgMax.
