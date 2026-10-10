# KFourInLine 4.0.0 → JavaScript

M16 ports Martin Heni's deliberately non-perfect KWin4/KFourInLine computer
player from the January 2008 KDE 4.0.0 release.

Preserved behaviour:

- negamax-style recursive `MinMax` structure and rightmost `>=` tie-break;
- historical levels, exposed as browser-safe levels 1–5;
- 69 horizontal, vertical and diagonal four-cell windows;
- empty-cell weights based on distance above the current landing square;
- stone-count table and `VICTORY_VALUE = 9,999,999`;
- column bias `{10, 50, 300, 500, 300, 50, 10}`;
- two independent random evaluation offsets in `[0, 2499]`;
- the original parent-board terminal/evaluation timing visible in the 4.0.0
  implementation rather than silently correcting it.

Qt's runtime random generator is replaced with ConnectLab's injected seeded
xorshift32 stream. This preserves distributions and deterministic replay, not
Qt seed-for-seed identity. The optional persistent `kwin4.brain` cache is not
enabled because no original trained brain ships with release 4.0.0.

Unlike the solver-oriented agents, KFourInLine explicitly aims for enjoyable,
human-like imperfection. ConnectLab does not describe it as optimal.
