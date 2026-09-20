'use strict';
const assert=require('assert'),fs=require('fs'),path=require('path'),vm=require('vm'),P=require('../public/js/physics.js');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/data/playfield.js'),'utf8'),sandbox);
const geometry=P.makeGeometry(sandbox.window.COMET_PLAYFIELD);
const wall=geometry.polygons.find(x=>x.kind==='right-wall');assert(wall,'native table right wall not found');
const oracle=fs.readFileSync(path.join(__dirname,'../reports/oracle-m10/right-wall.txt'),'utf8').trim().split(/\r?\n/);
const impulse=oracle.find(x=>x.startsWith('POST,')).split(',').slice(1).map(Number);
const native=oracle.find(x=>x.startsWith('STATE,')).split(',').slice(1).map(Number);
const b=P.makeBall();Object.assign(b,{x:.730,y:.56,vx:2.246843338,vy:.01,omega:0});
const dt=1/60,bs={c0x:b.x,c0y:b.y};b.vy+=P.constants.G*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;bs.c1x=b.x;bs.c1y=b.y;
const toi=P.helpers.solveBallPolygonTOI(b,wall,bs,dt);
assert(toi,'native JAR right-wall swept impact missing');
function near(a,c,t,msg){assert(Math.abs(a-c)<t,`${msg}: ${a} native=${c} tolerance=${t}`);}
near(toi.normal.x,-1,1e-7,'normal x');near(toi.normal.y,0,1e-7,'normal y');
near(toi.normalImpulse,impulse[0],2e-6,'normal impulse');near(toi.tangentImpulse,impulse[1],1e-5,'tangent impulse');
near(b.x,native[0],8e-5,'x');near(b.y,native[1],1e-6,'y');near(b.vx,native[2],2e-6,'vx');near(b.vy,native[3],1e-5,'vy');near(b.omega,native[4],4e-4,'omega');
assert(b.x<.75,'right wall cannot be penetrated by test ball');
console.log('PASS M10 right-wall standalone native-JAR CCD oracle');
console.log(JSON.stringify({alpha:toi.alpha,positionError:Math.hypot(b.x-native[0],b.y-native[1]),velocityError:Math.hypot(b.vx-native[2],b.vy-native[3]),spinError:Math.abs(b.omega-native[4])},null,2));
