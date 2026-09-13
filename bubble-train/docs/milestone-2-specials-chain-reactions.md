# Milestone 2 — specials, exact ripple and chain reactions

Status: **implemented and testable**, still not the final audiovisual game.

## Added in M2

- Source-style `BulletFactory` availability slots and finite special quotas.
- Source-style random `CarriageFactory`, including special-carriage quotas and initial triple prevention.
- Cannon magazine with loaded + next bubble, strict `>` reload timing, 45 px muzzle offset and 3° keyboard rotation step.
- Rainbow bubble animation from the audited C++ behavior: immediate first colour update, then every **16** animate calls despite the original comment saying 15.
- Speed bubble generation from the original integer `random(3)-1.5` behavior, inverse lifetime capped at 10 seconds, timer activation only after projectile insertion, expiry back to a normal random colour, and station-return reset.
- Driving speed multiplier calculated only from the rear-connected section.
- Negative speed multiplier/reverse motion.
- Exact post-move ripple propagation: a moving carriage can close a gap and propagate only the overlap into the next section.
- Real split-chain reconnection and delayed chain reactions.
- Original frame ordering: train movement + group removal, then bullets move, then bullet/train collision handling.
- Ordinary insertion defers group removal until the next train animation; bombs and colour bombs resolve immediately on collision.
- Source-order collision traversal (front to rear in the original list).
- Source matching quirk where a speed bubble can count as the rear-most member of a same-colour run but breaks a run when encountered as the current carriage.
- Track loader now accepts omitted `startpos` on subsequent sections and inherits the previous section end, as original level files do.
- Crash/return overflow preserves the previous carriage position instead of snapping to the path boundary.
- Clean-room Canvas renderer for diagnostic use, including geometric markers for all special bubble types.

## Determinism

The port still intentionally does **not** emulate a platform-specific libc `rand()` sequence. `SeededRng` supplies stable replay/test randomness while each random *decision* follows the audited source semantics. The speed-bubble integer scaling is reproduced over the seeded 32-bit source value.

## Fixed-step behavior

The diagnostic runs at 40 ms / 25 Hz. Special-bubble animation advances on simulation frames, not browser render frames. Speed expiry uses simulation milliseconds.

## Tests

M2 freeze target: all automated tests in `tests/` must pass with `npm test`.

Coverage now includes path geometry, inherited section starts, factories, rainbow timing, speed generation/expiry, magazine reload, dynamic ripple, reverse movement, collision order, delayed insertion matching, bombs, colour bombs, station ordering, crash/return behavior and an actual split/reconnect chain reaction.

## Still deferred

- Native-executable runtime parity capture.
- Original menu/options/credits/fastest-times/configuration flow.
- Audio implementation.
- Final clean asset pack and polished responsive UI.
- Campaign loader that fetches `.gms` + `.lvl` files as a complete playable progression.
- Historical level redistribution; original data remains under reference/quarantine rules.
