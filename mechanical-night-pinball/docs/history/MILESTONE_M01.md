# Milestone M0.1 — playable shell

## Purpose

Prove the new project's runtime architecture before implementing parity physics.

## Complete

- responsive shell;
- clean SVG layers;
- Canvas rendering;
- input abstraction;
- fixed-step game loop;
- state lifecycle;
- procedural audio;
- IT/EN HUD;
- basic playability scaffold;
- archaeology kept physically separate.

## Explicitly deferred

- exact chain-shape collision geometry;
- Box2D-equivalent contact solver;
- exact flipper revolute joints and motor torque;
- exact launcher prismatic joint;
- ramp topology switching;
- tunnel timing/teleport parity;
- light sequences and multiplier rules;
- peg consume/restore logic;
- exact scoring event wiring;
- executable-vs-web parity captures.

## Exit criterion for M0.2

Replace `KinematicScaffold` with a parity-oriented physics implementation while keeping the rest of the application API unchanged.
