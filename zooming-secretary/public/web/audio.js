/* SPDX-License-Identifier: GPL-3.0-or-later */

// Small clean-room Web Audio sound engine. It synthesizes all effects at runtime;
// there are no bundled audio samples and no historical sound data in this package.
export class AudioEngine {
  constructor({enabled=true, contextFactory=null}={}) {
    this.enabled=Boolean(enabled);
    this.contextFactory=contextFactory;
    this.ctx=null;
    this.master=null;
  }

  async unlock() {
    if (!this.enabled) return false;
    if (!this.ctx) {
      const Ctor=this.contextFactory ?? globalThis.AudioContext ?? globalThis.webkitAudioContext;
      if (!Ctor) return false;
      this.ctx=typeof Ctor==='function' ? new Ctor() : Ctor;
      this.master=this.ctx.createGain();
      this.master.gain.value=0.16;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state==='suspended' && this.ctx.resume) await this.ctx.resume();
    return true;
  }

  setEnabled(enabled) {
    this.enabled=Boolean(enabled);
    if (this.master) this.master.gain.value=this.enabled?0.16:0;
  }

  play(name) {
    if (!this.enabled) return;
    this.unlock().then(ok=>{ if(ok && this.enabled) this.#playNow(name); }).catch(()=>{});
  }

  #tone(freq,duration,offset=0,{type='square',gain=0.34,endFreq=null}={}) {
    const ctx=this.ctx;
    const when=ctx.currentTime+offset;
    const osc=ctx.createOscillator();
    const amp=ctx.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(freq,when);
    if(endFreq!=null) osc.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),when+duration);
    amp.gain.setValueAtTime(0.0001,when);
    amp.gain.exponentialRampToValueAtTime(gain,when+0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001,when+duration);
    osc.connect(amp); amp.connect(this.master);
    osc.start(when); osc.stop(when+duration+0.01);
  }

  #noise(duration,offset=0,gain=0.22) {
    const ctx=this.ctx;
    const length=Math.max(1,Math.floor(ctx.sampleRate*duration));
    const buffer=ctx.createBuffer(1,length,ctx.sampleRate);
    const data=buffer.getChannelData(0);
    for(let i=0;i<length;i++) data[i]=(Math.random()*2-1)*(1-i/length);
    const source=ctx.createBufferSource();
    const amp=ctx.createGain();
    source.buffer=buffer;
    const when=ctx.currentTime+offset;
    amp.gain.setValueAtTime(gain,when);
    amp.gain.exponentialRampToValueAtTime(0.0001,when+duration);
    source.connect(amp); amp.connect(this.master);
    source.start(when);
  }

  #playNow(name) {
    switch(name) {
      case 'start':
        this.#tone(392,.055,0); this.#tone(523,.065,.055); break;
      case 'ring':
        this.#tone(880,.07,0,{gain:.25}); this.#tone(660,.07,.09,{gain:.25}); break;
      case 'answer':
        this.#tone(523,.045,0); this.#tone(659,.045,.045); this.#tone(784,.08,.09); break;
      case 'topic':
        this.#tone(440,.045,0,{gain:.25}); this.#tone(660,.06,.05,{gain:.25}); break;
      case 'miss':
        this.#tone(220,.08,0,{type:'sawtooth',endFreq:150}); this.#tone(130,.11,.08,{type:'square'}); break;
      case 'coffee-ready':
        this.#tone(988,.035,0,{gain:.22}); this.#tone(1319,.055,.045,{gain:.22}); break;
      case 'coffee':
        this.#tone(523,.04,0); this.#tone(784,.04,.045); this.#tone(1047,.07,.09); break;
      case 'teleport':
        this.#tone(1200,.12,0,{type:'square',gain:.23,endFreq:280}); break;
      case 'ghost':
        this.#tone(150,.18,0,{type:'sawtooth',gain:.22,endFreq:65}); break;
      case 'knock':
        this.#noise(.055,0,.28); this.#tone(105,.08,0,{type:'square',gain:.22}); break;
      case 'wisdom':
        this.#tone(523,.04,0); this.#tone(659,.04,.045); this.#tone(784,.04,.09); this.#tone(1047,.09,.135); break;
      case 'win':
        this.#tone(523,.05,0); this.#tone(659,.05,.06); this.#tone(784,.05,.12); this.#tone(1047,.12,.18); break;
      case 'lose':
        this.#tone(330,.08,0); this.#tone(247,.08,.09); this.#tone(196,.14,.18); break;
      case 'pause':
        this.#tone(440,.045,0,{gain:.2}); break;
      case 'resume':
        this.#tone(660,.045,0,{gain:.2}); break;
      case 'ui':
        this.#tone(720,.025,0,{gain:.14}); break;
    }
  }
}
