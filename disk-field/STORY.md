# Disk Field
A 2007 game-jam physics puzzle in which you steer a disk by twisting the field around it, ported to the browser and checked against its own Python.

You never touch the disk. It sits in a grid of arrows that push it around, and all you control is the red half of them: hold Left or Right and every red arrow rotates ten degrees per step, while the blue arrows stay put. Gravity wells pull, repellers push, spinners swirl, and somewhere on the screen there is a red and black target the disk has to reach. Red walls send it back to the start. There is no score, no timer and no lives counter, only seventeen levels and the question of which way to turn the field.

**Disk Field** was written by Jeremy Appleyard (who entered as Tigga) in one week for PyWeek 5, in September 2007, on the contest theme "Twisted". The project's dossier records that it won the individual category, with an overall rating of 3.83 from 41 raters. This version keeps all seventeen levels and their physics, and replaces everything that could not be shipped safely.

## Highlights

The levels run in the original order, from the opening one, where a single rotatable repeller sits on the target, to level 13, Black holes!, which sends the disk through a pair of holes. Level 7, called Dodge!, has five moving walls whose starting heights and speeds are drawn at random each time it loads, so it is never quite the same puzzle twice. The level selector shows a live preview of each level on the right, with the walls and fields moving but the disk held still.

The menu, the selector, the options screen and the credits are drawn on one canvas in the original yellow and black. It runs in Italian or English, saves your progress in the browser, and has on-screen buttons for touch screens. Sound effects and music are synthesized by the browser, and the arcade lettering is drawn by code, because the original font and recordings are not included (more on that below).

## For the nerds

The 1.01 update came out on 25 September 2007, and its most interesting property is what it left alone. Of the 43 files in the contest archive and the 33 in the update, 27 are byte-identical, and that group includes the physics, the constants, the force formulas and every level. What changed is the shell: a crash on 64-bit systems, crisper text on some graphics cards, cheaper arrow drawing. The author's own change log also admits that the contest release shipped with psyco, an optional speed-up for Python, switched off by accident.

That accident matters more than it sounds, because the original advances exactly one simulation step per drawn frame and never measures elapsed time. A slow machine runs a slow game. The port instead runs a fixed 30 steps per second no matter how fast the screen refreshes.

Matching the numbers took some care. The original keeps its vectors as 32-bit floats and quietly turns them into 64-bit doubles the first time a field arrow is rotated. The port copies that behavior with `Math.fround`, so an arrow that has never been rotated is still a 32-bit value while a rotated one is not. To check the result, the original Python modules were run headless and their output was compared with the port over seven scenarios (2,238 steps in all) and 85 samples of the vector field. Every collision, hole and completion event matches exactly, and positions stay within 0.0025 pixels. The catch is that this ran under current Python and NumPy, not the 2007 interpreter, so it is strong evidence and not a proof of bit-exact equality.

Adding the game to this collection turned up one more fact. The seven original Python modules kept in the repository for that comparison are not the archive's bytes untouched. Five of them hash to exactly the archive's values once their line endings are converted back, which makes them the original code with tidied newlines. The other two differ by a few bytes that cannot be itemized without the private archive, and the notes now say so.

The source is also a museum of cut features. It still has crumble walls that break when the disk spins hard enough, disk blades, shrink and grow methods that nothing calls, power-up colors with no power-ups, and a wall generator that only lives in a dead block of level code. The author's post-mortem says he tried breaking walls by spinning and dropped it because it was hard to control. One quirk did survive into play and is kept on purpose: when a red wall resets the disk, position and speed go back to the start, but the spin does not.

Level 7 comes with a caveat about the proof of solvability. The test suite replays a winning sequence of key presses for every level on the real engine, and all seventeen finish. For Dodge!, though, that holds for one recorded random layout. Further searches found solutions for other layouts, but nobody has shown that every possible layout can be won.

## For everyone else

The author's README has no license file, only a closing line: "Do whatever you like. Would like it if you gave me some sort of credit." That is a permission in plain words, not a standard license, so the original code and levels keep it, and the new code around them is GPL-3.0-or-later. The credit is given in the game and in the documentation.

The assets are a different story. The original font has its own license, which asks for written permission before it is included in distributed software or collections, and no such permission is on record. The music has an attribution but no license. Five of the sound files have names that look like old Freesound uploads whose license pages were never recovered, and three collision sounds have no author information at all. None of them ships, which is why the playable game contains no font and no audio file.

Automated checks pass, but a person still has to play all seventeen levels with a keyboard, try the touch controls and short landscape layout on a real phone, and check that audio starts correctly on Safari and Chrome for mobile. Those items are open in the release checklist, and they are acceptance tests rather than known problems.

## A game with a sequel nobody kept

In 2009 a browser version of Disk Field, credited to the same author, appeared on Kongregate. The dossier found no source or repository for it, so the story of the game stops in this collection at the Python original, with a note that the trail continues somewhere it could not follow.
