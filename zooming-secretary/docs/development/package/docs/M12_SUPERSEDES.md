# M12 supersedes selected M7–M11 assumptions

The following earlier statements should be read with these M12 corrections:

- **M7/M11 factoid indices:** source-logical `rand8() % count` is superseded by the binary-real cc65 stale-X behavior documented in M12.
- **M10/M11 RNG model:** visual-only RNG consumption by Chief, Chatter and hearts is now part of the canonical deterministic core.
- **M10 ManBox:** active platform-edge reversal is restored.
- **Dream runaway:** first teleport reloads a 15-tick cooldown after raising the maximum from 5 to 15.
- **Dream phone topic:** ROM raw value 8 under the certified seed-1 trace is intentionally represented as `null` in JS because it comes from the original modulo-zero path and is behaviorally unused.

M11's coffee `py+1`, row-major initialization ordering, loop ordering, map fingerprints, side floors, phone initialization and entity coordinates remain valid.
