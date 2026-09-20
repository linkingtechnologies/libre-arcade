const assert=require('assert');
const fs=require('fs');
const path=require('path');
const P=require('../public/js/physics.js');
const DT=1/60;
function emptyPf(){return {bumpers:[],slingshots:[],obstacles:[],scores:{}};}
function golden(name){
  return fs.readFileSync(path.join(__dirname,'../reference/oracle',name+'.csv'),'utf8').split(/\r?\n/)
    .filter(x=>x && !x.startsWith('#') && !x.startsWith('frame,'))
    .map(x=>{const a=x.split(',').map(Number);return {frame:a[0],t:a[1],x:a[2],y:a[3],vx:a[4],vy:a[5],angle:a[6],omega:a[7]};});
}
function snap(e){const b=e.ball,f=e.flippers.left;return {x:b.x,y:b.y,vx:b.vx,vy:b.vy,angle:f.bodyAngle,omega:f.omega};}
function dist(a,b,k1,k2){return Math.hypot(a[k1]-b[k1],a[k2]-b[k2]);}
function compare(label,actual,ref,count,limits){
  let maxPos=0,maxVel=0,maxAngle=0,maxOmega=0;
  const compareAngular=limits.angle!=null||limits.omega!=null;
  for(let i=0;i<count;i++){
    maxPos=Math.max(maxPos,dist(actual[i],ref[i],'x','y'));
    maxVel=Math.max(maxVel,dist(actual[i],ref[i],'vx','vy'));
    if(compareAngular){
      maxAngle=Math.max(maxAngle,Math.abs(actual[i].angle-ref[i].angle));
      maxOmega=Math.max(maxOmega,Math.abs(actual[i].omega-ref[i].omega));
    }
  }
  assert(maxPos<=limits.pos,`${label}: max position error ${maxPos} > ${limits.pos}`);
  assert(maxVel<=limits.vel,`${label}: max velocity error ${maxVel} > ${limits.vel}`);
  if(limits.angle!=null) assert(maxAngle<=limits.angle,`${label}: max angle error ${maxAngle} > ${limits.angle}`);
  if(limits.omega!=null) assert(maxOmega<=limits.omega,`${label}: max omega error ${maxOmega} > ${limits.omega}`);
  return {maxPos,maxVel,maxAngle,maxOmega};
}
function freefall(){
  const e=new P.Engine(emptyPf());e.ball.x=.38;e.ball.y=.8;e.ball.vx=e.ball.vy=0;
  e.geometry={polygons:[],circles:[],reactiveSlings:[]};e.flippers.left.pivot={x:9,y:9};e.flippers.right.pivot={x:9,y:9};
  const rows=[];for(let i=0;i<60;i++){e.step(DT,(i+1)*1000/60,{left:false,right:false,plunge:false},{});rows.push(snap(e));}return rows;
}
function launch(){
  const e=new P.Engine(emptyPf()),rows=[];
  for(let i=0;i<12;i++){e.step(DT,(i+1)*1000/60,{left:false,right:false,plunge:false},{});rows.push(snap(e));}
  e.ball.vy+=P.constants.PLUNGE_DV;
  for(let i=12;i<90;i++){e.step(DT,(i+1)*1000/60,{left:false,right:false,plunge:false},{});rows.push(snap(e));}return rows;
}
function bumper(){
  const e=new P.Engine({bumpers:[{id:1,x:.38,y:.70,r:.03}],slingshots:[],obstacles:[],scores:{1:20}}),rows=[];
  e.geometry.polygons=[];e.flippers.left.pivot={x:9,y:9};e.flippers.right.pivot={x:9,y:9};
  e.ball.x=.38;e.ball.y=.55;e.ball.vx=0;e.ball.vy=1.5;
  for(let i=0;i<16;i++){e.step(DT,(i+1)*1000/60,{left:false,right:false,plunge:false},{onHit:()=>{}});rows.push(snap(e));}return rows;
}
function flipper(){
  const e=new P.Engine(emptyPf()),rows=[];e.geometry={polygons:[],circles:[],reactiveSlings:[]};e.ball.x=.307;e.ball.y=.115;e.ball.vx=0;e.ball.vy=-.10;
  for(let i=0;i<8;i++){e.step(DT,(i+1)*1000/60,{left:i>=3,right:false,plunge:false},{});rows.push(snap(e));}return rows;
}
const results={
  freefall:compare('freefall',freefall(),golden('freefall'),60,{pos:2e-6,vel:2e-6}),
  launch:compare('launch',launch(),golden('launch'),90,{pos:.006,vel:.20}),
  bumper:compare('bumper',bumper(),golden('bumper'),16,{pos:.001,vel:.001}),
  flipper:compare('flipper',flipper(),golden('flipper'),8,{pos:.0006,vel:.001,angle:.003,omega:.005})
};
console.log('trajectory parity tests passed');
console.log(JSON.stringify(results,null,2));
