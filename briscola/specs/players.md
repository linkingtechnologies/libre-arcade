# Integrated players

BriscoLab v1.7.29 exposes **39 independent player identities**: 16
core/historical players (including the native Random baseline) plus 23 PoIAna
pretrained RL agents.

## Core / historical benchmark set

| ID | Display name | Strategy | Upstream language/runtime | Reference folder |
|---|---|---|---|---|
| `qbriscola` | QBriscola | heuristic + public-card counting | C++ / Qt | `reference/qbriscola/` |
| `cuperativa` | Cuperativa | weighted handcrafted rules | Ruby | `reference/cuperativa/` |
| `smbriscola-empirico1` | smBrisCola Empirico1 | heuristic | Python | `reference/smbriscola-empirico1/` |
| `smbriscola-empirico2` | smBrisCola Empirico2 | heuristic | Python | `reference/smbriscola-empirico2/` |
| `jbriscola` | JBriscola | simple heuristic + randomness | Java | `reference/jbriscola/` |
| `pryscola` | Pryscola | simple heuristic | Python | `reference/pryscola/` |
| `random` | Random | uniform random baseline | BriscoLab native | — |
| `giacomelli-pig` | πG Greedy | deterministic published policy | C# / .NET 8 | `reference/giacomelli/` |
| `giacomelli-pih` | πH Hoarder | deterministic published policy | C# / .NET 8 | `reference/giacomelli/` |
| `giacomelli-pic` | πC Counter | deterministic policy + public-card memory | C# / .NET 8 | `reference/giacomelli/` |
| `cardframework-cpu0` | CardFramework Cpu0 | simple trump-first heuristic | C# / .NET | `reference/cardframework/` |
| `cardframework-cpu1` | CardFramework Cpu1 | point/suit overtake + trump heuristic | C# / .NET | `reference/cardframework/` |
| `cardframework-cpu2` | CardFramework Cpu2 | heuristic + probabilistic trump decisions | C# / .NET | `reference/cardframework/` |
| `briscolajs-s0` | Briscola.js S0 | deterministic heuristic | JavaScript / React demo | `reference/briscolajs/` |
| `briscolajs-s1` | Briscola.js S1 | heuristic + late-game alpha-beta | JavaScript / React demo | `reference/briscolajs/` |
| `briscolabot-v3` | BriscolaBot v3 | PPO deep RL policy | ONNX | `reference/briscolabot/` |

The default `arena:round-robin` uses this compact **16-player** core/historical
set. PoIAna remains a separately selectable 23-model family so ordinary
benchmark commands do not silently expand to all 39 identities.

## PoIAna family

Each upstream PoIAna ONNX model is exposed as `poiana-<model-name>`. The
publisher's win-rate metadata is preserved for provenance and benchmarking,
but is not shown as an absolute difficulty estimate in the player-facing UI and
is not a BriscoLab Arena result.

| ID | Upstream win rate | Architecture |
|---|---:|---|
| `poiana-blooming-bird` | 68.2033% | DQN |
| `poiana-graceful-darkness` | 68.1433% | DQN |
| `poiana-toasty-pine` | 68.0800% | QR-DQN, 50 quantiles |
| `poiana-autumn-night` | 68.0767% | DQN |
| `poiana-true-star` | 68.0267% | DQN |
| `poiana-laced-pond` | 67.6333% | DQN |
| `poiana-devout-paper` | 65.6833% | QR-DQN, 50 quantiles |
| `poiana-mild-aardvark` | 65.3067% | DQN |
| `poiana-snowy-shape` | 65.0300% | DQN |
| `poiana-lively-cosmos` | 63.3833% | DQN |
| `poiana-bumbling-leaf` | 61.5367% | DQN |
| `poiana-easy-shape` | 61.2867% | DQN |
| `poiana-earnest-night` | 58.8133% | DQN |
| `poiana-rich-mountain` | 58.8133% | DQN |
| `poiana-amber-lake` | 57.8433% | DQN |
| `poiana-warm-river` | 57.6833% | DQN |
| `poiana-spring-snowflake` | 57.5500% | DQN |
| `poiana-dark-salad` | 57.2400% | DQN |
| `poiana-selfplay-best` | 56.8933% | DQN self-play |
| `poiana-skilled-serenity` | 53.8800% | DQN |
| `poiana-smart-dragon` | 53.2100% | DQN |
| `poiana-hardy-galaxy` | 48.2300% | DQN |
| `poiana-cosmic-firebrand` | 45.0967% | DQN |

PoIAna's separate family round robin is available as `npm run arena:poiana`.
Any PoIAna identity can also be used in the generic head-to-head command.

## Implementation folders

There are eleven top-level folders under `src/players/`. Empirico1 and Empirico2
share the faithful `smbriscola/` implementation; πG/πH/πC share `giacomelli/`;
Cpu0/1/2 share `cardframework/`; S0/S1 share `briscolajs/`; and all 23 PoIAna
identities share `poiana/`.

There are eleven top-level folders under `reference/`. `reference/giacomelli/`
preserves the published-policy provenance, `reference/cardframework/` preserves
the exact NuGet 1.6.20 package and XML documentation used for the binary
archaeology, `reference/briscolajs/` documents the recovered browser demo, and
`reference/poiana/` preserves the game/training sources used for all 23 PoIAna
model identities.

## Fidelity status

- QBriscola: faithful source-based port with integration regression tests.
- Cuperativa: 500/500 randomized decisions matched the original Ruby oracle.
- smBrisCola Empirico1/2: 3,000/3,000 randomized decisions matched the original
  Python algorithms across both players.
- JBriscola: 3,000/3,000 randomized decisions matched the original Java CPU with
  controlled `java.util.Random` behavior.
- Pryscola: 3,000/3,000 randomized decisions and resulting hand order matched the
  original Python implementation.
- BriscolaBot v3: original ONNX model bundled; graph signature, policy weights,
  legal masking, and deterministic actor forward pass verified.
- PoIAna: all 23 original ONNX models bundled; exact 519-value observation and
  0/1/2 action semantics ported from the Godot source. For the 21 DQN models
  with matching training checkpoints, all six neural tensors matched the
  checkpoint `q_net` bit-for-bit. The two QR-DQN graph structures are evaluated
  directly from the supplied ONNX tensors.
- Giacomelli πG/πH/πC: policy rules ported from the published .NET source/paper;
  πC retains its public-card memory behavior.
- CardFramework Cpu0/1/2: ported from the user-supplied CardFramework.Maui
  1.6.20 NuGet assembly by inspecting its IL and XML documentation. The port
  deliberately retains decision-relevant quirks such as Cpu0/Cpu1 scanning
  only through `hand.length - 1` for trump in one branch, point-based
  `getSoprataglio`, Cpu1's consumed-but-unused random draw, and Cpu2's 50%
  branches. BriscoLab substitutes a seeded RNG only to make benchmarks
  reproducible while retaining the original random branch shape.
- Random: native control player; uniform legal-card selection with deterministic seeded RNG.

See each `src/players/<family>/README.md` and `reference/<player>/` for details.


## Briscola.js S0 / S1

Two behavioral reconstructions from Calogero Miraglia's historical browser
demo. S0 is a deterministic heuristic. S1 is the actual demo CPU and switches
from S0 to terminal alpha-beta search at trick 18. The late-game search infers
the opponent hand from public card history only after the stock is exhausted.
The generic Minimax routine recovered from the bundle is documented as an
archaeological subsystem, not registered as a separate gameplay player.
