# The software archaeology behind Mechanical Night Pinball

This is Mechanical Night Pinball's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why an unresolved search is reported as *unknown* rather than
*impossible* — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

This game's own documentation is already unusually thorough: `reference/PROVENANCE.md`,
`reference/SOURCE_SNAPSHOT_VERIFICATION.md`, `docs/ARCHAEOLOGY.md`, `docs/history/` and
`specs/history/` cover the full lineage in detail. This file doesn't repeat
that; it records what independent re-verification during integration into
this collection actually confirmed, plus the two most distinctive finds.

## Three layers deep, and the middle one isn't clean either

The lineage here has three links, not two: an unknown-rights Flash game
called Pinup Pinball, a 2018 C++/SDL/Box2D tribute by DocDonkeys that
reimplements it under a clear MIT license, and this restoration, built
against the DocDonkeys version as its primary parity target. The obvious
shortcut would be to treat the MIT license on the DocDonkeys repository as
clearing everything inside it. This project's own audit found otherwise:
several DocDonkeys graphics and audio assets show strong evidence of
deriving from the older Flash game, meaning they aren't freely relicensable
just because they sit inside an MIT-licensed tree. A permissive license on
a repository is a license for what the repository's own author actually
owns, not an automatic clearance for everything a previous, less
permissively licensed game left behind inside it. Public builds here use
entirely new SVG artwork and procedural audio instead.

## A commit that checks out to the byte

`reference/SOURCE_SNAPSHOT_VERIFICATION.md` pins the DocDonkeys reference to
one exact commit, `2208203...0cb9`, dated `2018-10-28T22:33:35Z`, with a
specific root Git tree SHA. Re-fetching that commit directly from
`DocDonkeys/Pinup-Pinball` on GitHub during integration reproduced the
identical author date and the identical root tree SHA. Recomputing the Git
blob hash of the repository's own `LICENSE` file by hand, using Git's
canonical blob format, matched the value on record exactly. None of this
required trusting a claim; every part of it is independently reproducible
by anyone who runs the same two commands against the same public commit.

## Recovering a feeling the modern remake itself had already lost

The most interesting find isn't about the Flash-to-C++ jump; it's about
what the C++ jump left behind. Bytecode recovered from the historical Flash
build shows the original flippers apply a small extra impulse,
`(0, -13.5)`, right at the moment a flipper key is first pressed, on top of
ordinary motor control. DocDonkeys' 2018 remake, the very project built to
carry this game forward, quietly dropped that impulse and drives the
flippers with motor control alone.

This restoration's primary parity target is the 2018 DocDonkeys table, but
the default player profile goes one step further back than its own
reference and restores the *effect* of that older impulse: a bounded,
one-shot angular-velocity assist on each flipper press edge, calibrated to
this project's own physics scale rather than copied as a raw number, since
the two solvers don't share mass, inertia, or unit scale. A strict
`?flipper=docdonkeys` mode is kept for anyone who wants the 2018 behavior
exactly as measured, snap omitted. Restoring something the authoritative
modern source had already quietly lost, by going past that source to an
older and less convenient one, is a rarer kind of archaeology than usually
shows up in a game reimplementation.
