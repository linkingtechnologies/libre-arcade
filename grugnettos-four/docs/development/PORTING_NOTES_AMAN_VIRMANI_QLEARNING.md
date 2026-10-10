# Aman Virmani Q-learning porting notes

## Preserved upstream

- Project: `AmanVirmani/Connect4-AI`
- Commit: `0d08f2ba9408218936ddc82987ba5bd6b1afa346`
- Date: 2020-05-21
- License: BSD-3-Clause
- Historical parameters: `alpha=0.1`, `gamma=0.6`, epsilon starts at 1, minimum 0.01 and decay 0.995.
- Historical update: `(1-alpha)*old_q + alpha*(reward + gamma*next_max)`.
- Terminal agent win is written directly as `1`; a loss after the random reply is written directly as `-1`.

The preserved source is in `reference/aman-virmani-connect4-ai/`. Checksums cover the source, README, entry point, commit marker and license.

## Missing upstream artifact

Both `main.py` and `utils/qlearning.py` try to load `q_table_1.pickle`, but that file is absent from every upstream commit. No trained weights are attributed to Aman Virmani in M11.

## Reproducible ConnectLab snapshot

`tools/train-virmani-qlearning.mjs` replays the published update and exploration schedule with a seeded xorshift32 generator. It trains 10,000 episodes as player one and another 10,000 as player two against legal uniformly random replies. The second-seat pass is the minimum adapter extension needed because the historical trainer only controls player one, while every ConnectLab Arena participant must play both colours.

The packed payload contains 115,589 `(seat, state, action, float32 Q)` records in 1,618,259 raw bytes before base64. Board states use a collision-free base-3 integer in top-to-bottom row-major order. Unknown legal actions retain the historical default value zero; equal maxima use the supplied seeded Arena RNG.

## Verification boundary

Tests cover the exact update equation, payload header and record counts, both seats, legal moves and deterministic replay. A byte-for-byte upstream model comparison is impossible because upstream never published its pickle and depends on an external Gym environment whose precise version is not pinned. M11 labels the payload as derived rather than historical.
