# The software archaeology behind Don Ceferino Hazaña

This is Don Ceferino Hazaña's own recovery story. For the philosophy shared
by every game in this collection — why reasoning is preserved rather than
just artifacts, why verification runs against executable originals rather
than screenshots, why provenance gaps are written down rather than smoothed
over — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## An Argentine answer to Super Pang, honestly labeled as one

Hugo Ruscitti's own README calls Don Ceferino Hazaña similar to Super Pang
— gauchos and pampas instead of balloon-popping harpoon guys, but the same
core idea of shooting bouncing balls that split into smaller ones. That's a
meaningfully different situation from this collection's earlier "Pong or
Pang?" question: rather than a clone built to trade on Capcom's IP, this is
an independently authored, independently licensed game with its own
character, story, and credited artwork by Walter Velazquez, that happens to
name its own inspiration plainly. `docs/LEGAL_AUDIT.md` checked specifically
for any extracted commercial asset or ROM fragment and found none. Recording
the inspiration honestly, rather than either hiding it or treating it as
grounds for suspicion, is exactly the kind of provenance the collection asks
for.

## A comma that quietly erased half a rebound table

`pelota.cc` sets rebound velocity per ball size with lines like
`vel_salto=-4,3;` for size 2 and `vel_salto=-4,8;` for size 3. In C++, a bare
comma there isn't a typo-tolerant list — it's the comma operator, which
evaluates both sides and keeps only the last one. `vel_salto=-4,3;` assigns
`-4` and silently discards the `3`. Whatever rebound speed the author
intended to give sizes 2 and 3 individually, the compiler only ever executed
`-4` for both, and for size 1 as well — only size 4's `-5` survives untouched.
Three of four ball sizes rebound identically not because that was the
design, but because of one missing semicolon-shaped mistake that shipped
and was played for years. `public/src/core/ball.js` reproduces the *executed*
values, not the values the source formatting suggests were intended —
faithful to what the compiler actually did, not to what the code looks like
it was trying to do.

## A sound array with one more sound than it has room for

The original `audio.cc` declares an 11-element array of sound pointers, then
loads 12 sounds into it. In C++ this is undefined behavior — a write past
the end of a fixed-size array, the kind of bug that can corrupt adjacent
memory depending on the compiler, platform, and phase of the moon. It
apparently caused no visible symptom in the shipped game, which is often how
these bugs survive: silently, until the exact wrong conditions line up. This
is one of the only cases in this whole restoration where the collection's
"preserve the quirk" rule doesn't apply, and `docs/PARITY.md` says so
explicitly rather than leaving the reader to wonder: JavaScript arrays don't
have fixed sizes to overflow, so there is nothing behaviorally faithful to
reproduce — the bug's *cause* doesn't exist in the target language, even
though its *absence of consequence* is trivially easy to replicate by
accident. Naming that distinction is itself part of the record.

## A bonus counter that only ever goes up

The freeze power-up adds to `tiempo_bonus` and starts a countdown, but the
original code that manages this counter never resets it back to zero after
it's spent — it bottoms out at 1, not 0. Pick up a second freeze later in
the same life, and it starts from 3 instead of the 2 a fresh reading of the
feature's own description would suggest, running one quick-message interval
longer than the first freeze did. Nothing in the shipped game ever tells the
player this; it's only visible by reading `fuente.cc`'s message-counting
logic directly. The port keeps the off-by-one floor exactly, because
"freeze bonuses get slightly more generous the more you've already used
them" is a real, if accidental, property of the released game, not a bug a
2026 restoration gets to quietly average away.

## Provenance kept visible instead of just kept quiet

Every other recent restoration in this collection that found media with
incomplete provenance answered by removing the files from the repository
entirely — the reasoning lives in a document, but the files themselves are
just gone. This restoration tried something more transparent: a
`quarantine/` folder, checked into the repository, with its own `README.md`
naming exactly what's inside (bitmap fonts, `menu.xm`) and exactly why each
one isn't loaded by the runtime. A future contributor who wants to pursue
the provenance further doesn't have to reconstruct what was excluded from a
changelog entry — the candidate files are sitting right there, labeled,
waiting for whoever eventually tracks down the missing half of the record.
