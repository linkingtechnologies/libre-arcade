export class ProceduralAudio {
  constructor(){
    this.context=null;this.master=null;this.sfxBus=null;this.musicBus=null;
    this.sfxEnabled=true;this.musicEnabled=true;
    this.masterVolume=.82;this.sfxVolume=.72;this.musicVolume=.38;
    this.lastCollisionAt=-Infinity;
    this.musicUrl='assets/music/mechanical-night-loop.ogg';
    this.musicBuffer=null;this.musicLoadPromise=null;this.musicSource=null;
    this.fallbackAmbience=null;
  }
  async ensureReady(){
    if(!this.context){
      this.context=new AudioContext();
      this.master=this.context.createGain();this.master.gain.value=this.masterVolume;this.master.connect(this.context.destination);
      this.sfxBus=this.context.createGain();this.sfxBus.gain.value=this.sfxEnabled?this.sfxVolume:0;this.sfxBus.connect(this.master);
      this.musicBus=this.context.createGain();this.musicBus.gain.value=this.musicEnabled?this.musicVolume:0;this.musicBus.connect(this.master);
    }
    if(this.context.state==='suspended')await this.context.resume();
    return true;
  }
  setSfxEnabled(v){this.sfxEnabled=Boolean(v);if(this.sfxBus)this.sfxBus.gain.value=this.sfxEnabled?this.sfxVolume:0;}
  setMusicEnabled(v){this.musicEnabled=Boolean(v);if(this.musicBus)this.musicBus.gain.value=this.musicEnabled?this.musicVolume:0;if(!this.musicEnabled)this.stopMusic();}
  // Compatibility with the pre-1.1 API.
  setEnabled(v){this.setSfxEnabled(v);}
  async tone({from=440,to=220,duration=.09,gain=.12,type='triangle'}={}){
    if(!this.sfxEnabled)return;
    await this.ensureReady();
    const now=this.context.currentTime,osc=this.context.createOscillator(),amp=this.context.createGain();
    osc.type=type;osc.frequency.setValueAtTime(from,now);osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),now+duration);
    amp.gain.setValueAtTime(gain,now);amp.gain.exponentialRampToValueAtTime(.0001,now+duration);
    osc.connect(amp).connect(this.sfxBus);osc.start(now);osc.stop(now+duration+.02);
  }
  async loadMusic(){
    if(this.musicBuffer)return this.musicBuffer;
    if(!this.musicLoadPromise){
      this.musicLoadPromise=(async()=>{
        await this.ensureReady();
        const response=await fetch(this.musicUrl,{cache:'force-cache'});
        if(!response.ok)throw new Error(`Music load failed: ${response.status}`);
        const bytes=await response.arrayBuffer();
        this.musicBuffer=await this.context.decodeAudioData(bytes.slice(0));
        return this.musicBuffer;
      })().catch(error=>{this.musicLoadPromise=null;throw error;});
    }
    return this.musicLoadPromise;
  }
  async startMusic(){
    if(!this.musicEnabled||this.musicSource)return;
    try{
      const buffer=await this.loadMusic();
      if(!this.musicEnabled||this.musicSource)return;
      const source=this.context.createBufferSource();
      source.buffer=buffer;source.loop=true;source.connect(this.musicBus);source.start();
      source.onended=()=>{if(this.musicSource===source)this.musicSource=null;};
      this.musicSource=source;
      this.stopFallbackAmbience();
    }catch(error){
      console.warn('Bundled music unavailable; using procedural fallback.',error);
      await this.startFallbackAmbience();
    }
  }
  stopMusic(){
    if(this.musicSource){try{this.musicSource.stop();}catch{}this.musicSource=null;}
    this.stopFallbackAmbience();
  }
  async startFallbackAmbience(){
    if(this.fallbackAmbience||!this.musicEnabled)return;
    await this.ensureReady();
    const ctx=this.context,bus=ctx.createGain(),filter=ctx.createBiquadFilter();
    bus.gain.value=.075;filter.type='lowpass';filter.frequency.value=1050;filter.Q.value=.7;
    bus.connect(filter).connect(this.musicBus);
    const a=ctx.createOscillator(),b=ctx.createOscillator(),lfo=ctx.createOscillator(),lfoGain=ctx.createGain();
    a.type='triangle';a.frequency.value=82.407;b.type='sine';b.frequency.value=123.471;
    const aGain=ctx.createGain(),bGain=ctx.createGain();aGain.gain.value=.52;bGain.gain.value=.30;
    a.connect(aGain).connect(bus);b.connect(bGain).connect(bus);
    lfo.type='sine';lfo.frequency.value=.18;lfoGain.gain.value=.015;lfo.connect(lfoGain).connect(bus.gain);
    const now=ctx.currentTime;a.start(now);b.start(now);lfo.start(now);
    this.fallbackAmbience={bus,filter,a,b,lfo,aGain,bGain};
  }
  stopFallbackAmbience(){
    if(!this.fallbackAmbience)return;
    const now=this.context?.currentTime??0;
    for(const osc of [this.fallbackAmbience.a,this.fallbackAmbience.b,this.fallbackAmbience.lfo]){try{osc.stop(now+.08);}catch{}}
    this.fallbackAmbience=null;
  }
  // Backwards-compatible names retained for diagnostics/tests from older milestones.
  startAmbience(){return this.startMusic();}
  stopAmbience(){return this.stopMusic();}
  flipper(direction='up'){if(direction==='down')this.tone({from:125,to:95,duration:.055,gain:.055,type:'square'});else this.tone({from:185,to:112,duration:.065,gain:.072,type:'square'});}
  launch(){this.tone({from:170,to:520,duration:.16,gain:.09});}
  bumper(){this.tone({from:620,to:300,duration:.09,gain:.08,type:'sine'});}
  lost(){this.tone({from:260,to:85,duration:.45,gain:.08});}
  light(){this.tone({from:920,to:1080,duration:.07,gain:.045,type:'sine'});}
  extraBall(){this.tone({from:440,to:880,duration:.3,gain:.06,type:'triangle'});}
  ballCollision(){if(!this.sfxEnabled||!this.context)return;const now=this.context.currentTime;if(now-this.lastCollisionAt<.022)return;this.lastCollisionAt=now;this.tone({from:430,to:280,duration:.035,gain:.018,type:'triangle'});}
  event(name){const map={ballCollision:()=>this.ballCollision(),bigBumper:()=>this.tone({from:420,to:180,duration:.11,gain:.09}),smallBumper:()=>this.bumper(),leftKicker:()=>this.tone({from:260,to:120,duration:.1,gain:.08,type:'square'}),light:()=>this.light(),lateralLight:()=>this.tone({from:760,to:980,duration:.08,gain:.05}),peg:()=>this.tone({from:700,to:420,duration:.05,gain:.05,type:'square'}),rampEntrance:()=>this.tone({from:260,to:650,duration:.18,gain:.06}),rampExit:()=>this.tone({from:620,to:320,duration:.13,gain:.06}),tunnel:()=>this.tone({from:300,to:640,duration:.35,gain:.055,type:'sine'}),thirdRamp:()=>this.tone({from:330,to:990,duration:.4,gain:.07}),kickerUsed:()=>this.tone({from:140,to:360,duration:.1,gain:.06,type:'square'})};map[name]?.();}
}
