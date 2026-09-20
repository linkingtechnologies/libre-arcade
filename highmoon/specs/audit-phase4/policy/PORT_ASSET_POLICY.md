# Libre Arcade asset policy for HighMoon

## Production rule

The future public Libre Arcade build MUST NOT depend on any original HighMoon bitmap or
WAV file.

Original assets stay unchanged in the archaeological `/reference` snapshot. New production
assets must have explicit, auditable provenance.

## Replacement requirements

- **Planets / moon:** use newly rendered/procedural art from documented public-domain/CC0
  inputs, or create original stylized planets from scratch.
- **UFOs / HUD / projectiles / explosion / bonus / logo / font / background:** clean-room
  redraw. Preserve gameplay meaning and logical geometry, not original pixels.
- **Audio:** synthesize with Web Audio or use explicit CC0/compatible sources. Do not trace
  or quantize the historical WAV waveforms.
- Store for every new asset: author, source URL (if any), license, date, SHA-256.

## Simulation/render separation

Historical collision dimensions and animation frame semantics belong in simulation/config
data. Rendering asset dimensions must never silently redefine collision geometry.

This policy removes unresolved historical asset provenance from the legal surface of the
new port while retaining the original archive strictly as a preservation reference.
