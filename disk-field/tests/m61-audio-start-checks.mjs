import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AudioSystem } from '../public/js/audio.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const app=fs.readFileSync(path.join(root,'public/js/app.mjs'),'utf8');
const audioSrc=fs.readFileSync(path.join(root,'public/js/audio.mjs'),'utf8');

class Param{setValueAtTime(){} exponentialRampToValueAtTime(){} cancelScheduledValues(){} setTargetAtTime(){} }
class Node{connect(){return this;} start(){} stop(){} constructor(){this.gain=new Param();this.frequency=new Param();this.type='sine';}}
class FakeAudioContext{
  constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=44100;this.destination=new Node();this.resumeCalls=0;}
  createGain(){return new Node();} createOscillator(){return new Node();}
  createBuffer(){return {getChannelData(){return new Float32Array(64);}};}
  createBufferSource(){const n=new Node();n.buffer=null;return n;}
  createBiquadFilter(){const n=new Node();n.frequency=new Param();return n;}
  resume(){this.resumeCalls++;this.state='running';return Promise.resolve();}
}
globalThis.AudioContext=FakeAudioContext;
const a=new AudioSystem({soundOn:true,musicOn:true});
await a.unlock();
if(!a.ctx || a.ctx.state!=='running') throw new Error('global gesture unlock did not resume AudioContext');
if(a.ctx.resumeCalls<1) throw new Error('AudioContext.resume was not invoked');
if(!a.musicTimer) throw new Error('music did not start after audio unlock');
a.stopMusic();
delete globalThis.AudioContext;

for(const ev of ['pointerdown','keydown','touchstart']){
  if(!app.includes(`addEventListener('${ev}',unlockAudioFromGesture`)) throw new Error(`global ${ev} audio unlock missing`);
}
if(!app.includes('function ensureAudio(){void audio.unlock()')) throw new Error('local interactions do not use reliable audio unlock');
if(!audioSrc.includes("vol:.022") || !audioSrc.includes("vol:.026")) throw new Error('M6.1 music audibility boost missing');
if(!audioSrc.includes('73.42*')) throw new Error('M6.1 bass frequency boost missing');

console.log('PASS: M6.1 resumes Web Audio on global user gestures');
console.log('PASS: M6.1 starts music after resume and uses an audible loop mix');
