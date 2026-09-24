import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSimulation,step,snapshot,originalWrap,screenCoordinates,REFERENCE_DT} from '../public/src/core.js';
const oracle=JSON.parse(readFileSync(new URL('./oracle-camera-reversal-m0.json',import.meta.url)));
const testsFromSource=JSON.parse(readFileSync(new URL('./oracle-corrected-m0.json',import.meta.url))).tests;
const byId=id=>testsFromSource.find(x=>x.id===id).observed;
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol,`${a} != ${b} (tol ${tol})`);
const vec=(a,b,tol)=>a.forEach((v,i)=>near(v,b[i],tol));
function tick(s,input={},n=100,dt=REFERENCE_DT){for(let i=0;i<n;i++)step(s,input,dt);return s;}
test('source M0.2: stillness, forward and reverse acceleration',()=>{
  let s=createSimulation();tick(s);vec(s.ship.pos,byId('01').pos);vec(s.ship.speed,byId('01').vel);
  s=createSimulation({position:[350,100]});tick(s,{up:true});vec(s.ship.pos,byId('02').pos);vec(s.ship.speed,byId('02').vel);
  s=createSimulation({position:[350,300]});tick(s,{down:true});vec(s.ship.pos,byId('06').pos);vec(s.ship.speed,byId('06').vel);
});
test('source M0.2: inertia after releasing the key',()=>{
  const s=createSimulation({position:[350,100]});tick(s,{up:true});vec(s.ship.pos,byId('03').pos_after_thrust);
  tick(s);vec(s.ship.pos,byId('03').pos_after_release);vec(s.ship.speed,byId('03').vel_after_release);
});
test('source M0.2: turn and thrust use PRE-rotation angle',()=>{
  let s=createSimulation();tick(s,{left:true});near(s.ship.angle,byId('04').angle);vec(s.ship.speed,byId('04').vel);
  s=createSimulation({position:[350,100]});step(s,{left:true,up:true});near(s.ship.speed[1],byId('05').first_tick_vy);
  near(s.ship.angle,byId('05').first_tick_angle);tick(s,{left:true,up:true},99);
  vec(s.ship.pos,byId('05').after_100_pos);vec(s.ship.speed,byId('05').after_100_vel);near(s.ship.angle,byId('05').after_100_angle);
});
test('source M0.2: single-wrap boundaries and equality',()=>{
  let s=createSimulation({position:[699,539],speed:[200,200]});step(s);vec(s.ship.pos,byId('07').wrapped_pos);
  s=createSimulation({position:[700,540]});step(s);vec(s.ship.pos,byId('07').exact_boundary_pos);
  s=createSimulation({position:[600,100],speed:[150000,0]});step(s);vec(s.ship.pos,byId('17').final_pos);
  near(originalWrap(700,0,700),700);vec(screenCoordinates([350,270],[30,30]),[320,240]);
});
test('source M0.2: frame-sensitive semi-implicit integration',()=>{
  for(const hz of [50,100,200]){
    const s=createSimulation({position:[350,100]});tick(s,{up:true},hz,1/hz);
    near(s.ship.pos[1],byId('16').end_y_by_fps[String(hz)],2e-8);
  }
});
test('source-derived 200-frame camera reversal trace, all ship and camera coordinates',()=>{
  const s=createSimulation({position:[400,270],speed:[100,0]});
  for(let i=0;i<oracle.length;i++){
    if(i===100)s.ship.speed[0]=-100;
    step(s);const p=snapshot(s),expected=oracle[i];
    assert.equal(p.tick,i+1);assert.equal(expected.tick,(i%100)+1);
    for(const key of ['ship_pos','ship_vel','cam_pos','cam_vel'])vec(p[key],expected[key],2e-8);
  }
});
test('reference state reset and simultaneous rotations',()=>{
  const s=createSimulation();tick(s,{left:true,right:true},25);near(s.ship.angle,0);
  const reset=createSimulation();near(reset.ship.pos[0],350);near(reset.camera.pos[0],30);near(reset.ticks,0);
});
test('no global browser dependencies in core; invalid dt blocked',()=>{
  assert.throws(()=>step(createSimulation(),{},0),RangeError);
  assert.throws(()=>originalWrap(5,1,1),RangeError);
});
