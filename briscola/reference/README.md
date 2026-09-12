# Upstream reference sources

This directory is organized **one folder per integrated AI player**, matching the
player list used by the UI and benchmark runner.

- `qbriscola/`
- `cuperativa/`
- `smbriscola-empirico1/`
- `smbriscola-empirico2/`
- `jbriscola/`
- `pryscola/`
- `briscolabot/`

The two smBrisCola players intentionally contain separate copies of the same
untouched upstream `briscola_player.py`, because Empirico1 and Empirico2 are two
independent player entries in BriscoLab even though the historical project
implemented both algorithms in one Python file.

`qbriscola/` currently contains provenance and license metadata only. The
faithful JavaScript port was made from the upstream QBriscola 1.1 C++ source,
principally `src/finestra.cpp`, available from the SourceForge repository. The
original C++ file was not embedded in earlier BriscoLab archives, so it is
not reconstructed here from the JavaScript port. This is intentional: a
reconstructed file would not be an untouched upstream reference.

## Licensing boundary

Files in this directory are upstream reference snapshots or provenance records.
They retain their original upstream licenses. The BriscoLab root
`GPL-3.0-only` declaration applies to BriscoLab project code and faithful
JavaScript adaptations as distributed by this project; it does not rewrite the
historical license notice of an untouched reference file.
