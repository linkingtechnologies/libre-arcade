// GPL-3.0-or-later. Resolution-independent logical playfield helpers.
export function computeViewport(canvasWidth,canvasHeight,playfieldWidth,playfieldHeight){
  if(!(canvasWidth>0&&canvasHeight>0&&playfieldWidth>0&&playfieldHeight>0))throw new Error('Invalid viewport dimensions');
  const scale=Math.min(canvasWidth/playfieldWidth,canvasHeight/playfieldHeight);
  return{
    scale,
    offsetX:(canvasWidth-playfieldWidth*scale)/2,
    offsetY:(canvasHeight-playfieldHeight*scale)/2,
    width:playfieldWidth*scale,
    height:playfieldHeight*scale
  };
}
export function canvasToPlayfield(x,y,viewport){
  return{x:(x-viewport.offsetX)/viewport.scale,y:(y-viewport.offsetY)/viewport.scale};
}
export function playfieldToCanvas(x,y,viewport){
  return{x:x*viewport.scale+viewport.offsetX,y:y*viewport.scale+viewport.offsetY};
}
