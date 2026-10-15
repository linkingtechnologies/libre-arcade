# M28 — NES visual fidelity audit

Version: **1.0.0-rc.5**  
Date: **2026-10-12**

## Goal

Move the clean-room browser presentation closer to the visual language of the 2011 NES release
without importing or tracing the historical CHR/sprite artwork.

## Reference boundary

The historical media audit allows the original game to be used as a behavioural/visual oracle but
keeps PinWizz/Shiru expressive graphics out of the GPL runtime package. M28 therefore observes only
broad visual characteristics and recreates them with new procedural pixel geometry.

Public visual references consulted for composition/style:

- LaunchBox gameplay screenshot: `https://images.launchbox-app.com//e2ddc5df-803a-43ea-942b-50dc6d45eb35.png`
- MobyGames NES screenshot gallery: `https://www.mobygames.com/game/55769/zooming-secretary/screenshots/`

No screenshot or extracted pixels are bundled in the release.

## Broad traits adopted

- black gameplay field rather than a modern decorative grid;
- cyan/white high-contrast bitmap HUD;
- cyan/magenta/white striped platform language;
- white/cyan pixel ladders;
- bright green two-drawer filing cabinets;
- compact cyan/white desk phones with pixel ring rays;
- warm orange/red protagonist palette;
- prop-based pixel NPC readability rather than debug letters;
- hard pixel edges only: no canvas system-font text and no antialiased arcs in gameplay rendering.

## Intentionally not copied

- historical CHR tiles or sprite bytes;
- exact PinWizz character pixels/silhouettes;
- original logo/trade dress;
- original ending art;
- original factoid prose;
- original music or FamiTracker data.

The result should be described as **NES-faithful in visual grammar, clean-room in artwork**, not as
pixel-perfect graphics emulation.
