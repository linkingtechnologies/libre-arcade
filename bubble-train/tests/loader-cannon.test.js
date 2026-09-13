// SPDX-License-Identifier: GPL-3.0-or-later
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { loadLevelXml, loadGameManifestXml, Cannon, Bubble, SeededRng, LevelModel, BulletFactory, SPECIAL } from '../public/src/index.js';

const levelXml=fs.readFileSync(new URL('./fixtures/basic-level.xml',import.meta.url),'utf8');
const gameXml=fs.readFileSync(new URL('./fixtures/basic-game.gms',import.meta.url),'utf8');

test('level loader reads cannon, train, population and all path primitive types', () => {
  const d=loadLevelXml(levelXml); assert.equal(d.cannons.length,1); assert.equal(d.trains.length,1);
  assert.deepEqual(d.cannons[0].position,{x:400,y:575}); assert.equal(d.cannons[0].reloadMs,500); assert.equal(d.cannons[0].bulletSpeed,10);
  assert.equal(d.trains[0].carriages.count,10); assert.equal(d.trains[0].carriages.colourCount,3);
  assert.deepEqual(d.trains[0].track.sections.map(s=>s.type),['line','arc','spiral']);
});

test('later track sections may omit startpos and inherit previous end like original loader', () => {
  const xml=`<level><cannons></cannons><trainstations><train speed="1"><track>
    <line startpos="0,0" endpos="100,0"/>
    <arc endpos="100,100" centre="50,50" rotation="clockwise"/>
    <line endpos="150,100"/>
  </track><carriages random="1" colour-num="2" carriage-num="1"/></train></trainstations></level>`;
  const d=loadLevelXml(xml); const [line,arc,last]=d.trains[0].track.sections;
  assert.deepEqual(line.end,{x:100,y:0});
  assert.deepEqual(arc.start,{x:100,y:0});
  assert.deepEqual(last.start,{x:100,y:100});
});

test('game manifest preserves ordered level/theme selection', () => {
  assert.deepEqual(loadGameManifestXml(gameXml),[
    {theme:'clean',src:'fixtures/one.lvl'}, {theme:'clean',src:'fixtures/two.lvl'}
  ]);
});

test('cannon fires from 45px barrel tip with no wall reflection logic', () => {
  const c=new Cannon({position:{x:100,y:100},bulletSpeed:10,reloadMs:500});
  let b=c.fire(new Bubble({colour:1}),0);
  assert.deepEqual(b.velocity,{x:0,y:-10});
  assert.deepEqual(b.position,{x:100,y:55});
  b.tick({nowMs:0,rng:new SeededRng(1)}); assert.deepEqual(b.position,{x:100,y:45});
  assert.equal(c.fire(new Bubble(),100),null); assert.ok(c.fire(new Bubble(),500));
});

test('magazine uses strict greater-than reload timing and maintains loaded/next bubbles', () => {
  const rng=new SeededRng(9); const factory=new BulletFactory({colourCount:3},rng);
  const c=new Cannon({position:{x:100,y:100},bulletSpeed:10,reloadMs:500,bulletFactory:factory});
  const originalNext=c.nextBubble;
  assert.ok(c.loadedBubble); assert.ok(originalNext);
  assert.ok(c.fireLoaded(0)); assert.equal(c.loadedBubble,null);
  c.animate(500,rng); assert.equal(c.loadedBubble,null,'source uses > bulletRate, not >=');
  c.animate(501,rng); assert.equal(c.loadedBubble,originalNext); assert.ok(c.nextBubble);
});

test('rainbow ammunition animates while waiting in the cannon', () => {
  const picks=[6,0,2]; const fakeRng={ nextInt:(max)=>(picks.shift() ?? 0)%max, nextUint32:()=>0 };
  const factory=new BulletFactory({colourCount:5,explicit:[{type:'SFX_RAINBOW',special:'true',number:1}]},fakeRng);
  const c=new Cannon({position:{x:100,y:100},bulletFactory:factory});
  assert.equal(c.loadedBubble.special,SPECIAL.RAINBOW);
  const before=c.loadedBubble.colour; c.animate(0,fakeRng); assert.notEqual(c.loadedBubble.colour,before);
});

test('projectile is culled after it no longer intersects the screen', () => {
  const c=new Cannon({position:{x:10,y:10},bulletSpeed:40,reloadMs:0}); const b=c.fire(new Bubble(),0);
  b.tick({nowMs:0,rng:new SeededRng(1)}); assert.equal(b.intersectsScreen(800,600),false);
});

test('level victory requires both factory and active train empty', () => {
  const xml=`<level><cannons></cannons><trainstations><train speed="1"><track><line startpos="0,0" endpos="100,0"/></track><carriages random="1" colour-num="2" carriage-num="0"/></train></trainstations></level>`;
  const l=new LevelModel(loadLevelXml(xml),new SeededRng(1)); assert.equal(l.tick(),'won');
});

test('level gameover occurs after spawned carriage moves past path end on following tick', () => {
  const xml=`<level><cannons></cannons><trainstations><train speed="60"><track><line startpos="0,0" endpos="50,0"/></track><carriages random="1" colour-num="2" carriage-num="1"/></train></trainstations></level>`;
  const l=new LevelModel(loadLevelXml(xml),new SeededRng(1));
  assert.equal(l.tick(),'playing');
  assert.equal(l.tick(),'gameover');
});
