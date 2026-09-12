# Preservation vs reconstruction policy

54321 is treated as a software-archaeology project first and a browser restoration second.

## PRESERVED

Material copied unchanged from the historical release:

- the user-supplied original archive;
- the extracted 2001 source tree;
- Noweb files and generated C++ sources;
- help scripts;
- Peg Jumper board data;
- original artwork and editable XCF sources;
- original developer documentation.

Preserved material lives under `/reference` and must not be silently edited.

## FAITHFUL PORT

A browser behavior may be called faithful only when it is traceable to original source, data, documentation, or executable observation. Examples include:

- cube indexing and topology;
- orthogonal-neighbor rules;
- Wrap semantics;
- difficulty tables;
- puzzle generation/setup;
- movement rules;
- 2D tier layout used to represent higher dimensions.

Parity notes and automated tests document these correspondences.

## RECONSTRUCTED / QoL

Features not demonstrably present in the 2001 release are labeled reconstructed. Current examples include:

- responsive browser shell;
- mobile/touch adaptations;
- English/Italian localization;
- browser/system font for new UI text;
- Web Audio implementation of the source-generated ding;
- optional dimensional-help overlays;
- accessibility labels.

These features must not be presented as original 2001 behavior.

## ENHANCED

Optional modernizations should remain separate from faithful defaults and must not alter puzzle rules. The dimensional-help system is disabled by default and may expose only geometry or legal current actions, never a solution path or hidden Bomb Squad contents.

## Licensing boundary

The original release is abandoned as an upstream development line, but abandonment does not remove copyright. The historical archive contains no standalone `LICENSE`/`COPYING` file and the exact GPLv3 compatibility of Patrick Stein's custom site-wide copyleft terms remains unresolved.

Therefore this repository deliberately avoids a blanket GPL-3.0 declaration. Original material remains attributed and separated. See `../LICENSE-RESEARCH.md`, `../ASSET-PROVENANCE.md`, and `../../THIRD_PARTY_NOTICES.md`.
