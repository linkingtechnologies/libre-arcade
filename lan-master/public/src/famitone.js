/* SPDX-License-Identifier: GPL-3.0-or-later */
/*
 * Minimal JavaScript port of the FamiTone v1.24 playback semantics used by
 * Lan Master. Original FamiTone code by Shiru is Public Domain.
 *
 * This module intentionally mirrors only the features used by Lan Master:
 * 5 music channels, instruments/envelopes, references/jumps, 2 SFX streams,
 * and DPCM trigger events.
 */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.LanMasterFamiTone=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';

const NOTE_TABLE=[
  0x6ad,0x64d,0x5f2,0x59d,0x54c,0x500,0x4b8,0x474,0x434,0x3f7,0x3be,0x388,
  0x356,0x326,0x2f8,0x2ce,0x2a5,0x27f,0x25b,0x239,0x219,0x1fb,0x1de,0x1c3,
  0x1aa,0x192,0x17b,0x166,0x152,0x13f,0x12d,0x11c,0x10c,0x0fd,0x0ee,0x0e1,
  0x0d4,0x0c8,0x0bd,0x0b2,0x0a8,0x09f,0x096,0x08d,0x085,0x07e,0x076,0x070,
  0x069,0x063,0x05e,0x058,0x053,0x04f,0x04a,0x046,0x042,0x03e,0x03a,0x037,
  0,0,0,0
];

function b64(s){
  if(typeof Buffer!=='undefined')return Uint8Array.from(Buffer.from(s,'base64'));
  const raw=atob(s),a=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);
  return a;
}
function signed8(v){return v&0x80?v-256:v}
function mkChannel(){return{repeat:0,note:63,instrument:0,duty:0x30,ptr:0,ret:0,refLen:0}}
function mkEnv(){return{value:0,repeat:0,addr:0,ptr:0}}
function mkSfx(){const b=new Uint8Array(11);b[0]=b[3]=b[9]=0x30;return{repeat:0,ptr:0,off:0,buf:b}}

class Engine{
  constructor(prg,opts={}){
    this.prg=prg;
    this.sfxTable=opts.sfxTable||0;
    this.dpcmTable=opts.dpcmTable||0;
    this.channels=Array.from({length:5},mkChannel);
    this.envs=Array.from({length:11},mkEnv);
    this.sfx=[mkSfx(),mkSfx()];
    this.out=new Uint8Array(11);
    this.songSpeed=0;
    this.frameCnt=0;
    this.instrumentPtr=0;
    this.sampleEvents=[];
    this.frameNumber=0;
    this.currentModule=0;
    this.musicStop();
  }
  read8(addr){
    addr&=0xffff;
    if(addr<0x8000)throw new Error('PRG address '+addr.toString(16));
    return this.prg[addr-0x8000];
  }
  read16(addr){return this.read8(addr)|(this.read8((addr+1)&0xffff)<<8)}
  musicStop(){
    for(const ch of this.channels){ch.ptr=0;ch.repeat=0;ch.refLen=0;ch.instrument=0;ch.note=63;ch.duty=0x30;ch.ret=0}
    for(const e of this.envs){e.value=0;e.repeat=0;e.addr=0;e.ptr=0}
    this.songSpeed=0;this.frameCnt=0;this.currentModule=0;
    this.sampleEvents.length=0;   // (the output keeps what the last update wrote, as the ROM's buffer does, until the next update)
  }
  musicStart(addr){
    this.currentModule=addr;
    this.songSpeed=0;
    let p=addr;
    for(let i=0;i<5;i++){
      const ch=this.channels[i];
      ch.ptr=this.read16(p);p+=2;
      ch.repeat=0;ch.refLen=0;ch.instrument=0;ch.note=63;ch.duty=0x30;ch.ret=0;
    }
    this.instrumentPtr=this.read16(p);p+=2;
    const speed=this.read8(p);
    // FamiTone initializes instrument zero envelopes but does not replace duty here.
    this._setInstrument(0,0,false);
    this._setInstrument(1,0,false);
    this._setInstrument(2,0,false);
    this._setInstrument(3,0,false);
    this.songSpeed=speed;
    this.frameCnt=speed;
    this.sampleEvents.length=0;
  }
  musicPause(paused){if(paused)this.songSpeed|=0x80;else this.songSpeed&=0x7f}
  setSfxTable(addr){this.sfxTable=addr;for(const s of this.sfx){s.repeat=0;s.ptr=0;s.off=0;this._clearSfx(s)}}
  _clearSfx(s){s.buf[6]=0;s.buf[0]=s.buf[3]=s.buf[9]=0x30}
  sfxStart(id,stream=0){
    const s=this.sfx[stream|0];if(!s||!this.sfxTable)return;
    s.ptr=0;s.repeat=0;s.off=0;this._clearSfx(s);
    s.ptr=this.read16(this.sfxTable+(id*2));
  }
  _setInstrument(channelIndex,instrument,setDuty=true){
    const ch=this.channels[channelIndex],base=this.instrumentPtr+(instrument*8);
    const envCount=channelIndex===3?2:3;
    const envBase=channelIndex===0?0:channelIndex===1?3:channelIndex===2?6:9;
    for(let i=0;i<envCount;i++){
      const e=this.envs[envBase+i];
      e.addr=this.read16(base+i*2);e.repeat=0;e.ptr=0;
    }
    const duty=this.read8(base+6);
    if(setDuty)ch.duty=duty;
    return duty;
  }
  _channelStep(ch){
    let ptr;
    if(ch.refLen){
      ch.refLen=(ch.refLen-1)&0xff;
      if(ch.refLen===0)ptr=ch.ret;
    }
    if(ptr===undefined){
      if(ch.repeat){
        ch.repeat=(ch.repeat-1)&0xff;
        return false;
      }
      ptr=ch.ptr;
    }
    for(let guard=0;guard<1024;guard++){
      const v=this.read8(ptr);ptr=(ptr+1)&0xffff;
      if(v<0x40){
        ch.note=v;ch.ptr=ptr;return true;
      }
      if(v<0x80){ch.instrument=v&0x3f;continue}
      if(v<0xc0){ch.repeat=v&0x3f;ch.ptr=ptr;return false}
      if(v===0xff){
        ch.ret=(ptr+3)&0xffff;
        ch.refLen=this.read8(ptr);
        ptr=this.read16(ptr+1);
        continue;
      }
      if(v===0xfe){
        ptr=this.read16(ptr);
        continue;
      }
      this.songSpeed=v&0x3f;
    }
    throw new Error('channelStep runaway');
  }
  _envStep(e){
    if(e.repeat){e.repeat=(e.repeat-1)&0xff;return}
    let y=e.ptr;
    for(let guard=0;guard<1024;guard++){
      const v=this.read8(e.addr+y);y=(y+1)&0xff;
      if(v>=0x80){
        e.value=(v+64)&0xff;
        e.ptr=y;
        return;
      }
      if(v===0x7f){
        y=this.read8(e.addr+y);
        continue;
      }
      e.repeat=v;
      e.ptr=y;
      return;
    }
    throw new Error('envelopeStep runaway');
  }
  _period(note,noteOff,pitch){
    const idx=(note+noteOff)&0xff;
    const base=NOTE_TABLE[idx]||0;
    return (base+signed8(pitch))&0x7ff;
  }
  _renderMusicRegs(){
    const o=this.out;
    // Reset to music values every frame; SFX are mixed later.
    const p1=this.channels[0],p2=this.channels[1],tr=this.channels[2],no=this.channels[3];
    const e=this.envs;
    if((this.songSpeed&0x80)!==0){
      o[0]=0x30;o[3]=0x30;o[6]=0x80;o[9]=0x30;
      return;
    }
    if(p1.note===63){o[0]=p1.duty}
    else{
      const per=this._period(p1.note,e[1].value,e[2].value);
      o[1]=per&0xff;o[2]=(per>>8)&7;o[0]=(e[0].value&0x0f)|p1.duty;
    }
    if(p2.note===63){o[3]=p2.duty}
    else{
      const per=this._period(p2.note,e[4].value,e[5].value);
      o[4]=per&0xff;o[5]=(per>>8)&7;o[3]=(e[3].value&0x0f)|p2.duty;
    }
    if(tr.note===63){o[6]=0x80}
    else{
      const per=this._period(tr.note,e[7].value,e[8].value);
      o[7]=per&0xff;o[8]=(per>>8)&7;o[6]=(e[6].value&0x7f)|0x80;
    }
    if(no.note===63){o[9]=0xf0}
    else{
      const ni=((no.note+e[10].value)&0x0f)^0x0f;
      o[10]=(((no.duty<<1)&0x80)|ni)&0xff;
      o[9]=(e[9].value&0x0f)|0xf0;
    }
  }
  _updateSfx(s){
    if(s.repeat){s.repeat=(s.repeat-1)&0xff;this._mixSfx(s);return}
    if(!s.ptr)return;
    let y=s.off;
    for(let guard=0;guard<1024;guard++){
      const v=this.read8(s.ptr+y);y=(y+1)&0xff;
      if(v<0x10){
        const val=this.read8(s.ptr+y);y=(y+1)&0xff;
        s.buf[v]=val;continue;
      }
      if(v===0xff){s.ptr=0;this._mixSfx(s);return}
      s.repeat=(v-0x10)&0xff;s.off=y;this._mixSfx(s);return;
    }
    throw new Error('SFX runaway');
  }
  _mixSfx(s){
    const o=this.out,b=s.buf;
    if((b[0]&15)>=(o[0]&15)){o[0]=b[0];o[1]=b[1];o[2]=b[2]}
    if((b[3]&15)>=(o[3]&15)){o[3]=b[3];o[4]=b[4];o[5]=b[5]}
    if(b[6]){o[6]=b[6];o[7]=b[7];o[8]=b[8]}
    if((b[9]&15)>(o[9]&15)){o[9]=b[9];o[10]=b[10]}
  }
  update(){
    this.sampleEvents.length=0;
    const speed=this.songSpeed;
    if(speed && !(speed&0x80)){
      if(this.frameCnt===0 || this.frameCnt>=0x80){
        for(let i=0;i<4;i++){
          const fresh=this._channelStep(this.channels[i]);
          if(fresh)this._setInstrument(i,this.channels[i].instrument,true);
        }
        const fresh5=this._channelStep(this.channels[4]);
        if(fresh5){
          const n=this.channels[4].note;
          if(n!==63)this.sampleEvents.push(n);
        }
        this.frameCnt=(this.frameCnt+this.songSpeed)&0xff;
      }
      for(const e of this.envs)this._envStep(e);
    }
    this._renderMusicRegs();
    this.frameCnt=(this.frameCnt-1)&0xff;
    for(const s of this.sfx)this._updateSfx(s);
    this.frameNumber++;
    return this.out;
  }
  dpcmInfo(sample){
    const p=this.dpcmTable+(sample*4);
    const start=this.read8(p),len=this.read8(p+1),pitch=this.read8(p+2);
    return{
      sample,startReg:start,lengthReg:len,pitchReg:pitch,
      addr:0xC000+(start*64),
      bytes:len*16+1,
      rateIndex:pitch&0x0f,
      loop:!!(pitch&0x40)
    };
  }
  snapshot(){
    return{
      module:this.currentModule,speed:this.songSpeed,frameCnt:this.frameCnt,
      regs:Array.from(this.out),sampleEvents:[...this.sampleEvents],
      channels:this.channels.map(c=>({...c})),
      envValues:this.envs.map(e=>e.value)
    };
  }
}
return{Engine,b64,NOTE_TABLE,signed8};
});
