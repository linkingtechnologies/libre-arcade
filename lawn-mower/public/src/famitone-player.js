// SPDX-License-Identifier: GPL-3.0-or-later
// Behavioral JavaScript port of the subset of Shiru's Public Domain FamiTone v1.23
// used by Lawn Mower. It interprets the original exported byte streams from /reference.
import { FAMITONE_BASE, FAMITONE_LABELS, SFX_LABELS, FAMITONE_MEMORY } from './famitone-data.js';

const NOTE_TABLE=[
  0x6ad,0x64d,0x5f2,0x59d,0x54c,0x500,0x4b8,0x474,0x434,0x3f7,0x3be,0x388,
  0x356,0x326,0x2f8,0x2ce,0x2a5,0x27f,0x25b,0x239,0x219,0x1fb,0x1de,0x1c3,
  0x1aa,0x192,0x17b,0x166,0x152,0x13f,0x12d,0x11c,0x10c,0x0fd,0x0ee,0x0e1,
  0x0d4,0x0c8,0x0bd,0x0b2,0x0a8,0x09f,0x096,0x08d,0x085,0x07e,0x076,0x070,
  0x069,0x063,0x05e,0x058,0x053,0x04f,0x04a,0x046,0x042,0x03e,0x03a,0x037,0,0,0,0,
];

const TRACK_TO_LABEL={
  title:'bgm_title_module', game:'bgm_game_module', levelclear:'bgm_levelclear_module',
  outoffuel:'bgm_outoffuel_module', welldone:'bgm_welldone_module',
};

function u8(v){return v&255;}
function s8(v){return (v&0x80)?v-256:v;}

class Mem {
  constructor(bytes=FAMITONE_MEMORY,base=FAMITONE_BASE){this.bytes=bytes;this.base=base;}
  b(addr){const i=addr-this.base;if(i<0||i>=this.bytes.length)throw new RangeError(`FamiTone read ${addr.toString(16)}`);return this.bytes[i];}
  w(addr){return this.b(addr)|(this.b(addr+1)<<8);}
}

function newChannel(ptr=0){return {repeat:0,note:63,instrument:0,duty:0x30,ptr,returnPtr:0,refLen:0};}
function newEnv(){return {value:0,repeat:0,addr:0,ptr:0};}

export class FamiToneSequencer {
  constructor({memory=FAMITONE_MEMORY,base=FAMITONE_BASE}={}){
    this.mem=new Mem(memory,base); this.channels=Array.from({length:5},()=>newChannel());
    this.env=Array.from({length:11},()=>newEnv()); this.speed=0; this.frameCnt=0; this.instrumentPtr=0; this.paused=false;
    // FT_OUT_BUF: the 11 bytes the original sends to the sound chip. It lives in RAM from one frame to the next: the music routine
    // only rewrites a channel's pitch bytes while it has a note (a silent channel keeps the last pitch), and the effects are merged
    // into the same buffer, so what an effect left there stays until a note replaces it.
    this.out=new Uint8Array(11);
  }
  start(track){
    const label=TRACK_TO_LABEL[track]??track; const module=typeof label==='number'?label:FAMITONE_LABELS[label];
    if(!module)throw new Error(`Unknown FamiTone track ${track}`);
    let p=module;
    this.channels=Array.from({length:5},()=>newChannel());
    for(let i=0;i<5;i++){this.channels[i]=newChannel(this.mem.w(p));p+=2;}
    this.instrumentPtr=this.mem.w(p);p+=2; this.speed=this.mem.b(p); this.frameCnt=0; this.paused=false;
    this.env=Array.from({length:11},()=>newEnv());
    for(let ch=0;ch<4;ch++) this.setInstrument(ch,0);     // the envelopes of instrument 0; the duty stays $30 until a note comes
    return this;
  }
  /** FamiToneMusicStop: every channel back to "no note", pointers and counters cleared, volumes zero, no music. */
  stop(){
    this.speed=0;this.paused=false;
    for(const c of this.channels){c.note=63;c.ptr=0;c.repeat=0;c.refLen=0;c.instrument=0;c.duty=0x30;}
    for(const e of this.env)e.value=0;
  }
  pause(on=true){this.paused=Boolean(on);}
  setInstrument(chIndex,instrument){
    const c=this.channels[chIndex]; c.instrument=instrument;
    let p=this.instrumentPtr + instrument*8; const envCount=chIndex===3?2:3; const base=chIndex*3;
    for(let i=0;i<envCount;i++){
      const e=this.env[base+i]; e.addr=this.mem.w(p); p+=2; e.repeat=0;e.ptr=0;e.value=0;
    }
    return this.mem.b(this.instrumentPtr + instrument*8 + 6);                  // the instrument's duty cycle
  }
  channelStep(c){
    if(c.refLen){c.refLen--;if(c.refLen===0)c.ptr=c.returnPtr;}
    if(c.repeat){c.repeat--;return false;}
    let p=c.ptr;
    for(let guard=0;guard<256;guard++){
      const v=this.mem.b(p++);
      if(v<0x40){c.note=v;c.ptr=p;return true;}
      if(v<0xc0){
        if(v>=0x80){c.repeat=v&0x3f;c.ptr=p;return false;}
        c.instrument=v&0x3f;continue;
      }
      if(v===0xff){
        c.returnPtr=p+3; c.refLen=this.mem.b(p); const target=this.mem.w(p+1); p=target; continue;
      }
      if(v===0xfe){p=this.mem.w(p);continue;}
      this.speed=v&0x3f;
    }
    throw new Error('FamiTone channel runaway');
  }
  envelopeStep(e){
    if(e.repeat){e.repeat--;return;}
    let p=e.addr+e.ptr;
    for(let guard=0;guard<64;guard++){
      const v=this.mem.b(p++);
      if(v>=0x80){e.value=u8(v-192);e.ptr=p-e.addr;return;}
      if(v===127){const loop=this.mem.b(p);p=e.addr+loop;continue;}
      e.repeat=v;e.ptr=p-e.addr;return;
    }
    throw new Error('FamiTone envelope runaway');
  }
  update(){
    if(!this.speed||this.paused){return this.registers();}
    if(this.frameCnt===0){
      for(let ch=0;ch<4;ch++){
        const isNew=this.channelStep(this.channels[ch]);
        if(isNew)this.channels[ch].duty=this.setInstrument(ch,this.channels[ch].instrument);
      }
      this.channelStep(this.channels[4]); // Fxx speed/control channel; DPCM disabled in Lawn Mower.
      this.frameCnt=this.speed;
    }
    for(const e of this.env)this.envelopeStep(e);
    const regs=this.registers();
    this.frameCnt=u8(this.frameCnt-1);
    return regs;
  }
  registers(){
    const out=this.out;
    if(this.paused){out[0]=out[3]=out[9]=0x30;out[6]=0x80;return out;}
    for(let ch=0;ch<3;ch++){
      const c=this.channels[ch], base=ch*3, o=ch*3;
      let vol=0;
      if(c.note!==63){
        const noteOff=this.env[base+1]?.value??0, pitch=s8(this.env[base+2]?.value??0);
        const timer=Math.max(0,(NOTE_TABLE[u8(c.note+noteOff)]??0)+pitch);
        out[o+1]=timer&255;out[o+2]=(timer>>8)&7;
        vol=this.env[base]?.value??0;
      }
      out[o]=ch===2 ? u8(0x80|vol) : u8((c.duty&0xf0)|vol);
    }
    const n=this.channels[3]; let nv=0;
    if(n.note!==63){
      const no=this.env[10]?.value??0;
      out[10]=((u8(n.note+no)&15)^15)|(((n.duty<<1)&0x80));
      nv=this.env[9]?.value??0;
    }
    out[9]=u8(0xf0|nv);
    return out;
  }
}

function clearSfxBuf(){const b=new Uint8Array(11);b[0]=b[3]=b[9]=0x30;return b;}
export class FamiToneSfxSequencer {
  constructor({memory=FAMITONE_MEMORY,base=FAMITONE_BASE}={}){this.mem=new Mem(memory,base);this.streams=Array.from({length:3},()=>({active:false,ptr:0,off:0,repeat:0,buf:clearSfxBuf()}));}
  start(effect,stream=0){if(effect<0||effect>13)throw new RangeError('sfx');const s=this.streams[stream];s.active=true;s.ptr=SFX_LABELS[`sfx${effect}`];s.off=0;s.repeat=0;s.buf=clearSfxBuf();}
  // SFX_MUTE is an effect like the others (number 10, which is only an end mark): it clears the stream's buffer and is mixed once.
  mute(stream){this.start(10,stream);}
  // FamiToneSfxUpdate: returns true when the stream's buffer is to be mixed into the output (an idle stream is skipped altogether).
  stepStream(s){
    if(s.repeat){s.repeat--;return true;}
    if(!s.active)return false;
    let p=s.ptr+s.off;
    for(let guard=0;guard<128;guard++){
      const v=this.mem.b(p++);
      if(v<0x10){s.buf[v]=this.mem.b(p++);continue;}
      if(v===0xff){s.active=false;s.ptr=0;s.off=0;return true;}
      s.repeat=u8(v-0x10);s.off=p-s.ptr;return true;
    }
    throw new Error('FamiTone SFX runaway');
  }
  update(out){
    // merges the effects into the music's output buffer in place, as FamiToneSfxUpdate does
    for(const s of this.streams){
      if(!this.stepStream(s))continue; const b=s.buf;
      if((b[0]&15)>=(out[0]&15)){out[0]=b[0];out[1]=b[1];out[2]=b[2];}
      if((b[3]&15)>=(out[3]&15)){out[3]=b[3];out[4]=b[4];out[5]=b[5];}
      if(b[6]){out[6]=b[6];out[7]=b[7];out[8]=b[8];}
      if((b[9]&15)>(out[9]&15)){out[9]=b[9];out[10]=b[10];}
    }
    return out;
  }
}

export function pulseTimerToHz(timer,cpu=1789773){return timer>0?cpu/(16*(timer+1)):0;}
export function triangleTimerToHz(timer,cpu=1789773){return timer>0?cpu/(32*(timer+1)):0;}
export const NOISE_PERIOD_NTSC=[4,8,16,32,64,96,128,160,202,254,380,508,762,1016,2034,4068];
export { TRACK_TO_LABEL, NOTE_TABLE };
