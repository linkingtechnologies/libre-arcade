# Grugnetto friend profiles

The player-facing friend cards describe the CPU opponents available on the current frozen **Grugnetto board v1.3**.

Seven are preserved KludgopolB CPU personalities. **Pazifik** is different: it is a clean historical behavioural reimplementation of JAtlantik r36 SimpleAI, integrated through the same `CPU_PROFILES` / `Game` AI interface.

They do **not** change the historical strategy parameters. The player-facing labels are a UI layer derived from automated play on the restored engine.

Configuration lives in `config/players/ai-profiles.json`; localized copy lives under `config/players/i18n/`.

Current player-facing archetypes:

- **Wallace — Champion**: strongest overall in duel verification and among the strongest with many players.
- **Hans — Multiplayer specialist**: especially effective in crowded games.
- **Zilla — Expert strategist**: strong and consistent across formats.
- **Queen — Balanced expert**: close to Zilla in head-to-head play and generally reliable.
- **Lost Soul — Unpredictable**: can surprise in duels but performs poorly in crowded games.
- **Mimrock — Intermediate**: suitable as a fair step up from beginner opposition.
- **Pazifik — Buy first, think later**: deterministic, impulsive buyer/builder, poor cash manager, almost no auction appetite relative to direct buying, and no trading. Easy overall; two-player games can become unusually long.
- **Lemming — Beginner**: deliberately weak and suitable for first games.

Pazifik's dedicated benchmark and preserved raw results live in `specs/pazifik-benchmark*.json` and `specs/pazifik-benchmark.md`.
