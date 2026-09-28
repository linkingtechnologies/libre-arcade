globalThis.Path2D=class{constructor(){this.ops=[]}moveTo(...a){this.ops.push(['M',...a])}bezierCurveTo(...a){this.ops.push(['C',...a])}quadraticCurveTo(...a){this.ops.push(['Q',...a])}closePath(){this.ops.push(['Z'])}};
const g10=await import('../src/geometry2010.js');
const g12=await import('../src/geometry2012.js');
for(const [w,h] of [[900,600],[600,900],[320,240],[1400,700]])for(const n of [12,24,48,96]){
  for(const [name,make,sides] of [['square2010',g10.createSquareGeometry2010,4],['hex2010',g10.createHexGeometry2010,6]]){
    const x=make(w,h,n,0x20100811+n);
    if(x.tileCount<n)throw new Error(`${name} tileCount ${x.tileCount}<${n}`);
    if(x.tiles.length!==x.tileCount)throw new Error(`${name} tile count mismatch`);
    if(x.rotationSteps!==sides)throw new Error(`${name} rotation steps mismatch`);
    if(!x.tiles.every(t=>t.path&&t.path.ops.length===1+sides*4+1))throw new Error(`${name} malformed path`);
  }
}
// Java 2010 oracle values produced directly from the original puzzlegames.jar.
const expected=[
 [900,600,12,4,3,12,214,214,22,-21],[900,600,24,6,4,24,150,150,0,0],[900,600,48,9,6,54,100,100,0,0],[900,600,96,12,8,96,75,75,0,0],
 [600,900,12,3,5,15,187,187,19,-17],[600,900,24,4,6,24,150,150,0,0],[600,900,48,6,9,54,100,100,0,0],[600,900,96,8,12,96,75,75,0,0],
 [320,240,12,4,3,12,80,80,0,0],[320,240,24,6,5,30,50,50,10,-5],[320,240,48,8,6,48,40,40,0,0],[320,240,96,12,9,108,26,26,4,3],
 [1400,700,12,5,3,15,262,262,45,-43],[1400,700,24,7,4,28,190,190,35,-30],[1400,700,48,10,5,50,140,140,0,0],[1400,700,96,14,7,98,100,100,0,0]
];
for(const e of expected){const [w,h,n,c,r,total,tw,th,l,t]=e,x=g10.createSquareGeometry2010(w,h,n,123);for(const [label,a,b] of [['cols',x.cols,c],['rows',x.rows,r],['tileCount',x.tileCount,total],['tileWidth',x.tileWidth,tw],['tileHeight',x.tileHeight,th],['leftOffset',x.leftOffset,l],['topOffset',x.topOffset,t]])if(a!==b)throw new Error(`2010 Java parity ${w}x${h}/${n} ${label}: ${a} != ${b}`);}

const expectedHex=[
 [900,600,12,8,3,12,270,312,-157,-90],[900,600,24,12,4,24,168,192,-96,-12],[900,600,48,16,6,48,122,140,-68,-32],[900,600,96,24,9,108,78,88,-37,-8],
 [600,900,12,6,4,12,258,296,-151,-31],[600,900,24,8,6,24,180,208,-105,-44],[600,900,48,11,9,50,122,140,-66,-40],[600,900,96,16,13,104,80,92,-40,-10],
 [320,240,12,8,3,12,96,108,-56,-15],[320,240,24,12,5,30,60,68,-35,-16],[320,240,48,16,7,56,42,48,-18,-12],[320,240,96,22,10,110,28,32,-1,-4],
 [1400,700,12,10,3,15,324,372,-191,-115],[1400,700,24,14,4,28,220,252,-125,-59],[1400,700,48,19,5,48,158,180,-90,-10],[1400,700,96,27,8,108,108,124,-56,-37]
];
for(const e of expectedHex){const [w,h,n,c,r,total,tw,th,l,t]=e,x=g10.createHexGeometry2010(w,h,n,123);for(const [label,a,b] of [['cols',x.cols,c],['rows',x.rows,r],['tileCount',x.tileCount,total],['tileWidth',x.tileWidth,tw],['tileHeight',x.tileHeight,th],['leftOffset',x.leftOffset,l],['topOffset',x.topOffset,t]])if(a!==b)throw new Error(`2010 Java hex parity ${w}x${h}/${n} ${label}: ${a} != ${b}`);}
// Hex geometry was mathematically retained when JigsawCutter was introduced.
for(const [w,h,n] of [[900,600,24],[600,900,48],[320,240,96],[1400,700,12]]){
  const a=g10.createHexGeometry2010(w,h,n,777),b=g12.createHexGeometry(w,h,n,777);
  for(const k of ['cols','rows','tileCount','tileWidth','tileHeight','spacingX','spacingY','leftOffset','topOffset'])if(a[k]!==b[k])throw new Error(`hex historical equivalence ${k}`);
}
const s10=g10.createSquareGeometry2010(900,600,24,7),s12=g12.createSquareGeometry(900,600,24,7);
if(s10.tileWidth===s12.tileWidth&&s10.parameters?.cornerVarianceFactor===s12.parameters?.cornerVarianceFactor)throw new Error('2010/2012 square modes unexpectedly indistinguishable');
console.log('2010 geometry/parity tests: OK');
