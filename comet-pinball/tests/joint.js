const assert=require('assert');
const fs=require('fs');
const path=require('path');
const P=require('../public/js/physics.js');
const DT=1/60;

function golden(){
  return fs.readFileSync(path.join(__dirname,'../reference/oracle/flipper-joint.csv'),'utf8')
    .split(/\r?\n/)
    .filter(x=>x && !x.startsWith('#') && !x.startsWith('frame,'))
    .map(x=>{const a=x.split(',').map(Number);return {x:a[2],y:a[3],vx:a[4],vy:a[5],angle:a[6],omega:a[7]};});
}

const ref=golden();
const e=new P.Engine({bumpers:[],slingshots:[],obstacles:[],scores:{}});
e.geometry={polygons:[],circles:[],reactiveSlings:[]};
e.ball.x=9;e.ball.y=9;
let maxOrigin=0,maxVelocity=0,maxAngle=0,maxOmega=0;
for(let i=0;i<60;i++){
  const pressed=(i<10)||(i>=25&&i<35);
  e.step(DT,(i+1)*1000/60,{left:pressed,right:false,plunge:false},{});
  const f=e.flippers.left,o=P.flipperOrigin(f),r=ref[i];
  maxOrigin=Math.max(maxOrigin,Math.hypot(o.x-r.x,o.y-r.y));
  maxVelocity=Math.max(maxVelocity,Math.hypot(f.comVx-r.vx,f.comVy-r.vy));
  maxAngle=Math.max(maxAngle,Math.abs(f.bodyAngle-r.angle));
  maxOmega=Math.max(maxOmega,Math.abs(f.omega-r.omega));
}
assert(maxOrigin<1e-6,`joint origin error ${maxOrigin}`);
assert(maxVelocity<2e-6,`joint COM velocity error ${maxVelocity}`);
assert(maxAngle<2e-6,`joint angle error ${maxAngle}`);
assert(maxOmega<1e-5,`joint omega error ${maxOmega}`);
console.log('revolute joint oracle parity passed');
console.log(JSON.stringify({maxOrigin,maxVelocity,maxAngle,maxOmega},null,2));
