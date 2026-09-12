# Preserved vs reconstructed

The restoration uses four labels: **preserved/parity**, **platform adaptation**, **documented historical bug fix**, and **future enhancement**.

## Preserved / parity behavior

The primary implementation intentionally preserves:

- 32×32 map tiles;
- six historical terrain families and three-family random selection;
- procedural level generation constants;
- water borders;
- original tree counts per difficulty;
- tree expansion cadence and recursive search behavior;
- 0.8 movement per simulation tick;
- non-normalized diagonal speed;
- point-only obstacle collision;
- horizontal/vertical capture only;
- ownership mirroring to decorative edge tiles;
- player-control percentage formula;
- tie-as-loss behavior in single player;
- arrow keys for player 1 and WASD for player 2;
- original LPC sprites and terrain artwork;
- nominal 60 repaint cycles/s with three simulation ticks per repaint;
- historical walking-animation counter semantics, now clocked independently at 60 Hz.

## Platform adaptations

These change the host platform without intending to change the rules:

- Java AWT/Swing → HTML5 Canvas 2D;
- fixed ~180 Hz simulation accumulator;
- fixed 60 Hz animation/repaint-state clock independent from monitor refresh;
- device-pixel-ratio rendering;
- frozen logical scene during an active match;
- scale/letterbox on browser resize or phone rotation rather than regenerating the match;
- HTML menu shell;
- touch directional pads;
- hiding the unused Player 2 touch pad in single-player mode;
- `Esc` / Menu action to leave a match;
- English/Italian localization of the browser shell;
- Instructions and About made reachable from the browser menu;
- browser-safe behavior for the original Exit option;
- generated tile atlases used as exact raster caches of original CFG/PNG combinations;
- menu exhibition regenerated when the browser viewport changes.

The original Java source contains Help/About states and strings, but its final visible main menu only exposes Single Player, Multiplayer and Exit. Making Instructions/About accessible is therefore explicitly a browser-shell adaptation.

## Documented historical bug fixes

The parity port corrects filename-case lookup mismatches such as:

- `professor.png` vs `Professor.png`
- `princess.png` vs `Princess.png`

This is required for reliable deployment on case-sensitive web hosting. The mismatch remains documented and the historical files remain untouched in `/reference`.

## UI reconstruction boundary

The browser menu is deliberately **not** a pixel-identical port of Java `UIUtils` or Java font metrics. It is a responsive web reconstruction with the same core game flow plus the documented browser additions above.

The game scene itself keeps the historical coordinate behavior. For example, at 800×600 the original Java source builds an 832×608 tilemap and centers it with small negative margins; the browser renderer uses the same logical centering/clipping behavior before any viewport scaling.

## Explicitly not changed in parity mode

The following tempting improvements remain absent:

- normalized diagonal movement;
- rectangle/circle collision bodies;
- deterministic seeded randomness;
- smarter tree AI;
- diagonal capture directions;
- altered difficulty constants;
- network multiplayer;
- remastered artwork.

If introduced later, any of these must be clearly separated from the preservation baseline and documented as an enhancement or reconstruction.
