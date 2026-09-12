// SPDX-License-Identifier: GPL-3.0-or-later
function mesh(vertices, normals, indices) { return { vertices: new Float32Array(vertices), normals: new Float32Array(normals), indices: new Uint16Array(indices) }; }

export function makeBox() {
  const p=[
    -1,-1,1, 1,-1,1, 1,1,1, -1,1,1,  -1,-1,-1,-1,1,-1,1,1,-1,1,-1,-1,
    -1,1,-1,-1,1,1,1,1,1,1,1,-1,  -1,-1,-1,1,-1,-1,1,-1,1,-1,-1,1,
    1,-1,-1,1,1,-1,1,1,1,1,-1,1,  -1,-1,-1,-1,-1,1,-1,1,1,-1,1,-1
  ];
  const n=[
    0,0,1,0,0,1,0,0,1,0,0,1, 0,0,-1,0,0,-1,0,0,-1,0,0,-1,
    0,1,0,0,1,0,0,1,0,0,1,0, 0,-1,0,0,-1,0,0,-1,0,0,-1,0,
    1,0,0,1,0,0,1,0,0,1,0,0, -1,0,0,-1,0,0,-1,0,0,-1,0,0
  ];
  const i=[]; for(let f=0;f<6;f++){const o=f*4;i.push(o,o+1,o+2,o,o+2,o+3);} return mesh(p,n,i);
}

export function makeSphere(lat=16, lon=20) {
  const v=[],n=[],i=[];
  for(let y=0;y<=lat;y++){const th=y*Math.PI/lat,st=Math.sin(th),ct=Math.cos(th);for(let x=0;x<=lon;x++){const ph=x*2*Math.PI/lon,sp=Math.sin(ph),cp=Math.cos(ph);const nx=cp*st,ny=ct,nz=sp*st;v.push(nx,ny,nz);n.push(nx,ny,nz);}}
  for(let y=0;y<lat;y++)for(let x=0;x<lon;x++){const a=y*(lon+1)+x,b=a+lon+1;i.push(a,b,a+1,b,b+1,a+1);} return mesh(v,n,i);
}

export function makeCylinderZ(segments=20) {
  const v=[],n=[],i=[];
  for(let z=0;z<=1;z++) for(let s=0;s<=segments;s++){const a=s*2*Math.PI/segments,x=Math.cos(a),y=Math.sin(a);v.push(x,y,z*2-1);n.push(x,y,0);}
  const row=segments+1; for(let s=0;s<segments;s++){const a=s,b=s+row;i.push(a,b,a+1,b,b+1,a+1);} return mesh(v,n,i);
}

export function makePlaneXZ() {
  return mesh(
    [-1,0,-1, 1,0,-1, 1,0,1, -1,0,1],
    [0,1,0, 0,1,0, 0,1,0, 0,1,0],
    [0,1,2, 0,2,3]
  );
}
