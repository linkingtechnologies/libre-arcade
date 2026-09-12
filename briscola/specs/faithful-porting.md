# Faithful porting policy

A faithful port is a preservation artifact, not an opportunity to redesign the
algorithm.

## Required principles

1. Preserve decision order and tie-breaking.
2. Preserve decision-relevant bugs, quirks, unusual probability expressions,
   and mutable state.
3. Keep legacy method/field names when useful for source comparison.
4. Put BriscoLab-specific translation in an adapter, not in the port.
5. Document any unavoidable deviation.
6. Do not optimize or refactor behavior until fidelity has been established.
7. Never replace a faithful port with an improved variant under the same player
   identity.

## Verification hierarchy

Preferred verification, strongest first:

1. randomized oracle comparison against executable upstream code;
2. deterministic fixture comparison against upstream tests/traces;
3. model graph/signature and numerical output comparison for ML models;
4. careful source-level equivalence review when execution is impossible.

Record the verification method and sample count in the player README or catalog.
