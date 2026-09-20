# HighMoon 1.2.4 — Graphics provenance audit

## Result

No graphics file has a satisfactory independent provenance chain.

`AUTHORS` identifies Patrick Gerdsmeier as author of the **game**, but contains no
asset-by-asset credits. `NEWS` says v1.1.2 changed “Wormholes, Blackholes,
Planettextures, Background etc.”, which demonstrates active graphics work but does not
identify the sources of the planet textures.

Several GIFs contain `Created with The GIMP` metadata. That is tool metadata, not an
authorship or license statement.

The planet and moon images are the highest-risk family because they are texture/
photographic-looking renders and no source was identified. Web/source searches did not
produce a defensible exact match to NASA or another public-domain source. They therefore
remain unresolved; **do not label them NASA/public-domain based on appearance alone**.

The conservative production decision is to replace **all original graphics**, including
UFOs, particles, HUD/computer sprites, font, logo, projectiles, explosion, planets and moon.

## Historical geometry must be preserved separately

This is important: HighMoon's `Sprite` computes logical width from the loaded image width
divided by its frame count. Gameplay/collision code uses sprite/object dimensions.

A clean-room redraw must therefore not make physics depend on the replacement bitmap size.
The future simulation should store the historical logical geometry as data, while Canvas 2D
renders replacement art independently.

| Asset | Raw pixels | Frames | Historical logical width |
|---|---:|---:|---:|
| `gfx/c_shooting.gif` | 52×26 | 2 | 26 |
| `gfx/c_thinking.gif` | 52×26 | 2 | 26 |
| `gfx/cpktblue.gif` | 5×5 | 1 | 5 |
| `gfx/cpktred.gif` | 5×5 | 1 | 5 |
| `gfx/earth.gif` | 101×101 | 1 | 101 |
| `gfx/explosionanim.gif` | 300×50 | 6 | 50 |
| `gfx/extra.gif` | 50×50 | 1 | 50 |
| `gfx/extra0.gif` | 17×17 | 1 | 17 |
| `gfx/extra1.gif` | 17×17 | 1 | 17 |
| `gfx/extra2.gif` | 17×17 | 1 | 17 |
| `gfx/extra3.gif` | 17×17 | 1 | 17 |
| `gfx/font.gif` | 1732×28 | 1 | 1732 |
| `gfx/heavy.gif` | 20×20 | 1 | 20 |
| `gfx/heavyback.gif` | 20×20 | 1 | 20 |
| `gfx/heavybackk.gif` | 21×21 | 1 | 21 |
| `gfx/highmoon.png` | 32×32 | 1 | 32 |
| `gfx/hole.gif` | 9×9 | 1 | 9 |
| `gfx/jupiter.gif` | 143×143 | 1 | 143 |
| `gfx/mars.gif` | 86×86 | 1 | 86 |
| `gfx/moon.gif` | 17×17 | 1 | 17 |
| `gfx/moon_mask.gif` | 17×17 | 1 | 17 |
| `gfx/saturn.gif` | 101×101 | 1 | 101 |
| `gfx/shoot.gif` | 17×17 | 1 | 17 |
| `gfx/shootback.gif` | 17×17 | 1 | 17 |
| `gfx/shootbackk.gif` | 13×13 | 1 | 13 |
| `gfx/stone.gif` | 7×7 | 1 | 7 |
| `gfx/stone_mask.gif` | 7×7 | 1 | 7 |
| `gfx/ufoblue.gif` | 2500×100 | 25 | 100 |
| `gfx/ufored.gif` | 2500×100 | 25 | 100 |
| `gfx/venus.gif` | 72×72 | 1 | 72 |
| `icon.png` | 64×64 | 1 | 64 |

The width table is an archaeological behavior constraint, **not a requirement that new
art copy the old pixels**.
