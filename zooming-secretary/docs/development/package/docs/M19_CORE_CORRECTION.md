# M19 core integration correction — Dream teleport event

M19 found an integration bug that did **not** alter the Dream state machine itself:

- `processDreamRunaway()` correctly moved the telephone and advanced RNG/cooldown state;
- the method emitted `PHONE_TELEPORT` into `Simulation.events`;
- `Simulation.tick()` later replaced `Simulation.events` with the local `out` array;
- therefore the teleport happened, but the browser never received the event.

M19 changes `processDreamRunaway(events)` so the event is appended to the same per-tick event array returned by `tick()`.

A dedicated regression test now verifies both:

1. the telephone state changes exactly as before;
2. `PHONE_TELEPORT` survives the full `Simulation.tick()` path exactly once.

This is a shell/event-plumbing correction. It does not change ROM-certified teleport RNG, destination selection or cooldown behavior.
