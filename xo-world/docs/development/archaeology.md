# XO World — Archaeology Note

XO World is one of four games in the 2007 On-Line Java Games release. It is a
10×10 five-in-a-row game in which the human plays X and the computer plays O.

The preservation target for this project is not merely the board game rules:
the principal historical value is the original CPU logic, which uses a
priority ladder of tactical pattern detectors plus a bounded recursive forced
sequence search (`DUBINA = 7`). It is not a conventional full-board minimax.

The restoration therefore treats the historical Java behavior as the oracle.
The JavaScript engine must continue to pass the deterministic oracle suite
before presentation-layer changes are accepted.

Historical raster assets are retained only in the private/reference baseline
and are not required by the browser build.
