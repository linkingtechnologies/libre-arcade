// SPDX-License-Identifier: GPL-3.0-or-later
// Clean-room Web Audio reconstruction of Nova Pinball's SFX roles.
// No original WAV is redistributed. Durations/trigger roles were measured from v0.2.3.
export class CleanAudio {
  constructor(){
    this.ctx=null;this.enabled=true;this.master=.48;this.last=new Map();this.bus=null;this.compressor=null;this.unlocking=null;this.warned=false;this.loops=new Map();
  }
  setEnabled(v){this.enabled=!!v;if(!this.enabled)this.stopAllLoops();}
  setupGraph(){
    if(!this.ctx||this.bus)return;
    this.bus=this.ctx.createGain();this.bus.gain.value=this.master;
    this.compressor=this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value=-20;this.compressor.knee.value=14;this.compressor.ratio.value=5;this.compressor.attack.value=.004;this.compressor.release.value=.16;
    this.bus.connect(this.compressor).connect(this.ctx.destination);
  }
  async unlock(){
    if(!this.enabled)return false;
    if(this.ctx?.state==='running'&&this.bus)return true;
    if(this.unlocking)return this.unlocking;
    this.unlocking=(async()=>{
      const AC=window.AudioContext||window.webkitAudioContext;
      if(!AC){if(!this.warned){console.warn('Web Audio API unavailable: sound effects disabled.');this.warned=true;}return false;}
      try{
        if(!this.ctx||this.ctx.state==='closed'){this.ctx=new AC({latencyHint:'interactive'});this.bus=null;this.compressor=null;this.setupGraph();}
        if(this.ctx.state!=='running'&&typeof this.ctx.resume==='function')await this.ctx.resume();
        return this.ctx.state==='running';
      }catch(err){if(!this.warned){console.warn('Unable to start Web Audio:',err);this.warned=true;}return false;}
    })();
    try{return await this.unlocking;}finally{this.unlocking=null;}
  }
  gate(name,ms=18){const now=performance.now(),prev=this.last.get(name)||0;if(now-prev<ms)return false;this.last.set(name,now);return true;}
  tone(freq=440,dur=.08,{type='sine',gain=.13,slide=0,delay=0,attack=.004}={}){
    if(!this.enabled||!this.ctx||!this.bus||this.ctx.state!=='running')return;
    const now=this.ctx.currentTime+delay,osc=this.ctx.createOscillator(),g=this.ctx.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,now);
    if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(25,freq+slide),now+dur);
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),now+Math.min(attack,dur*.25));g.gain.exponentialRampToValueAtTime(.0001,now+dur);
    osc.connect(g).connect(this.bus);osc.start(now);osc.stop(now+dur+.02);
  }
  noise(dur=.06,gain=.12,highpass=500,{delay=0,lowpass=0}={}){
    if(!this.enabled||!this.ctx||!this.bus||this.ctx.state!=='running')return;
    const rate=this.ctx.sampleRate,len=Math.max(1,Math.floor(rate*dur)),buf=this.ctx.createBuffer(1,len,rate),a=buf.getChannelData(0);
    for(let i=0;i<len;i++)a[i]=(Math.random()*2-1)*(1-i/len);
    const src=this.ctx.createBufferSource(),hp=this.ctx.createBiquadFilter(),g=this.ctx.createGain();hp.type='highpass';hp.frequency.value=highpass;g.gain.value=gain;src.buffer=buf;
    if(lowpass){const lp=this.ctx.createBiquadFilter();lp.type='lowpass';lp.frequency.value=lowpass;src.connect(hp).connect(lp).connect(g).connect(this.bus);}else src.connect(hp).connect(g).connect(this.bus);
    src.start(this.ctx.currentTime+delay);
  }
  startWormholeLoop(){
    if(this.loops.has('wormhole')||!this.ctx||!this.bus)return;
    const now=this.ctx.currentTime,g=this.ctx.createGain(),a=this.ctx.createOscillator(),b=this.ctx.createOscillator(),lfo=this.ctx.createOscillator(),lg=this.ctx.createGain();
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.035,now+.25);
    a.type='sawtooth';a.frequency.value=147;a.detune.value=-9;b.type='triangle';b.frequency.value=294;b.detune.value=11;
    lfo.frequency.value=.37;lg.gain.value=19;lfo.connect(lg).connect(a.frequency);lfo.connect(lg).connect(b.frequency);
    a.connect(g);b.connect(g);g.connect(this.bus);a.start(now);b.start(now);lfo.start(now);
    this.loops.set('wormhole',{nodes:[a,b,lfo],gain:g});
  }
  stopLoop(name){
    const loop=this.loops.get(name);if(!loop)return;const now=this.ctx?.currentTime||0;
    try{loop.gain.gain.cancelScheduledValues?.(now);loop.gain.gain.setValueAtTime?.(Math.max(.0001,loop.gain.gain.value||.03),now);loop.gain.gain.exponentialRampToValueAtTime?.(.0001,now+.16);}catch{}
    for(const n of loop.nodes)try{n.stop(now+.18);}catch{}
    this.loops.delete(name);
  }
  stopAllLoops(){for(const name of [...this.loops.keys()])this.stopLoop(name);}
  play(name){
    if(!this.enabled)return;
    if(!this.ctx||!this.bus||this.ctx.state!=='running'){this.unlock().then(ok=>{if(ok&&this.enabled)this._play(name);});return;}
    this._play(name);
  }
  _play(name){
    if(!this.enabled||!this.ctx||!this.bus||this.ctx.state!=='running'||!this.gate(name,name==='flipper'?34:14))return;
    const jitter=(range=1)=>1+(Math.random()-.5)*range;
    switch(name){
      // 0.251 s original: bright mechanical snap around the upper mids.
      case 'flipper':
        this.noise(.075,.055,900,{lowpass:6200});this.tone(1280*jitter(.06),.11,{type:'square',gain:.085,slide:-620});this.tone(310,.24,{type:'triangle',gain:.035,slide:-110,delay:.015});break;
      // 0.305 s original: strong launcher thump with upward mechanical sweep.
      case 'launch':
        this.noise(.15,.095,90,{lowpass:4300});this.tone(72,.29,{type:'sawtooth',gain:.09,slide:520});this.tone(420,.12,{type:'triangle',gain:.05,slide:230,delay:.08});break;
      // 0.475 s original: low table shove / cabinet rumble.
      case 'nudge':
        this.noise(.44,.105,35,{lowpass:3200});this.tone(46,.34,{type:'sine',gain:.06,slide:-12});break;
      // 0.295 s original: chunky bumper pulse.
      case 'bumper':
        this.noise(.11,.055,220,{lowpass:4700});this.tone(165*jitter(.12),.28,{type:'triangle',gain:.13,slide:430});this.tone(505*jitter(.08),.13,{type:'sine',gain:.05,slide:150});break;
      // 0.033 s original: tiny wall tick.
      case 'wall': this.noise(.032,.075,90,{lowpass:4400});this.tone(105,.028,{type:'triangle',gain:.035,slide:-35});break;
      // 0.032 s original: very short bright target click.
      case 'target': this.tone(1770*jitter(.08),.031,{type:'square',gain:.075,slide:180,attack:.001});this.noise(.025,.03,1900);break;
      // 1.041 s original: long ascending ramp flourish.
      case 'ramp':
        this.tone(380,.42,{type:'triangle',gain:.075,slide:620});this.tone(760,.52,{type:'sine',gain:.052,slide:900,delay:.18});this.noise(.62,.025,3100,{delay:.12});break;
      // 0.389 s original word bonus flourish.
      case 'wordbonus':
        this.tone(520,.11,{type:'square',gain:.08,slide:120});this.tone(690,.13,{type:'triangle',gain:.09,slide:150,delay:.09});this.tone(910,.17,{type:'sine',gain:.075,slide:220,delay:.20});break;
      // 0.285 / 0.279 s lock/release thumps.
      case 'blackhole-lock': this.noise(.22,.08,45,{lowpass:3200});this.tone(64,.28,{type:'sawtooth',gain:.10,slide:-28});break;
      case 'blackhole-release': this.tone(54,.27,{type:'sawtooth',gain:.095,slide:330});this.noise(.18,.05,80,{lowpass:3900});break;
      // 2.522 s black-hole appearance.
      case 'blackhole':
        this.tone(78,2.45,{type:'sawtooth',gain:.07,slide:-48,attack:.06});this.tone(156,1.8,{type:'triangle',gain:.035,slide:-90,delay:.12});this.noise(2.1,.025,25,{lowpass:2600});break;
      // 3.298 s used for Hydrogen Release + both fusion stages.
      case 'hydrogen-released':
        this.tone(310,2.9,{type:'sawtooth',gain:.045,slide:1900,attack:.08});this.tone(620,2.3,{type:'triangle',gain:.035,slide:1400,delay:.35});this.noise(2.8,.018,850,{delay:.15,lowpass:5100});break;
      // 2.548 s high spectral time-warp layer.
      case 'timewarp':
        this.tone(1700,2.45,{type:'sine',gain:.023,slide:7200,attack:.08});this.tone(3300,1.85,{type:'triangle',gain:.017,slide:8400,delay:.22});break;
      // 2.310 s source loops in original until reset.
      case 'wormhole':
        this.startWormholeLoop();this.tone(1470,1.65,{type:'triangle',gain:.035,slide:2400,attack:.06});this.noise(1.8,.012,5200);break;
      // 1.456 s original wormhole close.
      case 'wormhole-close':
        this.tone(6900,1.32,{type:'sine',gain:.024,slide:-6100,attack:.025});this.noise(1.25,.022,3300);break;
      // 1.618 s original reset bonus.
      case 'supergravity-bonus':
        this.tone(548,.32,{type:'triangle',gain:.085,slide:210});this.tone(760,.38,{type:'triangle',gain:.075,slide:250,delay:.25});this.tone(1040,.65,{type:'sine',gain:.07,slide:420,delay:.52});break;
      // 0.549 s original drain effect.
      case 'ball-drained':
        this.tone(374,.52,{type:'triangle',gain:.10,slide:-300});this.noise(.46,.045,900,{lowpass:8200});break;
      // 0.073 s original menu tick.
      case 'menu': this.tone(590*jitter(.05),.07,{type:'square',gain:.06,slide:75,attack:.001});break;
      // Compatibility aliases retained for tests/older calls.
      case 'bonus': this._play('wordbonus');break;
      case 'kicker': this._play('bumper');break;
      case 'drain': this._play('ball-drained');break;
      case 'tilt': this.tone(98,.32,{type:'square',gain:.10,slide:-35});break;
    }
  }
}
