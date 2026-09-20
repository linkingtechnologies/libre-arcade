# The software archaeology behind Comet Pinball

This is Comet Pinball's own recovery story. For the philosophy shared by every game in this collection (why reasoning is preserved rather than just artifacts, why verification runs against executable originals rather than screenshots, why an unresolved search is reported as *unknown* rather than *impossible*) see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

The game arrives with an unusually large evidence record: [`ARCHAEOLOGY.md`](ARCHAEOLOGY.md) for identity and scope, [`specs/PARITY.md`](specs/PARITY.md) for the measured physics, [`reference/audit/`](reference/audit/) for the audit of the original release, [`JAR-LICENSE-REVIEW.md`](JAR-LICENSE-REVIEW.md) for the binary's rights and over 90 files under [`reports/`](reports/). This file does not repeat them. It picks out what makes this specimen unusual and what integration into the collection checked again.

## A game that no longer starts

The 2013 release was built with JDK 1.7.0_21. The audit launched the untouched JAR under OpenJDK 21 and it fails before any window opens: PicoContainer looks for `javax.annotation.PreDestroy`, which modern Java no longer ships. That is a runtime-compatibility failure, not a defect of the game, and a launch on a period Java 7 or 8 was not reproduced. Running the original as an oracle therefore takes a period-appropriate Java setup. The port keeps its native measurements as frozen CSV files, so its own tests run without starting the Java game.

## The manual and the keys

The audit corrects its own first guess about the controls. The arrow keys are not the flippers: the shipped `pinball.properties` and the manual agree that the left flipper is Tab and the right is Enter, with Space to plunge, Escape to exit and R to reset. The arrows only move the ball in debug mode. The port binds Tab and Enter, and adds the arrows and letter keys because a browser player will expect them.

## A force that was never used

The source declares two different forces: 200 for bumpers and 300 for slingshots. The implementation applies the bumper value on the slingshots' reactive side as well, so the larger constant is never used. The port keeps that behavior, since the aim of a first pass is parity with what the game did, and leaves fixing it as a decision for later. Two of the four slingshots (ids 9 and 10) also have no scoring rule at all.

## A table format built for more than it loads

The table schema can describe several playfields. The implementation reads only the first, so the release contains exactly one table: three bumpers, four slingshots and three obstacles. The `7°` in the manual is the tilt of the table, not a ramp, and the manual's picture (a sparse black field with green wireframe fixtures) is the whole visual identity there was to preserve.

## Continuous collisions, rebuilt one contact at a time

The ball is a bullet body in the original, so fast contacts are resolved with time of impact rather than by checking positions at the end of each step. Reproducing that is the subject of most of the milestone reports. Frame 133 of the deterministic replay is the clearest case: the native trace shows a ball meeting `obstacle:7`, and switching continuous physics off makes the contact disappear entirely. Reimplementing that one contact, following the old Box2D 2.2.x structure (separating-axis search, clipping, a root search that alternates bisection and secant steps), brought the port's final position to within `7.9e-8 m` of the native one. Each later divergence, the flipper/corner contact at frame 57, the slingshots, the right flipper, the upper curves and the launch lane, was isolated and measured the same way.

## What the replay says, and what it does not

Native, the scripted three-ball game runs 1,842 frames, drains at frames 602, 1216 and 1830 and finishes on 45 points. The port follows it closely at first and then departs between frames 407 and 434, so its later drains and score differ. The documents say this plainly and keep the gap visible instead of tuning the engine to reach the number. Passing isolated tests is not evidence of full-game equivalence, and the game is described as a playable first import, not a certified 1.0.

## Fossils in the release

The shaded JAR holds 3,163 entries, including a stray `.svn/text-base/liblwjgl.jnilib.svn-base` and `mockito-all` 1.9.5, a test-mocking library that has no business in a shipping release. Its font files are bitmap atlases generated from the commercial typeface Nueva Std Cond. No grant covering them was found, which is the central reason the binary is not in this repository.

## A soundtrack borrowed from a sibling

The 2013 game has no meaningful production audio. The browser port plays a CC0 loop that was first written for another game in this collection, Mechanical Night Pinball. Integration confirmed the reuse by hash: the loop shipped here is byte-identical to that project's file, and the MP3 next to it is a format conversion of the same recording.

## What integration changed

The package arrived as two parallel trees, a source tree and a public copy of the runtime, kept in step by a script. The collection's layout has a single `public/` folder, so the two were merged after checking that every runtime and legal file was byte-identical. The 38 Node tests were then repointed at `public/` and pass, and the lint rules of the collection were added. The engine files were not touched.
