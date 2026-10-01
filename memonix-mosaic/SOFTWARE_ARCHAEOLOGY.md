# The software archaeology behind Memonix: Mosaic

This is Memonix's own recovery story. For the philosophy shared by every
game in this collection — why reasoning is preserved rather than just
artifacts, why verification runs against executable originals rather than
screenshots, why an unresolved search is reported as *unknown* rather than
*impossible* — see [`../SOFTWARE_ARCHAEOLOGY.md`](../SOFTWARE_ARCHAEOLOGY.md).

## A children's memory game with its own proprietary archive format

Michael Kurinnoy and Viewizard Games didn't reach for zip or tar when they
shipped Memonix 1.6 in 2006. They wrote their own container format, `.vfs`
("virtual file system"), complete with an optional embedded archive key and
its own compression scheme. `Core/VirtualFileSystem/VFS.cpp` parses a
`VFS_` signature, a version byte, and a little-endian file table of
name/offset/length triples; `RLE.cpp` then unpacks each entry with a small
run-length scheme of its own (a non-zero leading byte means "repeat the next
byte that many times," a zero means "the next byte is a literal-run length,
followed by that many raw bytes").

Nothing about that format is documented anywhere public. The only way to
recover the 50 original Mosaic tile bitmaps was to read `VFS.h`, `VFS.cpp`
and `RLE.cpp` directly and write a parser from scratch against them — not
against a library, not against a spec, against the source. That parser
found exactly 265 entries in `gamedata.vfs`, decompressed every one to
precisely its recorded length with zero mismatches, and pulled out the 50
files under `DATA/MOSAIC/` this restoration now ships as lossless PNGs. The
BMP and PNG decoders used to cross-check those tiles pixel-by-pixel were
written the same way: from the format specifications, not from an existing
image library, so that "the pixels match" could be a claim this restoration
actually verified rather than one it merely repeated from whoever packaged
the recovered archive.

## One license notice, read literally

This collection defaults a ported game to the broadest license its upstream
evidence supports, and that has meant GPL-3.0-**or-later** in every case so
far. Memonix breaks that pattern, and it does so on purpose rather than by
oversight.

The recovered `MemonixSourceCode/License.txt` says a copy of "the GNU
General Public License version 3" should have been received "with this
artwork pack." Version 3. Not "version 3 or any later version" — the
specific phrase the FSF's own template uses when an author means to grant
that permission, and the phrase this collection's `AGENTS.md` requires
before assuming it. It isn't there, not in the license notice and not in
any of the per-file headers across the recovered source tree. So this
restoration ships as GPL-3.0-**only** — the first time this collection has
had to make that call rather than default past it. See `PROVENANCE.md` for
the full reasoning.

## A "dual licensing" model, for a game about matching shapes

That same license notice opens with a sentence that reads strangely for
software this modest: "Memonix game source code available under 'dual
licensing' model." Dual licensing is the language of companies selling
proprietary exceptions alongside an open release — the kind of clause you'd
expect from a database engine or a compression library with commercial
customers who don't want their own code copylefted. Here it sits above a
memory-and-shape game for children, evidence that Viewizard treated their
whole catalog, however small a given title, with the same licensing
seriousness as a larger commercial product. The open-source branch of that
model is the one this restoration exercises.

## A loading-screen trick hiding in plain sight

`options.cpp`'s `LoadMosaicPreset` doesn't just load bitmaps — it builds
one. Four of the fifty tile textures (`1_1`, `1_2`, `1_7`, `1_8`) get
stamped into the four quadrants of a blank canvas via `vw_AddToTexture`,
and the result becomes `DATA\pr_m.bmp`: the small preview icon shown on the
main menu's Mosaic button. There is no separate hand-drawn preview asset:
the icon is assembled, at load time, out of four of the game's own tiles.
The recovered `pr_m.bmp` in `gamedata.vfs` is that assembled result, frozen
after the fact, and this restoration recovers and reuses it directly rather
than reassembling it again — but knowing where it came from is why its
pixels line up exactly with the four tiles it borrows from.

## Four windows that used to mean something else

Memonix 1.6 was never four separate downloads. Builder, Pair, Mosaic and
Jigsaw were one program with one title screen, and `menu.cpp` lays their
four 128×128 selector windows into fixed corners of a shared 800×600
canvas: Builder at (176,66), Pair at (496,66), Mosaic at (56,255), Jigsaw
at (616,255). A standalone Mosaic release has no use for three of those
four windows, and no historical Mosaic-only title screen ever existed to
copy instead. Rather than invent a new layout, this restoration keeps the
original composition, the original rainbow-and-castle illustration, and all
four original window coordinates, and just reassigns the three windows that
used to launch other games to Instructions, Options and Credits. Mosaic's
own window keeps doing exactly what it always did.

## Ten shapes, five colours, and a suffix order nobody would guess

The fifty tile filenames follow a pattern — `<family>_<suffix>.bmp`, family
1 through 5, ten suffixes per family — but the suffix order is not `_0`
through `_9`. Every load sequence in `game_start.cpp`, `game.cpp` and
`options.cpp` walks each family as `_1, _2, _3, _4, _5, _6, _7, _8, _9, _0`,
zero last instead of first. It's a small thing, invisible during play, and
exactly the kind of detail that only survives a restoration if someone
transcribes the load order instead of assuming it. `public/src/model.js`
keeps that exact sequence, because a Mosaic archive identifier that doesn't
match the original's own numbering is a Mosaic archive identifier that
can't be checked against anything.
