# Milestone 10 — player UI cleanup

## Goal

Remove software-archaeology/development language from the player-facing interface.

## Changes

- Removed the `Faithful historical restoration` / `Restauro storico fedele` subtitle from the header.
- Removed the clean-room/historical-assets explanation from the start overlay.
- Removed the same explanatory note from Options and from the footer.
- Kept only player-useful copy such as controls, campaign, attempts, audio, times and gameplay messages.
- Added a regression test that fails if archaeology/development jargon returns to the player UI.

All historical, legal and clean-room details remain in README/docs/specs, where they belong.

## Validation

- `npm test`: **63/63 PASS**.
- `npm run release:check`: PASS.
- Historical data hashes: 66/66 verified.
- Clean asset hashes: 33/33 verified.
- Quarantined media references in runnable files: 0.
- Soak: 61 levels, 183 attempts, 128589 ticks.
