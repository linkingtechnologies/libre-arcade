// SPDX-License-Identifier: GPL-3.0-or-later
export function clampCamera(v,min,max){ return Math.max(min,Math.min(max,v)); }

// The historical engine follows the visually lowest ball during multiball,
// i.e. the ball with the greatest Y coordinate on this downward-positive table.
export function lowestBallY(balls){
  if(!balls || balls.length===0) return null;
  let y=-Infinity;
  for(const b of balls) if(b && Number.isFinite(b.y)) y=Math.max(y,b.y);
  return Number.isFinite(y)?y:null;
}

export function ballCameraTarget(tableSize, ballY, viewportHeight){
  const cameraBorder=viewportHeight/2.5;
  const cameraOffset=viewportHeight/2;
  const trackedY=clampCamera(
    ballY,
    tableSize.y1+cameraBorder,
    tableSize.y2-cameraBorder
  );
  return -trackedY+cameraOffset;
}

export function fullTableTransform(tableSize, viewportWidth, viewportHeight){
  const scale=Math.max(0.1, viewportHeight/tableSize.height-0.1);
  return {
    scale,
    x:(viewportWidth-(tableSize.width*scale))/2,
    y:45
  };
}
