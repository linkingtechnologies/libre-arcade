# Architecture

## Layers

```text
Web UI
  ↓
BriscolaGame engine
  ↓
Player interface
  ↓
Adapters
  ↓
Faithful AI ports / model runtimes
```

The UI may depend on the engine and player adapters. Adapters may depend on their
own faithful port/runtime. Faithful ports must not depend on the UI or engine.

The Arena is a separate consumer of the same engine and adapters:

```text
arena/scripts
  ↓
BriscolaGame + registered adapters
  ↓
JSON / Markdown results
```

## Directory ownership

- `src/core/`: canonical game rules and state.
- `src/players/`: player implementations, faithful ports, runtimes, adapters.
- `src/ui/`: human-play browser presentation only.
- `arena/`: AI-vs-AI simulation and benchmark artifacts.
- `reference/`: upstream preservation material.
- `specs/`: stable project contracts.
- `test/`: automated regression and fidelity tests.

## Dependency rules

1. `src/core/` must not import AI-specific code.
2. `src/ui/` must not implement AI strategy.
3. Faithful algorithm modules should remain usable without the UI.
4. Adapters are the translation boundary between BriscoLab and legacy state.
5. Arena scripts must use the same adapters used by normal integration.
6. Benchmark-only deterministic runtimes may exist when explicitly documented,
   but must preserve the policy represented by the normal player.
