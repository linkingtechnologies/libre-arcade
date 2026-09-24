import test from 'node:test';
import assert from 'node:assert/strict';
import {createSoundEngine,loadSoundEnabled,saveSoundEnabled,AUDIO_KEY,CUES} from '../public/src/sound.js';
import {createSimulation,step} from '../public/src/core.js';
import {browserRandom,spawnWave} from '../public/src/asteroids.js';

class MockAudioContext {
  static instances=[];
  constructor(){this.state='running';this.currentTime=0;this.destination={};this.calls=[];MockAudioContext.instances.push(this);}
  resume(){this.state='running';return Promise.resolve();}
  suspend(){this.state='suspended';return Promise.resolve();}
  createOscillator(){const out={frequency:{setValueAtTime:(...a)=>this.calls.push(['frequency',...a]),exponentialRampToValueAtTime:(...a)=>this.calls.push(['ramp-frequency',...a])},connect:()=>{},start:()=>this.calls.push(['start']),stop:()=>this.calls.push(['stop']),disconnect:()=>{},onended:null};return out;}
  createGain(){return {gain:{setValueAtTime:(...a)=>this.calls.push(['gain',...a]),exponentialRampToValueAtTime:(...a)=>this.calls.push(['ramp-gain',...a])},connect:()=>{},disconnect:()=>{}};}
}
test('M12 synthesizer is lazy: creates no AudioContext or output without a user gesture',()=>{
  MockAudioContext.instances=[];const sound=createSoundEngine({AudioContextClass:MockAudioContext});
  assert.equal(MockAudioContext.instances.length,0);assert.equal(sound.play('shoot'),false);
  assert.equal(sound.unlock(),true);assert.equal(MockAudioContext.instances.length,1);
  assert.equal(sound.play('shoot'),true);assert.ok(MockAudioContext.instances[0].calls.some(x=>x[0]==='start'));
});
test('M12 seven distinct sounds use safe positive parameters and do not require WAV/font assets',()=>{
  assert.deepEqual(Object.keys(CUES).sort(),['hit','saucer','shield','ship','shoot','thrust','wave']);
  for(const cue of Object.values(CUES))assert.ok(cue.seconds>0&&cue.seconds<1&&cue.start>0&&cue.end>0&&cue.gain>0&&cue.gain<.2);
});
test('M12 mute prevents all new playback, unmute resumes existing AudioContext',()=>{
  const engine=createSoundEngine({AudioContextClass:MockAudioContext});engine.unlock();
  const ctx=MockAudioContext.instances.at(-1);ctx.currentTime=1;assert.equal(engine.play('shoot'),true);
  engine.setEnabled(false);assert.equal(engine.play('hit'),false);
  engine.setEnabled(true);engine.unlock();ctx.currentTime=2;assert.equal(engine.play('hit'),true);
});
test('M12 shot/thrust rate-limits protect overlapping sound output at high frame rate',()=>{
  const engine=createSoundEngine({AudioContextClass:MockAudioContext});engine.unlock();const ctx=MockAudioContext.instances.at(-1);
  assert.equal(engine.play('thrust'),true);ctx.currentTime=.02;assert.equal(engine.play('thrust'),false);
  ctx.currentTime=.15;assert.equal(engine.play('thrust'),true);
});
test('M12 sound preference persists independently from score and bindings',()=>{
  const map=new Map([['foreign-key','unchanged']]);const store={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
  assert.equal(loadSoundEnabled(store),true);assert.equal(saveSoundEnabled(store,false),true);assert.equal(map.get(AUDIO_KEY),'off');
  assert.equal(loadSoundEnabled(store),false);assert.equal(saveSoundEnabled(store,true),true);assert.equal(loadSoundEnabled(store),true);
  assert.equal(map.get('foreign-key'),'unchanged');
  assert.equal(loadSoundEnabled({getItem(){throw new Error('blocked')}}),true);
  assert.equal(saveSoundEnabled({setItem(){throw new Error('blocked')}},false),false);
});
test('M12 absent Web Audio API is a silent, non-fatal fallback',()=>{
  const sound=createSoundEngine({AudioContextClass:null});assert.equal(sound.available,false);assert.equal(sound.unlock(),false);assert.equal(sound.play('ship'),false);
});
test('M12 optional audio never mutates the game simulation or consumes game RNG draws',()=>{
  const seedFn=()=>.5,rng=browserRandom(seedFn),state=createSimulation({gameplay:true,rng});spawnWave(state,1,rng);
  const audio=createSoundEngine({AudioContextClass:MockAudioContext});audio.unlock();
  const snap=JSON.stringify({ship:state.ship,asteroids:state.asteroids,score:state.score,wave:state.wave});
  audio.play('shoot');audio.play('hit');audio.play('saucer');
  assert.equal(JSON.stringify({ship:state.ship,asteroids:state.asteroids,score:state.score,wave:state.wave}),snap);
  step(state,{up:true},.01);assert.equal(state.ticks,1);
});

import {MenuMachine,MENU_ITEMS} from '../public/src/menu.js';
import {readFileSync} from 'node:fs';
test('M12 accessible help and credits are separate from the four original game menu items',()=>{
  assert.deepEqual(MENU_ITEMS.menu,['play','highscores','options','quit']);
  const m=new MenuMachine();for(const screen of ['help','credits']){
    m.open(screen);assert.deepEqual(MENU_ITEMS[screen],['back']);assert.equal(m.choose(),'back');assert.equal(m.screen,'menu');
    m.open(screen);assert.equal(m.escape(),'menu');assert.equal(m.screen,'menu');
  }
});
test('M12 initial HTML has no Libre Arcade branding/link outside the on-demand credits screen',()=>{
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  assert.ok(html.includes('ASTEROIDS INFINITY'));
  assert.ok(!/libre.arcade/i.test(html));
});
