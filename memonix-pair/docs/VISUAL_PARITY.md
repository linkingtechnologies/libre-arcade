# Visual/UI parity

The restoration preserves the historical rules and original card artwork while restoring the historical Memonix preview and gameplay shell.

## Original visual sources used directly

| Runtime use | Historical source | Distributed file |
| --- | --- | --- |
| Preview background / controls | `DATA/start.jpg` | `assets/ui/original/start.jpg` |
| Preview countdown digits | `DATA/start2.jpg` | `assets/ui/original/start2.jpg` |
| Preview countdown label | `DATA/start3.jpg` | `assets/ui/original/start3.jpg` |
| Game background / timer sheet | `DATA/game.jpg` | `assets/ui/original/game.jpg` |
| Pair no-Mist blank panel | `DATA/game2.bmp`, source rect `(0,212)-(182,270)` | `assets/ui/original/game2.png` |
| Winner dialog | `DATA/box.jpg` | `assets/ui/original/box.jpg` |
| Empty / inactive / removed cell | `DATA/BUILDER/0.bmp` | `assets/ui/original/blank-cell.png` |

`game2.png` and `blank-cell.png` are lossless conversions of the recovered BMP pixels.

## Coordinates restored

- Board: `(44,44)`, 8×8 logical cells of 64×64 pixels.
- Preview buttons: Start `(590,344,176,41)`, Reset `(590,401,176,41)`, Options `(590,458,176,41)`, Menu `(590,515,176,41)`.
- Game buttons: Reset `(590,458,176,41)`, Menu `(590,515,176,41)`.
- Game timer digits: historical positions `(688,50)`, `(709,50)`, `(730,50)` using the digit strip embedded in `game.jpg`.
- Winner dialog: `(200,200,400,200)`; New/Menu hit areas mirror the original dialog implementation.

## Pair-specific fidelity

Pair has no piece palette and no Mist button. The original code blanks the Mist region by copying a patch from `game2.bmp`; The restoration does the same. Match and mismatch feedback is the face-up state of the selected cards for roughly 500 ms—there is no modern checkmark/cross overlay.

## Standalone adaptations

Options, Instructions, Top Scores and Credits are standalone preservation-layer screens. The title/menu uses the recovered Memonix main-menu shell while documenting the reassignment of the non-Pair suite windows.
