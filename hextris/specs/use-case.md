# UC-ARCADE-HEXTRIS — Play Hextris

## System context

One tab of the **libre-arcade** plugin (tab "Hextris", dashboard id `hextris`). Not a game built for this plugin — a vendored copy of [Hextris](https://github.com/Hextris/hextris) (GPL-3.0), embedded with only the local modifications listed in `design.md` (telemetry/ad/remote-script removal, CSS scoped under `#app`).

## Goal

Let the operator play Hextris from within CAMILA WorkTable, same as any other libre-arcade game, without this plugin needing to reimplement the game itself.

## Primary Actor

Anyone with access to the libre-arcade plugin — no special permission required. The game persists its own high scores in the browser's own storage (see design.md); nothing is shared or server-side, and nothing is sent to any third party (see design.md's "Local modifications" — the original telemetry/score-reporting calls were removed).

## Preconditions

- User is logged into CAMILA WorkTable with access to the libre-arcade plugin.

## Postconditions — Success

- The Hextris board is shown and playable, filling the whole browser viewport (fullscreen takeover — see design.md's "Why fullscreen, not boxed"; this is not a bug, it's how upstream Hextris is built).
- High scores persist across visits in the browser running the CAMILA session (`localStorage`).

## Postconditions — Error / Partial failure

- If `games/hextris/index.html` fails to load, or its `<!-- APP-CONTENT-START/END -->` markers are missing/renamed without updating `dashboard-hextris.inc.php` to match, the dashboard tab renders empty/broken — there is no custom error UI, since there is no JS of ours in the loop to render one.

## Main Success Scenario

### Step 1 — Land on the Hextris tab

1. User opens the "Hextris" tab, or clicks the Hextris tile on the Home tab.
2. The vendored game's own title/start screen renders, filling the browser viewport; Camila's own tab bar sits behind it and is not visible while the game screen is active (see design.md).

### Step 2 — Play

1. User taps/clicks to start, then uses arrow keys (desktop) or taps the left/right screen edges (touch) to rotate the hexagon.
2. Blocks fall from the outer edge inward; matching 3+ blocks of the same color where they touch clears them. The run ends when a block reaches the center. This integration does not alter game rules, scoring, or the win/lose condition in any way.

## Extensions

- **1a.** This game's own UI text ("GAME OVER", "HIGH SCORE", "How to play", etc.) stays English-only regardless of the CAMILA session's language — see design.md's "Other technical notes" for why translating it isn't in scope here.
- **2a.** Sharing a score (Twitter popup) or tapping the Play Store/App Store badges on the game-over screen still links out to the public hextris.github.io project and its mobile apps — left as upstream shipped them, see design.md's "Other technical notes".
