# PyWeek final2 → 1.0.1

Only four project-owned files differ between the two preserved trees: `README.txt`, `setup.py`, `game/const.py`, and `game/scenes.py`. No game asset bytes changed.

## Functional changes in 1.0.1

- Version changes from `1.0-pyweek16` to `1.0.1`.
- Package status changes from Beta to Production/Stable.
- README describes “minor fixes and AI tweaking”.
- AI move finder now prioritizes both **money and shield** tiles (`tile in [0, 1]`) rather than money only.
- AI attack selection is rewritten to choose only attacks the player can actually use and becomes aggressive when money exceeds 90 or the opponent shield is below 25.
- Cow, meteorite, rocket and laser effect endpoints are copied to mutable lists before being adjusted, avoiding accidental mutation/type problems in animation coordinates.

The browser parity baseline is **1.0.1**, with final2 retained to show what changed immediately after PyWeek.
