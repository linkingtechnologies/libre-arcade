export class AudioSystem {
  constructor({soundOn=true,musicOn=true}={}){
    this.soundOn=soundOn;
    this.musicOn=musicOn;
    this.ctx=null;
    this.fxGain=null;
    this.musicGain=null;
    this.musicTimer=null;
    this.musicStep=0;
    this.nextMusicTime=0;
    this.thudVariant=0;
  }
  _ctxCtor(){return globalThis.AudioContext||globalThis.webkitAudioContext||null;}
  ensure(){
    const Ctor=this._ctxCtor();
    if(!Ctor)return null;
    try{
      if(this.ctx?.state==='closed')this._resetContext();
      if(!this.ctx){
        this.ctx=new Ctor();
        this.fxGain=this.ctx.createGain();
        this.musicGain=this.ctx.createGain();
        this.fxGain.gain.value=0.9;
        this.musicGain.gain.value=0;
        this.fxGain.connect(this.ctx.destination);
        this.musicGain.connect(this.ctx.destination);
      }
      if(this.ctx.state==='suspended'){const p=this.ctx.resume();p?.catch?.(()=>{});}
      return this.ctx;
    }catch{return null;}
  }
  _resetContext(){
    if(this.musicTimer){clearInterval(this.musicTimer);this.musicTimer=null;}
    this.ctx=this.fxGain=this.musicGain=null;
  }
  setSound(on){this.soundOn=!!on;if(this.soundOn)this.ensure();}
  setMusic(on){this.musicOn=!!on;if(this.musicOn){void this.unlock();}else this.stopMusic();}
  async unlock(){
    const a=this.ensure();if(!a)return null;
    try{if(a.state==='suspended')await a.resume();}catch{}
    if(this.musicOn)this.startMusic();
    return a;
  }
  _osc({freq=220,dur=.08,vol=.03,type='sine',when=null,endFreq=null,dest=null,attack=.004}={}){
    const a=this.ensure();if(!a)return;
    const t=when??a.currentTime;
    try{
      const o=a.createOscillator(),g=a.createGain();
      o.type=type;
      o.frequency.setValueAtTime(Math.max(1,freq),t);
      if(endFreq!==null)o.frequency.exponentialRampToValueAtTime(Math.max(1,endFreq),t+dur);
      g.gain.setValueAtTime(.0001,t);
      g.gain.exponentialRampToValueAtTime(Math.max(.0002,vol),t+attack);
      g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      o.connect(g);g.connect(dest||this.fxGain);
      o.start(t);o.stop(t+dur+.01);
    }catch{}
  }
  _noise({dur=.06,vol=.015,when=null,cutoff=500}={}){
    const a=this.ensure();if(!a)return;
    const t=when??a.currentTime;
    try{
      const len=Math.max(32,Math.floor(a.sampleRate*dur));
      const buffer=a.createBuffer(1,len,a.sampleRate),data=buffer.getChannelData(0);
      for(let i=0;i<len;i++)data[i]=(Math.random()*2-1)*(1-i/len);
      const src=a.createBufferSource(),filter=a.createBiquadFilter(),g=a.createGain();
      src.buffer=buffer;filter.type='lowpass';filter.frequency.value=cutoff;
      g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
      src.connect(filter);filter.connect(g);g.connect(this.fxGain);src.start(t);src.stop(t+dur+.01);
    }catch{}
  }
  uiBeep(){if(!this.soundOn)return;this._osc({freq:520,dur:.038,vol:.018,type:'square'});}
  thud(intensity=.45){
    if(!this.soundOn)return;
    const a=this.ensure();if(!a)return;
    const v=Math.max(.012,Math.min(.07,.018+intensity*.052));
    const variants=[78,94,112];const f=variants[this.thudVariant++%variants.length];
    this._osc({freq:f,endFreq:f*.58,dur:.085,vol:v,type:'sine'});
    this._noise({dur:.055,vol:v*.34,cutoff:320+f});
  }
  blackHoleIn(){if(!this.soundOn)return;const a=this.ensure();if(!a)return;const t=a.currentTime;this._osc({freq:380,endFreq:78,dur:.34,vol:.034,type:'sawtooth',when:t});this._osc({freq:190,endFreq:58,dur:.38,vol:.018,type:'sine',when:t});}
  whiteHoleOut(){if(!this.soundOn)return;const a=this.ensure();if(!a)return;const t=a.currentTime;this._osc({freq:120,endFreq:620,dur:.16,vol:.035,type:'triangle',when:t});this._noise({dur:.035,vol:.012,cutoff:1200,when:t});}
  levelComplete(){
    if(!this.soundOn)return;const a=this.ensure();if(!a)return;const t=a.currentTime+.01;
    [523.25,659.25,783.99].forEach((f,i)=>this._osc({freq:f,dur:.16,vol:.026,type:'triangle',when:t+i*.085}));
  }
  endGame(){
    if(!this.soundOn)return;const a=this.ensure();if(!a)return;const t=a.currentTime+.02;
    [392,523.25,659.25,783.99,1046.5].forEach((f,i)=>this._osc({freq:f,dur:.28,vol:.026,type:i<3?'triangle':'sine',when:t+i*.11}));
  }
  startMusic(){
    if(!this.musicOn)return;
    const a=this.ctx||this.ensure();if(!a||this.musicTimer)return;
    try{this.musicGain.gain.cancelScheduledValues(a.currentTime);this.musicGain.gain.setTargetAtTime(.86,a.currentTime,.08);}catch{}
    this.musicStep=0;this.nextMusicTime=a.currentTime+.08;
    const schedule=()=>{
      if(!this.ctx||!this.musicOn)return;
      const horizon=this.ctx.currentTime+.55;
      while(this.nextMusicTime<horizon){this._musicStepAt(this.nextMusicTime,this.musicStep++);this.nextMusicTime+=.27;}
    };
    schedule();this.musicTimer=setInterval(schedule,220);
  }
  _musicStepAt(t,step){
    const scale=[110,130.81,146.83,164.81,196,220,261.63,293.66];
    const pattern=[0,3,5,2,4,1,6,3,7,5,2,4,1,3,6,4];
    const f=scale[pattern[step%pattern.length]];
    this._osc({freq:f,dur:.22,vol:.022,type:'triangle',when:t,dest:this.musicGain,attack:.012});
    if(step%4===0)this._osc({freq:73.42*(step%8===0?1:1.12246),dur:.65,vol:.026,type:'sine',when:t,dest:this.musicGain,attack:.03});
    if(step%8===6)this._osc({freq:f*2,dur:.12,vol:.011,type:'sine',when:t+.08,dest:this.musicGain,attack:.008});
  }
  stopMusic(){
    if(this.musicTimer){clearInterval(this.musicTimer);this.musicTimer=null;}
    const a=this.ctx;if(!a||!this.musicGain)return;
    try{this.musicGain.gain.cancelScheduledValues(a.currentTime);this.musicGain.gain.setTargetAtTime(.0001,a.currentTime,.04);}catch{}
  }
}
