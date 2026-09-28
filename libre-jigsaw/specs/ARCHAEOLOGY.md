# Archaeology baseline — Virtual Toybox → Libre Jigsaw

## Preserved artifacts

The `/reference` directory keeps the three supplied upstream artifacts unchanged and verifies them through `SHA256SUMS.txt`:

- `puzzles20100726.zip` — Virtual Toybox source snapshot, 2010-07-26;
- `puzzlegames.jar` — Virtual Toybox Puzzle Collection stable 2010.08.11;
- `libre-jig-master.zip` — later Libre Jigsaw source tree; internal GUI metadata identifies 2012.02.06 and repository work continues into March 2012.

The relevant Java source headers license the game code under GNU GPL version 3 or, at the recipient's option, any later version.

## Genealogy

Virtual Toybox Puzzle Collection contained Jigsaw Puzzle, Sliding Tile Puzzle and Spinning Tile Puzzle. The jigsaw line continued as Libre Jigsaw. Libre Arcade keeps this genealogy explicit but publishes the three games independently. This repository contains **Libre Jigsaw** only; see `LINEAGE.md`.

## Geometry

The 2010 square cutter and later Libre Jigsaw square cutter are genuine different generations. Virtual Toybox 2010 constructs square edges directly with larger control/corner variance. Libre Jigsaw later factors the geometry into `JigsawCutter` and changes the square curve construction and variance.

The hexagonal cutter is different historically: the 2010 implementation already contains the edge mathematics later generalized by `JigsawCutter`. Its ownership scheme, constants and edge clipping remain materially the same. The production player therefore uses the later Libre behaviour while the 2010 implementation remains preserved for parity tests.

## Snapping and groups

Both generations use true neighbour-to-neighbour snapping rather than snapping a piece to an absolute board position. Physical groups are represented by `ConnectedSet`; selected groups are conceptually separate from physical connectivity.

The common snap gate is preserved: logical adjacency, equal rotation and strict error below 5 pixels on both axes. The placement policy changed on 2011-02-08: Virtual Toybox 2010 recenters a merge with a weighted integer average, while Libre Jigsaw anchors to the largest qualifying on-board connected group. The production player follows the later Libre policy; both remain regression-tested.

## Layers and selection

The stable 2010 JAR confirms three organisational layers, keyboard accelerators 1/2/3 and rectangle multi-selection. Multi-selection moves whole connected groups without physically connecting them; selected groups are not snapped on multi-selection release and cannot be rotated as a multi-selection. The HTML5 player retains this behaviour and adds a visible area selector as the touch equivalent of keys 1/2/3.

## Save/load

Functional save/load entered the Libre Jigsaw line in December 2011. The Java `.ljf` format stores the image URL, board dimensions, tile-manager descriptor, generated cutter data, per-tile position/rotation/layer/z-order and connected sets.

The HTML5 restoration preserves the same user-level state but uses a browser-native self-contained `.ljf` JSON format. Bundled gallery images are referenced by filename; personal images are embedded directly. This deliberately improves portability over the Java file-URL dependency. Historical Java `.ljf` import is not claimed yet; such files are detected and rejected clearly.

## Completion

The later Java `finishGame()` rotates the final connected group upright, centers it on the play area and disables further manipulation. The HTML5 restoration reproduces that presentation.

## Assets

The ten bundled photographs and thumbnails in the player are byte-identical to the copies shipped with the historical game. The later upstream attribution identifies them as JS Nature Photos under CC BY-SA 3.0 US. Code and photographs therefore retain separate license notices; see `THIRD_PARTY_NOTICES.md` and `/LICENSES`.
