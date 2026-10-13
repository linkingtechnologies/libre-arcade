# M11 — UX overhaul

M11 deliberately stops treating the original J2ME HUD as a strict UI-parity requirement while keeping the certified 1.0.5 simulation/gameplay core unchanged.

## Changes

- Removed the visible `Menu` label from the historical HUD and removed the in-game Menu control.
- Added a modern external game panel with readable Money, Energy and Score cards.
- Added explicit CITY / MILITARY tabs.
- Added direct buttons for every building, shield and weapon: the player no longer has to discover actions by cycling cryptic `< >` labels.
- Added a selected-action card with cost, energy, footprint and plain-language purpose.
- Added explicit reasons when an action cannot be performed (not enough money, no ammunition, invalid terrain, cooldown).
- Added a large Build/Use button while retaining click-on-map placement/targeting.
- Added a permanent quick-start recipe: Power Plant → Commercial → Missile Silo → Military.
- Simplified the canvas HUD to four readable lines; detailed information is now in the external panel.
- Kept keyboard controls as an optional shortcut, not the primary way to learn the game.

## Preservation boundary

The simulation, costs, timings, AI, board, combat, scoring and historical quirks remain unchanged. M11 modernizes presentation and interaction only.
