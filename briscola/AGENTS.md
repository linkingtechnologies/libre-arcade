# BriscoLab Agent Guidelines

## Mission

BriscoLab preserves, ports, integrates, and benchmarks historical and modern
Briscola AIs under one independent two-player game engine.

The primary goal is **comparability with provenance**, not modernization of old
algorithms.

## Required reading

Before changing code, read the relevant documents under `specs/`, especially:

- `specs/architecture.md`
- `specs/player-interface.md`
- `specs/player-observation.md`
- `specs/adapter-guidelines.md`
- `specs/faithful-porting.md`
- `specs/arena-benchmark.md`

## Language

- All new BriscoLab identifiers, comments, tests, debug messages, and technical
  documentation must be written in English.
- Legacy identifiers may remain in their original language inside faithful ports
  when that improves line-by-line comparison with upstream code.
- Adapters must use English identifiers and comments even when the wrapped port
  retains legacy names.
- Files copied under `reference/` remain upstream material and are exempt.

## Faithful ports

- Preserve the original decision algorithm before attempting any improvement.
- Preserve upstream quirks and bugs when they can affect card selection or state.
- Do not silently fix, optimize, reorder, simplify, or reinterpret a faithful
  port.
- Never optimize a faithful port in place.
- If an improved variant is desired, create a separately named player and keep
  the faithful player unchanged.
- Document every intentional deviation from upstream behavior.
- Whenever feasible, validate the port against the original implementation as an
  oracle over randomized states.
- Keep oracle harness changes outside the preserved upstream reference files, or
  document any unavoidable compatibility patch precisely.

## Engine boundary

- The game engine owns rules, shuffle, turns, draw order, scores, hidden state,
  and action validation.
- Players must receive only `PlayerObservation`.
- Never expose the opponent hand, hidden stock order, future draws, or other
  private engine state to an AI.
- Adapters may remember information that was legitimately public earlier in the
  game, such as the originally exposed trump card.
- The engine must validate every returned action even for trusted players.

## Player API

- Expose integrated players through `async chooseAction(observation)`.
- Return a normal BriscoLab action such as:

```js
{
  type: "PLAY_CARD",
  cardId: "denari-3"
}
```

- Optional `debug` metadata may explain the decision but must not change game
  semantics.
- Stateful adapters must implement `reset()` when state can survive across
  games.

## Adapters

- Keep upstream data models inside ports and BriscoLab data models outside them.
- The adapter is the only intended translation boundary between those models.
- Do not leak BriscoLab engine objects into a faithful port solely for
  convenience.
- Preserve legacy hand ordering or persistent public memory when the upstream
  player depends on it.

## Reference sources

- `reference/` is organized one folder per integrated player, even when multiple
  players come from the same upstream project.
- Preserve upstream source files verbatim whenever possible.
- Add provenance documents rather than rewriting upstream headers.
- Never fabricate missing upstream source and present it as original reference
  material.

## Arena

- All AI-vs-AI simulation and benchmark tooling belongs under `arena/`.
- Do not add tournament or benchmark behavior to the human-play web UI.
- Reuse the central Arena player registry instead of duplicating player creation
  logic across scripts.
- Use deterministic game seeds whenever possible.
- For stochastic players, use an independently controlled player seed when the
  implementation permits it.
- Test both seating positions for every seed in comparative benchmarks.
- Store generated result artifacts under `arena/results/`, separate from scripts.
- JSON results should remain machine-readable and deterministic for identical
  inputs; do not add timestamps or environment noise to canonical result data.

## Tests

- Add regression tests for every new adapter or algorithm integration.
- Test that adapters return only legal actions.
- Test state resets for stateful adapters.
- When port fidelity is claimed, add an oracle comparison or a documented
  equivalent verification method.
- Run `npm test` before release packaging.
- Run a small Arena smoke benchmark after changes to Arena infrastructure.

## Licensing

- BriscoLab project code is `GPL-3.0-only`.
- Preserve all third-party copyright, attribution, and license notices.
- Update `THIRD_PARTY_NOTICES.md` and `THIRD_PARTY/` when adding a new upstream
  dependency, algorithm, model, or bundled asset.
- A root GPL declaration does not replace the historical license of files stored
  under `reference/`.
- Verify code and non-code asset licenses separately.

## Release discipline

- Do not change faithful AI behavior during repository restructuring or branding
  releases.
- Keep benchmark baselines under `arena/results/`.
- Update specs when a public architectural contract changes.
- Update the player catalog when a player is added, removed, renamed, or split.
