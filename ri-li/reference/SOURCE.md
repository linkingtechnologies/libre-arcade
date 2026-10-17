# Where the original comes from

`Ri-li-2.0.1.tar.bz2` is the source release of **Ri-li 2.0.1** (the C++/SDL game by Dominique Roux-Serret), untouched. It is the file that the restoration package
`rili-m18.zip` carried in its `reference/` folder, byte for byte, and it is what `tools/oracle/build.sh` compiles.

| | |
|---|---|
| Size | 13,745,398 bytes (141,202,974 bytes unpacked, about 90 files; the `data/` folder is most of it) |
| SHA-256 | `f71ccc20c37c601358d963e087ac0d524de8c68e96df09c3aac1ae65edd38dbd` |
| SHA-1 | `33c1cd7c7a757decf813f5065a1bd88bba9520f3` |
| MD5 | `57a2ff50a0c704786da8adf61d78bf52` |
| Named by the package as | the 2.0.1 release in `https://sourceforge.net/projects/ri-li/files/Ri-li%20Linux_Unix/Ri-li%20V2.0.1/` |

## What was and was not checked about the file

- The SourceForge page of that folder (read on 17 October 2026) lists `Ri-li-2.0.1.tar.bz2` as 13.7 MB, from 7 November 2007. The size agrees at the precision the page
  gives. SourceForge shows no checksum for it, and the author's own pages (`ri-li.org`) were not looked at. **That the file is byte for byte what the author published is
  therefore not established.** What can be said is that it unpacks to a program that builds and runs (`tools/oracle/build.sh`), whose headers, `NEWS` (the last entry is
  "01-11-2007 : Version 2.0.1") and `AUTHORS` say what the package says, and whose `levels.dat` is the one the package kept (SHA-256 below).
- The Debian archive has a `ri-li_2.0.1.orig.tar.gz` (2008), which is the same release in another compression. It was not downloaded; hashing its members against this archive's
  would settle the question (see `PROVENANCE.md`, open points).

## What is in it

`README`, `AUTHORS`, `NEWS`, `COPYING` (the text of the GNU GPL version 3), `COPYING.Music` (the musicians' own licence notice, also GPL version 3), `ChangeLog` (empty), the autotools files;
`src/` (the 25 files of C++: `loco`, `jeux`, `menu`, `ecran`, `sprite`, `tableau`, `utils`, `mouse`, `audio`, `editeur`, `main` and their headers);
`data/` (`sprites.dat`, `levels.dat`, `language.dat` and one `language.XX` file of label pictures for each of the 19 languages, icons);
`Sounds/` (nine `.wav` effects and the three tracker tunes `menu.mod`, `jeu1.xm`, `jeu2.xm`); `gentoo/`.

Files of the original that the page uses, with the SHA-256 that `tools/check-assets.mjs` checks them by:

| File | SHA-256 |
|---|---|
| `data/sprites.dat` | `65cb3c87b097bbbf8c5fb29bee343ce5f3b44a337b650887f32ed4d613288696` |
| `data/levels.dat` | `d88a4a1c3f8bb7eab580cb4a0225602b2f96b71fd34404ad230d37f0c6ee774f` (also `../public/data/levels.dat`) |
| `data/language.dat` | `9839ae255af926f9cc8c986a0614a2a889479ce276b26af3011cfb1d3057afcb` |
| `data/language.En` | `aa9df1016228e95f3a1ef5d03170ddc5314644c19715ab5e1b09c0e9e4d9a681` |
| `data/language.It` | `b1bf3cfa5785842d2c3bb75842fd61d4119fabb5fd25ff9522f8b9b9ab924fff` |

## What is not kept

The unpacked `data/` is 135 MB (the 17 other languages' labels are most of it), so the archive is kept packed and nothing is unpacked into the repository. To unpack it (it is bzip2):

```sh
tar -xjf reference/Ri-li-2.0.1.tar.bz2 -C /some/folder        # or python3 -c 'import tarfile; tarfile.open("reference/Ri-li-2.0.1.tar.bz2").extractall("/some/folder")'
RILI_DATA=/some/folder/Ri-li-2.0.1/data node tools/check-assets.mjs
```
