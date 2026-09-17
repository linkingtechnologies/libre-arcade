# Box2D 2.3.2 reference harness

These small C++ programs were used only to measure deterministic reference behaviour from the exact Box2D source preserved inside `/reference/Pinup-Pinball-220820357a6a9a455df920619e2240e4da130cb9.zip`.

They are not runtime dependencies and are not part of the web build. Their measurements are recorded in `../reference-data/box2d-calibration.txt` and asserted by `../calibration.mjs`.

The archived Box2D tree contains a few Windows-era case-insensitive include names (`b2Math.h` vs `b2math.h`, etc.); building it on a case-sensitive Unix filesystem may require local compatibility symlinks. Do not alter the preserved `/reference` archive.
