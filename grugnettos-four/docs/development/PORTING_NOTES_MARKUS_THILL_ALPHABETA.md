# Markus Thill AlphaBeta — porting notes

## Preserved design

The adapter derives from the MIT-licensed `c4/AlphaBetaAgent.java` preserved at commit `2a58844594ac022846385dd3ddc8bbbf0a26eae5`. It retains the project's compact 42-bit board orientation, center-biased move ordering, iterative alpha-beta search and transposition reuse. The board mapping is tested directly against `ConnectFour.fieldMask`.

## Browser boundary

Upstream can optionally load 8-ply and 12-ply opening databases. Those binary databases are not present in the retained repository and ConnectLab does not invent substitutes. Browser searches are capped at 1,000, 10,000 or 100,000 nodes. The decision is marked `exact` only for an immediate win or when every remaining ply was completed.

The port uses a deterministic open-four heuristic only at an interrupted horizon. Therefore “Markus Thill AlphaBeta” describes the preserved search family and representation, not bit-identical behavior at every bounded position and not perfect opening play.

## Verification

Ten positions and expected columns come from the preserved `AlphaBetaAgentTest.java`; they pass at the 10,000-node profile. A separate position with six empty cells completes the entire game tree and checks transposition hits. `javac` is unavailable in the build runtime, so this milestone verifies against the retained Java assertions rather than claiming a newly executed Java/JavaScript oracle comparison.
