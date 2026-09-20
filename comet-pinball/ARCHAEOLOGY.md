# Archaeology — preserved behavior, evidence and scope

## Identity and originals

Comet Pinball 1.1.0 (2013) by Patrick Haring and Christian Bürgi. Upstream: https://github.com/boskoop/comet-pinball ; frozen source commit `2d0a2865ab7243a476f1f7a6eab4d23b267e2135`. Primary historical artifact (not bundled here): `reference/releases/comet-pinball-1.1.0-b480.jar`; original manual `reference/docs/manual.pdf`; default table `reference/table/playfields.xml`. The manual shows a sparse black field, green wireframe fixtures, ring bumpers and light flippers. The game contains one loaded default table, not a collection of elevated pinball ramps. The `7°` ramp property refers to physical table tilt. Full archaeological audit and file provenance: `reference/audit/COMET_PINBALL_1.1.0_AUDIT.md`, `reference/audit/provenance.json`, `reference/source-urls.md`.

The **23 archived files included in this public-import package** preserve their baseline bytes. The original shaded JAR is intentionally excluded from the public repository; its upstream identity and digest are documented separately. Source payload contains an Apache-2.0 license, but the shaded JAR also includes third-party code and asset provenance questions; consult `THIRD_PARTY_NOTICES.md`.

## Faithful gameplay and documented UI differences

The HTML5 field keeps the original table geometry, physical constants, score mapping, direct-angular-velocity flippers, and historical bumper/slingshot force quirk. The source `data/playfield.js` is the browser representation of the preserved table XML and physics constants. No new physical targets, ramps or empirical scoring adjustments were added. Controls are extended for web keyboards and multitouch; camera, audio, visual style and player-controlled stuck-ball recovery are explicitly HTML5 presentation/usability additions, not features asserted to exist in 2013. A two-ball interstitial was removed: the next ball is now prepared automatically after a brief notice, leaving launch under player control.

## Native oracle and current limits

The historical JAR is the behavioral oracle. Full-game native input trace: 1/60 s steps, 1,842 native frames, drains at 602 / 1216 / 1830, final score 45. The browser full-game replay still diverges in trajectory before/around frame 434; isolated contacts at frame 402 and seeded polygonal right-flipper TOI at frame 434 are separately verified. The deterministic replay sends no second Plunge when the port returns to the launch lane, so its later score/drains differ. **Do not interpret passing isolated tests as bit-for-bit Box2D or full-game equivalence.** Preserve this diagnostic boundary rather than tuning the engine to a target score. Details: `specs/PARITY.md`, `specs/FULLGAME-REPLAY.md`, `reports/M10-FULLGAME-DIFFERENTIAL.md`, `reports/oracle-m10/`.

## Stuck-ball diagnosis

A stationary pocket in the upper-left field also reproduces on the native historical engine. Player-confirmed voluntary ball termination exists to allow progress without silently changing physical motion. Longer scripted gameplay runs distinguish genuinely stationary state from a game merely unfinished within a 60- or 120-second window; see `reports/M11.1-GAMEPLAY-REPORT.md` and the saved deterministic JSON results.

## Reproducibility and exclusions

`reference/oracle/` holds twelve CSV traces and their checksum file; `reports/oracle-m8/`, `reports/oracle-m9/`, `reports/oracle-m10/` retain key focused oracle measurements; `tools/oracle/` and `tools/diagnostics/` contain measurement generators. Regenerating an oracle changes a protected archaeological tree; run in a temporary copy, check results, never replace the frozen original inadvertently. The full JS tests run without starting the historical Java game.

Old local milestone CHANGELOGs and repeated screenshots/logs were folded into the first-import documentation; **the technical oracle data and research reports were retained**, not rewritten to pretend full parity.

## First-import boundary archaeology — historical M13.9 phase

The first-commit browser build has two isolated fixes not present in the archived original files: swept polygon collision for the playfield-side divider and for the central straight ceiling. The validated cases use the bundled 2013 JAR. At this historical phase the reverse narrow-lane two-wall interaction and curved upper sectors remained unresolved; M13.11 subsequently added a bounded two-wall solver for valid lower-corridor starting states, while other cases remain open; see `reports/M13.9-OPEN-ISSUES.md` and `specs/M13.9-BOUNDARY-ORACLE.md`. No end-to-end full-game parity or production-ready claim is made.

## Upper-wall CCD diagnostic (first import)
The native post-bumper single-step oracle, nine bumper/release sequences, M13.9 baseline comparison and remaining discrepancies are documented in `reports/M13.10-TEST-REPORT.md` and `reports/M13.10-OPEN-ISSUES.md`. These tests do not establish complete full-game parity.

## Narrow-lane two-wall correction (first import)

Unlike earlier one-wall TOI handling, the web port now resolves repeated physical impulses against both archived launcher-wall polygons within one frame when the ball starts in the lower corridor. Twenty valid native seeds and 14×120 additional stress frames passed; see `reports/M13.11-LANE-CCD.md`, `tests/m13.11-lane-coupled.js` and `reports/M13.11-OPEN-ISSUES.md`. It does not certify wall-overlap initial states, the opening transition or full-game parity.

## Public-commit boundary for the original JAR

This public-commit archive excludes the original fat JAR pending verification of bundled font-atlas/image/dependency redistribution terms. Its upstream download, original SHA-256 and audit remain in `reference/releases/README.md`, `reference/SHA256SUMS`, `reference/audit/` and `JAR-LICENSE-REVIEW.md`. Existing oracle CSVs remain as preserved records. Oracle regeneration using Java requires a locally downloaded and verified original JAR; do not check it into Git.
