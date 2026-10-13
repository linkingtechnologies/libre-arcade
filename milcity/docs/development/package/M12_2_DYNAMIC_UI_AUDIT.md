# M12.2 — Dynamic UI regression audit

This patch targets browser UI defects caused by rebuilding or replacing interactive DOM while the historical simulation continues to render at 10 FPS.

## Fixed

- The guided **Take me to the next step / Portami al prossimo passo** button is no longer recreated on every panel refresh. It is rebuilt only when the coach state actually changes.
- Training mode no longer reaches a coach state that tries to select Military mode without an opponent.
- The top-right `?` control now opens a modal help overlay during a game. It preserves the canvas and controller state, pauses the simulation while help is visible, and resumes the same game when closed.
- `Enter` / `Space` no longer clears successful build/fire feedback immediately after the action.
- Build/fire attempts are rejected after win/loss/game end, and the placement indicator also reflects the ended state.
- Footer duplication (`MilCity · Libre Arcade · Libre Arcade`) is removed. It now renders `MilCity · Libre Arcade` once, with Libre Arcade as the link.

## Interaction audit

Interactive elements that can exist during the 10 FPS render loop are now either stable DOM nodes or protected by structural signatures:

- City/Military tabs — stable by mode signature.
- Building/weapon buttons — stable by action-grid signature.
- Primary action / leave-game buttons — permanent nodes.
- Guided next-step button — stable by coach-state signature.
- Help close button — permanent modal node outside the game canvas.

Non-interactive status/card content may still be refreshed as state changes.
