# Zooming Secretary — M15 Day 1 Playable

## Result

**M15 status: GREEN for development/playtesting.**

The browser build now runs the actual Day 1 gameplay configuration rather than the synthetic
training office used in M14.

## Certified Day 1 values

- target calls: 10
- miss limit: 3
- active topics: 2
- base call delay: 250 ticks
- player spawn: (120,152)
- phones: (56,96), (192,96)
- topic cabinets: Earth (46,160), History (190,160)
- initial seed: 1
- post-init RNG: 64
- post-init call delay: 230
- initial phone counters: 252, 504
- initial phone topics: 0, 0
- binary-real initial factoid indices: 2, 7
- Day 1 collision SHA-256: `67cbe336548cd2b4f2928ace7afa86b1a9171f5fccb89fb09a874bb857cbf4b6`

## Runtime regression

The public Day 1 builder reproduces the M12 900-tick idle lifecycle:

- one missed call
- RNG 207
- call delay 220
- phone counters 186 / 6
- phone levels 0 / 2
- phone topics 1 / 0
- ring counter 395

## Media boundary

M15 uses only new placeholder drawing. It does not include original NES media or raw map bytes.
The exact functional topology is represented as semantic construction code and remains marked
for final redistribution review before public release.

## Automated acceptance

- inherited M8/M9 tests: 15/15
- M10: 15/15
- M11 public: 10/10
- M12: 12/12
- M13 policy: 8/8
- M14 shell: 12/12
- M15 Day 1: 14/14

**Total: 86/86 tests passed.**

M15 additionally verifies real player movement from spawn to the Earth cabinet and a real
lower-floor → ladder → upper-phone route using the production movement core.
