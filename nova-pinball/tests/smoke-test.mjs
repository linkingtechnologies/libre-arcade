import fs from 'node:fs';
import {clamp,circleSegment,circleCircle,closestOnSegment} from '../public/src/physics.js';
const table=JSON.parse(fs.readFileSync(new URL('../public/data/table.json',import.meta.url)));
const poly=d=>{const p=[];for(let i=0;i<d.vertices.length;i+=2)p.push({x:d.x+d.vertices[i],y:d.y+d.vertices[i+1]});return p};
const segs=p=>{const r=[];for(let i=0;i<p.length-1;i++)r.push([p[i],p[i+1]]);return r};
const walls=table.components.filter(x=>x.type==='wall').map(x=>({...x,poly:poly(x)}));
const triggers=table.components.filter(x=>x.type==='trigger').map(x=>({...x,poly:poly(x)}));
const bumpers=table.components.filter(x=>x.type==='bumper');
let b={x:table.ball.x,y:table.ball.y,vx:0,vy:0,r:15};
let launched=false;
function sensorHit(p){for(const [a,c] of segs(p)){const q=closestOnSegment(b.x,b.y,a.x,a.y,c.x,c.y);if(Math.hypot(b.x-q.x,b.y-q.y)<=b.r)return true}return false}
const dt=1/240;
let minY=b.y,maxY=b.y;
for(let n=0;n<240*3;n++){
 b.vy+=768*dt;b.vx=clamp(b.vx,-1000,1000);b.vy=clamp(b.vy,-1000,1000);b.x+=b.vx*dt;b.y+=b.vy*dt;
 for(const w of walls)for(const [a,c] of segs(w.poly))circleSegment(b,a,c,.4);
 for(const x of bumpers)circleCircle(b,x.x,x.y,x.r,clamp(x.r/10,1,4));
 for(const t of triggers)if(t.action==='slingshot'&&sensorHit(t.poly)){b.vx=0;b.vy=-1000;launched=true;}
 minY=Math.min(minY,b.y);maxY=Math.max(maxY,b.y);
}
if(!launched) throw new Error('launch-lane slingshot never fired');
if(minY>500) throw new Error(`ball never travelled up table; minY=${minY}`);
console.log('OK — launch lane fired; minY=',minY.toFixed(1),'maxY=',maxY.toFixed(1),'final=',b.x.toFixed(1),b.y.toFixed(1));
