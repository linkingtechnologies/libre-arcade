// GPL-3.0-or-later.
// Snap-policy preservation for Virtual Toybox Puzzle Collection 2010.08.11
// and Libre Jigsaw (policy changed 2011-02-08).
import {areGridNeighbors,rotateVectorSteps} from './geometry2012.js';

export const SNAP_THRESHOLD=5;

export function expectedNeighborVector(a,n,geom){
  return rotateVectorSteps(n.dx*geom.spacingX,n.dy*geom.spacingY,a.rotation,geom.rotationSteps);
}

export function neighborCorrection(a,b,geom,threshold=SNAP_THRESHOLD){
  if(a.rotation!==b.rotation)return null;
  const n=areGridNeighbors(a,b,geom.shape);
  if(!n)return null;
  const v=expectedNeighborVector(a,n,geom);
  const dx=(b.x-a.x)-v.x;
  const dy=(b.y-a.y)-v.y;
  // Java used strict comparisons: -snapThreshold < adjustment < snapThreshold.
  return (-threshold<dx&&dx<threshold&&-threshold<dy&&dy<threshold)?{dx,dy}:null;
}

/**
 * Find every external connected group that can snap to at least one tile in
 * the moving group. One representative correction is enough because members
 * of a connected group already have exact relative placement.
 */
export function collectSnapCandidates(pieces,movingGroup,geom,threshold=SNAP_THRESHOLD){
  const moving=pieces.filter(p=>p.group===movingGroup);
  const movingSet=new Set(moving);
  const byGroup=new Map();
  let order=0;
  for(const a of moving){
    for(const b of pieces){
      if(movingSet.has(b)||b.group===movingGroup)continue;
      const correction=neighborCorrection(a,b,geom,threshold);
      if(!correction||byGroup.has(b.group))continue;
      const members=pieces.filter(p=>p.group===b.group);
      byGroup.set(b.group,{
        group:b.group,
        size:members.length,
        dx:correction.dx,
        dy:correction.dy,
        // Retain deterministic board order for equal-size groups.
        order:order++,
        z:Math.max(...members.map(p=>p.z??0))
      });
    }
  }
  return [...byGroup.values()];
}

function javaIntDivision(n,d){return Math.trunc(n/d);}

/**
 * Virtual Toybox 2010.08.11 mouseReleased policy.
 * External sets are first aligned to the dragged set, then the merged result
 * is re-centred using the Java weighted-average calculation. The dragged set
 * contributes zero to the numerator and its size to the denominator.
 */
export function planSnap2010(movingSize,candidates){
  if(!candidates.length)return null;
  const total=movingSize+candidates.reduce((s,c)=>s+c.size,0);
  const weightedX=candidates.reduce((s,c)=>s+c.size*c.dx,0);
  const weightedY=candidates.reduce((s,c)=>s+c.size*c.dy,0);
  const center={dx:javaIntDivision(weightedX,total),dy:javaIntDivision(weightedY,total)};
  const external=new Map();
  for(const c of candidates)external.set(c.group,{dx:center.dx-c.dx,dy:center.dy-c.dy});
  return{policy:'2010',moving:center,external,anchorGroup:null,totalSize:total};
}

/**
 * Libre Jigsaw policy introduced 2011-02-08.
 * The largest on-board connected set is the anchor and does not move. The
 * dragged set and any other candidate sets are translated onto that anchor.
 */
export function planSnap2012(movingSize,candidates){
  if(!candidates.length)return null;
  const ranked=[...candidates].sort((a,b)=>b.size-a.size||b.z-a.z||a.order-b.order);
  const anchor=ranked[0];
  const moving={dx:anchor.dx,dy:anchor.dy};
  const external=new Map();
  for(const c of candidates){
    external.set(c.group,c.group===anchor.group?{dx:0,dy:0}:{dx:anchor.dx-c.dx,dy:anchor.dy-c.dy});
  }
  return{policy:'2012',moving,external,anchorGroup:anchor.group,totalSize:movingSize+candidates.reduce((s,c)=>s+c.size,0)};
}

export function planSnap(policy,movingSize,candidates){
  return policy==='2010'?planSnap2010(movingSize,candidates):planSnap2012(movingSize,candidates);
}
