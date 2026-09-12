# The software archaeology behind Libre Arcade

Every game in this collection answers the same question in a different genre:
could an old, abandoned piece of software be turned into a modern browser
game or opponent without losing its history? Not a clean-room rewrite that
merely looks the same, and not a modernization that quietly "fixes" what an
original author actually intended — a restoration that keeps their reasoning
legible and checkable.

## Preserve the reasoning, not just the artifact

The point of this laboratory is not to keep old files online. It is to
preserve what is inside them: how a programmer represented a board or a hand,
ordered the moves or cards they considered, avoided repeated states, managed
memory, decided when to stop a search, or weighed one heuristic against
another. A faithful port keeps that reasoning intact, including its quirks
and its bugs, instead of silently improving it into something the original
author never wrote.

## Verify by execution, not by resemblance

Every restoration in this collection is checked against its own source, not
against a screenshot. Where the original is still executable, its actual
output is the oracle: the restored engine's behavior is compared move by
move, state by state, against the original code running the same input —
never approximated by "it looks right." Where an original algorithm is
bounded (a search, a solver), a result that hits the bound is recorded as
*unknown*, never as *impossible* or as a silent success. An unverified
outcome is never presented as verified.

## Record provenance instead of erasing it

Every recovered source keeps its exact revision, its original license, and
its own copyright notices, tracked per file rather than folded into one
blanket statement. When a source cannot be pinned to an exact revision — no
git history, a compiled package, a paper, a deployed bundle with no visible
license — that limitation is written down plainly instead of being presented
with false precision.

## Why this matters more now, not less

Generative AI can now produce a new solitaire, a new card-playing heuristic,
or a new neural network from scratch in minutes. That makes it more valuable,
not less, to keep the software whose algorithms were actually designed,
tested, argued over, and shipped by identifiable people — and to keep that
reasoning available for study, comparison, and benchmarking, rather than
letting it quietly disappear under a faster rewrite.

## The games

Each game folder tells its own recovery story — which sources it restores,
what was found and what could not be, and how its own tests verify the
result. Two ways a game ends up here (see [README.md](README.md#games)):

**Ported** — re-implemented in a shared engine, verified against the
original with an executable oracle or a benchmark:

- [`klondike/SOFTWARE_ARCHAEOLOGY.md`](klondike/SOFTWARE_ARCHAEOLOGY.md)
- [`briscola/SOFTWARE_ARCHAEOLOGY.md`](briscola/SOFTWARE_ARCHAEOLOGY.md)
- [`netris/SOFTWARE_ARCHAEOLOGY.md`](netris/SOFTWARE_ARCHAEOLOGY.md)
- `netrok/` — see [`netrok/reference/README.md`](netrok/reference/README.md) and
  [`netrok/reference/source/netrok-0.95/RECOVERY_NOTES.md`](netrok/reference/source/netrok-0.95/RECOVERY_NOTES.md)
- `njam/` — see [`njam/README.md`](njam/README.md) and
  [`njam/reference/PROVENANCE.md`](njam/reference/PROVENANCE.md)
- `naval-battle/` — see [`naval-battle/README.md`](naval-battle/README.md)'s
  "Software archaeology" section and [`naval-battle/specs/provenance.md`](naval-battle/specs/provenance.md)
- [`netris/SOFTWARE_ARCHAEOLOGY.md`](netris/SOFTWARE_ARCHAEOLOGY.md)
- [`for-science/SOFTWARE_ARCHAEOLOGY.md`](for-science/SOFTWARE_ARCHAEOLOGY.md)
- [`54321/SOFTWARE_ARCHAEOLOGY.md`](54321/SOFTWARE_ARCHAEOLOGY.md)
- [`donkey-bolonkey/SOFTWARE_ARCHAEOLOGY.md`](donkey-bolonkey/SOFTWARE_ARCHAEOLOGY.md)
- [`psypong3d/SOFTWARE_ARCHAEOLOGY.md`](psypong3d/SOFTWARE_ARCHAEOLOGY.md)

**Restored** — the original code itself, vendored and kept running; no
separate archaeology essay, since the game's own `specs/design.md` already
records every change and why, and `public/CREDITS.md` its authorship and
license:

- [`hextris/specs/design.md`](hextris/specs/design.md)
- [`html5-breakout/specs/design.md`](html5-breakout/specs/design.md)
- [`html5-snake/specs/design.md`](html5-snake/specs/design.md)
- [`html5-space-invaders/specs/design.md`](html5-space-invaders/specs/design.md)
- [`react-simple-snake/specs/design.md`](react-simple-snake/specs/design.md)

**Built here** — new, not a restoration, so no archaeology story to tell:
[`grugnetto-go/`](grugnetto-go/).
