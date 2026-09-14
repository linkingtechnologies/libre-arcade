# The software archaeology behind Nova Pinball

This is Nova Pinball's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why an unresolved search is reported as *unknown* rather than
*impossible* — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

This game's own documentation already carries an unusually deep archaeology
record: `docs/HISTORY.md`, `docs/UPSTREAM_CREDITS.md`, `docs/ARCHAEOLOGY.md`,
`docs/PARITY_SPEC.md`, `docs/UI_PARITY.md`, `docs/AUDIO_PARITY.md`,
`docs/ASSET_REFERENCE.md`, `docs/PRESERVATION_MATRIX.md`,
`docs/RELEASE_AUDIT.md` and `NOTICE.md`. This file doesn't repeat that; it
picks out what independent re-verification during integration into this
collection actually confirmed, and why.

## An executable that carries its own proof

`reference/MANIFEST.md` claims the official Windows build,
`nova-pinball-0.2.3-win.zip`, is a fused LÖVE runtime whose first 381,952
bytes are the interpreter and whose appended payload is byte-identical to
the standalone `nova-pinball-0.2.3.love` release. That's a checkable claim,
not just an assertion, and integration re-verified it independently: both
files were re-downloaded straight from `wesleywerner/nova-pinball`'s GitHub
release page, and both SHA-256 hashes matched the manifest exactly. The
Windows executable isn't a separate build that happens to look the same —
it's the identical game payload, self-corroborating across two distribution
channels the author shipped nine years apart from each other's scrutiny.

## A sound effect nobody ever heard

The v0.2.3 `.love` archive contains 19 WAV files. Grepping the actual Lua
source for every call site that plays a sound turns up only 18 distinct
names. The nineteenth, `powerup-2.wav`, sits in the package, fully formed,
referenced by nothing — a sound effect Wesley Werner recorded or generated
and then never wired into a single mission, bumper or menu action. It shipped
in every release since 2015 anyway, silent cargo nobody who played the game
would ever have had reason to notice. The restoration synthesizes clean
replacements for the 18 roles that are actually used and leaves the 19th
alone, unreconstructed, exactly as unused as it always was.

## A number preserved to eleven decimal places

`data/table.json`'s `width` and `height` fields — `620` and
`759.49966716648` — look like they could be rounding artifacts of the JSON
conversion. They aren't. Extracting the original `nova.pinball` table
definition from inside the `.love` archive and reading its Lua-pickled
literals directly shows the same two numbers, digit for digit, in the
original 2015 source. That kind of exact floating-point agreement between an
independently-read Lua table and a JSON port of it is strong evidence the
conversion was a faithful transcription, not a re-derivation from
measurements or screenshots.

## A conservative call on a generous credit

Wesley Werner's own README opens its credit section with "Thanks goes to
these people for letting me use their work," naming five people by name.
That sentence is real evidence the original inclusions were authorized. It
is not, by itself, evidence that any of those five ever agreed to let their
work travel into a separately modified, redistributed web port built by
someone else a decade later — and the restoration treats that distinction as
real rather than academic. The historical credits are reproduced in full in
`docs/UPSTREAM_CREDITS.md` regardless of which assets shipped; the tracker
music, the restrictive `Advanced LED Board-7` font (independently confirmed
here to be "freeware for home using only," commercial use priced
separately) and the original WAV/PNG assets stay out of the public build for
that reason, documented rather than quietly dropped.
