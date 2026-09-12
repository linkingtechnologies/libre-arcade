# BriscoLab

**[▶ Play here](https://linkingtechnologies.github.io/libre-arcade/briscola/index.html)**

*Preserving, porting and benchmarking Briscola AIs*

BriscoLab is an experiment in software intelligence restoration. It recovers
Briscola-playing algorithms from abandoned and historical open-source projects,
ports them to a shared web environment, preserves their original decision-making
logic, and benchmarks them against one another. Rather than restoring only code
or graphics, BriscoLab preserves how old software used to think.

BriscoLab is an open-source laboratory for historical and modern two-player
Briscola computer players. It keeps the game engine, web UI, AI ports, adapters,
reference sources, and benchmark tooling separate so algorithms from different
eras and languages can be compared under the same rules.

## Current players

| Player | Family | Upstream | License |
|---|---|---|---|
| QBriscola | heuristic + public-card counting | C++ / Qt | GPL-2.0-or-later |
| Cuperativa | weighted handcrafted heuristic | Ruby | MIT |
| smBrisCola Empirico1 | handcrafted heuristic | Python | GPL-2.0-or-later |
| smBrisCola Empirico2 | handcrafted heuristic | Python | GPL-2.0-or-later |
| JBriscola | simple heuristic + randomness | Java | GPL-3.0 |
| Pryscola | simple heuristic | Python | GPL-3.0-or-later |
| BriscolaBot v3 | PPO / deep reinforcement learning | Python + ONNX | MIT |
| PoIAna (23 agents) | DQN / QR-DQN deep reinforcement learning | Godot + Python + ONNX | publisher: GPLv3 code / CC BY 4.0 assets |
| πG / πH / πC | deterministic published policies | C# / .NET 8 | MIT |
| CardFramework Cpu0/1/2 | heuristic + probabilistic rules | C# / .NET MAUI | GPL-3.0 |
| Briscola.js S0/S1 | heuristic / late-game alpha-beta | JavaScript / React demo | upstream license unverified; BriscoLab reconstruction GPL-3.0-only |
| Random | uniform random baseline | BriscoLab native | GPL-3.0-only |

See [`specs/players.md`](specs/players.md) for the player catalog and provenance
links.

## Repository layout

```text
briscola/
├── AGENTS.md
├── specs/                  # stable technical contracts
├── src/
│   ├── core/               # Briscola rules and game state
│   ├── players/            # faithful ports and adapters
│   └── ui/                 # browser UI
├── arena/
│   ├── scripts/            # deterministic simulation tools
│   └── results/            # benchmark artifacts
├── reference/              # upstream source snapshots for historical/imported players
├── THIRD_PARTY/            # third-party license texts/notices
├── test/
└── assets/
```

The architectural contracts live in [`specs/`](specs/README.md). Contributors
and coding agents should read [`AGENTS.md`](AGENTS.md) before modifying ports,
adapters, engine behavior, or benchmark code.

## Run the web UI

ES modules must be served over HTTP:

```bash
npm run serve
```

Then open `http://localhost:8080`.

The browser UI is intentionally for **human vs AI play**. The pre-game screen
selects **CPU strength**, **deck**, and either a single game
or an **Al meglio delle 3** series. A drawn game does not award a series win, and
the first side to two wins takes the series. The opening player alternates after
each completed game. Laboratory options expose an exact engine and seed only
when wanted. During
play the compact menu provides new-game/settings, optional CPU-hand reveal and
AI debug. Resolved tricks remain visible briefly and card/deal/collection animations
are preserved. The masked CPU levels are calibrated from Arena results: the
top `Maestro` level always selects BriscolaBot v3, while the other levels retain
broader pools of historical and learned opponents.

Two real manifest-driven historical decks are bundled: **Viterbesi–Murari 1900**
and **Napoletane Pignalosa 1882**, plus the symbolic fallback renderer.
Benchmarking and AI-vs-AI simulation still belong to the Arena tooling.

## Distributing the game

`npm run serve`/`npm run dev` serve the whole repository, which is convenient
for development but also exposes `arena/`, `test/`, `specs/`, and `reference/`
over HTTP. To package only what a player's browser actually needs:

```bash
npm run build
```

This copies `index.html`, `styles.css`, `src/`, `assets/`, `LICENSE`,
`THIRD_PARTY_NOTICES.md`, and `THIRD_PARTY/` into `game/` — nothing else, no
bundling. `npm start` builds and then serves `game/` on `http://localhost:8080`
to preview exactly what gets deployed. `game/` alone is enough for any static
web server; do not edit it directly, it is regenerated on every build.

## Tests

```bash
npm test
```

## Arena

Run a complete round robin:

```bash
npm run arena:round-robin -- 1000 1
```

Run a direct matchup (PoIAna identities work here too):

```bash
npm run arena:head-to-head -- qbriscola briscolabot-v3 1000 1
npm run arena:head-to-head -- poiana-blooming-bird briscolabot-v3 1000 1
```

Benchmark one player against the compact core/historical comparison set:

```bash
npm run arena:player -- poiana-blooming-bird 1000 1
```

Run a PoIAna-only round robin across all 23 upstream models:

```bash
npm run arena:poiana -- 100 1
```

Run the complete global round robin across every integrated player:

```bash
npm run arena:global -- 100 1
```

The v1.7.0 calibration artifact uses 39 players and 100 paired seeds per matchup (148,200 games).

Each Arena command writes both machine-readable JSON and a Markdown report under
`arena/results/`. See [`arena/README.md`](arena/README.md) for the benchmark
contract and command details.

## Core design principles

- The engine owns rules, deck, turns, scores, hidden state, and legality checks.
- A player receives only `PlayerObservation`, never the opponent hand or hidden
  stock.
- Every player is exposed through `async chooseAction(observation)`.
- Faithful ports preserve upstream behavior, including decision-relevant quirks.
- BriscoLab-specific adapters, comments, tests, and documentation use English.
- A faithful historical port is never silently improved in place.
- Arena simulations use deterministic seeds whenever technically possible and
  test both seating positions.

## Licensing

BriscoLab project code is released under **GNU GPL version 3 only**
(`GPL-3.0-only`). Faithful ports and bundled reference material retain their
upstream attribution and license notices. See [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).
Exact upstream revisions, licenses, and the boundary between preserved,
reconstructed, and new code are consolidated in [`PROVENANCE.md`](PROVENANCE.md).

Non-code assets retain their own terms. In particular, PoIAna is documented using the publisher's GPLv3 code / CC BY 4.0 asset declarations; see the third-party notice for the repository-snapshot licensing caveat.

Copyright © 2026 Umberto Bresciani. "Grugnetto", "Grugnetto's Briscola",
"BriscoLab", and the associated logos and character identity are trademarks
of Umberto Bresciani, separate from the GPL software license; see
[`TRADEMARKS.md`](TRADEMARKS.md).

## History

Development notes for earlier BriscoLab / BriscoLab releases are preserved in
[`CHANGELOG.md`](CHANGELOG.md).
