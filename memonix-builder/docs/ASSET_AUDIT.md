# Builder asset audit

The original `gamedata.vfs` recovered from `memonix_1.6_src.tar.bz2` contains 88 Builder BMP files:

- 22 window components
- 29 wall/facade components
- 10 door components
- 26 roof components
- 1 blank tile

The web restoration converts every Builder BMP to PNG solely for browser compatibility. A pixel-by-pixel RGB comparison after conversion passed for **88/88** files. `builder-png-manifest.csv` contains source and output SHA-256 hashes.

Source bundle SHA-256: `c5bd236c5cff2ffc07d98aff698368f32149c2428229fcde913e93bced250eab`

`gamedata.vfs` SHA-256: `883cc09707ff645f264199eadbe5f22a0309699b8ac3716fd2ada69abae299f3`
