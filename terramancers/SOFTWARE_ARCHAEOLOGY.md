# The software archaeology behind Terramancers

This is Terramancers' own recovery story. For the philosophy shared by
every game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why provenance gaps are written down rather than smoothed over
— see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A game found living inside a different game's repository

The preserved checkout still carries its original Subversion metadata —
`.svn/entries` files this restoration left untouched rather than tidied
away — and they name the repository outright: `svn.code.sf.net/p/vakhoarena/
code/trunk/dev`, checked out by user `shaishapira` on 2 July 2012.
"Vakhoarena" is not a typo or an old name for Terramancers; it's a
completely different game that shares this codebase. Digging into
`reference/extracted/src/src/shai/lpc/`, packages named `combat/`, `model/`,
and UI panels called `TavernPanel.java` and `HallOfRecordsPanel.java` are
still sitting there: gladiators, teams, leagues, arena matches, initiative
order, a hall-of-records screen — the scaffolding of an arena-combat/
management game that Terramancers, a real-time Reversi-on-a-tilemap, has no
use for at all. `Main.java`, the completed game's actual entry point, never
calls any of it. Terramancers wasn't built from scratch; it was built
*inside* an existing project, reusing its build setup and some of its
utility code, while the arena-combat idea it started from was left in place,
unfinished and unconnected. Both `reference/audit/ASSET_PROVENANCE.md` and
this port keep every one of those files rather than pruning the tree down to
"only what Terramancers actually runs" — the unused code is itself part of
the record of how this game came to exist.

## A speed formula the author wrote, then switched off

`Engine.java` contains a working, more elaborate player-speed formula —
`getPlayerSpeed()` — that never actually runs: the call site that would use
it is commented out, and the shipped game moves every player at a flat,
hard-coded 0.8 pixels per simulation tick instead. This is a live author
decision frozen mid-thought: a more dynamic mechanic was written, tested
enough to compile, and then deliberately not shipped, for reasons the source
doesn't record. A restoration that "helpfully" turned the dynamic formula
back on would be replacing the game that was actually released with a
different, never-shipped design the author chose not to ship. `public/src/core.js`
keeps the flat 0.8 constant exactly, and `reference/audit/GAMEPLAY_SPEC.md`
documents the dead code path by name so the choice stays visible rather than
silently vanishing.

## A collision check the source calls a TODO on itself

Right in the original `entity.cc`-equivalent movement code, before the
destination check, sits the author's own comment marking the point-based
collision test as something to improve later. It never was. A single point
`(x+dx, y+dy)` is tested against the destination tile; there's no bounding
box, no sub-pixel sweep, nothing more precise. This collection's rule for
exactly this situation — preserve source-observed quirks, including
acknowledged ones, rather than silently upgrading them — applies here
directly: the port keeps the same point check the shipped 2012 executable
used, TODO and all, because "the author knew about this and didn't fix it"
is different information than "nobody noticed."

## A tie that only looks fair

The historical UI decides single-player victory with one comparison:
`player1 > player2`. Nothing else. That means a tied board — an outcome the
scoring rules make entirely possible — resolves to a loss for the human
player purely because `>` doesn't include equality, not because tying is
narratively supposed to be a defeat. It's the kind of asymmetry that's
invisible unless you either read the comparison operator directly or
happen to end a match exactly tied, and this restoration's own test suite
pins the tie-counts-as-loss behavior explicitly rather than letting a
"more intuitive" tie/loss/win three-way split creep in during the port.

## Filenames that only broke on a filesystem the author never tested on

`professor.png` and `princess.png` are what the Java source requests by
name; the actual archive ships `Professor.png` and `Princess.png`,
capital-first. On Windows and on macOS's default filesystem, this never
matters — both are case-insensitive by default, so the mismatch was
invisible for the game's entire original run. It only surfaces on a
case-sensitive filesystem, exactly the kind this restoration's own
executable-archaeology pass used to launch the preserved `.jar` for
comparison (`reference/audit/EXECUTABLE_PARITY.md`), where temporary
lowercase aliases were needed just to get the original binary to find its
own art. The browser port resolves the correct case at load time and
records that as a platform-compatibility fix, not a gameplay change — the
mismatch was always there, just never observable until someone ran this
game somewhere its author didn't.
