# M8 — Web Workers for generator and solver

## Scope

M8 moves the two CPU-heavy 5ud0ku operations off the UI thread without changing the historical algorithms:

- puzzle generation (`GridCreator` + `GridSolver`), including Hard best-of-3 selection;
- custom-puzzle solving (`BruteForceSolver`).

The core under `src/core/` remains the M6/M7 parity port. M8 adds an isolation layer around it.

## Architecture

```text
UI / future renderer
       |
       v
SudokuWorkerClient
       |
       | protocol v1
       v
browser-worker-entry.js  /  node-worker-entry.js
       |
       v
worker-handler.js
       |
       +--> GridCreator / GridSolver
       |
       +--> BruteForceSolver
```

Browser code uses the standard module Worker API. Node's `worker_threads` entry exists only for deterministic automated testing of the same handler.

## Protocol v1

Request:

```js
{
  version: 1,
  id: 12,
  op: 'generate' | 'solve' | 'ping',
  payload: { ... }
}
```

Success:

```js
{ id: 12, ok: true, result: { ... } }
```

Failure:

```js
{
  id: 12,
  ok: false,
  error: { code: '...', message: '...' }
}
```

Unknown operations and invalid arguments are returned as structured errors rather than crashing the worker.

## Generate

Input:

```js
client.generate('hard', {
  creatorSeed: 1803,
  digitSeed: 91803,
  hardCandidates: 3,
  maxAttempts: 200,
});
```

The worker preserves the M2 generation sequence and returns:

- the complete M2 oracle record;
- the final game as the historical binary grid representation (`gridBytes`);
- the selected backtracking depth, which is not part of the historical save format.

Before returning the playable board the worker clears candidate pencil marks, matching `CreatorTask.storeGrid()` in the original 1.8 source, and only then applies `randomizeDigits()`.

`generatedResultToGrid()` reconstructs a normal `Grid` on the caller side and restores the backtracking metric separately.

## Solve

Input:

```js
client.solvePuzzle(puzzle81, { name: 'custom' });
```

The worker performs the historical pre-check (`checkForRules`) and, if valid, runs `BruteForceSolver` unchanged. Results preserve the historical distinction:

- contradictory: `rules=false`;
- valid but impossible: 0 solutions;
- unique: 1 solution;
- multiple: 2 solutions then stop.

The worker can also solve a serialized Grid through `solveGridBytes()`.

## Cancellation and timeout

5ud0ku's historical solvers are synchronous recursive algorithms. While such a worker is inside a deep solve it cannot reliably process a second `cancel` message without either:

- changing the solver to yield cooperatively, or
- requiring `SharedArrayBuffer`/Atomics and browser cross-origin isolation.

Both would add complexity to the parity core.

M8 therefore cancels at the Worker boundary:

1. terminate the currently busy worker;
2. reject the Promise with `WORKER_CANCELLED` or `WORKER_TIMEOUT`;
3. lazily create a clean worker for the next request.

This changes no solver decisions and works in ordinary browsers without extra security headers.

`AbortSignal` is supported directly.

## Main-thread responsiveness test

The historical `hard` solver fixture is deliberately expensive. In the M8 Node Worker test it took roughly 5–6 seconds, while a 20 ms heartbeat on the main event loop continued to fire hundreds of times.

This proves the architectural objective of M8: the old brute-force algorithm can remain intact without freezing the future browser UI.

The exact runtime is machine-dependent and is not a parity criterion.

## Regression gates

At packaging time:

- M2 generator/solver: 13/13 PASS;
- independent generated-puzzle uniqueness: 300/300 PASS;
- M3 gameplay/persistence parity: 41/41 PASS;
- M7 lifecycle/autosave: 8/8 PASS;
- Java 1.8 binary save compatibility: 2/2 PASS;
- M8 worker protocol/parity/responsiveness: 24/24 PASS.

M8 checks include:

- exact Easy/Normal/Hard M2 generator records through a worker;
- exact 10 solver fixtures through a worker;
- main-loop heartbeat during the multi-second Hard solve;
- structured worker errors;
- timeout termination and clean restart;
- `AbortSignal` cancellation and clean restart;
- rejection of overlapping requests as `WORKER_BUSY`.

## Parity decision

M8 changes **where** algorithms execute, not **what** they do.

The following remain untouched:

- Java-compatible RNG;
- generator symmetry/removal behavior;
- uniqueness checking;
- Hard ranking;
- Singles / Hidden Singles / backtracking ordering;
- brute-force row-major search;
- candidate order 1 through 9;
- stop-at-two behavior for custom puzzle solving.

## Browser usage

```js
import {
  createBrowserSudokuWorkerClient,
  generatedResultToGrid,
} from './src/core/index.js';

const engine = createBrowserSudokuWorkerClient({ defaultTimeoutMs: 15000 });

const generated = await engine.generate('normal', {
  creatorSeed: 1802,
  digitSeed: 91802,
});

const grid = generatedResultToGrid(generated);
```

The seed controls remain internal QA plumbing; M8 does not expose them as user-facing UI.
