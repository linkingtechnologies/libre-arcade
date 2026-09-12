# Historical executable check

## Artifact tested

`reference/extracted/Terramancers.jar`

The JAR was launched from a **temporary copy** of the extracted LPC archive. The preserved copy under `/reference` was not modified.

## Environment

- virtual X11 screen: 800×600
- OpenJDK 21 runtime
- lightweight X11 window manager used only so the historical maximized Swing window receives the expected 800×600 geometry

The game was written for Java 6, but the preserved JAR successfully starts on the newer runtime used for this check.

## Case-sensitive filesystem caveat

The historical Java code requests lowercase sprite names for at least some files while the archive contains capitalized filenames. Temporary aliases were created only in the test copy:

- `professor.png` → `Professor.png`
- `princess.png` → `Princess.png`

This reproduces the already-documented historical case-sensitivity issue without altering the artifact.

## Observed menu

The executable starts and displays the expected three final menu entries:

- Single Player
- Multiplayer
- Exit

Capture:

`captures/original-java-menu-800x600.png`

The source explains the geometry seen in that capture:

- Java screen: 800×600
- tile size: 32×32
- rows: `800 / 32 + 1 = 26`
- columns: `600 / 32 + 1 = 19`
- arena raster: 832×608
- arena left margin: `(800 - 832) / 2 = -16`
- arena top margin: `(600 - 608) / 2 = -4`

The small clipping around the arena is therefore original behavior, not a browser-port alignment defect.

At 800×600 `GamePanel.updateSize()` also creates menu buttons at `width / 2`, i.e. 400 pixels wide, and 50 pixels high. The browser shell does not attempt pixel-identical menu reproduction; this is an explicitly documented UI adaptation.

## Timing evidence

The executable source uses:

- `FPS = 60`
- `TPF = 3`
- three `Engine.tick()` calls per nominal repaint cycle

This yields a nominal 180 simulation ticks/s. `Tree.reloadTime = 50`, so after a paint event the next paint opportunity occurs after the counter has decremented through 50 to 0, i.e. 51 simulation ticks later under uninterrupted execution.

The browser implementation preserves the same tick constants and counter behavior. Walking animation is separated from simulation and advanced on a fixed 60 Hz clock because the original mutates `Sprite` animation state once per repaint rather than once per simulation tick.

## Parity boundary

This check establishes that the preserved JAR remains launchable and confirms the major screen/timing geometry directly against the executable/source pair. v1.0 does not claim pixel-identical Swing menu fonts/button rendering or deterministic random-map identity, both of which are outside the declared browser preservation baseline.
