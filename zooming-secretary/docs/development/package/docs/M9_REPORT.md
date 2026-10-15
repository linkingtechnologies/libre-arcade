# Zooming Secretary — M9 Reference-Run Harness

## Result

**M9 status: GREEN.**

A zero-dependency, headless JavaScript harness now executes the M8 restoration contract without any original game media.

### Covered

- RNG and title dwell seeding
- wrap primitives
- exact phone reset RNG ordering
- initial multi-phone staggering
- call-delay decay
- three heat levels, answer and miss lifecycle
- topic/wisdom gating
- coffee timing/speed logic
- campaign and Dream outcome semantics
- core NPC effects/timers
- Ghost pursuit primitive
- deterministic replay identity

### Intentionally not covered yet

- complete player movement against decompressed maps
- full cabinet/phone geometry
- complete NPC map navigation
- rendering/audio
- original graphics/music

Those are not required to prove the deterministic simulation primitives at M9.

## Important source-order detail confirmed

A normal phone answer calls `phone_reset(..., answer=1)`, which still consumes a random value for `phone_topic`. In the same gameplay tick, the common counter block then decrements the freshly-set counter from 25 to 24. M9 reproduces that operation ordering.

## Dream safety representation

The original Dream setup reaches a phone reset while `topics_active == 0`. M9 consumes the same RNG value but records the topic as `null` instead of reproducing an undefined/unsafe modulo-zero C result. This is explicit in tests and documentation.

## Acceptance

Run:

```bash
npm test
```

Expected result:

```text
15/15 tests passed
```

The generated machine-readable report is `docs/test-report.json`.
