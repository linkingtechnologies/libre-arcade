# Restoration notes

This edition is deliberately separated from the untouched upstream archaeology snapshot.

Key restoration decisions:

- original gameplay and rules retained where legally usable;
- unresolved player SVGs replaced with newly drawn inline SVG geese;
- unresolved `roll-a-die` code replaced with restoration-owned dice UI;
- external web fonts removed;
- historical online multiplayer excluded from the standalone playable edition;
- local 1–6 player state and turn handling implemented in the browser;
- Italian and English UI and rules added;
- responsive behavior retained;
- classic `4+5` explanatory typo corrected to 53 to match implemented behavior;
- historically implemented Maze 42→37 variant preserved;
- no silent normalization of the original rules beyond documented bug fixes.

The repository root is the deployable static application and uses native browser ES modules with explicit file extensions.

## Graphic restoration

- Goose-shaped player pieces use new inline SVG artwork created for this restoration; no upstream goose SVG is reused.
- Special tiles use original inline SVG pictograms while preserving the historical board geometry and rules.
- Dice use HTML/CSS pips rather than external artwork.
- Board and tile shading use CSS only, with no external images or fonts.
