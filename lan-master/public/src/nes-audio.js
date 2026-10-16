/* SPDX-License-Identifier: GPL-3.0-or-later */
(function(root,factory){
  const api=factory(root.LanMasterFamiTone);
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.LanMasterNESAudio=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(FT){
'use strict';

const DMC_PERIOD=[428,380,340,320,286,254,226,214,190,160,142,128,106,85,72,54];
const NOISE_PERIOD=[4,8,16,32,64,96,128,160,202,254,380,508,762,1016,2034,4068];
const DUTY=[1/8,2/8,4/8,6/8];
const TRI=[15,14,13,12,11,10,9,8,7,6,5,4,3,2,1,0,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

class Synth{
  constructor(engine,{sampleRate=48000,cpuHz=1789773}={}){
    this.engine=engine;this.sampleRate=sampleRate;this.cpuHz=cpuHz;
    this.framePhase=0;this.p1=0;this.p2=0;this.tri=0;
    this.noisePhase=0;this.noiseLfsr=1;
    this.dmcPhase=0;this.dmcDac=32;this.dmc=null;
  }
  resetPhases(){this.p1=this.p2=this.tri=this.noisePhase=this.dmcPhase=0;this.noiseLfsr=1;this.dmcDac=32;this.dmc=null}
  _startDpcm(id){
    const info=this.engine.dpcmInfo(id);
    if(!info.bytes)return;
    this.dmc={...info,byteIndex:0,bitIndex:0};
    this.dmcDac=32;this.dmcPhase=0;
  }
  _tickFrame(){
    this.engine.update();
    for(const id of this.engine.sampleEvents)this._startDpcm(id);
  }
  _pulse(regV,lo,hi,phaseName){
    const vol=regV&15;if(!vol)return 0;
    const period=((hi&7)<<8)|lo;if(period<8)return 0;
    const freq=this.cpuHz/(16*(period+1));
    let p=this[phaseName]+freq/this.sampleRate;p-=Math.floor(p);this[phaseName]=p;
    return p<DUTY[(regV>>6)&3]?vol:0;
  }
  _triangle(v,lo,hi){
    if(!(v&0x7f))return 0;
    const period=((hi&7)<<8)|lo;if(period<2)return 0;
    const freq=this.cpuHz/(32*(period+1));
    this.tri+=freq/this.sampleRate;this.tri-=Math.floor(this.tri);
    return TRI[Math.floor(this.tri*32)&31];
  }
  _noise(v,f){
    const vol=v&15;if(!vol)return 0;
    const idx=f&15,mode=!!(f&0x80),clock=this.cpuHz/NOISE_PERIOD[idx];
    this.noisePhase+=clock/this.sampleRate;
    while(this.noisePhase>=1){
      const bit0=this.noiseLfsr&1,tap=(this.noiseLfsr>>(mode?6:1))&1;
      this.noiseLfsr=(this.noiseLfsr>>1)|((bit0^tap)<<14);
      this.noisePhase-=1;
    }
    return (this.noiseLfsr&1)?0:vol;
  }
  _dmc(){
    if(!this.dmc)return this.dmcDac;
    const d=this.dmc,rate=this.cpuHz/DMC_PERIOD[d.rateIndex];
    this.dmcPhase+=rate/this.sampleRate;
    while(this.dmcPhase>=1&&this.dmc){
      const cur=this.dmc;
      const byte=this.engine.read8(cur.addr+cur.byteIndex);
      const bit=(byte>>cur.bitIndex)&1;
      if(bit){if(this.dmcDac<=125)this.dmcDac+=2}else if(this.dmcDac>=2)this.dmcDac-=2;
      cur.bitIndex++;
      if(cur.bitIndex===8){
        cur.bitIndex=0;cur.byteIndex++;
        if(cur.byteIndex>=cur.bytes){
          if(cur.loop)cur.byteIndex=0;else this.dmc=null;
        }
      }
      this.dmcPhase-=1;
    }
    return this.dmcDac;
  }
  step(){
    this.framePhase+=60/this.sampleRate;
    while(this.framePhase>=1){this._tickFrame();this.framePhase-=1}
    const r=this.engine.out;
    const p1=this._pulse(r[0],r[1],r[2],'p1');
    const p2=this._pulse(r[3],r[4],r[5],'p2');
    const tri=this._triangle(r[6],r[7],r[8]);
    const noi=this._noise(r[9],r[10]);
    const dmc=this._dmc();
    const ps=p1+p2;
    const pulse=ps?95.88/(8128/ps+100):0;
    const tndIn=tri/8227+noi/12241+dmc/22638;
    const tnd=tndIn?159.79/(1/tndIn+100):0;
    // Approximate NES analog mixer. High-pass filtering is added by BrowserAudio.
    return Math.max(-1,Math.min(1,(pulse+tnd)*1.35));
  }
}

class BrowserAudio{
  constructor(data){
    this.data=data;
    this.prg=FT.b64(data.prgB64);
    this.engine=new FT.Engine(this.prg,{sfxTable:data.sfxTable,dpcmTable:data.dpcmTable});
    this.ctx=null;this.node=null;this.gain=null;this.hp=null;this.synth=null;
    this.currentMusic='menu';this.bgmEnabled=true;this.sfxEnabled=true;
    this.engine.musicStart(data.music.menu);
  }
  async unlock(){
    const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AC)return false;
    if(!this.ctx){
      this.ctx=new AC({latencyHint:'interactive'});
      this.synth=new Synth(this.engine,{sampleRate:this.ctx.sampleRate,cpuHz:this.data.cpuHz});
      // ScriptProcessor keeps the project self-contained and file:// compatible.
      this.node=this.ctx.createScriptProcessor(1024,0,1);
      this.node.onaudioprocess=e=>{
        const ch=e.outputBuffer.getChannelData(0);
        for(let i=0;i<ch.length;i++)ch[i]=this.synth.step();
      };
      this.hp=this.ctx.createBiquadFilter();this.hp.type='highpass';this.hp.frequency.value=24;
      this.gain=this.ctx.createGain();this.gain.gain.value=0.72;
      this.node.connect(this.hp);this.hp.connect(this.gain);this.gain.connect(this.ctx.destination);
    }
    if(this.ctx.state!=='running')await this.ctx.resume();
    return true;
  }
  setBgmEnabled(v){this.bgmEnabled=!!v;if(!this.bgmEnabled)this.engine.musicStop();else this.playMusic(this.currentMusic,true)}
  setSfxEnabled(v){this.sfxEnabled=!!v}
  playMusic(name,force=false){
    this.currentMusic=name;
    if(!this.bgmEnabled&&!force){this.engine.musicStop();return}
    const addr=this.data.music[name];if(addr)this.engine.musicStart(addr);
  }
  stopMusic(){this.engine.musicStop()}
  playSfx(id){if(!this.sfxEnabled)return;this.engine.sfxStart(id,id===10?1:0)}
  get regs(){return this.engine.out}
  get active(){return !!this.ctx&&this.ctx.state==='running'}
}
return{Synth,BrowserAudio,DMC_PERIOD,NOISE_PERIOD,DUTY,TRI};
});
