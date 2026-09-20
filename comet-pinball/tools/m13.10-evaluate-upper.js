'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),P=require('../public/js/physics.js'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'public/data/playfield.js'),'utf8'),ctx);
const pf=ctx.window.COMET_PLAYFIELD;
const native=fs.readFileSync(path.join(root,'reports/M13.10-native-upper-postbumper.csv'),'utf8').trim().split(/\r?\n/).slice(1);
const rows=['x,y,vx,vy,nativeX,nativeY,nativeVX,nativeVY,contacts,jsX,jsY,jsVX,jsVY,jsTopCurve,jsCeiling,errorPos,errorVel'];
const counts={total:0,validStarts:0,curveContacts:0,ceilingContacts:0,missedCurve:0,errPosOver5mm:0,errPosOver1cm:0,jsAboveTop:0,nativeAboveTop:0};
const worst=[];
for(const line of native){
 const [xs,ys,vxs,vys,nxs,nys,nvxs,nvys,labels]=line.split(',');
 const [x,y,vx,vy,nx,ny,nvx,nvy]=[xs,ys,vxs,vys,nxs,nys,nvxs,nvys].map(Number);
 // Ignore invalid seeds: those already intersecting a curved outer wall
 // are not a physically possible post-bumper state inside the playfield.
 const arcCenter=x<.30?.30:(x>.46?.46:null);
 if(arcCenter!=null && Math.hypot(x-arcCenter,y-1.10)>.295-P.constants.BALL_R-.002)continue;
 if(arcCenter==null && y>1.40-P.constants.BALL_R-.002)continue;
 counts.validStarts++;
 const e=new P.Engine(pf);Object.assign(e.ball,{x,y,vx,vy,omega:0});
 const preContacts=[];e.step(1/60,1000,{left:false,right:false,plunge:false},{onContactEvent:ev=>{if(ev.event==='CONTACT_BEGIN')preContacts.push(ev.label);}});
 const b=e.ball,errP=Math.hypot(nx-b.x,ny-b.y),errV=Math.hypot(nvx-b.vx,nvy-b.vy);
 counts.total++;
 if(labels.includes('top-'))counts.curveContacts++;
 if(labels.includes('ceiling'))counts.ceilingContacts++;
 if(labels.includes('top-')&&!e.lastTopCurveTOI&&errP>.005)counts.missedCurve++;
 if(errP>.005)counts.errPosOver5mm++;
 if(errP>.01)counts.errPosOver1cm++;
 if(b.y>1.40+P.constants.BALL_R)counts.jsAboveTop++;
 if(ny>1.40+P.constants.BALL_R)counts.nativeAboveTop++;
 const row=[x,y,vx,vy,nx,ny,nvx,nvy,labels,b.x,b.y,b.vx,b.vy,e.lastTopCurveTOI?.seed||'',e.lastCeilingTOI?.alpha??'',errP,errV];rows.push(row.join(','));
 if(labels.includes('top-')||labels.includes('ceiling'))worst.push({x,y,vx,vy,labels,errP,errV,nx,ny,nvx,nvy,jsX:b.x,jsY:b.y,jsVX:b.vx,jsVY:b.vy,jsTop:e.lastTopCurveTOI?.seed||null});
}
const dest=path.join(root,'reports/M13.10-js-upper-postbumper.csv');fs.writeFileSync(dest,rows.join('\n')+'\n');
worst.sort((a,b)=>b.errP-a.errP);
console.log(JSON.stringify({counts,worst:worst.slice(0,25)},null,2));
