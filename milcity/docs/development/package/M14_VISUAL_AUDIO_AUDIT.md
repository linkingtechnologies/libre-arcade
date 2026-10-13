# MilCity M14 — Visual Fidelity & Audio Audit

Baseline: MilCity Blue 1.0.5 source package + browser restoration M13.

## Executive result

M14 improves the board renderer substantially while keeping the historical PNG atlas reference-only.

- **Board geometry / timing:** source-parity.
- **Radar semantics / colours:** source-parity.
- **Terrain palette:** historical palette matched.
- **Building / explosion sprites:** now use the same pixel-art vocabulary and measured historical palette, but remain **procedural clean replacements rather than byte/pixel copies**.
- **J2ME bitmap font, splash and logo:** intentionally not copied into the public runtime.
- **Menus / HUD:** intentionally modernized for usability.
- **Sound:** no playable audio system exists in the 1.0.5 source/release evidence examined.
- **Haptics:** the original did support device vibration on weapon use; the browser restoration currently omits this.

The visual-asset legal gate remains **YELLOW**. A procedural redraw is not automatically free of copyright risk if it traces artwork too closely, so M14 deliberately stops short of exact sprite tracing while preserving function, palette and visual role.

## Historical visual source

`res/images.png`

- dimensions: **111 × 91**
- SHA-256: `2802d4b6e998c4c219ff24f18a1c8429dc6f4af635484e917235211709300137`
- bitmap font occupies the upper atlas area;
- gameplay tiles start at Y=65;
- gameplay tile step is 9 px, clipped to **8 × 8** by `ImageDrawer.cellToImage()`;
- tile columns: 12.

Other historical images:

- `Splash_MilCity_Koojoo.png` — 240 × 320 — SHA-256 `132ccabc1b85f7a18a9434d12d682a4aaa6552267c64185f11becb3bc0f11509`
- `MilCityLogo_Shiro_icon.png` — 32 × 32 — SHA-256 `6ecdffb583b1228b1d7f5e05df1966cee4f3fac34ad6e282bd90e6dad030c4dc`

These remain historical/reference material and are not loaded by the browser UI.

## Historical palette measured from the tile atlas

| Role | RGB | Hex |
|---|---:|---|
| Water | 0,38,255 | `#0026ff` |
| Water highlight | 45,84,255 | `#2d54ff` |
| Ground | 104,65,39 | `#684127` |
| Construction green | 76,255,0 | `#4cff00` |
| Red | 255,0,0 | `#ff0000` |
| Yellow | 255,216,0 | `#ffd800` |
| Navy | 0,19,127 | `#00137f` |
| Magenta | 255,0,220 | `#ff00dc` |
| Runway grey | 64,64,64 | `#404040` |
| Nuke olive | 178,158,0 | `#b29e00` |
| Dark crater brown | 56,34,21 | `#382215` |

M14 replaces the approximate M6 colours with these values.

## Tile-by-tile audit

`MATCH` means the browser behaviour/solid colour can be considered equivalent without copying an artwork. `CLOSE` means semantic role, palette and pixel-art motif are preserved but the sprite is independently drawn. `DIFFERENT` means intentional modern replacement.

| Cell | Historical role | M13 | M14 | Notes |
|---:|---|---|---|---|
| 1 | Water | CLOSE | **CLOSE+** | exact two-colour palette; procedural wave clusters |
| 2 | Ground | CLOSE | **MATCH** | solid historical ground colour |
| 3 | Construction | CLOSE | **CLOSE+** | green/black construction marker, integer pixels |
| 4 | Missile Silo | CLOSE | **CLOSE+** | pixelated red/black silo ring, no antialias |
| 5 | Shield Generator | CLOSE | **CLOSE+** | pixelated magenta/black ring |
| 6–7 | Power Plant | DIFFERENT | **CLOSE** | paired navy plant + yellow lightning motif |
| 8–10 | Air Field | CLOSE | **CLOSE+** | three-part runway vocabulary restored |
| 11–12 | Laboratory | DIFFERENT | **CLOSE** | paired white/magenta laboratory/radome motif |
| 13–16 | Factory | DIFFERENT | **CLOSE** | four distinct quadrants, red/black/yellow industrial core |
| 17 | House | CLOSE | **CLOSE+** | red roof / white house / yellow windows |
| 18–26 | Nuke Silo | DIFFERENT | **CLOSE** | coherent 3×3 red/olive/black complex |
| 27 | Commercial | CLOSE | **CLOSE+** | navy/yellow pixel-dollar; no platform font |
| 28 | Destroyed | CLOSE | **CLOSE+** | dark pixel crater |
| 29 | Burning | CLOSE | **CLOSE+** | red/yellow pixel flame |
| 30–34 | Explosion frames | CLOSE | **CLOSE+** | five integer-pixel growth/burn frames; timing unchanged |

The M14 renderer uses **no Canvas arcs** for gameplay sprites, avoiding the smooth circles that made M13 visibly unlike the J2ME pixel art.

## Elements deliberately not visually source-identical

### Bitmap font

The original `ImageDrawer` renders a custom 6×8 visible font from the historical atlas. The browser uses a readable modern UI instead. Reintroducing the tiny source font would recreate the legibility problem already seen during M10–M11.

### Splash and logo

The original 240×320 Koojoo splash and Shiro icon remain reference-only because their specific authorship/licensing is unresolved. The public splash is procedural.

### Menus and HUD

The original J2ME bottom HUD and list menus are documented but intentionally replaced by the M11+ external control panel. **Rule fidelity takes precedence over UI fidelity** here because the original interface was not usable at modern desktop/browser scale.

## Sound audit — final result

The 1.0.5 source tree contains only these runtime media/assets:

- 3 PNG files;
- no WAV;
- no MIDI;
- no MP3/OGG;
- no other audio resources.

Source search found **no** imports/usages of `javax.microedition.media`, `Manager.createPlayer`, `Player`, or `playTone` for audio playback.

`Config.ENABLE_SOUND = false` exists, but the corresponding Options menu code is commented out and there is no implementation that consumes the setting. Therefore the most defensible conclusion is:

> **MilCity Blue 1.0.5 has no functioning sound system to preserve.**

The silent browser restoration is therefore audio-faithful rather than missing an identified soundtrack/SFX layer.

## Haptics are separate from sound

The original *does* implement vibration:

- `LocalPlayer.fire()` and `fireOnAnotherPlayer()` call `vibrateOnWeaponExplosion()`;
- duration = weapon footprint area × 100 ms;
- `MilCityBlue.notifyGameEvent()` calls `display.vibrate(arg)` when vibration is enabled.

Historical durations implied by weapon sizes:

| Weapon | Area | Vibration |
|---|---:|---:|
| Missile | 1×1 | 100 ms |
| Mortar | 2×2 | 400 ms |
| Shield | 2×2 | 400 ms |
| Aircraft | 2×3 | 600 ms |
| Spy | 3×3 | 900 ms |
| Nuke | 4×4 | 1600 ms |

The web port currently omits haptics and no longer exposes a dead Vibration option. A future optional `navigator.vibrate()` implementation could restore this on supported mobile browsers without adding sound.

## M14 conclusion

After M14:

- visual **simulation semantics** are high fidelity;
- board pixel art is materially closer to the original while remaining procedural;
- overall UI is intentionally modern rather than J2ME-identical;
- audio fidelity is effectively complete because no functioning original audio layer has been found;
- haptic fidelity remains an optional gap;
- exact historical artwork redistribution remains blocked by the asset-provenance gate.
