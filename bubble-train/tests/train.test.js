// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import { Track, LineSection, Train, Bubble, SPECIAL, CarriageFactory, TrainStation, SeededRng } from '../public/src/index.js';

const track=()=>new Track([new LineSection({x:0,y:0},{x:500,y:0})]);
const at=(p,colour=0,special=SPECIAL.NORMAL,extras={})=>({bubble:new Bubble({colour,special,...extras}),cursor:{sectionIndex:0,progress:p},state:'on-track'});
const pos=x=>Math.round(x*1e6)/1e6;

test('rear-connected segment advances across a split chain', () => {
  const tr=new Train(track()); tr.carriages=[at(0),at(30),at(100)]; tr.status='active';
  tr.advance(10);
  assert.deepEqual(tr.carriages.map((_,i)=>pos(tr.positionOf(i).x)),[10,40,100]);
});

test('ripple dynamically closes a gap and propagates only overlap', () => {
  const tr=new Train(track()); tr.carriages=[at(0),at(35)]; tr.status='active';
  tr.advance(10);
  assert.deepEqual(tr.carriages.map((_,i)=>pos(tr.positionOf(i).x)),[10,40]);
});

test('ripple stops when post-move gap remains greater than 30px', () => {
  const tr=new Train(track()); tr.carriages=[at(0),at(41)]; tr.status='active';
  tr.advance(10);
  assert.deepEqual(tr.carriages.map((_,i)=>pos(tr.positionOf(i).x)),[10,41]);
});

test('insertion opens a 30px slot as 15px backward + 15px forward ripple', () => {
  const tr=new Train(track()); tr.carriages=[at(30,0),at(60,1),at(90,2)]; tr.status='active';
  const result=tr.insert(1,new Bubble({colour:3}),'before',0);
  assert.equal(result.insertIndex,1);
  assert.deepEqual(tr.carriages.map((_,i)=>pos(tr.positionOf(i).x)),[15,45,75,105]);
});

test('collision traversal matches original front-to-rear list order', () => {
  const tr=new Train(track()); tr.carriages=[at(100),at(120)]; tr.status='active';
  assert.equal(tr.collisionIndex({x:110,y:0}),1, 'front/high-index carriage is tested first');
  assert.equal(tr.collisionIndex({x:151,y:0}),-1);
});

test('touching same-colour group of 3+ is removed', () => {
  const tr=new Train(track()); tr.carriages=[at(0,2),at(30,2),at(60,2),at(90,1)]; tr.status='active';
  assert.equal(tr.removeMatchRuns().length,3); assert.equal(tr.carriages.length,1);
});

test('same colours across a >31 gap do not match', () => {
  const tr=new Train(track()); tr.carriages=[at(0,2),at(30,2),at(62,2)]; tr.status='active';
  assert.equal(tr.findMatchRuns().length,0);
});

test('source quirk: speed bubble may count only when it is rear-most member of a run', () => {
  const tr1=new Train(track()); tr1.carriages=[at(0,1,SPECIAL.SPEED,{speedAdjustment:-.5}),at(30,1),at(60,1)]; tr1.status='active';
  assert.equal(tr1.findMatchRuns()[0]?.length,3);
  const tr2=new Train(track()); tr2.carriages=[at(0,1),at(30,1,SPECIAL.SPEED,{speedAdjustment:-.5}),at(60,1)]; tr2.status='active';
  assert.equal(tr2.findMatchRuns().length,0);
});

test('speed multiplier is summed only across the rear-connected driving section', () => {
  const tr=new Train(track());
  tr.carriages=[at(30,1,SPECIAL.SPEED,{speedAdjustment:-.5}),at(60,2),at(120,3,SPECIAL.SPEED,{speedAdjustment:.5})]; tr.status='active';
  assert.equal(tr.effectiveSpeedMultiplier(),.5);
  tr.advance(10);
  assert.deepEqual(tr.carriages.map((_,i)=>pos(tr.positionOf(i).x)),[35,65,120]);
});

test('negative multiplier reverses the driving section from its front edge', () => {
  const tr=new Train(track());
  tr.carriages=[at(30,1,SPECIAL.SPEED,{speedAdjustment:-1.5}),at(60,2)]; tr.status='active';
  const result=tr.advance(10);
  assert.equal(result.multiplier,-.5);
  assert.deepEqual(tr.carriages.map((_,i)=>pos(tr.positionOf(i).x)),[25,55]);
});

test('bomb removes only carriages inside strict 60px radius', () => {
  const tr=new Train(track()); tr.carriages=[at(0),at(30),at(59),at(60)]; tr.status='active';
  assert.equal(tr.bombAt({x:0,y:0}).length,3); assert.equal(tr.carriages.length,1);
});

test('colour bomb removes all matching colour in one train', () => {
  const tr=new Train(track()); tr.carriages=[at(0,1),at(30,2),at(60,1),at(90,3)]; tr.status='active';
  assert.equal(tr.colourBomb(0).length,2); assert.deepEqual(tr.carriages.map(c=>c.bubble.colour),[2,3]);
});

test('ordinary projectile insertion defers match removal until next train animate', () => {
  const tr=new Train(track()); tr.carriages=[at(30,2),at(60,2)]; tr.status='active';
  const hit=tr.resolveProjectile({x:90,y:0},new Bubble({colour:2}),0);
  assert.equal(hit.hit,true); assert.equal(hit.removed.length,0); assert.equal(tr.carriages.length,3);
  const frame=tr.animateFrame(0,{nowMs:40,rng:new SeededRng(1)});
  assert.equal(frame.removed.length,3); assert.equal(tr.carriages.length,0);
});

test('split chain can reconnect and produce a later chain reaction', () => {
  const tr=new Train(track());
  tr.carriages=[at(0,1),at(30,1),at(60,2),at(90,2),at(120,2),at(150,1)]; tr.status='active';
  let frame=tr.animateFrame(30,{nowMs:0,rng:new SeededRng(1)});
  assert.equal(frame.removed.length,3);
  assert.deepEqual(tr.carriages.map(c=>c.bubble.colour),[1,1,1]);
  frame=tr.animateFrame(30,{nowMs:40,rng:new SeededRng(1)}); assert.equal(frame.removed.length,0);
  frame=tr.animateFrame(30,{nowMs:80,rng:new SeededRng(1)}); assert.equal(frame.removed.length,0);
  frame=tr.animateFrame(30,{nowMs:120,rng:new SeededRng(1)}); assert.equal(frame.removed.length,3);
});

test('forward overflow crashes train without snapping carriage to path end', () => {
  const short=new Track([new LineSection({x:0,y:0},{x:50,y:0})]); const tr=new Train(short); tr.carriages=[at(45)]; tr.status='active';
  const r=tr.advance(10); assert.equal(r.crashed,true); assert.equal(tr.status,'crashed'); assert.equal(tr.positionOf(0).x,45);
});

test('backward overflow marks rear carriage in-station and station returns one per tick', () => {
  const t=track(); const tr=new Train(t); tr.carriages=[at(5)]; tr.status='active';
  const r=tr.rippleMove(0,'backward',10); assert.equal(r.returned.length,1); assert.equal(tr.carriages.length,1); assert.equal(tr.carriages[0].state,'in-station');
  assert.ok(tr.takeReturnedAtStation()); assert.equal(tr.carriages.length,0);
});

test('station ordering spawns at end of first tick and does not move new carriage until next tick', () => {
  const t=track(); const f=new CarriageFactory({colourCount:3,count:2,random:true},new SeededRng(1)); const s=new TrainStation({track:t,speed:10,factory:f});
  s.tick({nowMs:0,rng:new SeededRng(2)}); assert.equal(s.train.carriages.length,1); assert.equal(s.train.positionOf(0).x,0);
  s.tick({nowMs:40,rng:new SeededRng(2)}); assert.equal(s.train.positionOf(0).x,10);
  s.tick({nowMs:80,rng:new SeededRng(2)}); s.tick({nowMs:120,rng:new SeededRng(2)}); assert.equal(s.train.carriages.length,1);
  s.tick({nowMs:160,rng:new SeededRng(2)}); assert.deepEqual(s.train.carriages.map((_,i)=>s.train.positionOf(i).x),[0,40]);
});
