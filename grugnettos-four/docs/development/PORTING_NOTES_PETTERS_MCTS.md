# PetterS MCTS porting notes

## Preserved behavior

- UCT child score: `wins / visits + sqrt(2 * log(parentVisits) / visits)`;
- a uniformly selected untried move, removed with the original swap-and-pop operation;
- uniformly random legal rollouts to a terminal state;
- results recorded from each node's `player_to_move` perspective;
- independent root trees, aggregated by move;
- final move score with the original Beta(1,1) prior: `(wins + 1) / (visits + 2)`;
- Connect Four move order, gravity, winner detection and draw score.

## Deliberate integration changes

The C++ library normally creates eight worker threads and uses `std::mt19937_64`, seeded separately for each tree. The browser port evaluates eight trees sequentially to avoid worker infrastructure and uses a compact seeded JavaScript generator. This preserves the search structure and makes Arena replays deterministic, but it is not a seed-for-seed random-stream port.

The upstream command-line demo uses large fixed budgets. ConnectLab exposes 100, 500, 2,000 and 10,000 iterations per tree, with eight trees by default, so the UI can trade response time for search strength.

The neutral player contract receives a column-major board whose pieces use Arena player IDs. The adapter remaps the side to move to `1` and the opponent to `2`, then returns a zero-based column. The historical search classes remain unaware of the UI and tournament engine.

## Verification

`test/petters-mcts-parity.mjs` compiles an oracle against the preserved C++ `ConnectFourState` and compares legal moves, winner, side to move and result values over scripted positions. It also checks deterministic seeded MCTS behavior and an immediate tactical win. Exact C++/JavaScript MCTS move parity is intentionally not asserted because the PRNG algorithms differ.
