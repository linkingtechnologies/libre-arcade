# QBriscola upstream reference

Player: `QBriscola`

Upstream project: QBriscola 1.1
Authors: Betti Sorbelli Francesco and Ciotti Roberto
License: GNU GPL version 2 or later

Primary AI source used for the faithful port:

- `src/finestra.cpp`
- `src/finestra.h`

Related model sources used to confirm card priority / score semantics:

- `src/carta.cpp` / `src/carta.h`
- `src/mazzo.cpp` / `src/mazzo.h`
- `src/giocatore.cpp` / `src/giocatore.h`

Canonical repository browser:
https://sourceforge.net/p/qbriscola/code/HEAD/tree/trunk/src/

SourceForge release page:
https://sourceforge.net/projects/qbriscola/files/

Note: this folder deliberately does not contain a reconstructed C++ source file.
The v0.3 port was created from the upstream source, but the untouched upstream
files were not copied into the BriscoLab archive at that time. Keeping only
provenance here is safer than presenting a reverse-generated file as original.
