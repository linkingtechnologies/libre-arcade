# AGENTS.md

## Project goal
Preserve and faithfully port Njam 1.21 to framework-free HTML5/JavaScript while keeping the historical code and data auditable.

## Rules
- Treat AmigaOS4 Njam 1.21 as the primary behavioural reference.
- Never silently replace 1.21 behaviour with 1.25 behaviour.
- Keep original material under `reference/`; do not edit it.
- Keep engine logic independent from DOM/UI where practical.
- No JavaScript framework and no build step required for runtime.
- Code and technical documentation are in English.
- Preserve original level data losslessly.
- Any gameplay deviation must be recorded in `specs/PARITY.md`.
- Prefer deterministic tests for AI, movement and map parsing.
- Do not introduce non-free assets.
- Network Host/Join is intentionally deferred for the offline-parity milestone. Do not add WebRTC, WebSocket, signaling or a backend unless explicitly requested.
