# Pair asset audit

Recovered from the historical `gamedata.vfs` contained in `memonix_1.6_src.tar.bz2`.

- 1 original card back: `DATA/PAIR/0.bmp`
- 71 original faces: `DATA/PAIR/toys-001.bmp` … `toys-072.bmp`
- historical gap: `toys-015.bmp` is absent
- total distributed Pair card assets: 72

Each recovered 64×64 BMP was decoded to RGB and written as PNG without resampling or repainting. A build-time pixel comparison verified that every distributed PNG decodes to exactly the same RGB pixel matrix as its recovered BMP source.

The original Pair preview (`pr_p.bmp`) is preserved in `docs/pair-preview-original.png` for archaeological comparison and is also used, losslessly converted, in the historical title/menu reconstruction.

See `pair-png-manifest.csv` for SHA-256 values of source BMPs and distributed PNGs.
