# The software archaeology behind glParchis

This is glParchis's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why provenance gaps are written down rather than smoothed
over — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A threat detector that can't see the threat it's looking for

`docs/AI.md` traces a bug that survived from 2018 into this port on purpose.
The original computer player scores how threatened each of its own pawns is
by asking, for every opposing pawn, whether that opponent is "authorized to
move" (`estaAutorizadaAMover()`). That check ultimately calls
`puedeMover()`, which rejects any pawn where `ficha.jugador != mem.jugadores.actual`
— and during the AI's own threat scan, `mem.jugadores.actual` is set to the
AI player doing the scanning, not the opponent whose pawn is being examined.
So the very code meant to evaluate "can this enemy pawn threaten me" answers
"no" for essentially every ordinary enemy pawn, before ever checking
distance or dice range. Priority 2 of the original's five-priority decision
list — "reduce the number of threats" — is consequently almost inert in
real games; it was shipped, played, and never triggers the way its own name
promises. `public/src/ai/original-ai.js` reproduces this exactly rather than
fixing it, because a "smarter" AI here would be a different, unreleased
program, not the one that actually shipped in 20181125.

There's a second layer to the same bug worth keeping straight: on another
player's crowded start square, the original *can* register one threat,
through a narrower special-case branch. That branch works only because the
Python source tests the raw tuple returned by `puedeComer()` — a `(bool,
target)` pair — for truthiness directly, instead of unpacking and checking
its boolean element. In Python, `(False, None)` is a non-empty tuple, and a
non-empty tuple is truthy, so the check can pass even when the actual
capture flag inside it is `False`. The JavaScript port preserves this
observable quirk intentionally: fixing the tuple-truthiness slip would
silently change which start-square configurations the AI treats as
threats, which is exactly the kind of quiet "improvement" this collection
tries not to make without saying so.

## Two icons that name their own restriction

Most of glParchis's asset-provenance gaps are the ordinary kind — bundled
media with no accompanying license file, which simply can't be cleared one
way or the other. `play.png` and `stop.png` are a different, sharper case:
opening them at the byte level (`docs/ASSET-AUDIT.md`, independently
re-checked here with a raw `grep -a` over the PNG bytes) turns up an
embedded PNG `tEXt` comment that reads, in full, "Copyright INCORS GmbH
(www.iconexperience.com) - Unlicensed preview image". The icon's own
metadata states its restriction more plainly than most licensing questions
ever get answered. Both files are preserved, unmodified, inside
`reference/` for the historical record, and are the one asset pair this
restoration can say with total confidence should never appear in the
playable build — not "provenance unclear," but "provenance says no."

## A board rendered by nothing but code

`docs/ASSET-AUDIT.md` catalogs a long list of original media — icons,
avatars, textures, six WAV effects, country-flag PNGs — whose per-file
license can't be established from the archive alone. Rather than ship any
of it under a "probably fine" assumption, the browser build's entire board,
pawns, die and UI chrome are drawn from Canvas primitives and system fonts,
and every sound is a freshly written Web Audio oscillator cue in
`public/src/ui/audio.js`. This mirrors the original program's own OpenGL
approach more closely than it might look: 20181125 already rendered its
pawns as procedural cylinder/disk geometry rather than sprite art, so
replacing that 3D code with flat 2D Canvas shapes keeps the same
"presentation is code, not pictures" character the original chose for its
gameplay-critical pieces, while sidestepping every one of the archive's
unresolved raster and audio files entirely.

## A privacy feature that already existed in 2018

`docs/AUDIT.md` notes that the original desktop application phones home for
installation statistics, a global-statistics page, update checks and
bug-report navigation — all optional, none required for a single game of
Parchís. The browser restoration drops every one of them, keeping local
save/resume and the sound preference in `localStorage` only. That omission
isn't a modernization; the original code already treated those calls as
separable extras rather than gameplay, and the port simply declines to
carry them across into a static, no-backend build that has nowhere for
"phone home" to phone.
