let oscillatorStarts=0;
class Param { setValueAtTime(){} exponentialRampToValueAtTime(){} }
class Node { connect(target){return target||this;} }
class Gain extends Node { constructor(){super();this.gain=new Param();this.gain.value=1;} }
class Compressor extends Node {
  constructor(){super();for(const k of ['threshold','knee','ratio','attack','release'])this[k]={value:0};}
}
class Oscillator extends Node {
  constructor(){super();this.frequency=new Param();this.type='sine';}
  start(){oscillatorStarts++;}
  stop(){}
}
class FakeAudioContext {
  constructor(){this.state='suspended';this.currentTime=0;this.sampleRate=48000;this.destination=new Node();}
  createGain(){return new Gain();}
  createDynamicsCompressor(){return new Compressor();}
  createOscillator(){return new Oscillator();}
  createBuffer(ch,len){return {getChannelData(){return new Float32Array(len);}};}
  createBufferSource(){return Object.assign(new Node(),{start(){},buffer:null});}
  createBiquadFilter(){return Object.assign(new Node(),{type:'',frequency:{value:0}});}
  async resume(){await Promise.resolve();this.state='running';}
}
global.window={AudioContext:FakeAudioContext};
const {CleanAudio}=await import('../public/src/audio.js');
const audio=new CleanAudio();
if(audio.master<.4)throw new Error('SFX master still too quiet');
audio.play('menu');
await new Promise(r=>setTimeout(r,0));
if(audio.ctx?.state!=='running')throw new Error('AudioContext was not resumed');
if(oscillatorStarts<1)throw new Error('first queued SFX was dropped while unlocking');
const before=oscillatorStarts;
audio.last.clear();
audio.play('menu');
if(oscillatorStarts<=before)throw new Error('running AudioContext did not play synchronously');
console.log('OK — Web Audio unlock queues first SFX and output master is audible');
