# The software archaeology behind Netris

This is Netris's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why an unresolved search is reported as *unknown* rather than
*impossible* — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A dodge and a joke, thirty years old

Mark H. Weaver named his 1994 Tetris clone "Netris" and, right in the source
comment at the top of every file, called it "A free networked version of
T\*tris" — carefully never spelling out the trademarked name even in a
comment nobody but another programmer would ever read. Three decades later,
this collection avoids the same word for the same reason, in the same
company as `hextris/` and Abandoned Bricks: quietly dodging a trademark
turns out to be a Tetris-clone tradition, not a modern precaution.

The other joke is in the README, and it's aimed at the author's own game:

> This mode is currently very boring, because there's no scoring and it
> never gets any faster. This will be rectified at some point. I'm not
> very motivated to do it right now because I'm sick of one player T\*tris.

Netris's single-player mode has no score and no automatic speed-up. Weaver
built it as a proving ground for the feature he actually cared about —
network play, where the real game lived — and said so, in his own
distribution, without smoothing it over for posterity. This port keeps that
admission true: no score, no automatic speed-up, exactly as shipped.

## A random number generator, called out as crappy, by its own author

The whole piece sequence in Netris comes from one function, and its author
introduces it like this in `util.c`:

```c
/*
 * My really crappy random number generator follows
 * Should be more than sufficient for our purposes though
 */
```

It's a linear congruential generator with two magic constants, 31751 and
15437, seeded from the time of day unless a seed is set explicitly. It is
preserved exactly in `public/src/engine.js`'s `NetrisRandom` —
constants and all — because changing it, even to something more
statistically respectable, would mean this port no longer deals the same
piece sequence the 1999 binary would have dealt from the same seed. Faithful
preservation includes preserving what an author was comfortable calling
crappy.

## Turtle graphics for tetrominoes

Most Tetris implementations, before and since, describe a piece as a small
grid of filled and empty cells. Netris does not. In `shapes.c`, a piece is a
short program for a turtle: move forward, move back, turn left, turn right,
plot a block, repeat. A piece's four rotations are four separately-written
programs, linked into a circular chain (`rotateTo`) so that rotating just
follows the chain one step. It's a more unusual, more code-like way to say
"this is a T shape" than a coordinate table would be — and it says something
about how its author was thinking in 1994, comfortable reasoning about
shapes as traced paths rather than as data. `engine.js` reimplements the
same turtle interpreter rather than flattening the pieces into coordinate
tables, so that comparison remains possible line by line against `shapes.c`.

## A demo nobody saw, now the autopilot

`reference/netris/sr.c` — "a sample robot for Netris" — is a complete,
working Tetris-playing heuristic from the same two years as the rest of the
project: for every rotation and every column, it simulates the drop and
scores the resulting board on bumpiness, buried holes, and how enclosed each
gap is, then plays whichever placement scores lowest. Weaver wrote it to
demonstrate `robot.c`'s external-process protocol, not as a feature of the
game itself — you'd have had to know the protocol existed, write your own
launch command, and pipe `sr`'s stdin/stdout into a running Netris to ever
see it move a piece. Almost nobody who played Netris did.

`public/src/robot.js` ports `sr.c`'s scoring and decision functions
directly — the same `BoardScore` formula, the same `MakeDecision` search
over every rotation and column, even the same one-move-at-a-time actuator
pace — with only the pipe protocol swapped for direct calls into the
engine, since there's no external process to shell out to inside a browser
tab. Press `a` in the running game to hand it the board. Three decades
after it was written to prove a protocol worked, it's finally something a
player can actually watch play.
