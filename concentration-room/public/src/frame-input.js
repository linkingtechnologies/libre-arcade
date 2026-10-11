import { PLAY_STATE } from './state-machine.js';
import { KEY } from './input.js';

/**
 * One iteration of the original main loop (memorygame.s, cardsLoop) for the browser game: read the pads, repeat held
 * directions, move the cursor, run the state handler, and handle the A button the way handleStateStill does.
 * It lives here, apart from the page, so that the executable oracle (tools/rom-oracle.mjs) runs exactly the code the page runs.
 */
export function applyHistoricalGameInputFrame(game, pads) {
  if (!game) return;
  const stateBefore = game.state;
  pads.beginFrame(game.activePad);
  const active = game.activePad & 1;
  const keys = pads.newKeys[active];

  // read_pads/autorepeat and D-pad movement happen before stateDispatch, for the active pad whoever's turn it is:
  // the original does not look at the CPU's turn here, so the human's pad keeps moving the cursor while the CPU waits.
  //
  // The release ROM was built with the build tool's "reverse" setting, which runs the four handlers of the .shuffle block
  // in memorygame.s in the opposite order to the source (UP, LEFT, DOWN, RIGHT in the text): RIGHT, DOWN, LEFT, UP. Two
  // consequences, both found by running the ROM (tools/rom-oracle.mjs). The order shows when opposite directions are held
  // together, which a real pad cannot do and a keyboard can. And the jump that skips the movement while a pad is being
  // handed over (PASS_CONTROLLER) lands after the first handler to run, RIGHT, so in that state only RIGHT is skipped:
  // DOWN, LEFT and UP still move the cursor.
  if (stateBefore !== PLAY_STATE.DONE) {
    if (stateBefore !== PLAY_STATE.PASS_CONTROLLER && (keys & KEY.RIGHT)) game.moveCursor(1, 0);
    if (keys & KEY.DOWN) game.moveCursor(0, 1);
    if (keys & KEY.LEFT) game.moveCursor(-1, 0);
    if (keys & KEY.UP) game.moveCursor(0, -1);
  }

  // The state handler for this iteration. B and A are read by handleStateStill (and by the end of handleStateCleared,
  // which falls through into it), so they go in with the new keys.
  game.tick(1, { newKeys: keys });

  if (stateBefore === PLAY_STATE.PASS_CONTROLLER) {
    if (game.lastPlayerIsAI) {
      // the state was left without a key; the original clears the autorepeat of the active pad on the way out
      pads.cancelRepeat(game.activePad);
    } else if (game.state === PLAY_STATE.PASS_CONTROLLER) {
      const passPad = pads.passControllerPad();
      if (passPad >= 0) {
        game.acknowledgePass(passPad);
        pads.cancelRepeat(passPad);
      }
    }
  }
}
