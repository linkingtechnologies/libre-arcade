import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AudioSystem } from '../public/js/audio.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const app=fs.readFileSync(path.join(root,'public/js/app.mjs'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const audioSrc=fs.readFileSync(path.join(root,'public/js/audio.mjs'),'utf8');
const arcadeSrc=fs.readFileSync(path.join(root,'public/js/arcade-text.mjs'),'utf8');

const a=new AudioSystem({soundOn:true,musicOn:true});
if(a.ensure()!==null) throw new Error('headless unsupported Web Audio should fail soft');

class Param{setValueAtTime(){} exponentialRampToValueAtTime(){} cancelScheduledValues(){} setTargetAtTime(){}}
class Node{connect(){return this;} start(){} stop(){} constructor(){this.gain=new Param();this.frequency=new Param();this.type='sine';}}
class FakeBuffer{getChannelData(){return new Float32Array(64);}}
class FakeAudioContext{
  constructor(){this.state='running';this.currentTime=0;this.sampleRate=44100;this.destination=new Node();}
  createGain(){return new Node();} createOscillator(){return new Node();} createBuffer(){return new FakeBuffer();}
  createBufferSource(){const n=new Node();n.buffer=null;return n;} createBiquadFilter(){const n=new Node();n.frequency=new Param();return n;}
  resume(){return Promise.resolve();}
}
globalThis.AudioContext=FakeAudioContext;
const live=new AudioSystem({soundOn:true,musicOn:true});
if(!live.ensure()) throw new Error('fake supported Web Audio did not initialize');
live.startMusic();live.uiBeep();live.thud(.8);live.blackHoleIn();live.whiteHoleOut();live.levelComplete();live.endGame();live.stopMusic();
delete globalThis.AudioContext;
if(!html.includes('id="musicBtn"')) throw new Error('music toggle missing from toolbar');
if(!app.includes("diskfield-music")) throw new Error('music preference not persisted');
if(!app.includes("T('music')") || !app.includes("T('sound')")) throw new Error('separate music/sound UI missing');
if(!app.includes('audio.blackHoleIn()') || !app.includes('audio.whiteHoleOut()')) throw new Error('black/white hole effects not wired');
if(!app.includes('audio.levelComplete()') || !app.includes('audio.endGame()')) throw new Error('completion effects not wired');
if(!audioSrc.includes('thud(intensity') || !audioSrc.includes('startMusic()')) throw new Error('procedural thud/music implementation missing');
if(!arcadeSrc.includes('GLYPHS') || !app.includes('drawArcadeText')) throw new Error('procedural arcade lettering missing');
if(/MAKISUPA|tradeyourkid|wwwbeat|J_Fairba|SodaBush|delay_me|thud\.ogg/i.test(fs.readFileSync(path.join(root,'public/js/app.mjs'),'utf8')+audioSrc+arcadeSrc+html)) throw new Error('historical quarantined asset names leaked into runtime payload');
if(/font e audio originali non sono|original font and audio are not/i.test(app)) throw new Error('technical asset disclaimer still shown in game UI');
console.log('PASS: M5 separates music/sounds and persists both settings');
console.log('PASS: M5 runtime uses procedural audio and procedural arcade lettering only');
console.log('PASS: no quarantined historical font/audio is referenced by the playable runtime');
