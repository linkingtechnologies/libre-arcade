# Zooming Secretary source record

## What it is

*Zooming Secretary* is a game for the Nintendo Entertainment System made in 2011 by Shiru (code, game design, sound, direction, some
graphics) and Alexei "PinWizz" Bespalko (most of the graphics, the text messages, the label art), tested by Gibson. The version this
port follows is **v1.02, 30.12.11** (the ROM carries the string `v1.02 30.12.11`): v1.01 of 28.12.11 was the first public release, and
v1.02 fixes "unavailable topics were requested on early levels after playing latest levels" (the author's notes).

## Where the files come from

The author's own page (`shiru.untergrund.net/software.shtml`) did not answer on 15 October 2026 (the first attempt was refused; a later one failed
at the name lookup, which an unrelated site did too in the same minute, so that one says little), so every file below comes from a third party's
copy, downloaded on that day with the integrator's permission. Two copies were used, and they agree.

1. **The OpenEmu project's repository** `OpenEmu/OpenEmu-Update`, directory `Homebrew/NES/Zooming Secretary/` (and its subdirectory
   `zooming_secretary_src/`), `master` branch; the last commit that touches that directory is
   `ee1dc820f1e0e45a1b223fa1d2c8443e8b10f213` of 14 December 2014. Ten files were downloaded from it: the ROM, `notes.txt` and eight files
   of the source (`ORIGINAL_SHA256.txt`). The oracle was built and run on these.
2. **The Internet Archive's item `zooming_secretary`** (`https://archive.org/details/zooming_secretary`, "Nes homebrew game and source", creators
   shiru and pinwizz, uploaded on 5 April 2017 by another person). Its two archives were downloaded afterwards, and are the names
   that the restoration package gives for the release and the source:

   | File | Bytes | SHA-256 |
   |---|---:|---|
   | `zooming_secretary.zip` | 801,853 | `c61863bed7961dbba4ee02c20a5c2d3fa96ad0c746a638618f5132b58ab9eea9` |
   | `zooming_secretary_src.zip` | 216,516 | `b273f39fa2aef726e2d79d791aa080685157c4386ce246f163278194e33c4916` |

   The release archive holds `Zooming_Secretary.nes`, `notes.txt`, `manual.pdf` (6 pages), `label_nes.png` and `label_fami.png`; the source archive
   holds 36 files (`game.c`, `npc.h`, `neslib.*`, `crt0.s`, `famitone.s`, the maps, the music modules, the tile set and the tracker projects).

What the comparison of the two copies says:

- the ROM and `notes.txt` of the release archive, and the eight source files of the source archive, are **identical, byte for byte**, to the ten
  files downloaded from the OpenEmu repository;
- the SHA-256 of `zooming_secretary.zip` is the one that the restoration package records for its own copy of the release
  (`release_zip_sha256` in its `reference/manifest.json`, `public/data/README.md`), so the file read here is the file the package's authors
  preserved; the package recorded no hash for the source archive (`historical_source_archive_sha256` is null);
- the ROM's SHA-256 (`315adee1…1770`) is the "certified v1.02 ROM" hash of the package, so the ROM that this port was checked against is the one the
  package's authors checked against;
- the source files match the ROM in the ways that could be tried: the variables that the oracle reads are where the declaration order of
  `game.c` and `npc.h` puts them, and every one of them behaves as the source says (`tools/ram-map.mjs`).

What is not known: that these bytes are those that the authors published. Both copies are third parties'; they agree with each other and with
the package's record, and nothing in them says otherwise, but the author's own site was not reachable to compare.

## Licence

**What the files say.** The author's development notes (`notes.txt`) have a paragraph about the licence. In it Shiru says that Creative
Commons licences are not recommended for software, that he would have released the project (strictly non-commercial from the start) as
public domain, and that a compromise was needed with PinWizz's wish to keep the right to be recognised for his work; he adds that he
wanted to avoid viral licences. No source file (`game.c`, `npc.h`, `neslib.*`, `crt0.s`) carries a licence header, and nothing in the ROM names one.
The release's other files do:

- the **manual** (`manual.pdf`): the cover ends with "CC BY 2011 Alexei Bespalko and Shiru"; the introduction, in English and in Russian,
  says that the game is not licensed or endorsed by Nintendo, is free of charge, is "released under Creative Commons Attribution license"
  and is provided "as is", without warranty or responsibility of any kind; the credits page names Alexei "PinWizz" Bespalko (graphics and visual
  design), Shiru (code, sound, gameplay design) and Gibson (testing), and says the game is freeware;
- the **label** (`label_nes.png`): "CC BY 2011 by PinWizz and Shiru". The second label (`label_fami.png`) was not opened.

None of them gives a version of the licence, an address, or the text of the legal code. So the evidence is a **Creative Commons Attribution**
grant by the two authors, dated 2011, **version not stated**. It is not guessed here.

**The other works.** Shiru's 2019 OpenGameArt collection "NES 8-bit sound effects" says it contains effects from several of his
freeware games, Zooming Secretary among them, under CC0 or CC BY 3.0; the port does not use it (it makes its sounds at run time).
The Mega Drive, Uzebox and ZX Spectrum ports and their pages are not sources of anything here.

## What is not kept, and why

None of the original's bytes is kept (see `README.md`), and nothing of it is redistributed: not the ROM, not the source, not the pictures,
the music, the manual or the label. The hashes in `ORIGINAL_SHA256.txt` and the table above are enough to know which files were used.
