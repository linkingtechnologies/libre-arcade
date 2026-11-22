# Credits

## Elemental One

- **Game:** Zaven Muradyan, 2013 to 2014, made along the theme of Ludum Dare 28
  ("You Only Get One"). MIT License.
- **Original repository:** https://github.com/voithos/elemental-one
  (restored from commit `609636d84f8abb20e49fdf00ab42428f4805d27b`).
- **Engine:** Phaser 1.1.3, Copyright 2013 Photon Storm Ltd., MIT. It bundles
  Pixi.js code (Mat Groves, MIT) and PolyK (Ivan Kuckir, MIT).

## Restoration

Libre Arcade restoration: the game code and the four levels are the original
ones. This folder adds an HTML integration layer (title screen, pause, mute,
English and Italian text, touch buttons) and replaces two assets that could
not be redistributed. See `PROVENANCE.md`, `LICENSE-AUDIT.md` and
`GAMEPLAY-PARITY.md` in the game's folder in the Libre Arcade repository.

https://linkingtechnologies.github.io/libre-arcade/

## Art

| Files | Author | Licence |
|---|---|---|
| `assets/sprites/*`, `assets/tilesets/*` | Kenney (kenney.nl), via OpenGameArt | CC0 1.0 |
| `assets/images/menubackground.png`, `occluder.png`, `preloadbar.png` | Zaven Muradyan, composed from the Kenney tiles above (author's own, no separate notice upstream) | MIT (repository) / CC0 parts |
| `assets/tilemaps/*.json` | Zaven Muradyan | MIT |

## Audio

| File | Author | Licence | Notes |
|---|---|---|---|
| `happy.mp3`, `happy.ogg` | rezoner, "Happy Arcade Tune" (OpenGameArt) | CC BY 3.0 | `happy.mp3` is byte-for-byte the file on the OpenGameArt page (3,628,910 bytes); the `.ogg` is a conversion of it |
| `air.wav` | remaxim | CC0 1.0 | as declared by upstream |
| `water.wav` | kurt | CC BY 3.0 | as declared by upstream |
| `earth.wav` | qubodup | CC BY 3.0 | as declared by upstream |
| `fire.wav`, `pickup.wav` | p0ss | CC BY-SA 3.0, GPL 3.0 or GPL 2.0 (offered upstream) | used under CC BY-SA 3.0 / GPL 3.0 |
| `jump.wav` | Libre Arcade | GPL-3.0-or-later | synthesized; the original jump sound had no recorded author or licence |

CC BY 3.0 requires the attribution above to stay with the sounds.

## Font

**Jersey 10**, Copyright 2023 The Soft Type Project Authors
(https://github.com/scfried/soft-type-jersey), SIL Open Font License 1.1
(`fonts/OFL.txt`). It replaces **Minecraftia** by Andrew Tyler, which upstream
documents as "free for personal use" and so is not shipped.
