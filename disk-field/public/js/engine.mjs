import { LEVELS } from './levels.mjs';

export const C = Object.freeze({
  SCREEN_W: 800, SCREEN_H: 600, TICK_RATE: 30,
  BORDER_WIDTH: 16, WALL_WIDTH: 12, VECTOR_SPACING: 40,
  DISK_RADIUS: 20, DISK_MASS: 1, END_RADIUS: 10,
  BLACK_HOLE_RADIUS: 16, COLLISION_LOSS: 0.9,
  ROT_INC: 10 * Math.PI / 180,
});

const f32 = Math.fround;
const trunc = Math.trunc;
const sq = x => x*x;
const clone = obj => JSON.parse(JSON.stringify(obj));

function v2(x=0,y=0,f=true){ return {v:[f ? f32(x):x, f ? f32(y):y], f32:f}; }
function copyV(a){ return {v:[a.v[0],a.v[1]], f32:a.f32}; }
function quant(a,x){ return a.f32 ? f32(x) : x; }
function inMul(a,k){ a.v[0]=quant(a,a.v[0]*k); a.v[1]=quant(a,a.v[1]*k); }
function inAdd(a,b){ a.v[0]=quant(a,a.v[0]+b[0]); a.v[1]=quant(a,a.v[1]+b[1]); }
function dot(a,b){ return a[0]*b[0]+a[1]*b[1]; }
function lenSq(a){ return a[0]*a[0]+a[1]*a[1]; }
function rotateVec(a,rot){ if(!rot) return [a[0],a[1]]; const c=Math.cos(rot), s=Math.sin(rot); return [a[0]*c-a[1]*s,a[0]*s+a[1]*c]; }

class Rect {
  constructor(x,y,w,h){ this.x=trunc(x); this.y=trunc(y); this.w=trunc(w); this.h=trunc(h); }
  get left(){return this.x;} get right(){return this.x+this.w;}
  get top(){return this.y;} get bottom(){return this.y+this.h;}
  get centerx(){return trunc(this.x+this.w/2);} get centery(){return trunc(this.y+this.h/2);}
  get topleft(){return [this.left,this.top];} get topright(){return [this.right,this.top];}
  get bottomleft(){return [this.left,this.bottom];} get bottomright(){return [this.right,this.bottom];}
  move(dx,dy){return new Rect(this.x+trunc(dx),this.y+trunc(dy),this.w,this.h);}
  moveIp(dx,dy){this.x+=trunc(dx); this.y+=trunc(dy);}
  collidepoint(p){const l=Math.min(this.left,this.right),r=Math.max(this.left,this.right),t=Math.min(this.top,this.bottom),b=Math.max(this.top,this.bottom);return l<=p[0]&&p[0]<r&&t<=p[1]&&p[1]<b;}
}

function makeField(spec){
  if(spec.type==='MovingObject'){
    const inner=makeField(spec.object);
    return {
      kind:'MovingObject', inner, startX:spec.startX,endX:spec.endX,xVel:spec.xVel,
      startY:spec.startY,endY:spec.endY,yVel:spec.yVel,rotSpeed:spec.rotSpeed||0,
      fixed:inner.fixed,
      moving:true,
      effect(point,fixed){return inner.effect(point,fixed);},
      getPos(){return inner.getPos();},
      update(){
        const pos=inner.getPos();
        if((this.xVel<0&&pos[0]<=this.startX)||(this.xVel>0&&pos[0]>=this.endX)) this.xVel=-this.xVel;
        if((this.yVel<0&&pos[1]<=this.startY)||(this.yVel>0&&pos[1]>=this.endY)) this.yVel=-this.yVel;
        inner.move(this.xVel,this.yVel);
        if(inner.vector) inner.vector=rotateVec(inner.vector,this.rotSpeed);
      }
    };
  }
  if(spec.rect){
    const rect=new Rect(spec.rect.x,spec.rect.y,spec.rect.w,spec.rect.h);
    const o={kind:spec.type,strength:spec.strength,orientation:spec.orientation,fixed:spec.fixed,fuzzy:!!spec.fuzzy,rect,vector:[spec.vector[0],spec.vector[1]],moving:false};
    if(o.fuzzy){o.fuzzyRect=rect.move(-C.VECTOR_SPACING,-C.VECTOR_SPACING);o.fuzzyRect.w+=2*C.VECTOR_SPACING;o.fuzzyRect.h+=2*C.VECTOR_SPACING;}
    o.effect=(point,fixed)=>{
      if(o.fixed!==fixed) return [0,0];
      if(o.rect.collidepoint(point)) return [o.vector[0],o.vector[1]];
      if(o.fuzzy&&o.fuzzyRect.collidepoint(point)){
        const top=o.rect.bottom, bottom=o.rect.top; let mod;
        if(point[0]<o.rect.left){
          if(point[1]>top) mod=1-Math.sqrt(sq(o.rect.left-point[0])+sq(top-point[1]))/C.VECTOR_SPACING;
          else if(point[1]<bottom) mod=1-Math.sqrt(sq(o.rect.left-point[0])+sq(bottom-point[1]))/C.VECTOR_SPACING;
          else mod=1-(o.rect.left-point[0])/C.VECTOR_SPACING;
        } else if(point[0]>=o.rect.right){
          if(point[1]>top) mod=1-Math.sqrt(sq(o.rect.right-point[0])+sq(point[1]-top))/C.VECTOR_SPACING;
          else if(point[1]<bottom) mod=1-Math.sqrt(sq(o.rect.right-point[0])+sq(bottom-point[1]))/C.VECTOR_SPACING;
          else mod=1-(point[0]-o.rect.right)/C.VECTOR_SPACING;
        } else if(point[1]>=top) mod=1-(point[1]-top)/C.VECTOR_SPACING;
        else if(point[1]<=bottom) mod=1-(bottom-point[1])/C.VECTOR_SPACING;
        if(!(mod>0)) return [0,0];
        return [o.vector[0]*mod,o.vector[1]*mod];
      }
      return [0,0];
    };
    o.move=(x,y)=>{o.rect.moveIp(x,y);if(o.fuzzy)o.fuzzyRect.moveIp(x,y);};
    o.getPos=()=>o.rect.topleft;
    return o;
  }
  const o={kind:spec.type,strength:spec.strength,orientation:spec.orientation,fixed:spec.fixed,pos:[f32(spec.pos[0]),f32(spec.pos[1])],moving:false};
  o.effect=(point,fixed)=>{
    if(o.fixed!==fixed) return [0,0];
    const px=f32(point[0]),py=f32(point[1]);
    const rel0=f32(o.pos[0]-px), rel1=f32(o.pos[1]-py);
    const rel=rotateVec([rel0,rel1],o.orientation);
    const d=rel[0]*rel[0]+rel[1]*rel[1];
    return d ? [rel[0]*o.strength/d,rel[1]*o.strength/d] : [0,0];
  };
  o.move=(x,y)=>{o.pos[0]=f32(o.pos[0]+x);o.pos[1]=f32(o.pos[1]+y);};
  o.getPos=()=>o.pos;
  return o;
}

class Arrow {
  constructor(pos,objects){
    this.pos=[f32(pos[0]),f32(pos[1])];
    this.fixed=[f32(0),f32(0)]; this.rot=[f32(0),f32(0)]; this.rotF32=true;
    for(const o of objects){
      const a=o.effect(this.pos,true), b=o.effect(this.pos,false);
      this.fixed[0]=f32(this.fixed[0]+a[0]); this.fixed[1]=f32(this.fixed[1]+a[1]);
      this.rot[0]=f32(this.rot[0]+b[0]); this.rot[1]=f32(this.rot[1]+b[1]);
    }
    this.vector=[f32(this.fixed[0]+this.rot[0]),f32(this.fixed[1]+this.rot[1])]; this.vectorF32=true;
    this.removeFixed=[0,0];
  }
  rotate(rot){
    if(this.rot[0]||this.rot[1]){this.rot=rotateVec(this.rot,rot);this.rotF32=false;this.vector=[this.fixed[0]+this.rot[0],this.fixed[1]+this.rot[1]];this.vectorF32=false;}
  }
  setRemove(v){this.removeFixed=[v[0],v[1]];}
  setFixed(add){
    const dx=add[0]-this.removeFixed[0],dy=add[1]-this.removeFixed[1];
    if(dx||dy){
      this.fixed[0]=f32(this.fixed[0]+dx);this.fixed[1]=f32(this.fixed[1]+dy);
      if(this.vectorF32){this.vector[0]=f32(this.vector[0]+dx);this.vector[1]=f32(this.vector[1]+dy);}
      else {this.vector[0]+=dx;this.vector[1]+=dy;}
    }
  }
  strength(){return Math.hypot(this.vector[0],this.vector[1]);}
  fixedProportion(){const s=this.strength();return s?Math.hypot(this.fixed[0],this.fixed[1])/s:0;}
}

function makeWall(spec){
  if(spec.type==='WallGenerator') throw new Error('WallGenerator not used by active Disk Field 1.01 levels');
  const w={kind:spec.type,rect:new Rect(spec.rect.x,spec.rect.y,spec.rect.w,spec.rect.h),fadeIndex:spec.fadeIndex??-1,crumble:!!spec.crumble,killer:!!spec.killer,alive:true,moving:spec.type==='MovingWall'};
  if(w.moving){Object.assign(w,{startX:spec.startX,endX:spec.endX,xVel:spec.xVel,startY:spec.startY,endY:spec.endY,yVel:spec.yVel});}
  w.getSpeed=()=>w.moving?[f32(w.xVel),f32(w.yVel)]:[f32(0),f32(0)];
  w.update=()=>{
    if(!w.moving)return false; const p=w.rect.topleft;let sw=false;
    if((w.xVel<0&&p[0]<=w.startX)||(w.xVel>0&&p[0]>=w.endX)){w.xVel=-w.xVel;sw=true;}
    if((w.yVel<0&&p[1]<=w.startY)||(w.yVel>0&&p[1]>=w.endY)){w.yVel=-w.yVel;sw=true;}
    w.rect.moveIp(w.xVel,w.yVel);return sw;
  };
  return w;
}

function round1DToGap(pos, intermediate){
  if(intermediate){let off=pos%(C.VECTOR_SPACING/2);if(off>C.VECTOR_SPACING/4)pos-=C.VECTOR_SPACING/2-off;else if(off!==0)pos-=off;}
  else {let off=pos%C.VECTOR_SPACING+C.VECTOR_SPACING/2;if(off>C.VECTOR_SPACING/2)pos+=C.VECTOR_SPACING-off;else if(off!==0)pos-=off;}
  return pos;
}

export function runtimeLevel(index,{randomizeDodge=false,rng=Math.random}={}){
  const s=clone(LEVELS[index]);
  if(index===6&&randomizeDodge){
    const movers=s.walls.filter(w=>w.type==='MovingWall');
    const signs=[1,-1,1,-1,-1];
    for(let i=0;i<movers.length;i++){
      const rawY=C.SCREEN_H/2+(rng()*4-2)*C.VECTOR_SPACING;
      const y=round1DToGap(rawY,false);
      movers[i].rect.y=trunc(y+C.WALL_WIDTH/2);
      movers[i].yVel=signs[i]*(2+rng());
    }
  }
  return s;
}

export class Disk {
  constructor(pos,world){
    this.world=world; this.startPos=v2(pos[0],pos[1],true); this.pos=copyV(this.startPos); this.rotation=0;
    this.speed=v2(0,0,true); this.realSpeed=v2(0,0,true); this.angularV=0;this.scale=1;this.radius=C.DISK_RADIUS;this.radiusSq=this.radius*this.radius;this.mass=1;this.moi=200;this.holeStep=0;this.finished=false;this.hole=null;this.collided=false;
  }
  reset(){this.pos=copyV(this.startPos);this.speed=v2(0,0,true);}
  update(holes,walls){
    this.collided=false;
    if(this.holeStep){
      if(this.holeStep===30)this.scale=.5;else if(this.holeStep===29)this.scale=0;else if(this.holeStep===4)this.pos=v2(this.hole.target[0],this.hole.target[1],true);else if(this.holeStep===3)this.scale=0;else if(this.holeStep===2)this.scale=.5;else if(this.holeStep===1)this.scale=1;
      this.holeStep--;return;
    }
    const oldPos=copyV(this.pos);
    inMul(this.speed,.9); this.angularV*=.99;
    const g=this.world.getVectorAtPoint(this.pos.v); inAdd(this.speed,[g[0]/this.mass,g[1]/this.mass]);
    this.angularV += this.world.getVectorAtPoint([this.pos.v[0]+this.radius,this.pos.v[1]])[1]/this.moi;
    this.angularV -= this.world.getVectorAtPoint([this.pos.v[0]-this.radius,this.pos.v[1]])[1]/this.moi;
    this.angularV -= this.world.getVectorAtPoint([this.pos.v[0],this.pos.v[1]+this.radius])[0]/this.moi;
    this.angularV += this.world.getVectorAtPoint([this.pos.v[0],this.pos.v[1]-this.radius])[0]/this.moi;
    inAdd(this.pos,this.speed.v); this.rotation+=this.angularV;
    const R=this.radius, B=C.BORDER_WIDTH, loss=C.COLLISION_LOSS;
    if(this.pos.v[0]<=B+R){this.speed.v[0]=quant(this.speed,-this.speed.v[0]*loss);const t=this.speed.v[1],a=this.angularV;this.speed.v[1]=quant(this.speed,this.speed.v[1]-(t-R*a)/32);this.angularV+=(t-R*a)/32;this.pos.v[0]=quant(this.pos,B+R);this.collided=true;}
    else if(this.pos.v[0]>=C.SCREEN_W-B-R){this.speed.v[0]=quant(this.speed,-this.speed.v[0]*loss);const t=this.speed.v[1],a=this.angularV;this.speed.v[1]=quant(this.speed,this.speed.v[1]+(t+R*a)/32);this.angularV-=(t+R*a)/32;this.pos.v[0]=quant(this.pos,C.SCREEN_W-B-R);this.collided=true;}
    if(this.pos.v[1]<=B+R){this.speed.v[1]=quant(this.speed,-this.speed.v[1]*loss);const t=this.speed.v[0],a=this.angularV;this.speed.v[0]=quant(this.speed,this.speed.v[0]+(t+R*a)/32);this.angularV-=(t+R*a)/32;this.pos.v[1]=quant(this.pos,B+R);this.collided=true;}
    else if(this.pos.v[1]>=C.SCREEN_H-B-R){this.speed.v[1]=quant(this.speed,-this.speed.v[1]*loss);const t=this.speed.v[0],a=this.angularV;this.speed.v[0]=quant(this.speed,this.speed.v[0]-(t-R*a)/32);this.angularV+=(t-R*a)/32;this.pos.v[1]=quant(this.pos,C.SCREEN_H-B-R);this.collided=true;}
    for(const wall of walls){if(!wall.alive)continue;this.collideWall(wall);}
    this.realSpeed={v:[quant(this.pos,this.pos.v[0]-oldPos.v[0]),quant(this.pos,this.pos.v[1]-oldPos.v[1])],f32:this.pos.f32};
    for(const hole of holes){if(Math.hypot(this.pos.v[0]-hole.pos[0],this.pos.v[1]-hole.pos[1])<=C.DISK_RADIUS+C.END_RADIUS){this.holeStep=30;this.hole=hole;}}
    if(this.world.checkVictoryForDisk(this.pos.v))this.finished=true;
  }
  collideWall(wall){
    const p=this.pos.v,r=this.radius,rs=this.radiusSq,wr=wall.rect,loss=C.COLLISION_LOSS;
    const killer=()=>{if(wall.killer)this.reset();};
    const corner=(corner,add)=>{
      let cv=[f32(corner[0])-this.pos.v[0]+add[0],f32(corner[1])-this.pos.v[1]+add[1]]; const m2=lenSq(cv);
      if(m2<rs&&m2>0){
        this.pos={v:[f32(corner[0])-rs*cv[0]/m2,f32(corner[1])-rs*cv[1]/m2],f32:false};
        const xy2=2*cv[0]*cv[1],ux=cv[0]*cv[0],uy=cv[1]*cv[1];
        const sx=this.speed.v[0],sy=this.speed.v[1];
        this.speed={v:[-(sx*(ux-uy)+sy*xy2)/m2*loss,-(sx*xy2+sy*(uy-ux))/m2*loss],f32:false};
        this.collided=true;killer();return true;
      }return false;
    };
    if(p[0]<wr.left){
      if(p[1]<wr.bottom){corner(wr.bottomleft,[1,1]);}
      else if(p[1]>wr.top){corner(wr.topleft,[1,-1]);}
      else if(p[0]+r>wr.left&&p[0]<wr.centerx){this.speed.v[0]=quant(this.speed,-this.speed.v[0]*loss);const t=this.speed.v[1],a=this.angularV;this.speed.v[1]=quant(this.speed,this.speed.v[1]+(t+r*a)/32);this.angularV-=(t+r*a)/32;this.pos.v[0]=quant(this.pos,wr.left-r);const ws=wall.getSpeed();inAdd(this.speed,[ws[0]/32,ws[1]/32]);this.angularV+=ws[1]/32;this.collided=true;killer();}
    } else if(p[0]>wr.right){
      if(p[1]<wr.bottom){corner(wr.bottomright,[-1,1]);}
      else if(p[1]>wr.top){corner(wr.topright,[-1,-1]);}
      else if(p[0]-r<wr.right&&p[0]>wr.centerx){this.speed.v[0]=quant(this.speed,-this.speed.v[0]*loss);const t=this.speed.v[1],a=this.angularV;this.speed.v[1]=quant(this.speed,this.speed.v[1]-(t-r*a)/32);this.angularV+=(t-r*a)/32;this.pos.v[0]=quant(this.pos,wr.right+r);const ws=wall.getSpeed();inAdd(this.speed,[ws[0]/32,ws[1]/32]);this.angularV+=ws[1]/32;this.collided=true;killer();}
    } else {
      if(p[1]+r>wr.bottom&&p[1]<wr.centery){this.speed.v[1]=quant(this.speed,-this.speed.v[1]*loss);const t=this.speed.v[0],a=this.angularV;this.speed.v[0]=quant(this.speed,this.speed.v[0]-(t-r*a)/32);this.angularV+=(t-r*a)/32;const ws=wall.getSpeed();inAdd(this.speed,[ws[0]/32,ws[1]/32]);this.angularV-=ws[0]/32;this.pos.v[1]=quant(this.pos,wr.bottom-r);this.collided=true;killer();}
      else if(p[1]-r<wr.top&&p[1]>wr.centery){this.speed.v[1]=quant(this.speed,-this.speed.v[1]*loss);const t=this.speed.v[0],a=this.angularV;this.speed.v[0]=quant(this.speed,this.speed.v[0]+(t+r*a)/32);this.angularV-=(t+r*a)/32;const ws=wall.getSpeed();inAdd(this.speed,[ws[0]/32,ws[1]/32]);this.angularV-=ws[0]/32;this.pos.v[1]=quant(this.pos,wr.top+r);this.collided=true;killer();}
    }
  }
}

export class World {
  constructor(levelIndex,options={}){
    this.levelIndex=levelIndex;this.spec=runtimeLevel(levelIndex,options);this.objects=this.spec.objects.map(makeField);this.holes=this.spec.holes.map(h=>({pos:[h.pos[0],h.pos[1]],target:[h.target[0],h.target[1]],radius:h.radius}));this.walls=this.spec.walls.map(makeWall);this.winPos=[this.spec.winPos[0],this.spec.winPos[1]];this.finished=false;
    this.arrows=Array.from({length:19},(_,i)=>Array.from({length:14},(_,j)=>new Arrow([(i+1)*40,(j+1)*40],this.objects)));
    this.disks=this.spec.diskPos.map(p=>new Disk(p,this));
  }
  arrowAt(ix,iy){if(ix<0)ix=this.arrows.length+ix;if(iy<0)iy=this.arrows[0].length+iy;return this.arrows[ix][iy];}
  getVectorAtPoint(point){
    let rx=f32(0),ry=f32(0);let px=Number(point[0]),py=Number(point[1]);const x=(px%C.VECTOR_SPACING)/C.VECTOR_SPACING,y=(py%C.VECTOR_SPACING)/C.VECTOR_SPACING;px=px/C.VECTOR_SPACING-1;py=py/C.VECTOR_SPACING-1;const fx=Math.floor(px),fy=Math.floor(py),cx=Math.ceil(px),cy=Math.ceil(py);
    const add=(a,k)=>{rx=f32(rx+a.vector[0]*k);ry=f32(ry+a.vector[1]*k);};
    add(this.arrowAt(fx,fy),(1-x)*(1-y));
    if(cx<19&&cx>=0){add(this.arrowAt(cx,fy),x*(1-y));if(cy<14&&cy>=0)add(this.arrowAt(cx,cy),x*y);}
    if(cy<14&&cy>=0)add(this.arrowAt(fx,cy),(1-x)*y);
    return [rx,ry];
  }
  rotate(clockwise){const rot=clockwise?-C.ROT_INC:C.ROT_INC;for(const col of this.arrows)for(const a of col)a.rotate(rot);}
  checkVictoryForDisk(p){return Math.hypot(p[0]-this.winPos[0],p[1]-this.winPos[1])<=C.DISK_RADIUS+C.END_RADIUS;}
  checkVictory(){if(this.disks.every(d=>d.finished))this.finished=true;}
  updatePreview(){
    for(const w of this.walls)w.update();
    for(const o of this.objects)if(o.moving&&o.fixed){for(const col of this.arrows)for(const a of col)a.setRemove(o.effect(a.pos,true));}
    for(const o of this.objects)if(o.moving)o.update();
    for(const o of this.objects)if(o.moving&&o.fixed){for(const col of this.arrows)for(const a of col)a.setFixed(o.effect(a.pos,true));}
  }
  update(){
    for(const w of this.walls)w.update();
    for(const d of this.disks)if(!d.finished)d.update(this.holes,this.walls);
    for(const o of this.objects)if(o.moving&&o.fixed){for(const col of this.arrows)for(const a of col)a.setRemove(o.effect(a.pos,true));}
    for(const o of this.objects)if(o.moving)o.update();
    for(const o of this.objects)if(o.moving&&o.fixed){for(const col of this.arrows)for(const a of col)a.setFixed(o.effect(a.pos,true));}
    this.checkVictory();
  }
}

export function makeWorld(levelIndex,options={}){return new World(levelIndex,options);}
