# The software archaeology behind Memonix: Pair

This is Pair's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why an unresolved search is reported as *unknown* rather than
*impossible* — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).
For the shared Memonix archive format and the GPL-3.0-only licensing finding,
already told in full in
[`../memonix-mosaic/SOFTWARE_ARCHAEOLOGY.md`](../memonix-mosaic/SOFTWARE_ARCHAEOLOGY.md),
this is the Pair-specific half.

## A gap in the deck that the code never notices

Pair deals from a pool of 71 face images, numbered `toys-001.bmp` through
`toys-072.bmp`. Seventy-two numbers, seventy-one files: `toys-015.bmp` was
never part of the shipped archive. The game doesn't check for this and
doesn't need to, because of how it picks a face. `game_start.cpp` finds the
texture ID of `toys-001.bmp` once, then adds a random offset from 0 to 70 to
get any other face. Texture IDs are assigned in load order, and the loader
simply never requested `toys-015.bmp` in the first place, so the 71 files
that do exist occupy 71 consecutive IDs with no gap in the numbering the
game actually uses, only a gap in the filenames a person reading the
asset folder would notice. This restoration keeps a 71-entry face list and
never invents a seventy-second image to fill the naming gap, because the
gap was never really there in the first place, only in how the files happen
to be named.

## A shuffle that isn't one

Placing four copies of a symbol, or two, on the board doesn't use anything
resembling Fisher-Yates. The original code picks a random row and column,
checks whether that cell is already occupied, and if it is, picks again,
over and over, until it finds an empty one. Do that enough times across a
nearly-full board and the last couple of placements can take several
rejected tries before landing somewhere free. It's a slower, less elegant
algorithm than a proper shuffle, and it was clearly the first thing that
came to mind rather than the most efficient one. `generatePair` in this
restoration keeps the exact same reject-and-retry loop rather than quietly
upgrading it to a shuffle that would place the same symbols with less
wasted effort but a different, non-matching sequence of random draws.

## A difficulty setting that punishes you for the mistakes of your past self

Easy and Normal behave the way nearly every memory game does: get a pair
wrong, and the two cards you just flipped turn back over. Hard does
something else entirely. The instant you mismatch two cards, the game
doesn't just hide those two, it restores the entire board from a backup
taken the moment the board was generated, undoing every pair you've
successfully matched so far in the same attempt. A single late mistake
after ten correct matches sends all ten back into hiding. This is a real,
deliberate design choice preserved in the source, not a guess at what
"hard" should mean: `game.cpp` takes that backup once, right after dealing
the board, specifically so a later mismatch has something complete to
restore from. This restoration reproduces the same severity exactly, down
to the single shared 500-millisecond delay that both a match and a
mismatch wait out before resolving, because shortening or removing that
penalty would make Hard a different, gentler game than the one Viewizard
shipped.

## A tile borrowed from the room next door

Pair's empty board cells, the squares that haven't been dealt a card at
smaller board sizes, use an image that doesn't live anywhere in Pair's own
asset folder inside the archive. It's the same blank tile Builder uses for
its own empty cells, `DATA/BUILDER/0.bmp`, reused here under a different
name. The four Memonix suite games weren't four separate asset sets bundled
together; they shared a common pool of interface pieces, and a plain white
square was apparently common enough to not need its own duplicate copy for
each game. This restoration's `blank-cell.png` is a byte-for-byte copy of
the same file already recovered for this collection's own Builder
restoration, checked pixel by pixel against it rather than assumed to
merely look similar.
