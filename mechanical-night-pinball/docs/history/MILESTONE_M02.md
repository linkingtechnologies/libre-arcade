# Milestone M0.2 — source-driven physics

Status: **implemented / calibration pending**

M0.2 removes the coarse M0.1 containment and flipper impulses. The runtime now uses the actual collision-chain coordinates and event sensors recovered from `ChainCoordinates.h` and `ModuleSceneIntro.cpp`.

## Exact/source-driven

- dimensions, coordinates and source event topology;
- score table and multiplier cap;
- ramp wall switching;
- tunnel timer/exit vectors;
- peg consume/restore state;
- flipper pivot/angle limits/motor-speed targets;
- launcher travel/motor target;
- fixed 60 Hz outer timestep.

## Clean-room approximation still requiring executable calibration

- contact impulse solver vs Box2D 2.3.2;
- joint torque/inertia response (flippers currently motor-target driven);
- Box2D continuous collision edge cases;
- the odd negative launcher max-force behaviour is reproduced by its practical downward-yield effect rather than by copying Box2D solver internals;
- friction/contact ordering under simultaneous impacts.

These are explicitly not marked as parity-complete.
