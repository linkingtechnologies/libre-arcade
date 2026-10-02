# Source map — Pair mode

Historical source: `MemonixSourceCode`, from `memonix_1.6_src.tar.bz2`.

- `src/game_start.cpp` — board generation, face selection, 2-copy/4-copy rules, backup to `FieldDataPair`.
- `src/game.cpp` — card selection, 500 ms mismatch/match delays, hard-mode restore, win detection, score slots.
- `src/options.cpp` — Pair is constrained to three difficulty levels and shares the four grid sizes/countdown settings.
- `src/Main.cpp` — default setup and persistent score arrays.
- `gamedata.vfs` — card back, 71 face bitmaps, Pair preview image and shared UI/audio.

## Important implementation quirk
The original code chooses a face by adding an offset 0..70 to the texture ID of `toys-001.bmp`. This works because the 71 face textures are loaded contiguously even though filename `toys-015.bmp` is absent. A faithful web port should preserve the resulting 71-face pool, not invent an image 015.
