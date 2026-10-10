# Markus Thill MCTS porting notes

## Preserved search structure

- one root tree instead of PetterS-style root parallelization;
- progressive expansion in the state's action order;
- UCB exploitation from the opponent child perspective;
- exploration constant `2 * sqrt(2)` and epsilon tie noise;
- uniformly random terminal rollouts;
- negamax sign inversion at every backpropagation step;
- immediate winning-move shortcut;
- final preference for the most visited root action;
- best-value fallback when every expanded child has the same visit count;
- search for a reusable matching subtree up to six levels below the previous root.

## Integration adaptations

The original Java classes keep static `java.util.Random` instances with no reproducibility contract. The browser adapter uses a deterministic generator derived from the Arena seed and current ply. Seed-for-seed Java parity is therefore neither possible nor claimed.

The original `ConnectFour.generateMoves(player, true)` applies a large handcrafted ordering routine. ConnectLab keeps deterministic left-to-right legal action order; all selection, expansion, UCB, rollout and backup rules remain unchanged. This boundary is explicit because action order affects finite-budget MCTS results.

The original tree can be retained between calls. The neutral adapter searches the old tree for the externally supplied position, detaches a match as the new root and reports whether reuse occurred.

## Verification

`test/markus-thill-mcts.mjs` verifies seeded determinism, immediate tactical victory, the historical UCB constant, tree lookup and parameter validation. The global round-robin regression runs all seven common player factories twice with identical seeds and compares every move trace.
