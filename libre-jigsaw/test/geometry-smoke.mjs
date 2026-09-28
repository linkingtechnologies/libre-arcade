globalThis.Path2D=class{constructor(){this.ops=[]}moveTo(...a){this.ops.push(['M',...a])}bezierCurveTo(...a){this.ops.push(['C',...a])}quadraticCurveTo(...a){this.ops.push(['Q',...a])}closePath(){this.ops.push(['Z'])}};
const g=await import('../src/geometry2012.js');
for(const [w,h] of [[900,600],[600,900],[320,240],[1400,700]]){
 for(const n of [12,24,48,96]){
  for(const [name,make,sides] of [['square',g.createSquareGeometry,4],['hex',g.createHexGeometry,6]]){
   const x=make(w,h,n,12345+n);
   if(x.tileCount<n)throw new Error(`${name} tileCount ${x.tileCount}<${n}`);
   if(x.tiles.length!==x.tileCount)throw new Error(`${name} tile count mismatch`);
   if(x.rotationSteps!==sides)throw new Error(`${name} rotation steps mismatch`);
   if(!x.tiles.every(t=>t.path&&t.path.ops.length===1+sides*4+1))throw new Error(`${name} malformed path`);
   if(!x.tiles.every(t=>Number.isFinite(t.origX)&&Number.isFinite(t.origY)))throw new Error(`${name} invalid tile coordinates`);
  }
 }
}
const exp=[[10,0],[0,10],[-10,0],[0,-10]];
for(let i=0;i<4;i++){const v=g.rotateVector(10,0,i);if(v.x!==exp[i][0]||v.y!==exp[i][1])throw new Error(`rotateVector ${i}`);}
const hv=g.rotateVectorSteps(10,0,1,6);if(Math.abs(hv.x-5)>1e-9||Math.abs(hv.y-5*Math.sqrt(3))>1e-9)throw new Error('hex 60-degree rotation');
const a={gx:2,gy:2};for(const [dx,dy] of [[1,-1],[2,0],[1,1],[-1,1],[-2,0],[-1,-1]])if(!g.areGridNeighbors(a,{gx:a.gx+dx,gy:a.gy+dy},'hex'))throw new Error(`missing hex neighbor ${dx},${dy}`);
if(g.areGridNeighbors(a,{gx:2,gy:4},'hex'))throw new Error('false hex neighbor');
console.log('geometry smoke tests: OK');
