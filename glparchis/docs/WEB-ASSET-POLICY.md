# Web asset policy

The browser restoration does not import the original `images/` or `sounds/` directories into the playable web build.

## Reused legally as GPLv3 source/data

- Python rule logic translated into JavaScript;
- AI decision structure, including preserved historical quirks;
- route arrays;
- board square coordinates and flags;
- player colour definitions.

## Newly reconstructed

- board cells and paths: Canvas primitives;
- pawns: Canvas circles with numeric labels;
- safe-square marker: vector/text mark;
- die presentation: Unicode/CSS;
- interface: HTML/CSS;
- sound effects: clean-room Web Audio oscillator cues in `public/src/ui/audio.js`.

No historical WAV sample is embedded, decoded or transformed by the playable build.

## Quarantined from the playable build

The intact upstream archive remains in `reference/` for preservation, but original media are not consumed by `public/index.html` or the JavaScript application. This includes the explicitly problematic preview icons identified in `ASSET-AUDIT.md`, along with sounds and other files whose provenance was not sufficiently demonstrated.
