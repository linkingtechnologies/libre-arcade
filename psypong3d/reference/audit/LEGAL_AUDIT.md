# Historical and legal audit — PSY PONG 3D 0.9

## Upstream release

- Project: PSY PONG 3D
- Author: Quetzy Garcia
- Version: 0.9
- Release date: 2009-01-02
- Original archive supplied for audit: `psypong3d-0.9.tar.gz`
- SHA-256: `e3842c4410a2bd45ab1e7d43c16f03682d810ee6ad8094c8c05f6f4f854d75d7`
- MD5 of supplied `.tar.gz`: `ea31abc4ca1e4b26c802c62f8a507e31`
- The same TAR stream recompressed as bzip2 matches the historical PLD Source0 MD5 `c0f5891a306dbcfed07e2e513a854362` for `psypong3d-0.9.tar.bz2`.

## Code license

The archive contains the GNU GPL version 3 license text. README, CHANGELOG, Makefile and source headers state that PSY PONG 3D may be redistributed and/or modified under GPL version 3 or, at the recipient's option, any later version.

**Conclusion for code: GPL-3.0-or-later.** This resolves the conflict with external metadata that label the project GPLv2; the archive itself is the primary licensing evidence.

## Media audit

The upstream archive contains three BMP textures:

- `menu.bmp`: README says it was made with GIMP's Alien Neon logo creator.
- `background.bmp`: README credits a Flickr image by Lynn (Gracie's mom).
- `spiral.bmp`: README credits an AdobeUserSite.com Photoshop tutorial.

The archive does not provide a separate explicit media license or provenance statement sufficient to establish GPL-compatible redistribution rights for the two externally sourced images. For a conservative public preservation port, **none of the three historical BMP files are redistributed here**.

No separate sound or music files are present. No font file is bundled; the original program uses GLUT bitmap Helvetica.

## Preservation decision

This repository preserves the GPL-3.0-or-later textual and source-code portion under `reference/original-source/`, but deliberately excludes `src/textures/*.bmp` and the complete upstream archive. Keep an archival copy of the original tarball separately if needed for research.


## Replacement artwork used by the browser port

The public browser build does not use or redistribute the three historical BMP files. It uses newly created replacement artwork under `assets/`, documented in `assets/ASSET_PROVENANCE.md`. The replacement artwork is kept clearly separate from the historical reference source and is distributed with the restoration under GPL-3.0-or-later.
