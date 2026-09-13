# Milestone 13 — music balance fix

User testing confirmed that Web Audio and SFX were working, but procedural music
was still much too quiet relative to effects.

Changes:
- music bus raised to full-scale mix level;
- melody envelope raised substantially;
- bass envelope raised;
- overall master lowered slightly to preserve headroom;
- SFX synthesis and gameplay timing are unchanged.

This is a mix-only correction: no historical audio is introduced.
