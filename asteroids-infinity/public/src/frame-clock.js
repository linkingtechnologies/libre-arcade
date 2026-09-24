/* M10: one measured physical update per eligible rendered frame, capped at
 * 100 updates/second like pygame.time.Clock.tick(100). Browser rAF timing is
 * not identical to Pygame scheduling: at 120 Hz this skips a frame rather
 * than waiting on the display. No fixed-dt integration or catch-up steps.
 * Browser gaps >250ms are still skipped as a documented modern adaptation.
 * GPL-3.0-or-later (C) 2026 Libre Arcade contributors.
 */
import {BACKGROUND_GAP_SECONDS} from './frame-delta.js';
export const HISTORICAL_MAX_HZ=100;
export function createFrameClock({maxHz=HISTORICAL_MAX_HZ,maxGap=BACKGROUND_GAP_SECONDS}={}){
  if(!Number.isFinite(maxHz)||maxHz<=0||!Number.isFinite(maxGap)||maxGap<=0)
    throw new RangeError('Invalid frame clock options');
  let anchor=null;
  return {
    reset(){anchor=null;},
    advance(nowSeconds){
      if(!Number.isFinite(nowSeconds))return null;
      if(anchor===null){anchor=nowSeconds;return null;}
      const elapsed=nowSeconds-anchor;
      if(elapsed<0||elapsed>maxGap){anchor=nowSeconds;return null;}
      if(elapsed+1e-10<1/maxHz)return null;
      anchor=nowSeconds;
      return elapsed>0?elapsed:null;
    }
  };
}
