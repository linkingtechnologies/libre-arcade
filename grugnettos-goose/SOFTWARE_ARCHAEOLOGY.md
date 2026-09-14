# The software archaeology behind Grugnetto's Goose

This is Grugnetto's Goose's own recovery story. For the philosophy shared by
every game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why provenance gaps are written down rather than smoothed
over — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A restoration with no single original to restore

Every other "Ported" entry in this collection traces back to one specific
program: one archive, one commit, one executable. Grugnetto's Goose is
built differently, and says so plainly in its own `ARCHAEOLOGY.md`: it is
"not a direct port of one historical program." The Game of the Goose is a
centuries-old folk game with no single owner and no canonical source code —
what this project actually had to reconstruct was a *rule tradition*, not a
binary. Its `specs/rules.md` records the result as a "classic baseline"
rather than a single authoritative ruleset, and is explicit about the one
place where the baseline was deliberately extended rather than just
transcribed: if every player ends up simultaneously stuck in the Well or
Prison with no dice roll able to free anyone, the longest-blocked player is
released automatically. The project labels this a "Grugnetto's Goose safety
extension" in the same document that records the traditional rules,
right next to them, rather than letting a helpful modern fix quietly pass
as ancient wisdom.

## Six games studied, zero games copied

The project's `reference/` folder lists six earlier open-source Goose and
race-game implementations it examined for behavior, UX and architecture —
including, by coincidence, the exact same `rriesebos/game-of-the-goose` and
`glParchis 20181125` upstream projects this collection separately restored
in `game-of-the-goose/` and `glparchis/`. Opening those six reference
folders turns up only a `PROVENANCE.md` note in each — no source dump, no
bundled archive, nothing else. Every one of them carries a licensing or
asset-provenance gap its own audit couldn't close (a GPLv3/ISC metadata
conflict here, an unresolved SVG or PNG paper trail there), and the
project's own rule is unambiguous about what that means: "reference
material may be valuable for behavioural comparison... without granting
permission to copy code or assets." Six pieces of prior art were read
closely enough to inform a modern implementation, and not one line or
pixel of any of them made it into the runtime.

## A 2008 SVG and a 1910s lithograph, both checked against the source

Two historical board artworks — Pmathijssen's 2008 Ganzenbord SVG and Daan
Hoeksema's ca. 1910–1920 hand-drawn "Het aloude ganzenspel" board — are
actually bundled and actually rendered by the game, because both cleared a
plain public-domain status the other six references couldn't reach.
Neither claim was taken on the project's own word here: the SVG was
independently re-downloaded straight from `upload.wikimedia.org` and its
bytes matched the bundled copy exactly, and the JPEG's aspect ratio
(bundled 2048×1470 against the Commons original's 6421×4609) lines up to
four decimal places with the real historical litho print — Gebroeders
Koster's "Het aloude ganzenspel," geese, dice, and all, not a
lookalike standing in for it. The project is equally candid about the
gap between the two: the SVG is bundled byte-identical to Commons, while
the JPEG is explicitly documented as a locally-supplied smaller
representation, "not claimed to be byte-identical to the full-resolution
Commons source." Two different confidence levels, both written down
instead of rounded up to the same claim.

## Same board, two independently drawn maps

A historical board scan is a picture, not a coordinate system — nothing in
either bundled image says where square 37 actually is. `public/data/board-layouts/`
holds two separate hand-calibrated JSON maps, one per board, and
`ARCHAEOLOGY.md` is specific that the second "is not copied from the
Ganzenbord geometry" — each artwork's 1–63 overlay was measured against
that artwork alone, through the `?debugBoard=1` calibration tool the
project ships for exactly this purpose. It's a small methodological choice
with a real consequence: swapping the board theme in the options menu
doesn't just reskin the game, it swaps in a geometry that was independently
verified to actually match the picture underneath it.
