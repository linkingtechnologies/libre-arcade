# Disk Field HTML5 M5 — player-facing audio/typography polish

## Scope

M5 addresses the public-build presentation gap discovered during M4 review. It does not change the validated physics, level data, oracle corpus, or preserved upstream archives.

## What changed

### The in-game legal/technical disclaimer is gone

The credits now contain only player-facing credit copy. Asset provenance is documented in `THIRD_PARTY_NOTICES.md` and the archaeology audit instead of being shown as a gameplay message.

### Separate sound and music settings

The 2007 game had separate sound/music flags. M5 restores that distinction:

- `Suoni / Sounds` controls interface, collision, hole and completion cues;
- `Musica / Music` controls the procedural background loop;
- both settings persist independently in `localStorage`;
- both expose `aria-pressed` state in the browser toolbar.

### Replacement sound design

M4 had only three minimal oscillator cues. M5 adds a complete procedural replacement layer corresponding to the historical sound *roles*:

- UI beep;
- three rotating collision-thud timbres with impact-sensitive level;
- black-hole entry sweep;
- white-hole exit pop;
- level-completion cue;
- final-screen cue;
- quiet procedural music loop.

No historical recording is sampled, decoded, requested or packaged.

### Replacement typography

The historical `MAKISUPA.TTF` is not distributed. Instead, main Canvas headings and menu labels are drawn by a small 5×7 glyph renderer implemented as JavaScript. This gives the public build a consistent arcade identity without a font dependency. Regular browser controls/credits use the host system UI font.

## Fidelity/integrity

Hashes remain unchanged:

- `public/js/engine.mjs`: `d5648df0976156e4c57f579fd1dc82f55ab87828916b92b18422478e8afc6b97`
- `public/js/levels.mjs`: `d7d3d032693bd2634c4291989d25f05a1cc571c1e03476f78bf089546355f455`
- `DiskField v1.0.zip`: `d0e69dc0c4f07a886de8bd7be3fb474316b7c21af0c23a47e29fe519df4b141d`
- `DiskField v1.01.zip`: `e12e14c9ba5a3e92635cb4d0510c245129a97b4576a82aadd8531dfba35ec26f`

The complete Node regression suite passes after the M5 presentation changes.

## Remaining release gate

M5 remains a release candidate. Audio/typography no longer block public packaging, but the separate solvability/acceptance work still needs to close the full 17/17 replay proof and real-device checks before a final production label.
