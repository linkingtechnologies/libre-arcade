const fs=require('fs');
const path=require('path');
const P=require('../public/js/physics.js');
const DT=1/60;
function emptyPf(){return {bumpers:[],slingshots:[],obstacles:[],scores:{}};}
function golden(name){
  return fs.readFileSync(path.join(__dirname,'../reference/oracle',name+'.csv'),'utf8').split(/\r?\n/)
    .filter(x=>x&&!x.startsWith('#')&&!x.startsWith('frame,'))
    .map(x=>{const a=x.split(',').map(Number);return {frame:a[0],t:a[1],x:a[2],y:a[3],vx:a[4],vy:a[5],angle:a[6],omega:a[7]};});
}
function metric(actual,ref,count,compareAngular=false){
  let maxPosition=0,maxVelocity=0,maxAngle=0,maxOmega=0,positionFrame=0,velocityFrame=0;
  for(let i=0;i<count;i++){
    const pe=Math.hypot(actual[i].x-ref[i].x,actual[i].y-ref[i].y);
    const ve=Math.hypot(actual[i].vx-ref[i].vx,actual[i].vy-ref[i].vy);
    if(pe>maxPosition){maxPosition=pe;positionFrame=i;}
    if(ve>maxVelocity){maxVelocity=ve;velocityFrame=i;}
    if(compareAngular){
      maxAngle=Math.max(maxAngle,Math.abs((actual[i].angle||0)-(ref[i].angle||0)));
      maxOmega=Math.max(maxOmega,Math.abs((actual[i].omega||0)-(ref[i].omega||0)));
    }
  }
  return {frames:count,maxPosition,maxVelocity,maxAngle,maxOmega,positionFrame,velocityFrame};
}
function snap(e){const f=e.flippers.left;return {x:e.ball.x,y:e.ball.y,vx:e.ball.vx,vy:e.ball.vy,angle:f.bodyAngle,omega:f.omega};}
function runLaunch(){const e=new P.Engine(emptyPf()),a=[];for(let i=0;i<12;i++){e.step(DT,(i+1)*1000/60,{left:false,right:false,plunge:false},{});a.push(snap(e));}e.ball.vy+=P.constants.PLUNGE_DV;for(let i=12;i<150;i++){e.step(DT,(i+1)*1000/60,{left:false,right:false,plunge:false},{});a.push(snap(e));}return a;}
function runFlipper(){const e=new P.Engine(emptyPf()),a=[];e.geometry={polygons:[],circles:[],reactiveSlings:[]};e.ball.x=.307;e.ball.y=.115;e.ball.vx=0;e.ball.vy=-.10;for(let i=0;i<45;i++){e.step(DT,(i+1)*1000/60,{left:i>=3,right:false,plunge:false},{});a.push(snap(e));}return a;}
function runJoint(){const e=new P.Engine(emptyPf()),a=[];e.geometry={polygons:[],circles:[],reactiveSlings:[]};e.ball.x=9;e.ball.y=9;for(let i=0;i<60;i++){const pressed=(i<10)||(i>=25&&i<35);e.step(DT,(i+1)*1000/60,{left:pressed,right:false,plunge:false},{});const f=e.flippers.left,o=P.flipperOrigin(f);a.push({x:o.x,y:o.y,vx:f.comVx,vy:f.comVy,angle:f.bodyAngle,omega:f.omega});}return a;}
const launch=runLaunch(),flipper=runFlipper(),joint=runJoint();
const report={
  generatedBy:'tests/differential.js',
  units:{position:'m',velocity:'m/s',angle:'rad',omega:'rad/s'},
  launch90:metric(launch,golden('launch'),90),
  launch146:metric(launch,golden('launch'),146),
  launch150:metric(launch,golden('launch'),150),
  flipper8:metric(flipper,golden('flipper'),8,true),
  flipper45:metric(flipper,golden('flipper'),45,true),
  revoluteJoint60:metric(joint,golden('flipper-joint'),60,true)
};
console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--write')){
  const dir=path.join(__dirname,'../reports');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'differential.json'),JSON.stringify(report,null,2)+'\n');
}
