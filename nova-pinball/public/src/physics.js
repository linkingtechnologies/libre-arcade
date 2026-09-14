// SPDX-License-Identifier: GPL-3.0-or-later
export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const EPS = 1e-8;

export function closestOnSegment(px, py, ax, ay, bx, by) {
  const dx = bx-ax, dy = by-ay;
  const d2 = dx*dx + dy*dy;
  const t = d2 < EPS ? 0 : clamp(((px-ax)*dx + (py-ay)*dy)/d2, 0, 1);
  return { x:ax+t*dx, y:ay+t*dy, t };
}

export function circleSegment(ball, a, b, restitution=0.4, surfaceVelocity={x:0,y:0}) {
  const q = closestOnSegment(ball.x, ball.y, a.x, a.y, b.x, b.y);
  let nx = ball.x-q.x, ny = ball.y-q.y;
  let dist = Math.hypot(nx,ny);
  if (dist >= ball.r) return false;
  if (dist < EPS) {
    const sx=b.x-a.x, sy=b.y-a.y;
    const len=Math.hypot(sx,sy)||1;
    nx=-sy/len; ny=sx/len; dist=0;
    if ((ball.vx-surfaceVelocity.x)*nx + (ball.vy-surfaceVelocity.y)*ny > 0) { nx=-nx; ny=-ny; }
  } else { nx/=dist; ny/=dist; }
  const pen = ball.r-dist;
  ball.x += nx*(pen+0.05); ball.y += ny*(pen+0.05);
  const rvx=ball.vx-surfaceVelocity.x, rvy=ball.vy-surfaceVelocity.y;
  const vn=rvx*nx+rvy*ny;
  if (vn < 0) {
    const impulse=-(1+restitution)*vn;
    ball.vx += impulse*nx;
    ball.vy += impulse*ny;
  }
  return true;
}

export function circleCircle(ball, cx, cy, radius, restitution=2) {
  let nx=ball.x-cx, ny=ball.y-cy;
  let dist=Math.hypot(nx,ny);
  const min=ball.r+radius;
  if (dist>=min) return false;
  if (dist<EPS) { nx=0; ny=-1; dist=0; } else { nx/=dist; ny/=dist; }
  const pen=min-dist;
  ball.x+=nx*(pen+0.05); ball.y+=ny*(pen+0.05);
  const vn=ball.vx*nx+ball.vy*ny;
  if (vn<0) {
    const impulse=-(1+restitution)*vn;
    ball.vx+=impulse*nx; ball.vy+=impulse*ny;
  }
  return true;
}

export function pointInPolygon(x,y,poly) {
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const xi=poly[i].x, yi=poly[i].y, xj=poly[j].x, yj=poly[j].y;
    const hit=((yi>y)!==(yj>y)) && (x < (xj-xi)*(y-yi)/((yj-yi)||EPS)+xi);
    if(hit) inside=!inside;
  }
  return inside;
}

export function polySegments(poly) {
  const out=[];
  for(let i=0;i<poly.length-1;i++) out.push([poly[i],poly[i+1]]);
  return out;
}

export function transformedFlipper(def, angle) {
  const p=def.pivot;
  const pivot={x:def.x+p.x,y:def.y+p.y};
  const c=Math.cos(angle), s=Math.sin(angle);
  const verts=[];
  for(let i=0;i<def.vertices.length;i+=2){
    const lx=def.vertices[i]-p.x, ly=def.vertices[i+1]-p.y;
    verts.push({x:pivot.x+lx*c-ly*s,y:pivot.y+lx*s+ly*c});
  }
  return {pivot,verts};
}

// Equal-mass dynamic circle collision. LÖVE/Box2D leaves the ball fixture
// restitution at its default (0), so the normal relative velocity is removed
// rather than made bouncy. This matters once true multiball is active.
export function circlePair(a,b,restitution=0){
  let nx=b.x-a.x, ny=b.y-a.y;
  let dist=Math.hypot(nx,ny);
  const min=a.r+b.r;
  if(dist>=min) return false;
  if(dist<EPS){ nx=1; ny=0; dist=0; } else { nx/=dist; ny/=dist; }
  const pen=min-dist;
  a.x-=nx*(pen/2+0.025); a.y-=ny*(pen/2+0.025);
  b.x+=nx*(pen/2+0.025); b.y+=ny*(pen/2+0.025);
  const rvx=b.vx-a.vx, rvy=b.vy-a.vy;
  const vn=rvx*nx+rvy*ny;
  if(vn<0){
    const j=-(1+restitution)*vn/2;
    a.vx-=j*nx; a.vy-=j*ny;
    b.vx+=j*nx; b.vy+=j*ny;
  }
  return true;
}
