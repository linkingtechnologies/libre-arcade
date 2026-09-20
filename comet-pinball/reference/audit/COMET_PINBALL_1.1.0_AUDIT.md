# Comet Pinball 1.1.0 — software archaeology audit

Audit date: 2026-09-14

## Decision

**GO — with asset quarantine and a period-JVM runtime qualification.**

The original release and manual are authentic and internally consistent with the upstream source tree. The project is a small, complete pinball game rather than an unfinished skeleton. It is a strong preservation/port candidate because the code is compact, the table is partly data-driven, the physics model is understandable, and the upstream code license is Apache-2.0.

The two remaining caveats are not blockers for preservation:

1. Several visual assets have insufficient provenance for clean redistribution, especially the bitmap font generated from **Nueva Std**. These should stay in `/reference` and be replaced in a clean restoration unless their rights are independently proven.
2. The unmodified 2013 JAR does not start on Java 21 because the old runtime expects `javax.annotation.PreDestroy`. The JAR was built with JDK 7; a successful period-JVM (Java 7/8) launch was not reproduced in this audit environment.

## Preserved originals

| Artifact | Size | SHA-256 |
|---|---:|---|
| `comet-pinball-1.1.0-b480.jar` | 7,816,773 bytes | `84aa5e48c962439113d7e444881e3891c5a179b2306d49db42da9740d580a05f` |
| `manual.pdf` | 412,200 bytes | `17f3a5a249a5cd4a392ab1392da1619edb2d9a42d5252e1fa80c8f2684a0225e` |

The uploaded `manual.pdf` has Git blob SHA-1 `cc8e01e3276800ac777811b958ebf50004056732`, exactly matching upstream `doc/game_manual.pdf`.

## Binary identity and packaging

Manifest:

```text
Manifest-Version: 1.0
Archiver-Version: Plexus Archiver
Created-By: Apache Maven
Built-By: jenkins
Build-Jdk: 1.7.0_21
Main-Class: ch.m02.comet.pinball.desktop.Main
```

The JAR contains 3,163 entries, 2,044 class files, 16 native-library entries, and no nested JARs. It is effectively a shaded/fat JAR. Main class bytecode is Java 7 class-file major version 51.

Noteworthy archaeology details include a stray `.svn/text-base/liblwjgl.jnilib.svn-base` native artifact and the accidental inclusion of `mockito-all:1.9.5` in the release JAR.

## Embedded dependency evidence

| Component | Version evidenced in release/source | License evidence |
|---|---|---|
| libGDX | binary reports 0.9.9; source POM used 0.9.9-SNAPSHOT | Apache-2.0 upstream |
| LWJGL | 2.9.0 | BSD-style upstream |
| Universal Tween Engine | 6.3.3 from source POM | Apache-2.0 upstream |
| PicoContainer | 2.13.6 | BSD |
| Commons Lang | 3.1 | Apache-2.0 |
| Commons IO | 2.4 | Apache-2.0 |
| Paranamer | 2.5.2 | BSD |
| Mockito | 1.9.5 | MIT |
| sysout-over-slf4j | 1.0.2 | Apache-2.0 |
| SLF4J | 1.7.2 | MIT |
| Logback classic/core | 1.0.9 | EPL-1.0 or LGPL-2.1 |

The shaded JAR includes `META-INF/LICENSE.txt` with Apache-2.0 text and `META-INF/NOTICE.txt` from Apache Commons Lang. It does not appear to include a complete third-party license set for every shaded dependency, notably Logback. Preserve the original binary unchanged, but do not use its packaging as the compliance model for a new distribution.

## Manual and release consistency

The manual identifies Patrick Haring and Christian Bürgi, gives revision hash `6876016`, and documents the expected three-ball game, high scores, configurable playfield, and physics/key properties.

A correction to the preliminary audit is important: the default release controls are **Tab** for the left flipper and **Enter** for the right flipper. `Space` plunges, `Esc` exits, and `R` resets/ends the game. The arrow keys are configured for ball manipulation in debug mode rather than normal flipper control.

The embedded `pinball.properties` agrees with the manual:

```properties
pinball.debug=false
pinball.skip.splashscreen=false
key.game.exit=ESCAPE
key.ball.up=UP
key.ball.left=LEFT
key.ball.right=RIGHT
key.ball.plunge=SPACE
key.ball.reset=R
key.flipper.left=TAB
key.flipper.right=ENTER
physics.pinball.radius=0.0135
physics.earth.gravity=-9.81
physics.ramp.angle.degrees=7.0
```

## Default table

The release embeds one effective default playfield. It contains:

- 3 bumpers: IDs 1, 2, 3
- 4 slingshots: IDs 4, 5, 9, 10
- 3 obstacles: IDs 6, 7, 8
- scoring rules: bumpers 1–3 = 20 points; slingshots 4–5 = 5 points; slingshots 9–10 have no scoring rule

The schema can describe multiple playfields, but the implementation loads only the first one. The configurable elements are bumpers, slingshots, obstacles, positions/geometry, and rule bindings. Flippers, plunger, drain, table bounds, ball, and several physics constants remain code-defined.

## Physics observations relevant to parity

Important source/release behavior for a future web parity suite:

- field model: 0.76 m × 1.40 m, represented internally with a scale factor of 10
- earth gravity property: -9.81 m/s², projected by a 7° table/ramp angle
- Box2D stepping uses the frame delta with 6 velocity and 2 position iterations
- ball is a bullet body, intended to reduce tunnelling
- flippers use direct angular velocity rather than a conventional torque-driven motor
- bumper force is 200 in scaled units
- a defined slingshot force of 300 exists, but the implementation appears to apply the bumper force instead; preserve this historical quirk for first-pass parity before deciding whether to fix it

## Asset quarantine

The release includes raster UI/game images and bitmap-font assets. The font descriptors explicitly identify **Nueva Std**. Because Nueva Std is a commercial typeface and no redistribution grant for these generated font assets was established, `nueva_black.*` and `nueva_white.*` should be quarantined. Other images whose authorship/provenance is not independently documented should likewise remain reference-only until cleared or replaced.

The release contains no meaningful production MP3/WAV/OGG audio set. Prototype audio found in the source tree should also remain quarantined unless provenance is established.

## Runtime test

The untouched release JAR was launched in an isolated working directory under Xvfb using OpenJDK 21.0.8. Startup fails before the game window because PicoContainer attempts to load `javax.annotation.PreDestroy`, which is not provided by the modern JDK:

```text
java.lang.NoClassDefFoundError: javax/annotation/PreDestroy
```

This is classified as a modern-runtime compatibility failure, not an observed defect in the 2013 game. The manifest proves the release was built with JDK 7 (`1.7.0_21`). A period-compatible Java 7/8 runtime test remains desirable for archival completeness but is not required to begin a clean web reimplementation after this audit.

## Port feasibility

A future preservation port is well suited to pure HTML5 + JavaScript with Canvas 2D, client-side persistence, and no framework. The table XML should remain untouched in `/reference`; a generated JSON representation can be used by the web runtime if useful. A custom small physics implementation is plausible because the domain is limited, but it should only replace Box2D after parity fixtures are established for gravity, plunge, flippers, collisions, bumper/slingshot response, drain, score, ball count, and state transitions.

## Gate

The previous **HOLD** was caused by the absence of the original release bytes. That gate is now lifted.

**Final status: GO — preserve originals, quarantine uncertain assets, and do not “fix” historical physics behavior until parity is documented.**
