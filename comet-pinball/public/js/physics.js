(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  else root.CometPhysics=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const W=.76, H=1.40, SCALE=10;
const BALL_R=.0135;
const RAMP_ANGLE=7*Math.PI/180;
const G=-9.81*Math.sin(RAMP_ANGLE);
const STEEL_E=.56, GROUND_E=.20;
const BALL_FRICTION=.40, DEFAULT_FIXTURE_FRICTION=.20;
const MIXED_FRICTION=Math.sqrt(BALL_FRICTION*DEFAULT_FIXTURE_FRICTION);
const SLING_R=.005;
const STEEL_DENSITY_SCALED=8000/(SCALE*SCALE*SCALE); // 8 in the original Box2D world.
const BALL_R_SCALED=BALL_R*SCALE;
const BALL_MASS=Math.PI*BALL_R_SCALED*BALL_R_SCALED*STEEL_DENSITY_SCALED;
const BALL_INERTIA=.5*BALL_MASS*BALL_R*BALL_R;
// Measured from the original libGDX/Box2D body (scaled-world mass properties).
const FLIPPER_MASS=2.727645874;
const FLIPPER_LOCAL_CENTER=.402174175/10;
const FLIPPER_INERTIA_BOX=.864361584;
const FLIPPER_INERTIA_COM_BOX=FLIPPER_INERTIA_BOX-FLIPPER_MASS*Math.pow(FLIPPER_LOCAL_CENTER*10,2);
const FLIPPER_COMMAND_ALPHA=FLIPPER_INERTIA_COM_BOX/FLIPPER_INERTIA_BOX; // 0.489587986, measured Box2D joint projection
const FLIPPER_INERTIA=FLIPPER_INERTIA_BOX/100; // equivalent inertia in real-metre coordinates about the pivot
const FLIPPER_INERTIA_COM=FLIPPER_INERTIA_COM_BOX/100;
const ANGULAR_SLOP=2*Math.PI/180;
const MAX_ANGULAR_CORRECTION=8*Math.PI/180;
const BUMPER_FORCE_SCALED=20*SCALE; // 200, exact upstream constant.
const BUMPER_ACCEL_PHYSICAL=(BUMPER_FORCE_SCALED/BALL_MASS)/SCALE;
const PLUNGE_DV=Math.abs(-9.81*SCALE)*2*.1/SCALE; // 1.962 m/s.
const CONTACT_EPS=2e-5;
const LINEAR_SLOP=.005/SCALE;
const POLYGON_RADIUS=(2*.005)/SCALE;
const MAX_LINEAR_CORRECTION=.2/SCALE;
const BAUMGARTE=.2, TOI_BAUMGARTE=.75;
const VELOCITY_ITERATIONS=6, POSITION_ITERATIONS=2, TOI_POSITION_ITERATIONS=20;
const MAX_SUBSTEP=1/240;
// b2CollidePolygons (Box2D 2.2.x) compares separations in the scaled Box2D
// world.  Comet's Java world is x10, while this port stores real metres.
const POLY_RELATIVE_TOL=.98, POLY_ABSOLUTE_TOL=.001/SCALE;
const TOI_TARGET=Math.max(LINEAR_SLOP,2*POLYGON_RADIUS-3*LINEAR_SLOP);
const BALL_POLYGON_TOI_TARGET=Math.max(LINEAR_SLOP,POLYGON_RADIUS+BALL_R-3*LINEAR_SLOP);
const TOI_TOLERANCE=.25*LINEAR_SLOP;
const VELOCITY_THRESHOLD=1/SCALE; // b2_velocityThreshold == 1 in the x10 world.
const FLIPPER_TABLE_FRICTION=DEFAULT_FIXTURE_FRICTION;

function v(x=0,y=0){return {x,y};}
function add(a,b){return v(a.x+b.x,a.y+b.y);}
function sub(a,b){return v(a.x-b.x,a.y-b.y);}
function mul(a,s){return v(a.x*s,a.y*s);}
function dot(a,b){return a.x*b.x+a.y*b.y;}
function cross(a,b){return a.x*b.y-a.y*b.x;}
function len(a){return Math.hypot(a.x,a.y);}
function norm(a){const l=len(a)||1;return v(a.x/l,a.y/l);}
function clamp(x,a,b){return Math.max(a,Math.min(b,x));}
function rot(p,a){const c=Math.cos(a),s=Math.sin(a);return v(p.x*c-p.y*s,p.x*s+p.y*c);}
function invRot(p,a){const c=Math.cos(a),s=Math.sin(a);return v(p.x*c+p.y*s,-p.x*s+p.y*c);}
function closestOnSeg(p,a,b){const ab=sub(b,a),d=dot(ab,ab)||1,t=clamp(dot(sub(p,a),ab)/d,0,1);return add(a,mul(ab,t));}
function polygonArea(points){let a=0;for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];a+=p.x*q.y-q.x*p.y;}return a*.5;}
function pointInPolygon(p,points){let inside=false;for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[i],b=points[j];
  const hit=((a.y>p.y)!==(b.y>p.y))&&(p.x<(b.x-a.x)*(p.y-a.y)/((b.y-a.y)||1e-20)+a.x);
  if(hit) inside=!inside;
}return inside;}
function rectPoints(cx,cy,hx,hy,angle=0){
  return [v(-hx,-hy),v(hx,-hy),v(hx,hy),v(-hx,hy)].map(p=>add(v(cx,cy),rot(p,angle)));
}
function translate(points,offset){return points.map(p=>add(p,offset));}

// ---------------------------------------------------------------------------
// Historical polygon manifold helpers (Box2D 2.2.x, b2CollidePolygons).
// They intentionally keep the contact manifold in local coordinates so that
// the same manifold can be transformed again after the TOI position solve,
// exactly as b2WorldManifold/b2PositionSolverManifold do in the native engine.
// ---------------------------------------------------------------------------
function polygonCentroid(vertices){
  let area=0,cx=0,cy=0;
  for(let i=0;i<vertices.length;i++){
    const p=vertices[i],q=vertices[(i+1)%vertices.length],d=cross(p,q);
    area+=d;cx+=(p.x+q.x)*d;cy+=(p.y+q.y)*d;
  }
  area*=.5;
  if(Math.abs(area)<1e-18)return v(0,0);
  return v(cx/(6*area),cy/(6*area));
}
function makePolygonShape(vertices,radius=POLYGON_RADIUS){
  const vv=vertices.map(p=>v(p.x,p.y)),normals=[];
  const ccw=polygonArea(vv)>=0;
  for(let i=0;i<vv.length;i++){
    const e=sub(vv[(i+1)%vv.length],vv[i]);
    normals.push(norm(ccw?v(e.y,-e.x):v(-e.y,e.x)));
  }
  return {vertices:vv,normals,centroid:polygonCentroid(vv),radius};
}
function xfPoint(xf,p){return add(xf.p,rot(p,xf.a));}
function invXfPoint(xf,p){return invRot(sub(p,xf.p),xf.a);}
function xfVector(xf,p){return rot(p,xf.a);}
function invXfVector(xf,p){return invRot(p,xf.a);}
function makeXf(p,a=0){return {p:v(p.x,p.y),a};}

function findMaxSeparation(poly1,xf1,poly2,xf2){
  let bestEdge=0,bestSep=-Infinity;
  for(let i=0;i<poly1.vertices.length;i++){
    // Normal of polygon1 expressed in polygon2 local coordinates.
    const n=invXfVector(xf2,xfVector(xf1,poly1.normals[i]));
    const p=invXfPoint(xf2,xfPoint(xf1,poly1.vertices[i]));
    let s=Infinity;
    for(const q of poly2.vertices)s=Math.min(s,dot(sub(q,p),n));
    if(s>bestSep){bestSep=s;bestEdge=i;}
  }
  return {edge:bestEdge,separation:bestSep};
}
function clipSegmentToLine(input,normal,offset,vertexIndexA){
  const out=[];
  const d0=dot(normal,input[0].v)-offset,d1=dot(normal,input[1].v)-offset;
  if(d0<=0)out.push({v:v(input[0].v.x,input[0].v.y),id:{...input[0].id}});
  if(d1<=0)out.push({v:v(input[1].v.x,input[1].v.y),id:{...input[1].id}});
  if(d0*d1<0){
    const t=d0/(d0-d1),p=add(input[0].v,mul(sub(input[1].v,input[0].v),t));
    const src=d0>0?input[0]:input[1];
    out.push({v:p,id:{indexA:vertexIndexA,indexB:src.id.indexB,typeA:'vertex',typeB:'face'}});
  }
  return out;
}
function findIncidentEdge(ref,xfRef,edgeRef,inc,xfInc){
  const normalInc=invXfVector(xfInc,xfVector(xfRef,ref.normals[edgeRef]));
  let index=0,minDot=Infinity;
  for(let i=0;i<inc.normals.length;i++){
    const d=dot(normalInc,inc.normals[i]);if(d<minDot){minDot=d;index=i;}
  }
  const i2=(index+1)%inc.vertices.length;
  return [
    {v:xfPoint(xfInc,inc.vertices[index]),id:{indexA:edgeRef,indexB:index,typeA:'face',typeB:'vertex'}},
    {v:xfPoint(xfInc,inc.vertices[i2]),id:{indexA:edgeRef,indexB:i2,typeA:'face',typeB:'vertex'}}
  ];
}
function collidePolygons(polyA,xfA,polyB,xfB){
  const totalRadius=polyA.radius+polyB.radius;
  const sepA=findMaxSeparation(polyA,xfA,polyB,xfB);if(sepA.separation>totalRadius)return null;
  const sepB=findMaxSeparation(polyB,xfB,polyA,xfA);if(sepB.separation>totalRadius)return null;
  let ref,inc,xfRef,xfInc,edgeRef,type,flip;
  if(sepB.separation>POLY_RELATIVE_TOL*sepA.separation+POLY_ABSOLUTE_TOL){
    ref=polyB;inc=polyA;xfRef=xfB;xfInc=xfA;edgeRef=sepB.edge;type='faceB';flip=true;
  }else{
    ref=polyA;inc=polyB;xfRef=xfA;xfInc=xfB;edgeRef=sepA.edge;type='faceA';flip=false;
  }
  const incident=findIncidentEdge(ref,xfRef,edgeRef,inc,xfInc);
  const i2=(edgeRef+1)%ref.vertices.length;
  const v11=ref.vertices[edgeRef],v12=ref.vertices[i2];
  const localTangent=norm(sub(v12,v11)),localNormal=v(localTangent.y,-localTangent.x);
  const planePoint=mul(add(v11,v12),.5),tangent=xfVector(xfRef,localTangent),normal=v(tangent.y,-tangent.x);
  const w11=xfPoint(xfRef,v11),w12=xfPoint(xfRef,v12);
  const frontOffset=dot(normal,w11);
  const sideOffset1=-dot(tangent,w11)+totalRadius,sideOffset2=dot(tangent,w12)+totalRadius;
  let clip=clipSegmentToLine(incident,mul(tangent,-1),sideOffset1,edgeRef);if(clip.length<2)return null;
  clip=clipSegmentToLine(clip,tangent,sideOffset2,i2);if(clip.length<2)return null;
  const points=[];
  for(const cp of clip){
    const separation=dot(normal,cp.v)-frontOffset;
    if(separation<=totalRadius){
      let id={...cp.id};
      if(flip)id={indexA:id.indexB,indexB:id.indexA,typeA:id.typeB,typeB:id.typeA};
      points.push({localPoint:invXfPoint(xfInc,cp.v),id});
    }
  }
  if(!points.length)return null;
  return {type,localNormal,localPoint:planePoint,points:points.slice(0,2),radiusA:polyA.radius,radiusB:polyB.radius};
}
function worldManifold(manifold,xfA,xfB){
  if(!manifold||!manifold.points.length)return null;
  const points=[];let normal;
  if(manifold.type==='faceA'){
    normal=xfVector(xfA,manifold.localNormal);const plane=xfPoint(xfA,manifold.localPoint);
    for(const mp of manifold.points){
      const clip=xfPoint(xfB,mp.localPoint),scalarA=manifold.radiusA-dot(sub(clip,plane),normal);
      const cA=add(clip,mul(normal,scalarA)),cB=sub(clip,mul(normal,manifold.radiusB));points.push(mul(add(cA,cB),.5));
    }
  }else{
    normal=xfVector(xfB,manifold.localNormal);const plane=xfPoint(xfB,manifold.localPoint);
    for(const mp of manifold.points){
      const clip=xfPoint(xfA,mp.localPoint),scalarB=manifold.radiusB-dot(sub(clip,plane),normal);
      const cB=add(clip,mul(normal,scalarB)),cA=sub(clip,mul(normal,manifold.radiusA));points.push(mul(add(cA,cB),.5));
    }
    normal=mul(normal,-1);
  }
  return {normal,points};
}
function positionSolverManifold(manifold,xfA,xfB,index){
  let normal,point,separation;
  if(manifold.type==='faceA'){
    normal=xfVector(xfA,manifold.localNormal);const plane=xfPoint(xfA,manifold.localPoint);point=xfPoint(xfB,manifold.points[index].localPoint);
    separation=dot(sub(point,plane),normal)-manifold.radiusA-manifold.radiusB;
  }else{
    normal=xfVector(xfB,manifold.localNormal);const plane=xfPoint(xfB,manifold.localPoint);point=xfPoint(xfA,manifold.points[index].localPoint);
    separation=dot(sub(point,plane),normal)-manifold.radiusA-manifold.radiusB;normal=mul(normal,-1);
  }
  return {normal,point,separation};
}

// Historical b2CollidePolygonAndCircle.  The table polygons are stored in
// world coordinates, so xfA is the identity and the circle local point is 0.
function collidePolygonCircle(poly,xfA,circleCenter,radiusB=BALL_R){
  const cLocal=invXfPoint(xfA,circleCenter),radius=poly.radius+radiusB;
  let normalIndex=0,separation=-Infinity;
  for(let i=0;i<poly.vertices.length;i++){
    const s=dot(poly.normals[i],sub(cLocal,poly.vertices[i]));
    if(s>radius)return null;
    if(s>separation){separation=s;normalIndex=i;}
  }
  const i1=normalIndex,i2=(i1+1)%poly.vertices.length,v1=poly.vertices[i1],v2=poly.vertices[i2];
  let localNormal,localPoint;
  if(separation<Number.EPSILON){
    localNormal=poly.normals[i1];localPoint=mul(add(v1,v2),.5);
  }else{
    const e=sub(v2,v1),u1=dot(sub(cLocal,v1),e),u2=dot(sub(cLocal,v2),mul(e,-1));
    if(u1<=0){
      if(dot(sub(cLocal,v1),sub(cLocal,v1))>radius*radius)return null;
      localNormal=norm(sub(cLocal,v1));localPoint=v1;
    }else if(u2<=0){
      if(dot(sub(cLocal,v2),sub(cLocal,v2))>radius*radius)return null;
      localNormal=norm(sub(cLocal,v2));localPoint=v2;
    }else{
      const faceCenter=mul(add(v1,v2),.5),s=dot(sub(cLocal,faceCenter),poly.normals[i1]);
      if(s>radius)return null;
      localNormal=poly.normals[i1];localPoint=faceCenter;
    }
  }
  return {type:'faceA',localNormal,localPoint,points:[{localPoint:v(0,0),id:{indexA:normalIndex,indexB:0,typeA:'face',typeB:'vertex'}}],radiusA:poly.radius,radiusB};
}

function circlePolygonContact(center,radius,points){
  let best=null,bestD2=Infinity,bestEdge=0;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],q=closestOnSeg(center,a,b),d=sub(center,q),d2=dot(d,d);
    if(d2<bestD2){bestD2=d2;best=q;bestEdge=i;}
  }
  const inside=pointInPolygon(center,points),dist=Math.sqrt(bestD2);
  if(!inside&&dist>=radius) return null;
  let n;
  if(inside){
    const a=points[bestEdge],b=points[(bestEdge+1)%points.length],e=sub(b,a),ccw=polygonArea(points)>0;
    n=norm(ccw?v(e.y,-e.x):v(-e.y,e.x));
    return {normal:n,penetration:radius+dist,point:best,inside:true};
  }
  if(dist>1e-12) n=mul(sub(center,best),1/dist);
  else {
    const a=points[bestEdge],b=points[(bestEdge+1)%points.length],e=sub(b,a),ccw=polygonArea(points)>0;
    n=norm(ccw?v(e.y,-e.x):v(-e.y,e.x));
  }
  return {normal:n,penetration:radius-dist,point:best,inside:false};
}

function makeGeometry(pf){
  const polygons=[],circles=[],reactiveSlings=[];let polySeq=0,circleSeq=0;
  const addPoly=(points,e=STEEL_E,meta={})=>polygons.push({points,e,mu:MIXED_FRICTION,key:`p${polySeq++}`,...meta});
  const addCircle=(x,y,r,e=STEEL_E,meta={})=>circles.push({x,y,r,e,mu:MIXED_FRICTION,key:`c${circleSeq++}`,...meta});

  // Exact Box2D boundary boxes from FieldBoundsElement.
  addPoly(rectPoints(.38,.005,.38,.005),GROUND_E,{kind:'ground',label:'ground'});
  addPoly(rectPoints(.38,1.395,.38,.005),STEEL_E,{kind:'ceiling',label:'ceiling'});
  addPoly(rectPoints(.005,.70,.005,.70),STEEL_E,{kind:'left-wall',label:'left-wall'});
  addPoly(rectPoints(.755,.70,.005,.70),STEEL_E,{kind:'right-wall',label:'right-wall'});

  // Exact launch-lane separator: x=.71..72, y=0..1.10.
  addPoly(rectPoints(.715,.55,.005,.55),STEEL_E,{kind:'plunger-tube',label:'plunger-tube'});

  // Hard-coded lower table geometry.
  addPoly([v(0,.15),v(.20,.15),v(.20,.20),v(0,.35)],STEEL_E,{kind:'bottom-left',label:'bottom-left'});
  addPoly([v(.20,.20),v(.20,.185),v(.22,.185)],STEEL_E,{kind:'left-flipper-corner',label:'left-flipper-corner'});
  addPoly([v(.72,.15),v(.72,.35),v(.52,.20),v(.52,.15)],STEEL_E,{kind:'bottom-right',label:'bottom-right'});
  addPoly([v(.52,.20),v(.50,.185),v(.52,.185)],STEEL_E,{kind:'right-flipper-corner',label:'right-flipper-corner'});

  // Exact 30-rectangle quarter-circle fixtures used by FieldTopCornerElement.
  const count=30,corner=.30,halfW=.005,halfL=.02,base=.295;
  for(let i=0;i<count;i++){
    const a=(Math.PI/2)*i/(count-1);
    const local=v(base*Math.cos(a)-corner,base*Math.sin(a)-corner);
    addPoly(translate(rectPoints(local.x,local.y,halfW,halfL,a),v(.76,1.40)),STEEL_E,{kind:'top-right-curve',label:`top-right-${i}`});
    const leftCenter=add(v(0,1.40),rot(local,Math.PI/2));
    addPoly(rectPoints(leftCenter.x,leftCenter.y,halfW,halfL,a+Math.PI/2),STEEL_E,{kind:'top-left-curve',label:`top-left-${i}`});
  }

  // XML obstacles are already in real-metre coordinates after undoing the Java x10 scale.
  for(const o of pf.obstacles) addPoly(o.v.map(p=>v(o.x+p.x,o.y+p.y)),STEEL_E,{kind:'obstacle',id:o.id,label:`obstacle:${o.id}`});

  // Slingshot fixtures, copied structurally from Slingshot.java.
  for(const s of pf.slingshots){
    const c=v(s.x,s.y),a=add(c,s.a),b=add(c,s.b),ab=sub(b,a);
    const rAB=mul(norm(v(-ab.y,ab.x)),SLING_R);
    const reactive=[sub(a,rAB),sub(b,rAB),add(b,rAB),add(a,rAB)];
    addPoly(reactive,STEEL_E,{kind:'sling-reactive',id:s.id,reactive:true,label:`sling-reactive:${s.id}`});
    reactiveSlings.push({id:s.id,points:reactive,normal:norm(v(ab.y,-ab.x))}); // Java rotate(-90).

    for(const endpoint of [a,b]){
      const vec=sub(endpoint,c),rr=mul(norm(v(-vec.y,vec.x)),SLING_R);
      addPoly([sub(c,rr),sub(endpoint,rr),add(endpoint,rr),add(c,rr)],STEEL_E,{kind:'sling-side',id:s.id,label:`sling-side:${s.id}`});
    }
    addCircle(c.x,c.y,SLING_R,STEEL_E,{kind:'sling-corner',id:s.id,label:`sling-corner:${s.id}`});
    addCircle(a.x,a.y,SLING_R,STEEL_E,{kind:'sling-corner',id:s.id,label:`sling-corner:${s.id}`});
    addCircle(b.x,b.y,SLING_R,STEEL_E,{kind:'sling-corner',id:s.id,label:`sling-corner:${s.id}`});
  }
  for(const b of pf.bumpers) addCircle(b.x,b.y,b.r,STEEL_E,{kind:'bumper',id:b.id,label:`bumper:${b.id}`});
  return {polygons,circles,reactiveSlings};
}

function solve22(k11,k12,k22,bx,by){
  const det=k11*k22-k12*k12;
  if(Math.abs(det)<1e-18) return v(0,0);
  return v(( k22*bx-k12*by)/det,(-k12*bx+k11*by)/det);
}
function initFlipperState(f){
  const rc=rot(v(f.localCenter,0),f.bodyAngle);
  f.comX=f.pivot.x+rc.x;f.comY=f.pivot.y+rc.y;
  f.comVx=0;f.comVy=0;
  f.jointState='inactive';
  f.jointImpulse={x:0,y:0,z:0};
  f.jointRA=v(0,0);f.jointK=null;
  return f;
}
function quantizeFlipperState(f){
  // Native Box2D 2.2.x stores the sweep and velocities as float.  Positions
  // and linear velocities are float values in Comet's x10 world; angles are
  // dimensionless float values.
  f.comX=Math.fround(f.comX*SCALE)/SCALE;f.comY=Math.fround(f.comY*SCALE)/SCALE;
  f.comVx=Math.fround(f.comVx*SCALE)/SCALE;f.comVy=Math.fround(f.comVy*SCALE)/SCALE;
  f.bodyAngle=Math.fround(f.bodyAngle);f.omega=Math.fround(f.omega);
}
function makeFlippers(){
  const rest=Math.atan2(3,4),active=Math.atan2(4,3);
  return {
    left:initFlipperState({name:'left',pivot:v(.226,.156),bodyAngle:-rest,omega:0,min:-rest-ANGULAR_SLOP,max:active+ANGULAR_SLOP,hardMin:-rest,hardMax:active,localSign:1,localCenter:FLIPPER_LOCAL_CENTER,referenceAngle:rest,jointLower:-Math.PI/2,jointUpper:0}),
    right:initFlipperState({name:'right',pivot:v(.494,.156),bodyAngle:rest,omega:0,min:-active-ANGULAR_SLOP,max:rest+ANGULAR_SLOP,hardMin:-active,hardMax:rest,localSign:-1,localCenter:-FLIPPER_LOCAL_CENTER,referenceAngle:-rest,jointLower:0,jointUpper:Math.PI/2})
  };
}
function flipperOrigin(f){
  const rc=rot(v(f.localCenter,0),f.bodyAngle);
  return v(f.comX-rc.x,f.comY-rc.y);
}
function flipperWorldShape(f){
  const s=f.localSign,L=.11,r0=.02,r1=.01,o=flipperOrigin(f);
  const local=s>0?[v(0,-r0),v(L,-r1),v(L,r1),v(0,r0)]:[v(0,r0),v(-L,r1),v(-L,-r1),v(0,-r0)];
  const poly=local.map(p=>add(o,rot(p,f.bodyAngle)));
  const tip=add(o,rot(v(s*L,0),f.bodyAngle));
  return {poly,pivot:{x:o.x,y:o.y,r:r0},tip:{x:tip.x,y:tip.y,r:r1}};
}
function flipperLocalPolygon(f){
  const s=f.localSign,L=.11,r0=.02,r1=.01;
  return makePolygonShape(s>0?[v(0,-r0),v(L,-r1),v(L,r1),v(0,r0)]:[v(0,r0),v(-L,r1),v(-L,-r1),v(0,-r0)]);
}
function flipperXf(f){return makeXf(flipperOrigin(f),f.bodyAngle);}
function flipperXfFromSweep(f,cx,cy,a){
  const rc=rot(v(f.localCenter,0),a);return makeXf(v(cx-rc.x,cy-rc.y),a);
}
function flipperCornerDef(f){
  if(f.name==='left')return {key:'flipper-left:poly-vs-left-flipper-corner',shape:makePolygonShape([v(0,0),v(0,-.015),v(.02,-.015)]),xf:makeXf(v(.2,.2),0)};
  return {key:'flipper-right:poly-vs-right-flipper-corner',shape:makePolygonShape([v(0,0),v(-.02,-.015),v(0,-.015)]),xf:makeXf(v(.52,.2),0)};
}
function flipperTarget(f,pressed){return f.name==='left'?(pressed?50:-15):(pressed?-50:15);}
function solve33(m,b){
  const a=m[0],c=m[1],d=m[2],e=m[3],f=m[4],g=m[5];
  const det=a*(e*g-f*f)-c*(c*g-f*d)+d*(c*f-e*d);
  if(Math.abs(det)<1e-18)return {x:0,y:0,z:0};
  const dx=b.x*(e*g-f*f)-c*(b.y*g-f*b.z)+d*(b.y*f-e*b.z);
  const dy=a*(b.y*g-f*b.z)-b.x*(c*g-f*d)+d*(c*b.z-b.y*d);
  const dz=a*(e*b.z-b.y*f)-c*(c*b.z-b.y*d)+b.x*(c*f-e*d);
  return {x:dx/det,y:dy/det,z:dz/det};
}
function jointAngleOf(f){return -f.bodyAngle-f.referenceAngle;}
function computeJointState(f){
  const a=jointAngleOf(f);
  if(a<=f.jointLower)return 'lower';
  if(a>=f.jointUpper)return 'upper';
  return 'inactive';
}
function beginFlipperStep(f,pressed,dt){
  // FlipperElement.setAngularVelocity() runs before world.step(). Linear velocity is preserved.
  f.omega=flipperTarget(f,pressed);
  f.comVy+=G*dt;
  const newState=computeJointState(f);
  if(newState!==f.jointState)f.jointImpulse.z=0;
  f.jointState=newState;
  const r=rot(v(-f.localCenter,0),f.bodyAngle);f.jointRA=r;
  const m=1/FLIPPER_MASS,i=1/FLIPPER_INERTIA_COM;
  f.jointK={
    k11:m+r.y*r.y*i,
    k12:-r.y*r.x*i,
    k13:-r.y*i,
    k22:m+r.x*r.x*i,
    k23:r.x*i,
    k33:i
  };
}
function warmStartFlipperJoint(f,dtRatio){
  const imp=f.jointImpulse;
  imp.x*=dtRatio;imp.y*=dtRatio;imp.z*=dtRatio;
  const m=1/FLIPPER_MASS,i=1/FLIPPER_INERTIA_COM,r=f.jointRA;
  f.comVx-=m*imp.x;f.comVy-=m*imp.y;
  f.omega-=i*(cross(r,imp)+imp.z);
}
function solveFlipperVelocityConstraint(f){
  const r=f.jointRA,k=f.jointK,m=1/FLIPPER_MASS,i=1/FLIPPER_INERTIA_COM;
  const c1x=-f.comVx+f.omega*r.y;
  const c1y=-f.comVy-f.omega*r.x;
  const acc=f.jointImpulse;
  let ix=0,iy=0,iz=0;
  if(f.jointState!=='inactive'){
    const out=solve33([k.k11,k.k12,k.k13,k.k22,k.k23,k.k33],{x:-c1x,y:-c1y,z:f.omega}); // -Cdot2 = wA
    ix=out.x;iy=out.y;iz=out.z;
    const nz=acc.z+iz;
    const violates=(f.jointState==='lower'&&nz<0)||(f.jointState==='upper'&&nz>0);
    if(violates){
      const rhsx=-c1x+acc.z*k.k13,rhsy=-c1y+acc.z*k.k23;
      const red=solve22(k.k11,k.k12,k.k22,rhsx,rhsy);
      ix=red.x;iy=red.y;iz=-acc.z;
      acc.x+=ix;acc.y+=iy;acc.z=0;
    }else{acc.x+=ix;acc.y+=iy;acc.z+=iz;}
  }else{
    const imp=solve22(k.k11,k.k12,k.k22,-c1x,-c1y);ix=imp.x;iy=imp.y;
    acc.x+=ix;acc.y+=iy;
  }
  f.comVx-=m*ix;f.comVy-=m*iy;
  f.omega-=i*(cross(r,{x:ix,y:iy})+iz);
}
function commandFlipper(f,pressed){
  // Compatibility helper retained for tests/tools outside Engine.
  f.omega=FLIPPER_COMMAND_ALPHA*flipperTarget(f,pressed)+(1-FLIPPER_COMMAND_ALPHA)*f.omega;
}
function advanceFlipper(f,dt){
  let next=f.bodyAngle+f.omega*dt;
  if(next<f.min){next=f.min;f.omega=0;}
  if(next>f.max){next=f.max;f.omega=0;}
  f.bodyAngle=next;
}
function integrateFlipper(f,dt){f.comX+=f.comVx*dt;f.comY+=f.comVy*dt;f.bodyAngle+=f.omega*dt;}
function pointPositionSolve(f){
  const invM=1/FLIPPER_MASS,invI=1/FLIPPER_INERTIA_COM;
  const r=rot(v(-f.localCenter,0),f.bodyAngle);
  const cx=f.comX+r.x-f.pivot.x,cy=f.comY+r.y-f.pivot.y;
  const k11=invM+invI*r.y*r.y,k12=-invI*r.x*r.y,k22=invM+invI*r.x*r.x;
  const imp=solve22(k11,k12,k22,-cx,-cy);
  f.comX+=invM*imp.x;f.comY+=invM*imp.y;f.bodyAngle+=invI*cross(r,imp);
  return Math.hypot(cx,cy);
}
function solveFlipperPositionConstraintOnce(f){
  let angularError=0;
  const angle=jointAngleOf(f);
  if(f.jointState==='upper'){
    const C=clamp(angle-f.jointUpper-ANGULAR_SLOP,0,MAX_ANGULAR_CORRECTION);
    f.bodyAngle+=C;angularError=Math.abs(C);
  }else if(f.jointState==='lower'){
    const C=clamp(angle-f.jointLower+ANGULAR_SLOP,-MAX_ANGULAR_CORRECTION,0);
    f.bodyAngle+=C;angularError=Math.abs(C); // body A change is +C for this sign convention
  }
  const positionError=pointPositionSolve(f);
  return positionError<=LINEAR_SLOP&&angularError<=ANGULAR_SLOP;
}
function correctFlipperLimit(f){for(let i=0;i<POSITION_ITERATIONS;i++)solveFlipperPositionConstraintOnce(f);}
function updateFlipper(f,pressed,dt){commandFlipper(f,pressed);advanceFlipper(f,dt);}
function surfaceVelocityForFlipper(f,q){const r=v(q.x-f.comX,q.y-f.comY);return v(f.comVx-f.omega*r.y,f.comVy+f.omega*r.x);}

function makeBall(){return {x:.735,y:.0335,vx:0,vy:0,omega:0};}
function resetBall(ball){ball.x=.735;ball.y=.0335;ball.vx=0;ball.vy=0;ball.omega=0;}

function circleContact(ball,c){
  const d=v(ball.x-c.x,ball.y-c.y),dist=len(d),minD=BALL_R+c.r;
  if(dist>minD+CONTACT_EPS)return null;
  const n=dist>1e-12?mul(d,1/dist):v(0,1);
  return {normal:n,penetration:minD-dist,point:v(c.x+n.x*c.r,c.y+n.y*c.r),e:c.e??STEEL_E,mu:c.mu??MIXED_FRICTION,key:c.key,label:c.label};
}
function dynamicCircleContact(ball,c){
  const h=circleContact(ball,c);if(!h)return null;
  const ballSurface=sub(v(ball.x,ball.y),mul(h.normal,BALL_R));
  h.point=mul(add(h.point,ballSurface),.5);return h;
}
function polygonContact(ball,p){
  const hit=circlePolygonContact(v(ball.x,ball.y),BALL_R+POLYGON_RADIUS,p.points);
  if(!hit)return null;
  const core=hit.point,polySurface=add(core,mul(hit.normal,POLYGON_RADIUS));
  const ballSurface=sub(v(ball.x,ball.y),mul(hit.normal,BALL_R));
  const worldPoint=mul(add(polySurface,ballSurface),.5);
  return {...hit,point:worldPoint,e:p.e??STEEL_E,mu:p.mu??MIXED_FRICTION,key:p.key,label:p.label};
}
function contactRelVelocity(ball,c){
  const rb=sub(c.point,v(ball.x,ball.y));
  const vb=add(v(ball.vx,ball.vy),v(-ball.omega*rb.y,ball.omega*rb.x));
  if(!c.flipper)return vb;
  return sub(vb,surfaceVelocityForFlipper(c.flipper,c.point));
}
function contactMasses(ball,c){
  const rb=sub(c.point,v(ball.x,ball.y)),rnB=cross(rb,c.n),rtB=cross(rb,c.t);
  let kn=(1/BALL_MASS)+(rnB*rnB/BALL_INERTIA),kt=(1/BALL_MASS)+(rtB*rtB/BALL_INERTIA);
  if(c.flipper){
    const ra=sub(c.point,v(c.flipper.comX,c.flipper.comY));
    const rnA=cross(ra,c.n),rtA=cross(ra,c.t);
    kn+=(1/FLIPPER_MASS)+(rnA*rnA/FLIPPER_INERTIA_COM);
    kt+=(1/FLIPPER_MASS)+(rtA*rtA/FLIPPER_INERTIA_COM);
  }
  return {normalMass:kn>0?1/kn:0,tangentMass:kt>0?1/kt:0};
}
function applyConstraintImpulse(ball,c,dN,dT){
  const J=add(mul(c.n,dN),mul(c.t,dT));
  const rb=sub(c.point,v(ball.x,ball.y));
  ball.vx+=J.x/BALL_MASS;ball.vy+=J.y/BALL_MASS;ball.omega+=cross(rb,J)/BALL_INERTIA;
  if(c.flipper){
    const f=c.flipper,ra=sub(c.point,v(f.comX,f.comY));
    f.comVx-=J.x/FLIPPER_MASS;f.comVy-=J.y/FLIPPER_MASS;f.omega-=cross(ra,J)/FLIPPER_INERTIA_COM;
  }
}
function buildVelocityContacts(ball,geometry,flippers,oldStatic,oldDynamic,dtRatio){
  const contacts=[];
  function addContact(h,key,flipper,cache){
    if(!h)return;
    const n=h.normal,t=v(n.y,-n.x),rel=contactRelVelocity(ball,{point:h.point,n,t,flipper});
    const vn=dot(rel,n),mass=contactMasses(ball,{point:h.point,n,t,flipper});
    const prev=cache&&cache.get(key);let normalImpulse=0,tangentImpulse=0;
    if(prev&&dot(prev.normal,n)>.95){normalImpulse=dtRatio*prev.normalImpulse;tangentImpulse=dtRatio*prev.tangentImpulse;}
    contacts.push({key,label:h.label||key,n,t,point:h.point,e:h.e,mu:h.mu,flipper,normalMass:mass.normalMass,tangentMass:mass.tangentMass,velocityBias:vn<-.1?-h.e*vn:0,normalImpulse,tangentImpulse,dynamic:!!flipper});
  }
  for(const p of geometry.polygons)addContact(polygonContact(ball,p),p.key,null,oldStatic);
  for(const f of [flippers.left,flippers.right]){
    const sh=flipperWorldShape(f),base='fl-'+f.name+'-';
    addContact(polygonContact(ball,{points:sh.poly,e:STEEL_E,mu:MIXED_FRICTION,key:base+'poly'}),base+'poly',f,oldDynamic);
    addContact(dynamicCircleContact(ball,{...sh.pivot,e:STEEL_E,mu:MIXED_FRICTION,key:base+'pivot'}),base+'pivot',f,oldDynamic);
    addContact(dynamicCircleContact(ball,{...sh.tip,e:STEEL_E,mu:MIXED_FRICTION,key:base+'tip'}),base+'tip',f,oldDynamic);
  }
  return contacts;
}
function warmStartContacts(ball,contacts){for(const c of contacts)if(c.normalImpulse||c.tangentImpulse)applyConstraintImpulse(ball,c,c.normalImpulse,c.tangentImpulse);}
function solveContactsIteration(ball,contacts){
  for(const c of contacts){
    let rel=contactRelVelocity(ball,c),vt=dot(rel,c.t);let lambdaT=-c.tangentMass*vt;
    const maxF=c.mu*c.normalImpulse,oldT=c.tangentImpulse;c.tangentImpulse=clamp(oldT+lambdaT,-maxF,maxF);lambdaT=c.tangentImpulse-oldT;
    if(lambdaT)applyConstraintImpulse(ball,c,0,lambdaT);
    rel=contactRelVelocity(ball,c);const vn=dot(rel,c.n);let lambdaN=-c.normalMass*(vn-c.velocityBias);
    const oldN=c.normalImpulse;c.normalImpulse=Math.max(oldN+lambdaN,0);lambdaN=c.normalImpulse-oldN;
    if(lambdaN)applyConstraintImpulse(ball,c,lambdaN,0);
  }
}
function storeContactCaches(contacts){
  const s=new Map(),d=new Map();for(const c of contacts)(c.dynamic?d:s).set(c.key,{normal:c.n,normalImpulse:c.normalImpulse,tangentImpulse:c.tangentImpulse});return {static:s,dynamic:d};
}
function correctionAmount(pen){return clamp(BAUMGARTE*Math.max(0,pen-LINEAR_SLOP),0,MAX_LINEAR_CORRECTION);}
function correctStaticCirclePosition(ball,c){const h=circleContact(ball,c);if(!h)return false;const a=correctionAmount(h.penetration);ball.x+=h.normal.x*a;ball.y+=h.normal.y*a;return a>0;}
function correctStaticPolygonPosition(ball,p){const h=polygonContact(ball,p);if(!h)return false;const a=correctionAmount(h.penetration);ball.x+=h.normal.x*a;ball.y+=h.normal.y*a;return a>0;}
function correctDynamicHitWithFactor(ball,f,h,factor){
  if(!h)return false;
  const C=clamp(factor*Math.max(0,h.penetration-LINEAR_SLOP),0,MAX_LINEAR_CORRECTION);if(C<=0)return false;
  const n=h.normal,point=h.point,rb=sub(point,v(ball.x,ball.y)),ra=sub(point,v(f.comX,f.comY));
  const rnB=cross(rb,n),rnA=cross(ra,n);
  const K=(1/BALL_MASS)+(rnB*rnB/BALL_INERTIA)+(1/FLIPPER_MASS)+(rnA*rnA/FLIPPER_INERTIA_COM);
  const impulse=K>0?C/K:0,P=mul(n,impulse);
  ball.x+=P.x/BALL_MASS;ball.y+=P.y/BALL_MASS;
  f.comX-=P.x/FLIPPER_MASS;f.comY-=P.y/FLIPPER_MASS;f.bodyAngle-=cross(ra,P)/FLIPPER_INERTIA_COM;
  return true;
}
function correctDynamicHit(ball,f,h){return correctDynamicHitWithFactor(ball,f,h,BAUMGARTE);}
function correctDynamicFlipperContacts(ball,f){
  const sh=flipperWorldShape(f);let any=false;
  any=correctDynamicHit(ball,f,polygonContact(ball,{points:sh.poly,e:STEEL_E,mu:MIXED_FRICTION}))||any;
  any=correctDynamicHit(ball,f,dynamicCircleContact(ball,{...sh.pivot,e:STEEL_E,mu:MIXED_FRICTION}))||any;
  any=correctDynamicHit(ball,f,dynamicCircleContact(ball,{...sh.tip,e:STEEL_E,mu:MIXED_FRICTION}))||any;
  return any;
}
function resolveCircleCCD(ball,c,onContact){
  const h=circleContact(ball,c);if(!h)return false;if(onContact&&c.label)onContact(c.label);
  if(h.penetration>0){ball.x+=h.normal.x*h.penetration;ball.y+=h.normal.y*h.penetration;}
  // Static circle impact, single-point impulse. Bumpers are intentionally kept on this
  // dedicated CCD path because their historical trace is already near float precision.
  const n=h.normal,t=v(-n.y,n.x),rb=sub(h.point,v(ball.x,ball.y));
  let rel=add(v(ball.vx,ball.vy),v(-ball.omega*rb.y,ball.omega*rb.x)),vn=dot(rel,n);if(vn>=0)return true;
  const rn=cross(rb,n),invN=(1/BALL_MASS)+(rn*rn/BALL_INERTIA),ee=(-vn>.1)?h.e:0,jn=-(1+ee)*vn/invN;
  const rt=cross(rb,t),invT=(1/BALL_MASS)+(rt*rt/BALL_INERTIA);rel=add(v(ball.vx,ball.vy),v(-ball.omega*rb.y,ball.omega*rb.x));let jt=-dot(rel,t)/invT;jt=clamp(jt,-h.mu*Math.abs(jn),h.mu*Math.abs(jn));
  const J=add(mul(n,jn),mul(t,jt));ball.vx+=J.x/BALL_MASS;ball.vy+=J.y/BALL_MASS;ball.omega+=cross(rb,J)/BALL_INERTIA;return true;
}
function touchingCircle(ball,c,eps=CONTACT_EPS){return Math.hypot(ball.x-c.x,ball.y-c.y)<=BALL_R+c.r+eps;}
function touchingPolygon(ball,points,eps=CONTACT_EPS){return !!circlePolygonContact(v(ball.x,ball.y),BALL_R+POLYGON_RADIUS+eps,points);}

function featureKey(id){return `${id.indexA}/${id.indexB}/${id.typeA}/${id.typeB}`;}
function applyFlipperCornerImpulse(f,point,normal,tangent,dN,dT){
  const J=add(mul(normal,dN),mul(tangent,dT)),r=sub(point,v(f.comX,f.comY));
  f.comVx+=J.x/FLIPPER_MASS;f.comVy+=J.y/FLIPPER_MASS;f.omega+=cross(r,J)/FLIPPER_INERTIA_COM;
}
function buildFlipperCornerVelocityContact(f,corner,manifold,cache=null,dtRatio=0,warm=true){
  const wm=worldManifold(manifold,corner.xf,flipperXf(f));if(!wm)return null;
  const t=v(wm.normal.y,-wm.normal.x),points=[];
  for(let i=0;i<manifold.points.length;i++){
    const point=wm.points[i],r=sub(point,v(f.comX,f.comY));
    const rn=cross(r,wm.normal),rt=cross(r,t);
    const kN=1/FLIPPER_MASS+rn*rn/FLIPPER_INERTIA_COM,kT=1/FLIPPER_MASS+rt*rt/FLIPPER_INERTIA_COM;
    const vel=surfaceVelocityForFlipper(f,point),vn=dot(vel,wm.normal),key=featureKey(manifold.points[i].id);
    let normalImpulse=0,tangentImpulse=0;
    const prev=warm&&cache&&cache.get(key);
    if(prev&&dot(prev.normal,wm.normal)>.95){normalImpulse=dtRatio*prev.normalImpulse;tangentImpulse=dtRatio*prev.tangentImpulse;}
    points.push({point,key,normalMass:kN>0?1/kN:0,tangentMass:kT>0?1/kT:0,velocityBias:vn<-VELOCITY_THRESHOLD?-STEEL_E*vn:0,normalImpulse,tangentImpulse});
  }
  return {f,corner,manifold,normal:wm.normal,tangent:t,points,friction:FLIPPER_TABLE_FRICTION,restitution:STEEL_E};
}
function warmStartFlipperCornerContact(c){
  if(!c)return;for(const p of c.points)if(p.normalImpulse||p.tangentImpulse)applyFlipperCornerImpulse(c.f,p.point,c.normal,c.tangent,p.normalImpulse,p.tangentImpulse);
}
function solveFlipperCornerVelocity(c){
  if(!c)return;
  // b2ContactSolver solves friction before normal constraints.  The first M8
  // corner impact has one manifold point; scalar iteration is therefore the
  // exact historical branch for that contact.
  for(const p of c.points){
    let vel=surfaceVelocityForFlipper(c.f,p.point),lambdaT=-p.tangentMass*dot(vel,c.tangent);
    const maxF=c.friction*p.normalImpulse,oldT=p.tangentImpulse;p.tangentImpulse=clamp(oldT+lambdaT,-maxF,maxF);lambdaT=p.tangentImpulse-oldT;
    if(lambdaT)applyFlipperCornerImpulse(c.f,p.point,c.normal,c.tangent,0,lambdaT);
    vel=surfaceVelocityForFlipper(c.f,p.point);let lambdaN=-p.normalMass*(dot(vel,c.normal)-p.velocityBias);
    const oldN=p.normalImpulse;p.normalImpulse=Math.max(oldN+lambdaN,0);lambdaN=p.normalImpulse-oldN;
    if(lambdaN)applyFlipperCornerImpulse(c.f,p.point,c.normal,c.tangent,lambdaN,0);
  }
}
function storeFlipperCornerCache(c){
  const out=new Map();if(!c)return out;for(const p of c.points)out.set(p.key,{normal:c.normal,normalImpulse:p.normalImpulse,tangentImpulse:p.tangentImpulse});return out;
}
function solveFlipperCornerPosition(f,corner,manifold,factor){
  let minSeparation=0;
  for(let i=0;i<manifold.points.length;i++){
    const xfB=flipperXf(f),psm=positionSolverManifold(manifold,corner.xf,xfB,i);minSeparation=Math.min(minSeparation,psm.separation);
    const r=sub(psm.point,v(f.comX,f.comY)),rn=cross(r,psm.normal),K=1/FLIPPER_MASS+rn*rn/FLIPPER_INERTIA_COM;
    const C=clamp(factor*(psm.separation+LINEAR_SLOP),-MAX_LINEAR_CORRECTION,0),impulse=K>0?-C/K:0,P=mul(psm.normal,impulse);
    f.comX+=P.x/FLIPPER_MASS;f.comY+=P.y/FLIPPER_MASS;f.bodyAngle+=cross(r,P)/FLIPPER_INERTIA_COM;
  }
  return minSeparation;
}
function flipperCornerSeparation(f,corner,poly,sweep,alpha){
  const cx=sweep.c0x+(sweep.c1x-sweep.c0x)*alpha,cy=sweep.c0y+(sweep.c1y-sweep.c0y)*alpha,a=sweep.a0+(sweep.a1-sweep.a0)*alpha;
  const xfB=flipperXfFromSweep(f,cx,cy,a),sa=findMaxSeparation(corner.shape,corner.xf,poly,xfB).separation,sb=findMaxSeparation(poly,xfB,corner.shape,corner.xf).separation;
  return Math.max(sa,sb);
}
function findFlipperCornerTOI(f,corner,poly,sweep){
  const s0=flipperCornerSeparation(f,corner,poly,sweep,0);
  // b2TimeOfImpact distinguishes an overlapped core (no TOI solve) from a
  // separated core already within target+tolerance (touching at t=0).
  if(s0<=0)return null;
  if(s0<TOI_TARGET+TOI_TOLERANCE)return 0;
  let hi=1,sHi=flipperCornerSeparation(f,corner,poly,sweep,hi);
  if(sHi>TOI_TARGET+TOI_TOLERANCE){
    // A rotating polygon can enter and leave within one step.  Locate the first
    // bracket geometrically, then use the historical secant/bisection root loop.
    // This is only bracket discovery; the root itself is solved against the
    // Box2D target/tolerance below.
    let prevA=0,prevS=s0,found=false;
    for(let i=1;i<=32;i++){
      const a=i/32,s=flipperCornerSeparation(f,corner,poly,sweep,a);
      if(prevS>TOI_TARGET&&s<=TOI_TARGET+TOI_TOLERANCE){hi=a;sHi=s;found=true;break;}
      prevA=a;prevS=s;
    }
    if(!found)return null;
  }
  let lo=0,sLo=s0,root=hi;
  for(let i=0;i<50;i++){
    root=(i&1)?lo+(TOI_TARGET-sLo)*(hi-lo)/((sHi-sLo)||1e-20):(lo+hi)*.5;
    root=clamp(root,lo,hi);const s=flipperCornerSeparation(f,corner,poly,sweep,root);
    if(Math.abs(s-TOI_TARGET)<TOI_TOLERANCE)return root;
    if(s>TOI_TARGET){lo=root;sLo=s;}else{hi=root;sHi=s;}
  }
  return root;
}
function solveFlipperCornerTOI(f,corner,sweep,dt){
  const poly=flipperLocalPolygon(f),alpha=findFlipperCornerTOI(f,corner,poly,sweep);if(alpha==null)return null;
  // b2World::SolveTOI only selects a contact when its alpha is strictly below
  // the current minimum (initially 1).  A touching result at tMax therefore
  // does not create a second TOI island.
  if(alpha>=1-1e-12)return null;
  f.comX=sweep.c0x+(sweep.c1x-sweep.c0x)*alpha;f.comY=sweep.c0y+(sweep.c1y-sweep.c0y)*alpha;f.bodyAngle=sweep.a0+(sweep.a1-sweep.a0)*alpha;
  const manifold=collidePolygons(corner.shape,corner.xf,poly,flipperXf(f));if(!manifold)return null;
  const pre=worldManifold(manifold,corner.xf,flipperXf(f));
  let minSeparation=0,positionIterations=0;
  for(;positionIterations<TOI_POSITION_ITERATIONS;positionIterations++){
    minSeparation=solveFlipperCornerPosition(f,corner,manifold,TOI_BAUMGARTE);
    if(minSeparation>=-1.5*LINEAR_SLOP){positionIterations++;break;}
  }
  // TOI islands explicitly disable warm starting and contain contacts/bodies,
  // not the revolute joint.  Six velocity iterations therefore act only on
  // this contact for the isolated flipper/corner case.
  const contact=buildFlipperCornerVelocityContact(f,corner,manifold,null,0,false);
  for(let i=0;i<VELOCITY_ITERATIONS;i++)solveFlipperCornerVelocity(contact);
  const safe={comX:f.comX,comY:f.comY,angle:f.bodyAngle};
  const h=(1-alpha)*dt;f.comX+=f.comVx*h;f.comY+=f.comVy*h;f.bodyAngle+=f.omega*h;
  const post=worldManifold(manifold,corner.xf,flipperXf(f));
  return {alpha,manifold,pre,post,contact,minSeparation,positionIterations,safe,h};
}


function pointPolygonDistanceFeature(poly,xf,point){
  const verts=poly.vertices.map(q=>xfPoint(xf,q));
  if(pointInPolygon(point,verts))return {distance:0,type:'overlap',verts};
  let best=Infinity,feature=null;
  for(let i=0;i<verts.length;i++){
    const a=verts[i],b=verts[(i+1)%verts.length],ab=sub(b,a),den=dot(ab,ab);
    const raw=den>0?dot(sub(point,a),ab)/den:0,t=clamp(raw,0,1),q=add(a,mul(ab,t)),d=len(sub(point,q));
    if(d<best){
      best=d;
      if(t>1e-7&&t<1-1e-7)feature={type:'face',edge:i,point:q};
      else feature={type:'vertex',index:t<=.5?i:(i+1)%verts.length,point:t<=.5?a:b};
    }
  }
  return {distance:best,...feature,verts};
}
function findBallPolygonTOI(poly,xf,sweep){
  const pointAt=a=>v(sweep.c0x+(sweep.c1x-sweep.c0x)*a,sweep.c0y+(sweep.c1y-sweep.c0y)*a),target=BALL_POLYGON_TOI_TARGET,tol=TOI_TOLERANCE;
  let t1=0;
  for(let outer=0;outer<20;outer++){
    const p1=pointAt(t1),feat=pointPolygonDistanceFeature(poly,xf,p1);
    if(feat.distance<=0)return null;
    if(feat.distance<target+tol)return t1;
    let sepAt;
    if(feat.type==='face'){
      const a=xfPoint(xf,poly.vertices[feat.edge]),b=xfPoint(xf,poly.vertices[(feat.edge+1)%poly.vertices.length]);
      let axis=xfVector(xf,poly.normals[feat.edge]),mid=mul(add(a,b),.5);
      if(dot(sub(p1,mid),axis)<0)axis=mul(axis,-1);
      sepAt=t=>dot(sub(pointAt(t),mid),axis);
    }else{
      const axis0=sub(p1,feat.point),dl=len(axis0);if(dl<=1e-15)return null;const axis=mul(axis0,1/dl);
      let support=feat.verts[0],sd=dot(support,axis);
      for(const q of feat.verts){const d=dot(q,axis);if(d>sd){sd=d;support=q;}}
      sepAt=t=>dot(sub(pointAt(t),support),axis);
    }
    let t2=1,s2=sepAt(t2);
    if(s2>target+tol)return null;
    if(s2>target-tol){t1=t2;continue;}
    let s1=sepAt(t1);
    if(s1<target-tol)return null;
    if(s1<=target+tol)return t1;
    let a1=t1,a2=t2,root=t2;
    for(let i=0;i<50;i++){
      root=(i&1)?a1+(target-s1)*(a2-a1)/((s2-s1)||1e-20):.5*(a1+a2);
      root=clamp(root,a1,a2);const ss=sepAt(root);
      if(Math.abs(ss-target)<tol){t2=root;break;}
      if(ss>target){a1=root;s1=ss;}else{a2=root;s2=ss;}
      t2=root;
    }
    if(t2<=t1+1e-12)return t1;
    t1=t2;
  }
  return t1;
}
function solveBallPolygonTOI(ball,p,sweep,dt,options={}){
  const shape=makePolygonShape(p.points),xf=makeXf(v(0,0),0),alpha=findBallPolygonTOI(shape,xf,sweep);
  if(alpha==null||alpha>=1-1e-12)return null;
  ball.x=sweep.c0x+(sweep.c1x-sweep.c0x)*alpha;ball.y=sweep.c0y+(sweep.c1y-sweep.c0y)*alpha;
  const manifold=collidePolygonCircle(shape,xf,v(ball.x,ball.y),BALL_R);if(!manifold)return null;
  const circleXf=()=>makeXf(v(ball.x,ball.y),0),pre=worldManifold(manifold,xf,circleXf());
  let minSeparation=0,positionIterations=0;
  if(options.scaledFloatPosition){
    const f32=Math.fround,scaledNormal=v(f32(manifold.localNormal.x),f32(manifold.localNormal.y));
    const scaledPlane=v(f32(manifold.localPoint.x*SCALE),f32(manifold.localPoint.y*SCALE));
    const scaledRadius=f32((manifold.radiusA+manifold.radiusB)*SCALE),scaledSlop=f32(LINEAR_SLOP*SCALE);
    const scaledMaxCorrection=f32(MAX_LINEAR_CORRECTION*SCALE),scaledStop=f32(-1.5*LINEAR_SLOP*SCALE);
    let scaledX=f32(ball.x*SCALE),scaledY=f32(ball.y*SCALE);
    for(;positionIterations<TOI_POSITION_ITERATIONS;positionIterations++){
      const dx=f32(scaledX-scaledPlane.x),dy=f32(scaledY-scaledPlane.y);
      const d=f32(f32(dx*scaledNormal.x)+f32(dy*scaledNormal.y));
      const scaledSeparation=f32(d-scaledRadius);minSeparation=scaledSeparation/SCALE;
      let C=f32(f32(TOI_BAUMGARTE)*f32(scaledSeparation+scaledSlop));
      C=f32(Math.max(-scaledMaxCorrection,Math.min(0,C)));
      scaledX=f32(scaledX+f32(-C*scaledNormal.x));scaledY=f32(scaledY+f32(-C*scaledNormal.y));
      ball.x=scaledX/SCALE;ball.y=scaledY/SCALE;
      if(scaledSeparation>=scaledStop){positionIterations++;break;}
    }
  }else{
    for(;positionIterations<TOI_POSITION_ITERATIONS;positionIterations++){
      const psm=positionSolverManifold(manifold,xf,circleXf(),0);minSeparation=psm.separation;
      const r=sub(psm.point,v(ball.x,ball.y)),rn=cross(r,psm.normal),K=1/BALL_MASS+rn*rn/BALL_INERTIA;
      const C=clamp(TOI_BAUMGARTE*(psm.separation+LINEAR_SLOP),-MAX_LINEAR_CORRECTION,0),impulse=K>0?-C/K:0,P=mul(psm.normal,impulse);
      ball.x+=P.x/BALL_MASS;ball.y+=P.y/BALL_MASS;
      if(Math.fround(minSeparation)>=Math.fround(-1.5*LINEAR_SLOP)){positionIterations++;break;}
    }
  }
  const wm=worldManifold(manifold,xf,circleXf()),n=wm.normal,t=v(n.y,-n.x),point=wm.points[0],rb=sub(point,v(ball.x,ball.y));
  const rn=cross(rb,n),rt=cross(rb,t),normalMass=1/(1/BALL_MASS+rn*rn/BALL_INERTIA),tangentMass=1/(1/BALL_MASS+rt*rt/BALL_INERTIA);
  const rel0=add(v(ball.vx,ball.vy),v(-ball.omega*rb.y,ball.omega*rb.x)),vn0=dot(rel0,n),velocityBias=vn0<-VELOCITY_THRESHOLD?-(p.e??STEEL_E)*vn0:0;
  let normalImpulse=0,tangentImpulse=0;
  const apply=(dN,dT)=>{const J=add(mul(n,dN),mul(t,dT)),r=sub(point,v(ball.x,ball.y));ball.vx+=J.x/BALL_MASS;ball.vy+=J.y/BALL_MASS;ball.omega+=cross(r,J)/BALL_INERTIA;};
  for(let i=0;i<VELOCITY_ITERATIONS;i++){
    let r=sub(point,v(ball.x,ball.y)),rel=add(v(ball.vx,ball.vy),v(-ball.omega*r.y,ball.omega*r.x));
    let lambdaT=-tangentMass*dot(rel,t),maxF=(p.mu??MIXED_FRICTION)*normalImpulse,oldT=tangentImpulse;tangentImpulse=clamp(oldT+lambdaT,-maxF,maxF);lambdaT=tangentImpulse-oldT;if(lambdaT)apply(0,lambdaT);
    r=sub(point,v(ball.x,ball.y));rel=add(v(ball.vx,ball.vy),v(-ball.omega*r.y,ball.omega*r.x));let lambdaN=-normalMass*(dot(rel,n)-velocityBias),oldN=normalImpulse;normalImpulse=Math.max(oldN+lambdaN,0);lambdaN=normalImpulse-oldN;if(lambdaN)apply(lambdaN,0);
  }
  const safe={x:ball.x,y:ball.y,vx:ball.vx,vy:ball.vy,omega:ball.omega};
  const h=(1-alpha)*dt;ball.x+=ball.vx*h;ball.y+=ball.vy*h;
  const post=worldManifold(manifold,xf,circleXf());
  return {alpha,manifold,pre,post,normal:n,tangent:t,point,normalImpulse,tangentImpulse,minSeparation,positionIterations,safe,h};
}

// M13.11 experimental, bounded two-wall CCD inside the genuine launcher corridor.
// Both real Box2D rectangles participate; do not use a one-sided TOI that
// advances the ball through the other wall using an obsolete velocity.
function solveBallLaneCoupledTOI(ball,divider,outer,start,dt){
  if(!(dt>0)||!divider||!outer||!(start.y>.055&&start.y<1.065)||
     !(start.x>=.732&&start.x<=.738)||!(Math.abs(start.vx)>.015))return null;
  let remaining=dt,events=[],x=start.x,y=start.y,vx=start.vx,vy=start.vy,omega=start.omega;
  const shapeD=makePolygonShape(divider.points),shapeR=makePolygonShape(outer.points),xf=makeXf(v(0,0),0);
  // The legacy polygon root finder needs an end-point before the ball has
  // already crossed a *whole* wall. Bracket using short swept segments even
  // for rare high-speed bumper impulses; a single giant sweep can miss both.
  // No reflection/position clamping: every bounce goes through the original
  // polygon TOI contact impulse solver, for both genuine static fixtures.
  for(let iteration=0;iteration<512&&remaining>1e-8;iteration++){
    const segmentDt=Math.min(remaining,.006/Math.max(.015,Math.abs(vx)));
    const sweep={c0x:x,c0y:y,c1x:x+vx*segmentDt,c1y:y+vy*segmentDt};
    const candidates=[];
    if(vx<-.015){const alpha=findBallPolygonTOI(shapeD,xf,sweep);if(alpha!=null&&alpha<1-1e-12)candidates.push({p:divider,alpha});}
    if(vx>.015){const alpha=findBallPolygonTOI(shapeR,xf,sweep);if(alpha!=null&&alpha<1-1e-12)candidates.push({p:outer,alpha});}
    if(!candidates.length){x=sweep.c1x;y=sweep.c1y;remaining-=segmentDt;continue;}
    candidates.sort((a,b)=>a.alpha-b.alpha);
    const c=candidates[0],oldRemaining=remaining;
    Object.assign(ball,{x,y,vx,vy,omega});
    const hit=solveBallPolygonTOI(ball,c.p,sweep,segmentDt);
    if(!hit||!Number.isFinite(ball.vx)||!Number.isFinite(ball.x))return null;
    events.push({label:c.p.label,alpha:c.alpha,normalImpulse:hit.normalImpulse});
    Object.assign(ball,hit.safe);
    ({x,y,vx,vy,omega}=ball);
    remaining=oldRemaining-segmentDt*c.alpha;
    if(c.alpha<=1e-9&&Math.abs(vx)<.015){x+=vx*remaining;y+=vy*remaining;remaining=0;break;}
  }
  if(remaining>1e-8){
    // Event budget exhausted; surface the state to tests rather than silently
    // declaring containment or teleporting the ball to the middle of the lane.
    return {events,exhausted:true};
  }
  Object.assign(ball,{x,y,vx,vy,omega});
  return {events,exhausted:false};
}

function solveBallTopCurveTOI(ball,polygons,sweep,dt,regularLabels=[],maxAlpha=1){
  // Only sweep polygons in reach.  This includes newly born curve contacts
  // (the M13.9 path looked solely at contacts already touching at frame start).
  const pad=BALL_R+POLYGON_RADIUS+LINEAR_SLOP;
  const minX=Math.min(sweep.c0x,sweep.c1x)-pad,maxX=Math.max(sweep.c0x,sweep.c1x)+pad;
  const minY=Math.min(sweep.c0y,sweep.c1y)-pad,maxY=Math.max(sweep.c0y,sweep.c1y)+pad;
  if(minY>1.41||maxY<1.08)return null;
  const curves=polygons.filter(p=>{
    if(p.kind!=='top-right-curve'&&p.kind!=='top-left-curve')return false;
    let bb=p._curveCcdBounds;
    if(!bb){bb={minX:Math.min(...p.points.map(v=>v.x)),maxX:Math.max(...p.points.map(v=>v.x)),minY:Math.min(...p.points.map(v=>v.y)),maxY:Math.max(...p.points.map(v=>v.y))};p._curveCcdBounds=bb;}
    return minX<=bb.maxX&&maxX>=bb.minX&&minY<=bb.maxY&&maxY>=bb.minY;
  });
  if(!curves.length)return null;
  let seed=null,minAlpha=1;
  for(const p of curves){const shape=makePolygonShape(p.points),xf=makeXf(v(0,0),0),alpha=findBallPolygonTOI(shape,xf,sweep);if(alpha!=null&&alpha<minAlpha){minAlpha=alpha;seed={p,shape,xf,alpha};}}
  if(!seed||minAlpha>=maxAlpha-1e-8||minAlpha>=1-1e-12)return null;
  ball.x=sweep.c0x+(sweep.c1x-sweep.c0x)*minAlpha;ball.y=sweep.c0y+(sweep.c1y-sweep.c0y)*minAlpha;
  const byLabel=new Map(curves.map(p=>[p.label,p])),ordered=[];
  const add=p=>{if(!p||ordered.some(x=>x.p===p))return;const shape=makePolygonShape(p.points),xf=makeXf(v(0,0),0),manifold=collidePolygonCircle(shape,xf,v(ball.x,ball.y),BALL_R);if(manifold)ordered.push({p,shape,xf,manifold});};
  add(seed.p);for(const label of regularLabels)add(byLabel.get(label));for(const p of curves)add(p);if(!ordered.length)return null;
  const circleXf=()=>makeXf(v(ball.x,ball.y),0),pre=ordered.map(c=>({label:c.p.label,wm:worldManifold(c.manifold,c.xf,circleXf())}));
  let minSeparation=0,positionIterations=0;
  for(;positionIterations<TOI_POSITION_ITERATIONS;positionIterations++){
    minSeparation=0;
    for(const c of ordered){const q=positionSolverManifold(c.manifold,c.xf,circleXf(),0);minSeparation=Math.min(minSeparation,q.separation);const r=sub(q.point,v(ball.x,ball.y)),rn=cross(r,q.normal),K=1/BALL_MASS+rn*rn/BALL_INERTIA;const C=clamp(TOI_BAUMGARTE*(q.separation+LINEAR_SLOP),-MAX_LINEAR_CORRECTION,0),impulse=K>0?-C/K:0,P=mul(q.normal,impulse);ball.x+=P.x/BALL_MASS;ball.y+=P.y/BALL_MASS;}
    if(minSeparation>=-1.5*LINEAR_SLOP){positionIterations++;break;}
  }
  const velocityContacts=ordered.map(c=>{const wm=worldManifold(c.manifold,c.xf,circleXf()),n=wm.normal,t=v(n.y,-n.x),point=wm.points[0],rel=contactRelVelocity(ball,{point,n,t,flipper:null}),vn=dot(rel,n),mass=contactMasses(ball,{point,n,t,flipper:null});return {key:c.p.key,label:c.p.label,n,t,point,e:c.p.e??STEEL_E,mu:c.p.mu??MIXED_FRICTION,flipper:null,normalMass:mass.normalMass,tangentMass:mass.tangentMass,velocityBias:vn<-VELOCITY_THRESHOLD?-(c.p.e??STEEL_E)*vn:0,normalImpulse:0,tangentImpulse:0,dynamic:false};});
  for(let i=0;i<VELOCITY_ITERATIONS;i++)solveContactsIteration(ball,velocityContacts);
  const safe={x:ball.x,y:ball.y,vx:ball.vx,vy:ball.vy,omega:ball.omega},h=(1-minAlpha)*dt;ball.x+=ball.vx*h;ball.y+=ball.vy*h;
  const post=ordered.map((c,i)=>({label:c.p.label,wm:worldManifold(c.manifold,c.xf,circleXf()),normalImpulse:velocityContacts[i].normalImpulse,tangentImpulse:velocityContacts[i].tangentImpulse}));
  return {alpha:minAlpha,seed:seed.p.label,contacts:ordered.map(c=>c.p.label),pre,post,positionIterations,minSeparation,safe,h};
}

function findBallCircleTOI(c,sweep){
  const p0=v(sweep.c0x,sweep.c0y),axis0=sub(p0,v(c.x,c.y)),d0=len(axis0);if(d0<=0)return null;
  const axis=mul(axis0,1/d0),target=Math.max(LINEAR_SLOP,BALL_R+c.r-3*LINEAR_SLOP);
  if(d0<target+TOI_TOLERANCE)return 0;
  const sepAt=a=>dot(sub(v(sweep.c0x+(sweep.c1x-sweep.c0x)*a,sweep.c0y+(sweep.c1y-sweep.c0y)*a),v(c.x,c.y)),axis);
  let s1=d0,s2=sepAt(1);if(s2>target+TOI_TOLERANCE)return null;if(s2>target-TOI_TOLERANCE)return 1;
  let a1=0,a2=1,root=1;for(let i=0;i<50;i++){root=(i&1)?a1+(target-s1)*(a2-a1)/((s2-s1)||1e-20):.5*(a1+a2);root=clamp(root,a1,a2);const ss=sepAt(root);if(Math.abs(ss-target)<TOI_TOLERANCE)return root;if(ss>target){a1=root;s1=ss;}else{a2=root;s2=ss;}}return root;
}
function circleCircleWorldManifold(ball,c){const d=sub(v(ball.x,ball.y),v(c.x,c.y)),dist=len(d),normal=dist>1e-12?mul(d,1/dist):v(1,0);const a=add(v(c.x,c.y),mul(normal,c.r)),b=sub(v(ball.x,ball.y),mul(normal,BALL_R));return {normal,points:[mul(add(a,b),.5)],separation:dist-c.r-BALL_R};}
function solveBallSlingTOI(ball,geometry,sweep,dt){
  const corners=geometry.circles.filter(c=>c.kind==='sling-corner'),reactives=geometry.polygons.filter(p=>p.kind==='sling-reactive');let seed=null,minAlpha=1;
  for(const c of corners){const a=findBallCircleTOI(c,sweep);if(a!=null&&a<minAlpha){minAlpha=a;seed={shape:'circle',fixture:c,id:c.id,label:c.label};}}
  for(const p of reactives){const shape=makePolygonShape(p.points),xf=makeXf(v(0,0),0),a=findBallPolygonTOI(shape,xf,sweep);if(a!=null&&a<minAlpha){minAlpha=a;seed={shape:'polygon',fixture:p,id:p.id,label:p.label,polyShape:shape,xf};}}
  if(!seed||minAlpha>=1-1e-12)return null;
  ball.x=sweep.c0x+(sweep.c1x-sweep.c0x)*minAlpha;ball.y=sweep.c0y+(sweep.c1y-sweep.c0y)*minAlpha;
  const contacts=[];
  function addCircle(c){const wm=circleCircleWorldManifold(ball,c);if(wm.separation>0)return;contacts.push({shape:'circle',fixture:c,label:c.label,e:c.e??STEEL_E,mu:c.mu??MIXED_FRICTION,pre:{normal:v(wm.normal.x,wm.normal.y),points:wm.points.map(q=>v(q.x,q.y))}});}
  function addPolygon(poly,knownShape=null,knownXf=null){const shape=knownShape||makePolygonShape(poly.points),xf=knownXf||makeXf(v(0,0),0),manifold=collidePolygonCircle(shape,xf,v(ball.x,ball.y),BALL_R);if(!manifold)return;const wm=worldManifold(manifold,xf,makeXf(v(ball.x,ball.y),0));contacts.push({shape:'polygon',fixture:poly,label:poly.label,e:poly.e??STEEL_E,mu:poly.mu??MIXED_FRICTION,polyShape:shape,xf,manifold,pre:wm});}
  if(seed.shape==='circle')addCircle(seed.fixture);else addPolygon(seed.fixture,seed.polyShape,seed.xf);
  for(const p of geometry.polygons)if(p.id===seed.id&&(p.kind==='sling-reactive'||p.kind==='sling-side')&&p!==seed.fixture)addPolygon(p);
  for(const c of corners)if(c.id===seed.id&&c!==seed.fixture)addCircle(c);
  let minSeparation=0,positionIterations=0;
  for(;positionIterations<TOI_POSITION_ITERATIONS;positionIterations++){
    minSeparation=0;
    for(const c of contacts){let normal,separation;if(c.shape==='circle'){const wm=circleCircleWorldManifold(ball,c.fixture);normal=wm.normal;separation=wm.separation;}else{const q=positionSolverManifold(c.manifold,c.xf,makeXf(v(ball.x,ball.y),0),0);normal=q.normal;separation=q.separation;}minSeparation=Math.min(minSeparation,separation);const C=clamp(TOI_BAUMGARTE*(separation+LINEAR_SLOP),-MAX_LINEAR_CORRECTION,0),impulse=-C*BALL_MASS,P=mul(normal,impulse);ball.x+=P.x/BALL_MASS;ball.y+=P.y/BALL_MASS;}
    if(minSeparation>=-1.5*LINEAR_SLOP){positionIterations++;break;}
  }
  const vcs=[];
  for(const c of contacts){const wm=c.shape==='circle'?circleCircleWorldManifold(ball,c.fixture):worldManifold(c.manifold,c.xf,makeXf(v(ball.x,ball.y),0)),n=wm.normal,t=v(n.y,-n.x),point=wm.points[0],rb=sub(point,v(ball.x,ball.y));const rn=cross(rb,n),rt=cross(rb,t),normalMass=1/(1/BALL_MASS+rn*rn/BALL_INERTIA),tangentMass=1/(1/BALL_MASS+rt*rt/BALL_INERTIA);const rel0=add(v(ball.vx,ball.vy),v(-ball.omega*rb.y,ball.omega*rb.x)),vn0=dot(rel0,n),velocityBias=vn0<-VELOCITY_THRESHOLD?-c.e*vn0:0;vcs.push({key:c.label,label:c.label,n,t,point,e:c.e,mu:c.mu,flipper:null,normalMass,tangentMass,velocityBias,normalImpulse:0,tangentImpulse:0,dynamic:false,_source:c});}
  for(let i=0;i<VELOCITY_ITERATIONS;i++)solveContactsIteration(ball,vcs);
  const safe={x:ball.x,y:ball.y,vx:ball.vx,vy:ball.vy,omega:ball.omega},h=(1-minAlpha)*dt;ball.x+=ball.vx*h;ball.y+=ball.vy*h;
  const outContacts=vcs.map(vc=>{const c=vc._source,post=c.shape==='circle'?circleCircleWorldManifold(ball,c.fixture):worldManifold(c.manifold,c.xf,makeXf(v(ball.x,ball.y),0));return {label:c.label,shape:c.shape,pre:c.pre,post,normalImpulse:vc.normalImpulse,tangentImpulse:vc.tangentImpulse,manifold:c.manifold||null};});
  return {alpha:minAlpha,seed:seed.label,contacts:outContacts,minSeparation,positionIterations,safe,h};
}

function dynamicCircleCenterAt(f,sweep,localPoint,alpha){const cx=sweep.c0x+(sweep.c1x-sweep.c0x)*alpha,cy=sweep.c0y+(sweep.c1y-sweep.c0y)*alpha,a=sweep.a0+(sweep.a1-sweep.a0)*alpha;return xfPoint(flipperXfFromSweep(f,cx,cy,a),localPoint);}
function findBallDynamicCircleTOI(f,flipperSweep,ballSweep,localPoint,radius){
  const target=Math.max(LINEAR_SLOP,BALL_R+radius-3*LINEAR_SLOP),tol=TOI_TOLERANCE,ballAt=a=>v(ballSweep.c0x+(ballSweep.c1x-ballSweep.c0x)*a,ballSweep.c0y+(ballSweep.c1y-ballSweep.c0y)*a),deltaAt=a=>sub(ballAt(a),dynamicCircleCenterAt(f,flipperSweep,localPoint,a));let t1=0;
  for(let outer=0;outer<20;outer++){const d1=deltaAt(t1),distance=len(d1);if(distance<=0)return null;if(distance<target+tol)return t1;const axis=mul(d1,1/distance);let t2=1,done=false;for(let push=0;push<8;push++){let s2=dot(deltaAt(t2),axis);if(s2>target+tol)return null;if(s2>target-tol){t1=t2;done=true;break;}let s1=dot(deltaAt(t1),axis);if(s1<target-tol)return null;if(s1<=target+tol)return t1;let a1=t1,a2=t2;for(let i=0;i<50;i++){const root=(i&1)?a1+(target-s1)*(a2-a1)/((s2-s1)||1e-20):.5*(a1+a2),ss=dot(deltaAt(root),axis);if(Math.abs(ss-target)<tol){t2=root;break;}if(ss>target){a1=root;s1=ss;}else{a2=root;s2=ss;}}}if(!done&&t1>=1-1e-12)return null;}return t1;
}
// Continuous distance-based TOI for a circle against a swept flipper polygon.
// The closing-speed bound is geometric (linear motion plus radius * angle
// change), not an empirical frame/impulse correction. A circle must begin
// outside the polygon's TOI target to seed a newly born contact.
function findBallDynamicPolygonTOI(f,flipperSweep,ballSweep){
  const shape=flipperLocalPolygon(f),target=BALL_POLYGON_TOI_TARGET;
  const distanceAt=alpha=>{
    const angle=flipperSweep.a0+(flipperSweep.a1-flipperSweep.a0)*alpha;
    const comX=flipperSweep.c0x+(flipperSweep.c1x-flipperSweep.c0x)*alpha;
    const comY=flipperSweep.c0y+(flipperSweep.c1y-flipperSweep.c0y)*alpha;
    const xf=flipperXfFromSweep(f,comX,comY,angle);
    const point=v(ballSweep.c0x+(ballSweep.c1x-ballSweep.c0x)*alpha,
                  ballSweep.c0y+(ballSweep.c1y-ballSweep.c0y)*alpha);
    return pointPolygonDistanceFeature(shape,xf,point).distance;
  };
  const initial=distanceAt(0);
  if(initial<=target)return null;
  const relativeTravel=len(v(ballSweep.c1x-ballSweep.c0x-(flipperSweep.c1x-flipperSweep.c0x),
                             ballSweep.c1y-ballSweep.c0y-(flipperSweep.c1y-flipperSweep.c0y)));
  const angularTravel=Math.abs(flipperSweep.a1-flipperSweep.a0);
  const radius=Math.max(...shape.vertices.map(p=>len(sub(p,v(f.localCenter,0)))));
  const speedBound=relativeTravel+angularTravel*radius;
  if(speedBound<=0)return null;
  let t=0,d=initial;
  // Conservative advancement cannot skip the first contact even if the
  // closest polygon feature changes during the sweep.
  for(let iteration=0;iteration<128;iteration++){
    const remaining=d-target;
    if(remaining<=1e-12)return t;
    const next=Math.min(1,t+remaining/speedBound);
    if(next<=t)return t;
    const nextDistance=distanceAt(next);
    if(nextDistance<=target){
      let lo=t,hi=next;
      for(let i=0;i<52;i++){
        const mid=(lo+hi)*.5;
        if(distanceAt(mid)>target)lo=mid;else hi=mid;
      }
      return (lo+hi)*.5;
    }
    if(next===1)return null;
    t=next;d=nextDistance;
  }
  return null;
}
function solveBallFlipperTOI(ball,f,ballSweep,flipperSweep,dt){
  const s=f.localSign,pivot={label:`flipper-${f.name}:pivot`,type:'circle',local:v(0,0),r:.02},tip={label:`flipper-${f.name}:tip`,type:'circle',local:v(s*.11,0),r:.01};let seed=null,minAlpha=1;
  for(const c of [pivot,tip]){const a=findBallDynamicCircleTOI(f,flipperSweep,ballSweep,c.local,c.r);if(a!=null&&a<minAlpha){minAlpha=a;seed=c;}}
  const polygonAlpha=findBallDynamicPolygonTOI(f,flipperSweep,ballSweep);
  if(polygonAlpha!=null&&polygonAlpha<minAlpha){minAlpha=polygonAlpha;seed={label:`flipper-${f.name}:poly`,type:'polygon'};}
  if(!seed||minAlpha>=1-1e-12)return null;
  ball.x=ballSweep.c0x+(ballSweep.c1x-ballSweep.c0x)*minAlpha;ball.y=ballSweep.c0y+(ballSweep.c1y-ballSweep.c0y)*minAlpha;
  f.comX=flipperSweep.c0x+(flipperSweep.c1x-flipperSweep.c0x)*minAlpha;f.comY=flipperSweep.c0y+(flipperSweep.c1y-flipperSweep.c0y)*minAlpha;f.bodyAngle=flipperSweep.a0+(flipperSweep.a1-flipperSweep.a0)*minAlpha;
  const localPoly=flipperLocalPolygon(f),polyManifold=collidePolygonCircle(localPoly,flipperXf(f),v(ball.x,ball.y),BALL_R);
  const contacts=[];
  if(seed.type==='polygon'){
    if(!polyManifold)return null;
    contacts.push({...seed,manifold:polyManifold});
  }else{
    contacts.push(seed);
    if(polyManifold)contacts.push({label:`flipper-${f.name}:poly`,type:'polygon',manifold:polyManifold});
    const otherCircle=seed===pivot?tip:pivot,oc=dynamicCircleCenterAt(f,{c0x:f.comX,c0y:f.comY,a0:f.bodyAngle,c1x:f.comX,c1y:f.comY,a1:f.bodyAngle},otherCircle.local,0);
    if(len(sub(v(ball.x,ball.y),oc))<=BALL_R+otherCircle.r+CONTACT_EPS)contacts.push(otherCircle);
  }
  const ballXf=()=>makeXf(v(ball.x,ball.y),0),flXf=()=>flipperXf(f);
  const circlePSM=c=>{const a=xfPoint(flXf(),c.local),b=v(ball.x,ball.y),d=sub(b,a),L=len(d),normal=L>1e-12?mul(d,1/L):v(1,0);return {normal,point:mul(add(a,b),.5),separation:L-c.r-BALL_R};};
  const circleWM=c=>{const a=xfPoint(flXf(),c.local),b=v(ball.x,ball.y),d=sub(b,a),L=len(d),normal=L>1e-12?mul(d,1/L):v(1,0),pa=add(a,mul(normal,c.r)),pb=sub(b,mul(normal,BALL_R));return {normal,point:mul(add(pa,pb),.5)};};
  const psm=c=>c.type==='circle'?circlePSM(c):positionSolverManifold(c.manifold,flXf(),ballXf(),0),wm=c=>c.type==='circle'?circleWM(c):(()=>{const w=worldManifold(c.manifold,flXf(),ballXf());return {normal:w.normal,point:w.points[0]};})(),pre=contacts.map(c=>({label:c.label,...wm(c)}));
  let minSeparation=0,positionIterations=0;
  for(;positionIterations<TOI_POSITION_ITERATIONS;positionIterations++){
    minSeparation=0;for(const c of contacts){const q=psm(c);minSeparation=Math.min(minSeparation,q.separation);const ra=sub(q.point,v(f.comX,f.comY)),rb=sub(q.point,v(ball.x,ball.y)),rnA=cross(ra,q.normal),rnB=cross(rb,q.normal),K=1/FLIPPER_MASS+rnA*rnA/FLIPPER_INERTIA_COM+1/BALL_MASS+rnB*rnB/BALL_INERTIA,C=clamp(TOI_BAUMGARTE*(q.separation+LINEAR_SLOP),-MAX_LINEAR_CORRECTION,0),impulse=K>0?-C/K:0,P=mul(q.normal,impulse);f.comX-=P.x/FLIPPER_MASS;f.comY-=P.y/FLIPPER_MASS;f.bodyAngle-=cross(ra,P)/FLIPPER_INERTIA_COM;ball.x+=P.x/BALL_MASS;ball.y+=P.y/BALL_MASS;}
    if(minSeparation>=-1.5*LINEAR_SLOP){positionIterations++;break;}
  }
  const vcs=contacts.map(c=>{const q=wm(c),n=q.normal,t=v(n.y,-n.x),rel=contactRelVelocity(ball,{point:q.point,n,t,flipper:f}),vn=dot(rel,n),mass=contactMasses(ball,{point:q.point,n,t,flipper:f});return {key:c.label,label:c.label,n,t,point:q.point,e:STEEL_E,mu:MIXED_FRICTION,flipper:f,normalMass:mass.normalMass,tangentMass:mass.tangentMass,velocityBias:vn<-VELOCITY_THRESHOLD?-STEEL_E*vn:0,normalImpulse:0,tangentImpulse:0,dynamic:true,_source:c};});
  for(let i=0;i<VELOCITY_ITERATIONS;i++)solveContactsIteration(ball,vcs);
  const safe={ball:{x:ball.x,y:ball.y,vx:ball.vx,vy:ball.vy,omega:ball.omega},flipper:{comX:f.comX,comY:f.comY,angle:f.bodyAngle,vx:f.comVx,vy:f.comVy,omega:f.omega}},h=(1-minAlpha)*dt;ball.x+=ball.vx*h;ball.y+=ball.vy*h;f.comX+=f.comVx*h;f.comY+=f.comVy*h;f.bodyAngle+=f.omega*h;
  const post=vcs.map(vc=>{const q=wm(vc._source);return {label:vc.label,normal:q.normal,point:q.point,normalImpulse:vc.normalImpulse,tangentImpulse:vc.tangentImpulse};});return {alpha:minAlpha,seed:seed.label,pre,post,positionIterations,minSeparation,safe,h};
}

class Engine{
  constructor(playfield){
    this.pf=playfield;this.geometry=makeGeometry(playfield);this.ball=makeBall();this.flippers=makeFlippers();
    this.lastPlunge=-Infinity;this.bumperContacts=new Set();this.slingContacts=new Set();this.drainLatched=false;this.pendingReactive=v(0,0);
    this.staticContactCache=new Map();this.dynamicContactCache=new Map();this.previousDt=0;
    this.flipperCorners={left:flipperCornerDef(this.flippers.left),right:flipperCornerDef(this.flippers.right)};
    this.flipperCornerCaches={left:new Map(),right:new Map()};this.lastCornerTOI={left:null,right:null};this._stepCornerContacts={left:null,right:null};
    this.obstacle7=this.geometry.polygons.find(p=>p.kind==='obstacle'&&p.id===7)||null;this.obstacle8=this.geometry.polygons.find(p=>p.kind==='obstacle'&&p.id===8)||null;this.leftWall=this.geometry.polygons.find(p=>p.kind==='left-wall')||null;this.rightWall=this.geometry.polygons.find(p=>p.kind==='right-wall')||null;this.plungerDivider=this.geometry.polygons.find(p=>p.kind==='plunger-tube')||null;this.ceiling=this.geometry.polygons.find(p=>p.kind==='ceiling')||null;this.lastCeilingTOI=null;this.lastPlungerDividerTOI=null;this.lastLaneCoupledTOI=null;this.lastBallPolygonTOI=null;this.lastObstacle8TOI=null;this.lastLeftWallTOI=null;this.lastRightWallTOI=null;this.lastTopCurveTOI=null;this.lastSlingTOI=null;this.lastBallFlipperTOI={left:null,right:null};this.ballContactActive=new Set();this._stepBallContactLabels=new Set();this._stepInitialTopLabels=new Set();this._stepLeftWallActive=false;
  }
  reset(){resetBall(this.ball);this.bumperContacts.clear();this.slingContacts.clear();this.drainLatched=false;this.pendingReactive=v(0,0);this.staticContactCache.clear();this.dynamicContactCache.clear();this.flipperCornerCaches.left.clear();this.flipperCornerCaches.right.clear();this.lastCornerTOI={left:null,right:null};this.lastBallPolygonTOI=null;this.lastObstacle8TOI=null;this.lastLeftWallTOI=null;this.lastRightWallTOI=null;this.lastPlungerDividerTOI=null;this.lastLaneCoupledTOI=null;this.lastCeilingTOI=null;this.lastTopCurveTOI=null;this.lastSlingTOI=null;this.lastBallFlipperTOI={left:null,right:null};this.ballContactActive.clear();this._stepBallContactLabels.clear();this._stepInitialTopLabels.clear();this._stepLeftWallActive=false;this.previousDt=0;}
  resetAll(){this.reset();this.lastPlunge=-Infinity;this.flippers=makeFlippers();this.flipperCorners={left:flipperCornerDef(this.flippers.left),right:flipperCornerDef(this.flippers.right)};}
  plunge(nowMs){const b=this.ball;if(this.drainLatched||nowMs-this.lastPlunge<1000)return false;if(b.x>.70&&b.y<BALL_R*2){b.vy+=PLUNGE_DV;this.lastPlunge=nowMs;return true;}return false;}
  _processReactive(handlers){
    const b=this.ball,nextB=new Set();
    for(const c of this.geometry.circles){if(c.kind!=='bumper')continue;if(touchingCircle(b,c)){nextB.add(c.id);if(this._stepBallContactLabels)this._stepBallContactLabels.add(c.label);}else if(this.bumperContacts.has(c.id)){const n=norm(v(b.x-c.x,b.y-c.y));this.pendingReactive.x+=n.x*BUMPER_ACCEL_PHYSICAL;this.pendingReactive.y+=n.y*BUMPER_ACCEL_PHYSICAL;if(handlers&&handlers.onHit)handlers.onHit(c.id);}}
    this.bumperContacts=nextB;
  }
  _syncSlingContactEndsAtStepStart(dt,handlers){
    const b=this.ball;
    for(const s of this.geometry.reactiveSlings){
      const label=`sling-reactive:${s.id}`;if(!this.slingContacts.has(s.id))continue;
      if(!touchingPolygon(b,s.points)){
        this.slingContacts.delete(s.id);
        if(this.ballContactActive.has(label)){if(handlers&&handlers.onContactEvent)handlers.onContactEvent({event:'CONTACT_END',label});this.ballContactActive.delete(label);}
        b.vx+=s.normal.x*BUMPER_ACCEL_PHYSICAL*dt;b.vy+=s.normal.y*BUMPER_ACCEL_PHYSICAL*dt;
        if(handlers&&handlers.onHit)handlers.onHit(s.id);
      }
    }
    for(const s of this.geometry.reactiveSlings){
      const label=`sling-corner:${s.id}`;if(!this.ballContactActive.has(label))continue;
      const touching=this.geometry.circles.some(c=>c.kind==='sling-corner'&&c.id===s.id&&touchingCircle(b,c));
      if(!touching){if(handlers&&handlers.onContactEvent)handlers.onContactEvent({event:'CONTACT_END',label});this.ballContactActive.delete(label);}
    }
  }
  _sensorOverlaps(){const b=this.ball;return b.x+BALL_R>0&&b.x-BALL_R<.70&&b.y+BALL_R>0&&b.y-BALL_R<.04;}
  _solveFlipperTOIPositions(){
    const b=this.ball;let ran=false;
    for(let iter=0;iter<TOI_POSITION_ITERATIONS;iter++){
      let worst=0,any=false;
      for(const f of [this.flippers.left,this.flippers.right]){
        const sh=flipperWorldShape(f),hits=[polygonContact(b,{points:sh.poly,e:STEEL_E,mu:MIXED_FRICTION}),dynamicCircleContact(b,{...sh.pivot,e:STEEL_E,mu:MIXED_FRICTION}),dynamicCircleContact(b,{...sh.tip,e:STEEL_E,mu:MIXED_FRICTION})];
        for(const h of hits)if(h){worst=Math.max(worst,h.penetration);if(h.penetration>3*LINEAR_SLOP){correctDynamicHitWithFactor(b,f,h,TOI_BAUMGARTE);any=true;ran=true;}}
      }
      if(!any||worst<=3*LINEAR_SLOP)break;
    }
    return ran;
  }
  _cornerEnabled(name){return this.geometry.polygons.some(p=>p.kind===`${name}-flipper-corner`);}
  _solvePositionIsland(){
    const b=this.ball;
    for(let pass=0;pass<POSITION_ITERATIONS;pass++){
      for(const p of this.geometry.polygons){
        const label=p.label||p.key;
        if((p.kind==='top-right-curve'||p.kind==='top-left-curve')&&!this._stepInitialTopLabels.has(label))continue;
        if(p.kind==='left-wall'&&!this._stepLeftWallActive)continue;
        if(p.kind==='obstacle'&&p.id===8)continue;
        if(p.kind==='sling-reactive'||p.kind==='sling-side')continue;
        if(this._stepBallContactLabels&&polygonContact(b,p))this._stepBallContactLabels.add(label);correctStaticPolygonPosition(b,p);
      }
      for(const c of this.geometry.circles){if(c.kind==='sling-corner')continue;correctStaticCirclePosition(b,c);}
      correctDynamicFlipperContacts(b,this.flippers.left);correctDynamicFlipperContacts(b,this.flippers.right);
      for(const name of ['left','right']){const c=this._stepCornerContacts[name];if(c)solveFlipperCornerPosition(c.f,c.corner,c.manifold,BAUMGARTE);}
      solveFlipperPositionConstraintOnce(this.flippers.left);solveFlipperPositionConstraintOnce(this.flippers.right);
    }
  }
  step(dt,nowMs,input,handlers={}){
    dt=clamp(dt,0,.05);if(input&&input.plunge&&this.plunge(nowMs)&&handlers.onPlunge)handlers.onPlunge();if(this.drainLatched||dt<=0)return;
    this._syncSlingContactEndsAtStepStart(dt,handlers);
    this.ball.vx+=this.pendingReactive.x*dt;this.ball.vy+=this.pendingReactive.y*dt;this.pendingReactive.x=0;this.pendingReactive.y=0;this.ball.vy+=G*dt;
    beginFlipperStep(this.flippers.left,!!(input&&input.left),dt);beginFlipperStep(this.flippers.right,!!(input&&input.right),dt);
    const dtRatio=this.previousDt>0?dt/this.previousDt:0;
    const contacts=buildVelocityContacts(this.ball,this.geometry,this.flippers,this.staticContactCache,this.dynamicContactCache,dtRatio);this._stepBallContactLabels=new Set(contacts.map(c=>c.label).filter(Boolean));this._stepInitialTopLabels=new Set(contacts.filter(c=>c.label&&(c.label.startsWith('top-right-')||c.label.startsWith('top-left-'))).map(c=>c.label));this._stepLeftWallActive=contacts.some(c=>c.label==='left-wall');
    for(const name of ['left','right']){
      const f=this.flippers[name],corner=this.flipperCorners[name];let cc=null;
      if(this._cornerEnabled(name)){const manifold=collidePolygons(corner.shape,corner.xf,flipperLocalPolygon(f),flipperXf(f));if(manifold)cc=buildFlipperCornerVelocityContact(f,corner,manifold,this.flipperCornerCaches[name],dtRatio,true);}
      this._stepCornerContacts[name]=cc;
    }
    warmStartContacts(this.ball,contacts);warmStartFlipperCornerContact(this._stepCornerContacts.left);warmStartFlipperCornerContact(this._stepCornerContacts.right);warmStartFlipperJoint(this.flippers.left,dtRatio);warmStartFlipperJoint(this.flippers.right,dtRatio);
    for(let iter=0;iter<VELOCITY_ITERATIONS;iter++){solveFlipperVelocityConstraint(this.flippers.left);solveFlipperVelocityConstraint(this.flippers.right);solveContactsIteration(this.ball,contacts);solveFlipperCornerVelocity(this._stepCornerContacts.left);solveFlipperCornerVelocity(this._stepCornerContacts.right);}
    const caches=storeContactCaches(contacts);this.staticContactCache=caches.static;this.dynamicContactCache=caches.dynamic;this.flipperCornerCaches.left=storeFlipperCornerCache(this._stepCornerContacts.left);this.flipperCornerCaches.right=storeFlipperCornerCache(this._stepCornerContacts.right);
    const sweeps={};for(const name of ['left','right']){const f=this.flippers[name];sweeps[name]={c0x:f.comX,c0y:f.comY,a0:f.bodyAngle};}
    const ballSweep={c0x:this.ball.x,c0y:this.ball.y};
    const laneStart={x:this.ball.x,y:this.ball.y,vx:this.ball.vx,vy:this.ball.vy,omega:this.ball.omega};
    const sweepSpeed=Math.hypot(this.ball.vx,this.ball.vy),travelStep=sweepSpeed>1e-9?(BALL_R*.12/sweepSpeed):MAX_SUBSTEP,maxStep=Math.min(MAX_SUBSTEP,travelStep),n=Math.max(1,Math.ceil(dt/Math.max(maxStep,1/2000))),h=dt/n;
    for(let i=0;i<n;i++){integrateFlipper(this.flippers.left,h);integrateFlipper(this.flippers.right,h);this.ball.x+=this.ball.vx*h;this.ball.y+=this.ball.vy*h;for(const c of this.geometry.circles)if(c.kind!=='sling-corner')resolveCircleCCD(this.ball,c,label=>this._stepBallContactLabels.add(label));this._processReactive(handlers);if(this._sensorOverlaps()){this.drainLatched=true;if(handlers.onDrain)handlers.onDrain();break;}}
    ballSweep.c1x=this.ball.x;ballSweep.c1y=this.ball.y;
    this._solvePositionIsland();
    this.lastLaneCoupledTOI=solveBallLaneCoupledTOI(this.ball,this.plungerDivider,this.rightWall,laneStart,dt);
    if(this.lastLaneCoupledTOI&&!this.lastLaneCoupledTOI.exhausted){
      // The ball has already consumed the entire step inside the launcher.
      // A later TOI using the obsolete pre-bounce sweep could otherwise move
      // it across the playfield and undo the valid two-wall collision island.
      this.lastTopCurveTOI=this.lastCeilingTOI=this.lastBallPolygonTOI=this.lastObstacle8TOI=
      this.lastLeftWallTOI=this.lastRightWallTOI=this.lastPlungerDividerTOI=this.lastSlingTOI=null;
      this.lastBallFlipperTOI={left:null,right:null};
      for(const contact of this.lastLaneCoupledTOI.events)this._stepBallContactLabels.add(contact.label);
      if(handlers.onContactEvent){
        for(const label of this._stepBallContactLabels)if(!this.ballContactActive.has(label))handlers.onContactEvent({event:'CONTACT_BEGIN',label});
        for(const label of this.ballContactActive)if(!this._stepBallContactLabels.has(label))handlers.onContactEvent({event:'CONTACT_END',label});
      }
      this.ballContactActive=new Set(this._stepBallContactLabels);
      quantizeFlipperState(this.flippers.left);this.previousDt=dt;
      return;
    }
    const topCurveSweep={c0x:ballSweep.c0x,c0y:ballSweep.c0y,c1x:this.ball.x,c1y:this.ball.y};
    if(handlers.onFlipperCornerPostSolve){for(const name of ['left','right']){const c=this._stepCornerContacts[name];if(!c)continue;const post=worldManifold(c.manifold,c.corner.xf,flipperXf(c.f));handlers.onFlipperCornerPostSolve(name,{kind:'regular',manifold:c.manifold,post,contact:c,normalImpulse:c.points[0]?.normalImpulse||0,tangentImpulse:c.points[0]?.tangentImpulse||0});}}
    for(const name of ['left','right']){const f=this.flippers[name],s=sweeps[name];s.c1x=f.comX;s.c1y=f.comY;s.a1=f.bodyAngle;this.lastCornerTOI[name]=this._cornerEnabled(name)?solveFlipperCornerTOI(f,this.flipperCorners[name],s,dt):null;if(this.lastCornerTOI[name]&&handlers.onFlipperCornerPostSolve){this.lastCornerTOI[name].kind='toi';handlers.onFlipperCornerPostSolve(name,this.lastCornerTOI[name]);}}
    // Choose the earliest available upper-wall TOI *before* mutating the ball:
    // each subsequent solve using the old sweep otherwise undoes the rebound.
    const ceilingAlpha=this.ceiling&&this.geometry.polygons.includes(this.ceiling)?findBallPolygonTOI(makePolygonShape(this.ceiling.points),makeXf(v(0,0),0),ballSweep):null;
    this.lastTopCurveTOI=solveBallTopCurveTOI(this.ball,this.geometry.polygons,topCurveSweep,dt,[...this._stepInitialTopLabels],ceilingAlpha??1);if(this.lastTopCurveTOI&&handlers.onTopCurveTOIPostSolve)handlers.onTopCurveTOIPostSolve(this.lastTopCurveTOI);
    // Preserve the M13.9 central-ceiling contact when it precedes the curved wall.
    // An earlier swept curve impact already invalidated the pre-impact sweep.
    // Replaying a later ceiling TOI from that stale sweep would overwrite the
    // curved-wall rebound and teleport the ball back toward the outer arc.
    this.lastCeilingTOI=ceilingAlpha!=null&&(!this.lastTopCurveTOI||ceilingAlpha<=this.lastTopCurveTOI.alpha+1e-8)?solveBallPolygonTOI(this.ball,this.ceiling,ballSweep,dt):null;if(this.lastCeilingTOI)this._stepBallContactLabels.add('ceiling');if(this.lastCeilingTOI&&handlers.onBallPolygonPostSolve)handlers.onBallPolygonPostSolve('ceiling',this.lastCeilingTOI);
    this.lastBallPolygonTOI=this.obstacle7?solveBallPolygonTOI(this.ball,this.obstacle7,ballSweep,dt):null;if(this.lastBallPolygonTOI)this._stepBallContactLabels.add('obstacle:7');if(this.lastBallPolygonTOI&&handlers.onBallPolygonPostSolve)handlers.onBallPolygonPostSolve('obstacle:7',this.lastBallPolygonTOI);
    this.lastObstacle8TOI=this.obstacle8?solveBallPolygonTOI(this.ball,this.obstacle8,ballSweep,dt,{scaledFloatPosition:true}):null;if(this.lastObstacle8TOI)this._stepBallContactLabels.add('obstacle:8');if(this.lastObstacle8TOI&&handlers.onBallPolygonPostSolve)handlers.onBallPolygonPostSolve('obstacle:8',this.lastObstacle8TOI);
    // M13.12: an upper-curve rebound invalidates the pre-impact sweep.
    // A later left/right-wall TOI must start from the curve island's *post*
    // impact state and use only its remaining time. Replaying the original
    // frame sweep overwrote valid bumper -> curved-wall rebounds and launched
    // the ball outside the board (deterministic frames 11/19 in the two cases).
    const sideSweep=this.lastTopCurveTOI?
      {c0x:this.lastTopCurveTOI.safe.x,c0y:this.lastTopCurveTOI.safe.y,c1x:this.ball.x,c1y:this.ball.y}:ballSweep;
    const sideDt=this.lastTopCurveTOI?this.lastTopCurveTOI.h:dt;
    this.lastLeftWallTOI=this.leftWall?solveBallPolygonTOI(this.ball,this.leftWall,sideSweep,sideDt):null;if(this.lastLeftWallTOI)this._stepBallContactLabels.add('left-wall');if(this.lastLeftWallTOI&&handlers.onBallPolygonPostSolve)handlers.onBallPolygonPostSolve('left-wall',this.lastLeftWallTOI);
    this.lastRightWallTOI=!this.lastLaneCoupledTOI&&this.rightWall&&this.geometry.polygons.includes(this.rightWall)?solveBallPolygonTOI(this.ball,this.rightWall,sideSweep,sideDt):null;if(this.lastRightWallTOI)this._stepBallContactLabels.add('right-wall');if(this.lastRightWallTOI&&handlers.onBallPolygonPostSolve)handlers.onBallPolygonPostSolve('right-wall',this.lastRightWallTOI);
    // M13.9: repair the VERIFIED playfield -> launch-lane tunneling only.
    // The reverse direction is not included: the lane is only 3 mm wider than
    // the ball, so naive one-contact TOI can create a NEW outer-wall escape.
    // Preserve M13.8 reverse behavior until a coupled two-wall island is verified.
    this.lastPlungerDividerTOI=!this.lastLaneCoupledTOI&&this.plungerDivider&&this.geometry.polygons.includes(this.plungerDivider)&&ballSweep.c0x<=.710-BALL_R?solveBallPolygonTOI(this.ball,this.plungerDivider,ballSweep,dt):null;if(this.lastPlungerDividerTOI)this._stepBallContactLabels.add('plunger-tube');if(this.lastPlungerDividerTOI&&handlers.onBallPolygonPostSolve)handlers.onBallPolygonPostSolve('plunger-tube',this.lastPlungerDividerTOI);
    this.lastSlingTOI=solveBallSlingTOI(this.ball,this.geometry,ballSweep,dt);if(this.lastSlingTOI){for(const c of this.lastSlingTOI.contacts){this._stepBallContactLabels.add(c.label);if(c.label.startsWith('sling-reactive:'))this.slingContacts.add(+c.label.split(':')[1]);if(handlers.onSlingTOIPostSolve)handlers.onSlingTOIPostSolve(c.label,c,this.lastSlingTOI);}}
    for(const name of ['left','right']){const f=this.flippers[name],fs=sweeps[name];this.lastBallFlipperTOI[name]=solveBallFlipperTOI(this.ball,f,ballSweep,fs,dt);const bf=this.lastBallFlipperTOI[name];if(bf){for(const c of bf.post)this._stepBallContactLabels.add(c.label);if(handlers.onBallFlipperTOIPostSolve)handlers.onBallFlipperTOIPostSolve(name,bf);}}
    this._solveFlipperTOIPositions();
    if(handlers.onContactEvent){for(const label of this._stepBallContactLabels)if(!this.ballContactActive.has(label))handlers.onContactEvent({event:'CONTACT_BEGIN',label});for(const label of this.ballContactActive)if(!this._stepBallContactLabels.has(label))handlers.onContactEvent({event:'CONTACT_END',label});}
    this.ballContactActive=new Set(this._stepBallContactLabels);quantizeFlipperState(this.flippers.left);this.previousDt=dt;
  }
}

return {
  constants:{W,H,SCALE,BALL_R,G,STEEL_E,GROUND_E,BALL_FRICTION,DEFAULT_FIXTURE_FRICTION,MIXED_FRICTION,SLING_R,BALL_MASS,BALL_INERTIA,FLIPPER_MASS,FLIPPER_LOCAL_CENTER,FLIPPER_INERTIA_BOX,FLIPPER_INERTIA_COM_BOX,FLIPPER_INERTIA_COM,FLIPPER_COMMAND_ALPHA,FLIPPER_INERTIA,ANGULAR_SLOP,MAX_ANGULAR_CORRECTION,BUMPER_ACCEL_PHYSICAL,PLUNGE_DV,LINEAR_SLOP,POLYGON_RADIUS,MAX_LINEAR_CORRECTION,BAUMGARTE,TOI_BAUMGARTE,VELOCITY_ITERATIONS,POSITION_ITERATIONS,TOI_POSITION_ITERATIONS,MAX_SUBSTEP},
  helpers:{v,add,sub,mul,dot,len,norm,clamp,rot,closestOnSeg,circlePolygonContact,collidePolygonCircle,worldManifold,makePolygonShape,findBallPolygonTOI,solveBallPolygonTOI,solveBallTopCurveTOI,findBallCircleTOI,solveBallSlingTOI,circleCircleWorldManifold,findBallDynamicCircleTOI,findBallDynamicPolygonTOI,solveBallFlipperTOI,rectPoints},
  makeGeometry,makeFlippers,flipperOrigin,flipperWorldShape,makeBall,resetBall,flipperTarget,beginFlipperStep,solveFlipperVelocityConstraint,commandFlipper,advanceFlipper,integrateFlipper,correctFlipperLimit,updateFlipper,Engine
};
});
