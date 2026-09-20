# Comet Pinball
A 2013 Java pinball table rebuilt for the browser, with its physics measured against the original.

The table is small, black and almost bare: three ring bumpers near the top, four slingshots and three angled obstacles, all drawn in green wireframe in the 2013 manual. You have three balls and two flippers, and there are no ramps. The interest is in how the ball moves, and that is what this version tries to keep exact.

**Comet Pinball** was written in Java by Patrick Haring and Christian Bürgi, on libGDX with Box2D for the physics, and released as version 1.1.0 in 2013 under the Apache License 2.0. The browser version is a new implementation of the same table, written to behave like the original and checked against it.

## Highlights

The table is the original one, translated without loss from its XML file: a field 0.76 metres wide and 1.40 metres tall, a ball with a 13.5 millimetre radius and a table tilted by seven degrees. Bumpers score 20 points and two of the four slingshots score 5. The other two slingshots score nothing, exactly as in the release.

The controls follow the manual, where Tab moves the left flipper and Enter the right one, with Space to launch. Arrow keys, A, D, Z, L and M work too, and on a phone two fingers can hold both flippers at once. The camera follows the ball or shows the whole table, the game speaks English or Italian depending on your browser, and a CC0 music loop plays after you press play. That loop was written for another game in this collection, Mechanical Night Pinball.

## For the nerds

The original flippers do not use a torque motor. Each one is given an angular velocity directly, and the port copies that. It also copies a bug: the source declares a slingshot force of 300, but the slingshots apply the bumper force of 200, so the larger number is never used.

The interesting part is the ball. It is a fast body, so Box2D resolves its hits with time of impact instead of checking where it ended up. The port rebuilt those contacts one at a time and compared each with a trace recorded from the original. In the deterministic replay, frame 57 has a flipper touching a table corner, and the port's contact impulse matches the native one to about six digits: 3.575741 against 3.575747. At frame 133 the ball meets an obstacle, and turning continuous physics off in the original makes that contact vanish, which shows the step is a time-of-impact contact.

The comparison stops short of a full game, and the documents say so. Played by the same scripted inputs, the original drains its three balls at frames 602, 1216 and 1830 and finishes on 45 points. The port tracks it closely at first and drifts apart between frames 407 and 434, after which its drains and score differ. It was not tuned to reach 45. Passing every isolated contact test is not the same as being equal over a whole game, and this first import is described as a playable version, not a certified one.

The original release cannot easily be run today. Built with JDK 1.7.0_21, it fails to start under OpenJDK 21 because a class the old dependency container expects, `javax.annotation.PreDestroy`, is no longer part of Java. The recorded traces therefore live in this repository as fixed files, and the 38 tests run without Java.

Adding the game to this collection produced a few checks of its own. The upstream license file was read directly: Apache License 2.0, with a 2012 notice for Comet Engineering, Patrick Haring and Christian Bürgi, and the repository is archived and read-only since October 2020. The music turned out to be byte-identical to Mechanical Night Pinball's loop. And the package, which shipped its runtime twice in two folders, was merged into one copy after every file was confirmed identical.

## For everyone else

The original program is a single Java archive of about 7.8 megabytes with over three thousand entries. It bundles other people's libraries and two bitmap fonts generated from a commercial typeface, Nueva Std Cond, and no permission to redistribute those was found. So the archive is not in this repository. Its exact size and hash are recorded, and it can still be downloaded from the original project page on SourceForge.

The port is licensed Apache-2.0 like the original, which is a difference from most of this collection, where ported code is GPL-3.0-or-later. Apache-2.0 code can sit inside a GPL collection, and the root README says so.

Still open before anyone should call it finished: a complete three-ball game on real desktop and mobile browsers, two-finger play on a real phone, audio resuming after a pause, and entering the launch lane from above. Those are listed in the testing notes as acceptance work, not as known defects.

## A stuck ball

In the upper-left part of the table there is a pocket where the ball can come to rest. The same thing happens in the original, so the port does not quietly nudge the ball out. It offers a way to end the turn instead, after you confirm.
