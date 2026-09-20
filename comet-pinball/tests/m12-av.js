'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const Audio=require('../public/js/audio.js'),Visuals=require('../public/js/visuals.js');
const started=[];let clock=.1;
class Gain{constructor(){this.gain={value:0,setValueAtTime(){},exponentialRampToValueAtTime(){}};}connect(){}disconnect(){}}
class Osc{constructor(){this.frequency={setValueAtTime(){},exponentialRampToValueAtTime(){}};}connect(){}disconnect(){}start(t){started.push(t)}stop(){}set type(t){}set onended(fn){}}
class MockAudioContext{constructor(){this.destination={};this.state='running';}get currentTime(){return clock;}createGain(){return new Gain();}createOscillator(){return new Osc();}resume(){return Promise.resolve();}close(){return Promise.resolve();}}
const a=Audio.create(MockAudioContext);
assert.equal(a.available,false);assert.equal(a.unlock(),true);assert.equal(a.available,true);
assert.equal(a.play('bumper'),true);assert.equal(a.play('bumper'),false,'collision sound cooldown');
clock+=.10;assert.equal(a.play('bumper'),true);assert.equal(a.play('nonsense'),false);
const soundCount=started.length;a.setMuted(true);clock+=1;assert.equal(a.play('flipper'),false);assert.equal(started.length,soundCount,'mute silences oscillators');
a.setMuted(false);a.setMusic(true);a.updateMusic(true);assert(started.length>soundCount,'music schedules original synth notes');
const beforePause=started.length;a.updateMusic(false);assert.equal(started.length,beforePause,'music pauses immediately');
a.setMusic(false);assert.equal(a.music,false);
const calls=[];const grad={addColorStop(){}};
const context=new Proxy({createRadialGradient(){return grad;},createLinearGradient(){return grad;}},{get(o,k){return k in o?o[k]:(...args)=>{calls.push([k,...args]);};},set(o,k,v){o[k]=v;return true;}});
const v={scaleX:650,scaleY:650,sx:x=>x*650,sy:y=>(1.28-y)*650};
Visuals.drawArt(context,v,.75,1.28);Visuals.lamp(context,v,.25,1.1,.03,true);
Visuals.sparks(context,v,[{x:.25,y:1.1,id:1,at:100}],200);
Visuals.ballTrail(context,v,[{x:.2,y:.2},{x:.3,y:.3},{x:.35,y:.32}]);
assert(!calls.some(x=>x[0]==='fillText'),'2013 field should not invent graphics text');assert(calls.some(x=>x[0]==='arc'));assert(calls.some(x=>x[0]==='stroke'));
const index=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
for(const dep of ['js/audio.js','js/visuals.js','js/comet.js'])assert(index.includes(`<script src="${dep}"></script>`));
for(const k of ['soundBtn','musicBtn'])assert(index.includes(`id="${k}"`));
console.log('PASS M12 synth audio: unlock, event throttling, mute, music pause; visuals paint without engine mutations; UI scripts wired');
