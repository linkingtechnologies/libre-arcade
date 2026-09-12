import test from 'node:test';
import assert from 'node:assert/strict';
import { AudioReplacement } from '../public/src/audio.js';

function memoryStorage(){
  const m=new Map();
  return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))};
}

test('clean audio replacement can be disabled persistently without an AudioContext',()=>{
  const storage=memoryStorage(),a=new AudioReplacement(storage);
  assert.equal(a.enabled,true);
  a.toggle();assert.equal(a.enabled,false);assert.equal(storage.getItem('dkbk.audio'),'off');
  a.toggle();assert.equal(a.enabled,true);assert.equal(storage.getItem('dkbk.audio'),'on');
});

test('historical gameplay sound events map to replacement cues, while gameover stays silent',()=>{
  const a=new AudioReplacement(memoryStorage()),heard=[];
  a.bubble=()=>heard.push('bubble');a.scream=()=>heard.push('scream');a.crush=()=>heard.push('crush');a.alarm=()=>heard.push('alarm');a.crazyAlarm=()=>heard.push('crazy');
  for(const type of ['bubble','match','crush','blocked','level','gameover'])a.handleEvent({type,count:1});
  assert.deepEqual(heard,['bubble','scream','crush','alarm','crazy']);
});


test('motor starts after a late browser audio unlock even when the game screen was already entered',()=>{
  const a=new AudioReplacement(memoryStorage());
  let starts=0;a.startMotor=()=>{starts++;};
  const flow={screen:'game',screenTime:0,game:{events:[]}};
  a.sync(flow); // no context yet: records screen but cannot start sound
  a.ctx={state:'running'};a.master={};
  a.sync(flow);
  assert.equal(starts,1);
});
