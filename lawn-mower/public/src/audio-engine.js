// SPDX-License-Identifier: GPL-3.0-or-later
// Web Audio renderer for Lawn Mower's original Shiru/FamiTone streams.
import { FamiToneSequencer, FamiToneSfxSequencer, pulseTimerToHz, triangleTimerToHz, NOISE_PERIOD_NTSC } from './famitone-player.js';

const CPU_NTSC=1789773;
export const MASTER_GAIN=1.5;
const SFX={ENGINE_START:0,ENGINE_STOP:1,ENGINE_STALL:2,START:3,FUEL_ON_FIELD:4,FUEL_GET:5,GRASS_CUT:6,PAUSE:7,FUEL_LOW:8,SKIP:9,MUTE:10,STONE:11,FLOWERS:12,ENGINE_TURBO:13};

function makePulseWave(ctx,duty){
  // Fourier series of a unipolar pulse, DC omitted because speakers/APU coupling removes it.
  const N=48, real=new Float32Array(N+1), imag=new Float32Array(N+1);
  for(let n=1;n<=N;n++){
    real[n]=Math.sin(2*Math.PI*n*duty)/(Math.PI*n);
    imag[n]=(Math.cos(2*Math.PI*n*duty)-1)/(Math.PI*n);
  }
  return ctx.createPeriodicWave(real,imag,{disableNormalization:false});
}
function makeNoiseBuffer(ctx,shortMode=false){
  const len=shortMode?93:32767, data=new Float32Array(len); let lfsr=1;
  for(let i=0;i<len;i++){
    data[i]=(lfsr&1)?0.7:-0.7;
    const tap=shortMode?6:1, fb=(lfsr&1)^((lfsr>>tap)&1);
    lfsr=(lfsr>>1)|(fb<<14);
  }
  const b=ctx.createBuffer(1,len,ctx.sampleRate);b.copyToChannel(data,0);return b;
}

export class LawnAudioEngine {
  constructor(){
    this.music=new FamiToneSequencer(); this.sfx=new FamiToneSfxSequencer();
    this.currentTrack='title'; this.music.start('title'); this.lastRegs=new Uint8Array(11);
    this.ctx=null; this.master=null; this.nodes=null; this.enabled=true; this.uiSuspended=false; this.visibilitySuspended=false;
  }
  async unlock(){
    if(!this.enabled||this.uiSuspended||this.visibilitySuspended)return;
    if(!this.ctx){this._createAudioGraph();}
    await this._syncSuspension();
    if(this.ctx?.state==='running')this._apply(this.lastRegs,true);
  }
  _createAudioGraph(){
    const AC=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AC)return;
    const ctx=this.ctx=new AC(); const master=this.master=ctx.createGain();master.gain.value=MASTER_GAIN;master.connect(ctx.destination);
    const compressor=ctx.createDynamicsCompressor();compressor.threshold.value=-8;compressor.knee.value=10;compressor.ratio.value=4;compressor.attack.value=.002;compressor.release.value=.08;
    master.disconnect();master.connect(compressor);compressor.connect(ctx.destination);
    const waves=[.125,.25,.5,.75].map(d=>makePulseWave(ctx,d));
    const mkPulse=()=>{const o=ctx.createOscillator(),g=ctx.createGain();o.setPeriodicWave(waves[2]);g.gain.value=0;o.connect(g).connect(master);o.start();return{o,g,waves,duty:-1};};
    const tri=ctx.createOscillator(),tg=ctx.createGain();tri.type='triangle';tg.gain.value=0;tri.connect(tg).connect(master);tri.start();
    const long=ctx.createBufferSource(),short=ctx.createBufferSource(),ngL=ctx.createGain(),ngS=ctx.createGain();
    long.buffer=makeNoiseBuffer(ctx,false);short.buffer=makeNoiseBuffer(ctx,true);long.loop=short.loop=true;ngL.gain.value=ngS.gain.value=0;long.connect(ngL).connect(master);short.connect(ngS).connect(master);long.start();short.start();
    this.nodes={p1:mkPulse(),p2:mkPulse(),tri:{o:tri,g:tg},noise:{long,short,gLong:ngL,gShort:ngS}};
  }
  async _syncSuspension(){
    if(!this.ctx)return;
    const shouldRun=this.enabled&&!this.uiSuspended&&!this.visibilitySuspended;
    try{
      if(shouldRun&&this.ctx.state!=='running')await this.ctx.resume();
      else if(!shouldRun&&this.ctx.state==='running')await this.ctx.suspend();
    }catch{}
  }
  async suspendForUi(on){this.uiSuspended=Boolean(on);await this._syncSuspension();}
  async suspendForVisibility(on){this.visibilitySuspended=Boolean(on);await this._syncSuspension();}
  setEnabled(enabled){
    this.enabled=Boolean(enabled);
    if(this.master&&this.ctx){
      const t=this.ctx.currentTime, g=this.master.gain, target=this.enabled?MASTER_GAIN:0;
      // Keep manual mute click-free, then suspend after the short fade to avoid
      // burning audio resources while muted. The sequencer itself keeps advancing.
      try{g.cancelScheduledValues(t);g.setTargetAtTime(target,t,0.008);}catch{g.value=target;}
      if(!this.enabled){const ctx=this.ctx;setTimeout(()=>{if(!this.enabled&&this.ctx===ctx)this._syncSuspension();},40);}
    }
    return this.enabled;
  }
  resetForTitle(){
    this.music=new FamiToneSequencer(); this.sfx=new FamiToneSfxSequencer();
    this.currentTrack='title'; this.music.start('title'); this.lastRegs=new Uint8Array(11);
    if(this.nodes)this._apply(this.lastRegs,true);
  }
  startMusic(track){this.currentTrack=track;this.music.start(track);}
  stopMusic(){this.currentTrack=null;this.music.stop();}
  pauseMusic(on){this.music.pause(on);}
  playSfx(id,stream=0){if(id===SFX.MUTE){this.sfx.mute(stream);return;}this.sfx.start(id,stream);}
  muteStream(stream){this.sfx.mute(stream);}
  processEvents(events){
    for(const e of events){
      switch(e.type){
        case 'cheat-on': this.playSfx(SFX.SKIP,0);break;
        case 'title-start': this.stopMusic();this.playSfx(SFX.START,0);break;
        case 'engine-start': this.playSfx(SFX.ENGINE_START,0);break;
        case 'play-start': this.startMusic('game');break;
        case 'boost-start': this.playSfx(SFX.ENGINE_TURBO,0);break;
        case 'pause-on': this.pauseMusic(true);this.playSfx(SFX.PAUSE,0);break;
        case 'pause-off': this.playSfx(SFX.PAUSE,0);this.pauseMusic(false);break;
        case 'fuel-spawn': this.playSfx(SFX.FUEL_ON_FIELD,2);break;
        case 'fuel-collected': this.playSfx(SFX.FUEL_GET,2);break;
        case 'fuel-low': this.playSfx(SFX.FUEL_LOW,2);break;
        case 'grass-cut': case 'flowers-cleared': this.playSfx(SFX.GRASS_CUT,1);break;
        case 'flowers-hit': this.playSfx(SFX.FLOWERS,1);break;
        case 'grass-mute': this.muteStream(1);break;
        case 'stone-hit': this.playSfx(SFX.STONE,0);break;
        case 'level-clear': this.stopMusic();break;                  // the effects are muted later, by 'audio-mute-stream'
        case 'out-of-fuel': this.stopMusic();break;
        case 'engine-stall': this.playSfx(SFX.ENGINE_STALL,0);break;
        case 'engine-stop': this.playSfx(SFX.ENGINE_STOP,0);break;
        case 'audio-mute-stream': this.muteStream(e.stream);break;
        case 'message-start': this.startMusic(e.kind==='level-clear'?'levelclear':'outoffuel');break;
        case 'message-confirm': this.stopMusic();this.playSfx(SFX.SKIP,0);break;
        case 'game-complete': this.startMusic('welldone');break;
        case 'final-exit': this.stopMusic();this.playSfx(SFX.SKIP,0);break;
        case 'title-return': this.startMusic('title');break;
      }
    }
  }
  /** One NMI of sound: the events of the kernel's tick, in the order the original does it. Events marked `early` come from code that
   *  runs before the NMI's FamiToneUpdate and are heard in this NMI; the others come from the game logic after it and are heard from
   *  the next. While a screen is being set up the original does not call FamiToneUpdate at all (`setup`). */
  step(events,{setup=false}={}){
    this.processEvents(events.filter(e=>e.early));
    if(!setup)this.tick();
    this.processEvents(events.filter(e=>!e.early));
  }
  tick(){
    this.lastRegs=this.sfx.update(this.music.update());this._apply(this.lastRegs,false);return this.lastRegs;
  }
  _apply(r,immediate=false){
    if(!this.nodes||!this.ctx)return; const t=this.ctx.currentTime, tau=immediate?0.001:0.009;
    const set=(param,val)=>param.setTargetAtTime(val,t,tau);
    const pulse=(n,off)=>{
      const vol=r[off]&15, timer=r[off+1]|((r[off+2]&7)<<8), duty=(r[off]>>6)&3;
      if(duty!==n.duty){n.o.setPeriodicWave(n.waves[duty]);n.duty=duty;}
      const hz=pulseTimerToHz(timer);if(hz>1&&hz<20000)set(n.o.frequency,hz);
      set(n.g.gain,vol?Math.pow(vol/15,1.15)*0.095:0);
    };
    pulse(this.nodes.p1,0);pulse(this.nodes.p2,3);
    const tv=r[6]&0x7f, tt=r[7]|((r[8]&7)<<8), th=triangleTimerToHz(tt);if(th>1&&th<20000)set(this.nodes.tri.o.frequency,th);set(this.nodes.tri.g.gain,tv?0.07:0);
    const nv=r[9]&15, ni=r[10]&15, short=Boolean(r[10]&0x80), clock=CPU_NTSC/NOISE_PERIOD_NTSC[ni], rate=Math.min(16,Math.max(.02,clock/this.ctx.sampleRate));
    set(this.nodes.noise.long.playbackRate,rate);set(this.nodes.noise.short.playbackRate,rate);
    const ng=nv?Math.pow(nv/15,1.1)*0.055:0;set(this.nodes.noise.gLong.gain,short?0:ng);set(this.nodes.noise.gShort.gain,short?ng:0);
  }
}
export {SFX};
