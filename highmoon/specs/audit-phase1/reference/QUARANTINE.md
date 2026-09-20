# HighMoon asset quarantine — phase 1

No asset family is approved for Libre Arcade reuse yet.

Reason: the official package is described generically as GPL, but the source/archive has not yet been inspected locally for per-file credits, headers, or third-party provenance. Until that inspection is complete, all graphics, bitmap font and sound effects remain quarantined.

Known installed asset families from FreeBSD packaging:
- planets/moons/background objects: earth.gif, venus.gif, mars.gif, jupiter.gif, saturn.gif, moon.gif, moon_mask.gif, stone.gif, stone_mask.gif, hole.gif
- ships/HUD/CPU indicators: ufoblue.gif, ufored.gif, c_thinking.gif, c_shooting.gif, cpktblue.gif, cpktred.gif, extra*.gif, font.gif, highmoon.png
- projectile/explosion graphics: shoot*.gif, heavy*.gif, explosionanim.gif
- sound effects: applause.wav, click.wav, curve.wav, explosion.wav, kling.wav, laser.wav, pluck.wav, strom.wav
- no music file appears in the FreeBSD installed file list.

Required before release from quarantine:
1. inspect AUTHORS, README, COPYING and source comments in exact 1.2.4 archive;
2. hash/fingerprint every media file;
3. search for third-party origin/stock collections;
4. classify each family as approved / replace / quarantine permanently.
