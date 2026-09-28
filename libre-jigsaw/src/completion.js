// GPL-3.0-or-later. Pure completion-placement helper derived from Libre Jigsaw finishGame().
export function planSolvedPlacement(anchor,geom,canvasWidth,canvasHeight){
  if(!anchor||!geom)throw new Error('Missing completion state');
  const normalizeSteps=anchor.rotation? -anchor.rotation:0;
  const boardOriginX=anchor.x-anchor.origX;
  const boardOriginY=anchor.y-anchor.origY;
  const targetX=(canvasWidth-geom.boardWidth)/2;
  const targetY=(canvasHeight-geom.boardHeight)/2;
  return{normalizeSteps,dx:targetX-boardOriginX,dy:targetY-boardOriginY};
}
