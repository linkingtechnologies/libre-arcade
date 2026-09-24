/* M8 reconstruction / M9 release: measured one-step browser clock.
 * This is a documented adaptation of Python 2 pygame.time.Clock.tick(100).
 * Browser background gaps >250 ms are skipped; normal foreground dt is
 * unquantized (no 10 ms accumulator, no catch-up). GPL-3.0-or-later.
 */
export const BACKGROUND_GAP_SECONDS=0.25;
export function frameDelta(seconds){
  if(!Number.isFinite(seconds)||seconds<=0||seconds>BACKGROUND_GAP_SECONDS)return null;
  return seconds;
}
