# Bumper → upper curve → lateral wall: corrected stale-sweep sequence

## Reproduced cause

Two deterministic bumper-hit traces exited the upper-left (first alarm at frame 11) or upper-right arc (frame 19). The upper-curve TOI resolved a rebound, but a later lateral-wall TOI reused the full-frame sweep calculated **before** that rebound. The outdated trajectory overwrote the correctly resolved post-impact position and velocity.

## Focused correction

After an upper-curve TOI, lateral-wall checks begin from `lastTopCurveTOI.safe` and use only the remaining interval `lastTopCurveTOI.h` and the **post-impact** trajectory. Without an upper-curve TOI, ordinary lateral-wall handling stays unchanged. No extra barriers, teleportation or fixture, bumper-force, score, audio or control tuning was introduced.

## Evidence and limits

- Neither of the two deterministic earlier escape traces (frames 11 and 19) raises a geometric upper-boundary alarm in the fixed runtime during 85 frames.
- A scan of **567** starting states returned **0** upper-boundary geometric alerts in the fixed implementation versus **24** in the earlier implementation, including nine alerts following a bumper hit. At least 487 current scenarios had a real bumper event; 478 registered a curve collision.
- The detector is an approximate conservative geometric alarm, not an exact reconstruction of every upper polygon. The 567 initial states do not represent every possible game trajectory.
- The previous historical comparison covered five isolated native states without escapes but did not certify matching native trajectories **after** the repair. Whole-game native parity remains incomplete.
- Entry from the top into the lane, states initially overlapping a wall and other mixed curve contacts remain open.

Production change: `js/physics.js` (identical under `public/`), protected by `tests/m13.12-bumper-upper-wall.js` and separate diagnostic scans.
