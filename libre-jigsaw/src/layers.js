export const LAYER_COUNT=3;

export function normalizeLayer(layer){
  const n=Number(layer);
  return Number.isInteger(n)&&n>=0&&n<LAYER_COUNT?n:0;
}

export function visiblePieces(pieces,layer){
  const target=normalizeLayer(layer);
  return pieces.filter(p=>p.layer===target);
}

export function uniqueGroupsFromPieces(pieces){
  return new Set(pieces.map(p=>p.group));
}

export function moveGroupsToLayer(pieces,groupIds,layer){
  const target=normalizeLayer(layer),groups=groupIds instanceof Set?groupIds:new Set(groupIds);
  let moved=0;
  for(const p of pieces){
    if(groups.has(p.group)&&p.layer!==target){p.layer=target;moved++;}
  }
  return moved;
}

export function normalizeRect(a,b){
  return{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)};
}

export function rectsIntersect(a,b){
  return a.x<=b.x+b.w&&a.x+a.w>=b.x&&a.y<=b.y+b.h&&a.y+a.h>=b.y;
}
