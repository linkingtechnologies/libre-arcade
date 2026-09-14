# SnakesLadders — direct archive audit

- Project: SourceForge `asnakesladders`.
- Original archive examined: `SnakesLadders.zip`.
- SHA-256: `c683fbe6de00811a46185002d6c2b6208d3dc886c555a427d928626c46335b83`.
- Source identifies the game as “Snakes & Ladders by AVM RAO”.
- SourceForge file date: 2013-09-28.
- Role in Grugnetto’s Goose: Human/CPU turn flow and manual/automatic dice comparison.
- Historical source bundled here: **No**.
- Code copied into `public/src`: **No**.

## Licensing evidence

SourceForge labels the project GNU GPLv3, but the downloaded ZIP contains no `LICENSE` or `COPYING`, and inspected source headers do not reproduce GPL terms. That external project metadata is not enough for this archaeology project’s direct-evidence admission rule.

## Technical observations

The source exposes game modes for Human/Computer and Human/Human play, including manual dice entry. Snakes and ladders are stored as explicit board-transition data. These ideas are useful as comparison points for a turn state machine, but no C++/MFC code is incorporated.

## Asset status

The archive contains BMP board/dice artwork, ICO resources and WAV sounds. No complete asset provenance ledger was found. All of those media remain quarantined.
