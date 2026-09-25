import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SoundPlayer,SOUND_EVENTS,scheduleEffect} from '../public/js/audio.js';
import {Game} from '../public/js/engine.js';

function fakeContext(){
  const starts=[];const gains=[];
  const ctx={currentTime:0,state:'running',destination:{},createGain(){const node={gain:{value:1,values:[],setValueAtTime(v,t){this.value=v;this.values.push([v,t]);},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};gains.push(node);return node;},createOscillator(){const node={frequency:{setValueAtTime(){}},connect(){},disconnect(){},start(t){starts.push(t);},stop(){}};return node;}};
  return {ctx,starts,gains};
}
test('all seven effects schedule actual oscillators through the master gain',()=>{
  const {ctx,starts,gains}=fakeContext();const player=new SoundPlayer({contextFactory:()=>ctx});
  for(const type of SOUND_EVENTS){ctx.currentTime+=.5;assert.equal(player.play(type),true,type);}
  assert.ok(starts.length>=SOUND_EVENTS.length);assert.equal(gains[0].gain.value,.11);
  assert.equal(scheduleEffect(ctx,gains[0],'unknown'),0);
});
test('mute stops active voices, prevents new ones, unmute permits new sound',()=>{
  const {ctx,starts,gains}=fakeContext();const player=new SoundPlayer({contextFactory:()=>ctx});
  player.play('clear');const initial=starts.length;assert.ok(initial>0);
  player.setEnabled(false);assert.equal(gains[0].gain.value,0);
  assert.equal(player.play('gameOver'),false);assert.equal(starts.length,initial);
  player.setEnabled(true);assert.equal(gains[0].gain.value,.11);
  assert.equal(player.play('toggle'),true);assert.ok(starts.length>initial);
});
test('muted on first load does not even allocate an audio device',()=>{
  const player=new SoundPlayer({enabled:false,contextFactory:()=>{throw Error('should not initialize');}});
  assert.equal(player.unlock(),false);assert.equal(player.play('move'),false);assert.equal(player.context,null);
});
test('game emits sounds only for successful movements, rotations, landing, lines and game over',()=>{
  const g=new Game({width:10,height:10},7);const events=[];g.onEvent=e=>events.push(e);
  g.move(-1,0);assert.ok(events.includes('move'));events.length=0;
  g.paused=true;assert.equal(g.move(1,0),false);assert.equal(g.rotate(),false);assert.deepEqual(events,[]);g.paused=false;
  g.current={id:1,x:0,y:0,rotation:0};g.land();assert.ok(events.includes('land'));
  events.length=0;g.board[0]=Array(10).fill(2);g.current={id:1,x:0,y:1,rotation:0};g.land();assert.ok(events.includes('clear'));
});
test('player UI includes sound toggle and bilingual Help, and original sound is not claimed',()=>{
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const app=readFileSync(new URL('../public/js/app.js',import.meta.url),'utf8');
  assert.match(html,/id="sound"[^>]*aria-pressed="true"/);
  for(const phrase of ['soundHelp','soundCredit','soundOn','soundOff','muteSounds','unmuteSounds'])assert.equal((app.match(new RegExp('(?<![A-Za-z])'+phrase+':','g'))||[]).length,2,phrase);
  assert.match(app,/safeWrite\(SOUND_KEY,sound.enabled\)/);
  assert.match(app,/sound.setEnabled\(!sound.enabled\)/);
});
