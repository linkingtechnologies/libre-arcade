import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NjamGame, LevelSet, TILE, MODE, MAPW, MAPH, MAPSIZE, MAXDELAY } from '../src/game.js';
import { HighScores } from '../src/highscores.js';
import { NjamEditor } from '../src/editor.js';
import { NJAM_NET_PORT, CID_SIZE, MAP_PACKET_SIZE, CLIENT_PACKET_SIZE, HOST_PACKET_SIZE, encodeCID, decodeCID, encodeHostFrame, decodeHostFrame, encodeClientFrame, decodeClientFrame, encodeRuntimeMap, decodeRuntimeMap } from '../src/network-protocol.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');

// 1) Archive bytes are preserved exactly; runtime SetCurrentMap clears the 3 reserved spawn corners.
const probe=new NjamGame({seed:12345});
for(const def of [...probe.coopLevelsets,...probe.duelLevelsets]){
  const set=new LevelSet(def);
  assert.equal(set.bytes.length,20*MAPSIZE,`${def.id}: complete 20-map container`);
  const original=fs.readFileSync(path.join(root,'reference/njam-1.21-os4/levels',def.filename));
  for(let m=0;m<def.validMaps;m++){
    const raw=set.rawMap(m),expected=new Uint8Array(MAPSIZE);
    for(let x=0;x<MAPW;x++)for(let y=0;y<MAPH;y++) expected[y*MAPW+x]=original[m*MAPSIZE+x*MAPH+y];
    assert.deepEqual(raw,expected,`${def.filename} map ${m+1}: source bytes preserved`);
    const runtime=set.runtimeMap(m);
    assert.equal(runtime[(MAPH-2)*MAPW+1],TILE.EMPTY);
    assert.equal(runtime[1*MAPW+(MAPW-2)],TILE.EMPTY);
    assert.equal(runtime[(MAPH-2)*MAPW+(MAPW-2)],TILE.EMPTY);
    assert.equal(runtime[1*MAPW+1],raw[1*MAPW+1],'player-0 corner is deliberately untouched');
  }
}

// 2) One-player startup parity.
{
  const g=new NjamGame({seed:12345});g.start(MODE.ONE);
  assert.equal(g.status,'ready');assert.equal(g.lives,4);assert.equal(g.currentMap,0);assert.equal(g.ghosts.length,5);
  assert.deepEqual(g.players.map(p=>p.playing),[true,false,false,false]);
  const c=g.cookies;assert.equal(g.bonus,1850+(c>260?7*(c-250):0));
}

// 3) Two-player cooperative mode: 5 ghosts, shared 1000 bonus, correct second spawn/orientation.
{
  const g=new NjamGame({seed:5});g.start(MODE.TWO);
  assert.equal(g.ghosts.length,5);assert.deepEqual(g.players.map(p=>p.playing),[true,true,false,false]);
  assert.deepEqual([g.players[1].x,g.players[1].y,g.players[1].rotate],[MAPW-2,MAPH-2,2]);
  const c=g.cookies;assert.equal(g.bonus,1000+(c>260?4*(c-250):0));
  const before=g.players[0].gamePoints;g.players[0].x=2;g.players[0].y=2;g.setTile(2,2,TILE.COOKIE);g.cookies++;g.processTile(g.players[0]);
  assert.equal(g.players[0].gamePoints,before,'COOP cookies do not increment GamePoints');
}

// 4) Local duel: 8 ghosts, two players, no time bonus, DUEL set and 6 powerup replacement attempts.
{
  const g=new NjamGame({seed:11});g.mode=MODE.DUEL;g.levelsets=g.duelLevelsets;g.selectLevelSet(0);g.start(MODE.DUEL);
  assert.equal(g.ghosts.length,8);assert.equal(g.bonus,0);assert.deepEqual(g.players.map(p=>p.playing),[true,true,false,false]);
  assert.ok(g.currentMap>=0&&g.currentMap<g.duelLevelsets[0].validMaps);
}

// 5) A second juice in non-duel cannot be collected/refreshed.
{
  const g=new NjamGame({seed:7});g.start(MODE.ONE);const p=g.player;p.juice=77;const old=g.tile(p.x,p.y);g.setTile(p.x,p.y,TILE.JUICE);g.processTile(p);
  assert.equal(p.juice,77);assert.equal(g.tile(p.x,p.y),TILE.JUICE);g.setTile(p.x,p.y,old);
}

// 6) In duel, touching a second juice while powered moves it to the opposite corner.
{
  const g=new NjamGame({seed:13});g.mode=MODE.DUEL;g.levelsets=g.duelLevelsets;g.start(MODE.DUEL);const p=g.player;
  Object.assign(p,{x:2,y:2,juice:50});g.setTile(2,2,TILE.JUICE);g.setTile(MAPW-2,MAPH-2,TILE.EMPTY);g.processTile(p);
  assert.equal(g.tile(2,2),TILE.EMPTY);assert.equal(g.tile(MAPW-2,MAPH-2),TILE.JUICE);assert.equal(p.juice,50);
}

// 7) Last cookie exits before collision/update.
{
  const g=new NjamGame({seed:17});g.start(MODE.ONE);g.beginPlaying();const p=g.player;Object.assign(p,{x:2,y:2,xo:0,yo:0,vx:0,vy:0,rotate:0});g.map.fill(TILE.WALL);g.setTile(2,2,TILE.COOKIE);g.setTile(3,2,TILE.EMPTY);g.cookies=1;g.bonus=0;g.freeze=1;const ghost=g.ghosts[0];Object.assign(ghost,{x:2,y:2,xo:0,yo:0,vx:0,vy:0,delay:0});g.tick();
  assert.equal(g.cookies,0);assert.equal(g.lives,4);assert.equal(g.status,'map-result');assert.equal(g.freeze,1);
}

// 8) Shared-life loss resets both cooperative players only after continue, preserving powers.
{
  const g=new NjamGame({seed:19});g.start(MODE.TWO);g.beginPlaying();const p=g.players[1];Object.assign(p,{x:10,y:10,xo:2,yo:0,vx:1,vy:0,invisible:42,delay:0});const ghost=g.ghosts[0];Object.assign(ghost,{x:10,y:10,xo:2,yo:0,vx:0,vy:0,delay:0});g.collide();
  assert.equal(g.status,'life-lost');assert.equal(g.lives,3);assert.equal(p.invisible,42);g.continueAfterDeath();const d=g.find(TILE.DOOR);assert.deepEqual([g.players[0].x,g.players[0].y],[d.x,d.y]);assert.deepEqual([g.players[1].x,g.players[1].y],[d.x,d.y]);assert.equal(p.invisible,42);
}

// 9) Duel player-vs-player juice kill.
{
  const g=new NjamGame({seed:23});g.mode=MODE.DUEL;g.levelsets=g.duelLevelsets;g.start(MODE.DUEL);const a=g.players[0],b=g.players[1];Object.assign(a,{x:5,y:5,xo:0,yo:0,delay:0,juice:10});Object.assign(b,{x:5,y:5,xo:0,yo:0,delay:0,juice:0});const d=g.find(TILE.DOOR);g.collidePlayers();
  assert.equal(b.delay,MAXDELAY);assert.deepEqual([b.x,b.y],[d.x,d.y]);assert.equal(a.stats.playerKills,1);
}

// 10) Duel ghost death does not consume lives; player gets minimum invisibility and door respawn.
{
  const g=new NjamGame({seed:29});g.mode=MODE.DUEL;g.levelsets=g.duelLevelsets;g.start(MODE.DUEL);g.beginPlaying();const p=g.player,ghost=g.ghosts[0];Object.assign(p,{x:6,y:6,xo:0,yo:0,delay:0,juice:0,invisible:0});Object.assign(ghost,{x:6,y:6,xo:0,yo:0,delay:0});const lives=g.lives,d=g.find(TILE.DOOR);g.collide();
  assert.equal(g.lives,lives);assert.deepEqual([p.x,p.y],[d.x,d.y]);assert.equal(p.invisible,1.5*MAXDELAY);
}

// 11) Duel match is first to 4 victories; ties do not increment wins.
{
  const g=new NjamGame({seed:31});g.mode=MODE.DUEL;g.levelsets=g.duelLevelsets;g.start(MODE.DUEL);g.beginPlaying();g.players[0].mapPoints=10;g.players[1].mapPoints=5;g.finishRound();assert.equal(g.roundWinner,0);assert.equal(g.players[0].gamePoints,1);g.continueMapResult();
  for(let round=1;round<4;round++){g.beginPlaying();g.players[0].mapPoints=10;g.players[1].mapPoints=5;g.finishRound();if(round<3)g.continueMapResult();}
  assert.equal(g.players[0].gamePoints,4);assert.equal(g.pendingFinal,true);g.continueMapResult();assert.equal(g.status,'duel-won');
}

// 12) Freeze holds dead-ghost respawn countdown by odd/even oscillation.
{
  const g=new NjamGame({seed:37});g.start();g.freeze=5;const ghost=g.ghosts[0];ghost.delay=2;g.moveGhosts();assert.equal(ghost.delay,3);g.moveGhosts();assert.equal(ghost.delay,2);
}

// 13) Closed trap = 2*MAXDELAY, no life loss.
{
  const g=new NjamGame({seed:41});g.start();const lives=g.lives,d=g.find(TILE.DOOR),p=g.player;g.setTile(p.x,p.y,TILE.WALL);g.processTile(p);assert.equal(g.lives,lives);assert.equal(p.delay,MAXDELAY*2);assert.deepEqual([p.x,p.y],[d.x,d.y]);
}

// 14) High-score insertion uses strict '>' and original 9-character allowed-name shape.
{
  const mem=new Map();const storage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v)};const h=new HighScores(storage);assert.equal(h.qualifies(0),-1);const idx=h.insert(10,2);assert.equal(idx,0);assert.equal(h.commitName(idx,'abc-xyz!'),true);assert.equal(h.rows[0].name,'ABCXYZ!');
}

// 15) Editor round-trip preserves exact 13,440-byte x-major format and original runtime corner clearing.
{
  const ed=new NjamEditor(),def=probe.coopLevelsets.find(x=>x.id==='ORIGINAL');ed.loadDef(def,'COOP');const bytes=ed.exportBytes();const original=fs.readFileSync(path.join(root,'reference/njam-1.21-os4/levels',def.filename));
  // Editor SetCurrentMap clears reserved corners in the current map, so compare every other byte.
  assert.equal(bytes.length,original.length);const skip=new Set();for(const [x,y] of [[1,MAPH-2],[MAPW-2,1],[MAPW-2,MAPH-2]])skip.add(x*MAPH+y);
  for(let i=0;i<MAPSIZE;i++)if(!skip.has(i))assert.equal(bytes[i],original[i]);
  ed.setTile(2,2,9);assert.equal(ed.changed,true);ed.undo();assert.notEqual(ed.tile(2,2),9);
}


// 16) Editor T TEST mirrors njamedit.cpp: two active players, DUEL rules,
//     5 ghosts/no injected powerups for COOP and 8 ghosts/+6 replacements for DUEL.
{
  const ed=new NjamEditor(),coop=probe.coopLevelsets.find(x=>x.id==='ORIGINAL');ed.loadDef(coop,'COOP');
  const v=ed.validateCurrent();assert.equal(v.ok,true);const def=ed.toLevelSetDef('EDITORTEST');
  const g=new NjamGame({seed:43});g.setSkin(-1);g.startEditorTest(def,ed.current,'COOP');
  assert.equal(g.editorTest,true);assert.equal(g.mode,MODE.DUEL);assert.deepEqual(g.players.map(p=>p.playing),[true,true,false,false]);
  assert.equal(g.ghosts.length,5);assert.equal(g.bonus,0);assert.equal(g.currentSkin,0);
  g.beginPlaying();g.finishRound();assert.equal(g.status,'editor-test-done');assert.equal(g.running,false);
}
{
  const ed=new NjamEditor(),duel=probe.duelLevelsets.find(x=>x.id==='ORIGINAL');ed.loadDef(duel,'DUEL');const def=ed.toLevelSetDef('EDITORTEST');
  const raw=new LevelSet(def).runtimeMap(0),cookiesBefore=[...raw].filter(v=>v===TILE.COOKIE).length;
  const g=new NjamGame({seed:47});g.startEditorTest(def,0,'DUEL');assert.equal(g.ghosts.length,8);assert.ok(g.cookies<=cookiesBefore&&g.cookies>=cookiesBefore-6,'six duel powerup replacement attempts may re-roll COOKIE');
}


// 17) The historical SDL_net packet semantics are preserved independently of transport.
{
  assert.equal(NJAM_NET_PORT,5547);assert.equal(CID_SIZE,4);assert.equal(MAP_PACKET_SIZE,672);assert.equal(CLIENT_PACKET_SIZE,16);assert.equal(HOST_PACKET_SIZE,56);
  const cid=encodeCID(true,false);assert.deepEqual([...cid],[78,74,1,0]);assert.deepEqual(decodeCID(cid).playing,[true,false]);
  const ps=[{rotate:3,x:11,y:12,xo:4,yo:2,vx:-1,vy:1},{rotate:1,x:25,y:22,xo:0,yo:3,vx:1,vy:0}];
  const ghosts=Array.from({length:8},(_,i)=>({x:i+1,y:i+2,xo:i%5,yo:(i+1)%5,delay:i*15}));
  const hp=encodeHostFrame(ps,ghosts);assert.equal(hp.length,56);const hd=decodeHostFrame(hp);assert.deepEqual(hd.players,ps);assert.deepEqual(hd.ghosts,ghosts);assert.equal(hd.exit,false);
  const cp=encodeClientFrame(ps,{exit:true});assert.equal(cp.length,16);const cd=decodeClientFrame(cp);assert.equal(cd.exit,true);assert.deepEqual(cd.players,ps);
  const set=new LevelSet(probe.duelLevelsets.find(x=>x.id==='ORIGINAL')),runtime=set.runtimeMap(0),wire=encodeRuntimeMap(runtime);assert.equal(wire.length,672);assert.deepEqual(decodeRuntimeMap(wire),runtime);
}

console.log('Njam 1.21 local/full-parity core tests: OK');

// 18) Duel race warning state mirrors RenderGameScreen(): when every player but
//     the leader is mathematically unable to catch up, triple-ding fires once;
//     if the race opens again, mapend2/race-reopened fires once.
{
  const g=new NjamGame({seed:53});g.mode=MODE.DUEL;g.levelsets=g.duelLevelsets;g.start(MODE.DUEL);
  let ding=0,reopen=0;g.addEventListener('tripleDing',()=>ding++);g.addEventListener('raceReopened',()=>reopen++);
  g.players[0].mapPoints=10;g.players[1].mapPoints=2;g.cookies=7;g.updateDuelRaceState();
  assert.equal(g.tripleDinged,true);assert.equal(ding,1);g.updateDuelRaceState();assert.equal(ding,1,'warning only fires once while state remains closed');
  g.cookies=8;g.updateDuelRaceState();assert.equal(g.tripleDinged,false);assert.equal(reopen,1);
}
