# PoIAna provenance snapshot

This reference folder contains the upstream files used to integrate the PoIAna
agent family into BriscoLab v1.3.0.

Sources supplied as GitHub repository ZIP snapshots:

- PoIAna game: https://github.com/ivanrava/poiana
- training repository: https://github.com/ivanrava/briscola-rl
- publisher page: https://ivanrava.itch.io/poiana

The publisher page describes PoIAna as a Briscola game with multiple AI agents,
states that models are loaded through ONNX Runtime, and links both repositories.
It declares the **code license as GNU GPL v3.0** and the **asset license as
Creative Commons Attribution 4.0 International**.

The GitHub ZIP snapshots supplied for this integration do not contain a
standalone root `LICENSE` file. BriscoLab therefore preserves the publisher's
project-level licensing statement in `THIRD_PARTY/PoIAna.NOTICE` rather than
inventing a more specific license classification for individual ONNX binaries.

## Preserved game files

`game/` contains the files directly relevant to inference and card semantics:

- `OnnxState.cs`
- `OnnxOpponentStrategy.cs`
- `SelectorMenu.cs`
- `Card.cs`
- `Deck.cs`
- `WinStrategies.cs`

## Preserved training files

`training/` contains the observation/action definitions and exporter used to
cross-check the Godot implementation:

- `state.py`
- `cards.py`
- `game.py`
- `game_rules.py`
- `export.py`

The 23 original `.onnx` model binaries are bundled under
`assets/models/poiana/` because they are runtime assets rather than reference
source text.

## Integrity manifest

`assets/models/poiana/MANIFEST.sha256` records SHA-256 hashes for every bundled
upstream ONNX binary and every mechanically derived Arena tensor bundle. This
allows later archaeology work to distinguish an unchanged upstream model from a
modified or regenerated artifact.
