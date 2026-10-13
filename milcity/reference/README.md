# reference/

The historical material behind this game, kept light and reproducible, not as a copy of the archive it came from.

- `milcity-blue-1.0.5/` is the author's source of 19 February 2011, unmodified: the 66 Java files (the core of the game, the GUI, the Bluetooth classes and the MIDlet, and one test), `COPYING` (the full text of the GNU GPL version 3), `README` and `Application Descriptor`. `CHECKSUMS.txt` lists the SHA-256 of each; they are what `tools/java-oracle.mjs` compiles and runs, and what `public/src/` was compared with.
- `SOURCE.md` says where the archive comes from, what is known (the archive is byte for byte the file SourceForge serves, compared by SHA-256 on 12 October 2026; the deployed jar was not compared), the licence and the evidence for it, and what is not kept (the deployed jar, the three pictures, the IDE's project files), each with its hash.
- `ARCHIVE_SHA256.txt` lists the 81 files of the archive.

The archive itself, the deployed program (`MilCity-Blue.jar`), the pictures and the IDE files are not redistributed. The deployed jar can be unzipped by whoever has it and given to the oracle (`MILCITY_CLASSES`), to run the classes the author compiled instead of the ones compiled here.
