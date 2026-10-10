# Fourrow asset audit — M0

No original Childsplay media is included in this package.

## Assets referenced by recovered Fourrow code

| Asset | Runtime use | M0 status | Notes |
| --- | --- | --- | --- |
| `4row_red.png` | red token | YELLOW | Exact filename also appears in Al Sweigart's Four-In-A-Row downloads; binary identity/license of the image itself not independently proven here. |
| `4row_black.png` | CPU token | YELLOW | Same provenance issue as red token. |
| `4row_board.png` | board cell | YELLOW | Same filename as Sweigart upstream graphics. |
| `1.png` … `7.png` | column labels | UNKNOWN/YELLOW | Childsplay media with no per-file provenance recovered. |
| `computer.png` | CPU portrait | UNKNOWN/YELLOW | Childsplay-specific media; no per-file provenance recovered. |
| `winner.png` | winner marker | UNKNOWN/YELLOW | Childsplay-specific media; no per-file provenance recovered. |
| `won.ogg` | win audio | UNKNOWN/YELLOW | No per-file provenance recovered. |
| `loss.ogg` | loss audio | UNKNOWN/YELLOW | No per-file provenance recovered. |
| `8.png`, `9.png`, `10.png` | not loaded by Fourrow code | REFERENCE ONLY | Present in `FourrowData`, apparently unused by this activity version. |
| `pointer_computer.png`, `pointer_user.png` | not loaded by recovered code | REFERENCE ONLY | Leftover/unreferenced in recovered Fourrow module. |

## Why this is conservative

Childsplay had a documented Debian licensing dispute over media provenance. The project-wide GPL statement is therefore insufficient evidence for treating every individual image/audio file as GPL-safe.

## Restoration asset strategy

For a Libre Arcade / ConnectLab integration:

- render board, holes, tokens and column numbers procedurally in Canvas/CSS;
- use text/CSS for CPU/player indicators;
- synthesize minimal feedback tones with Web Audio or use separately audited CC0 assets;
- do not redistribute the original Childsplay Fourrow PNG/OGG files unless their provenance is later proven file-by-file.

This removes the asset gate without altering the historical move-selection algorithm.
