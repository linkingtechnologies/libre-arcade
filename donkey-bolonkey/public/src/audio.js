// Clean-room Web Audio replacements for the historical Allegro samples.
// Event/timing semantics are source-derived; timbres are intentionally new.
import { FPS } from './core/constants.js';

export class AudioReplacement {
  constructor(storage=globalThis.localStorage){
    this.storage=storage;
    this.enabled=storage?.getItem?.('dkbk.audio')!=='off';
    this.ctx=null;
    this.master=null;
    this.motor=null;
    this.lastScreen=null;
    this.titlePlayed=false;
    this.lastEventId=0;
  }

  async unlock(){
    if(!this.enabled)return false;
    const AC=globalThis.AudioContext||globalThis.webkitAudioContext;
    if(!AC)return false;
    if(!this.ctx){
      this.ctx=new AC();
      this.master=this.ctx.createGain();
      this.master.gain.value=0.28;
      this.master.connect(this.ctx.destination);
    }
    if(this.ctx.state==='suspended')await this.ctx.resume();
    return this.ctx.state==='running';
  }

  setEnabled(value){
    this.enabled=Boolean(value);
    this.storage?.setItem?.('dkbk.audio',this.enabled?'on':'off');
    if(!this.enabled)this.stopMotor();
    return this.enabled;
  }
  toggle(){return this.setEnabled(!this.enabled);}

  sync(flow){
    const screen=flow.screen;
    if(screen!==this.lastScreen){
      if(this.lastScreen==='game'&&screen!=='game')this.stopMotor();
      if(screen==='title')this.titlePlayed=false;
      this.lastScreen=screen;
    }
    if(!this.enabled||!this.ctx||this.ctx.state!=='running')return;
    if(screen==='game')this.startMotor();

    if(screen==='title'&&!this.titlePlayed&&flow.screenTime>FPS/2){
      this.titlePlayed=true;
      this.titleCue();
    }
    if(screen==='game'){
      for(const event of flow.game.events){
        if(event.id<=this.lastEventId)continue;
        this.lastEventId=event.id;
        this.handleEvent(event);
      }
    }
  }

  handleEvent(event){
    switch(event.type){
      case 'bubble': this.bubble(); break;
      case 'match': this.scream(); break;
      case 'crush': this.crush(event.count||1); break;
      case 'blocked': this.alarm(); break;
      case 'level': this.crazyAlarm(); break;
    }
  }

  startMotor(){
    if(!this.enabled||!this.ctx||this.ctx.state!=='running'||this.motor)return;
    const now=this.ctx.currentTime;
    const gain=this.ctx.createGain();
    const low=this.ctx.createOscillator();
    const high=this.ctx.createOscillator();
    const lfo=this.ctx.createOscillator();
    const lfoGain=this.ctx.createGain();
    low.type='triangle'; high.type='sine'; lfo.type='sine';
    low.frequency.value=57; high.frequency.value=114; lfo.frequency.value=7;
    gain.gain.setValueAtTime(0.0001,now);gain.gain.exponentialRampToValueAtTime(0.055,now+0.08);
    lfoGain.gain.value=2.2;
    lfo.connect(lfoGain);lfoGain.connect(low.frequency);
    low.connect(gain);high.connect(gain);gain.connect(this.master);
    low.start();high.start();lfo.start();
    this.motor={gain,low,high,lfo};
  }

  stopMotor(){
    if(!this.motor)return;
    const {gain,low,high,lfo}=this.motor;
    const now=this.ctx?.currentTime||0;
    try{gain.gain.cancelScheduledValues(now);gain.gain.setTargetAtTime(0.0001,now,0.025);}catch{/* already stopped */}
    for(const node of [low,high,lfo]){try{node.stop(now+0.12);}catch{/* already stopped */}}
    this.motor=null;
  }

  tone(freq,duration,{volume=0.12,type='square',endFreq=freq,when=0}={}){
    if(!this.ctx||!this.master)return;
    const t=this.ctx.currentTime+when;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type=type;o.frequency.setValueAtTime(freq,t);
    if(endFreq!==freq)o.frequency.exponentialRampToValueAtTime(Math.max(20,endFreq),t+duration);
    g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(volume,t+0.008);g.gain.exponentialRampToValueAtTime(0.0001,t+duration);
    o.connect(g);g.connect(this.master);o.start(t);o.stop(t+duration+0.02);
  }

  noise(duration,{volume=0.13,when=0,lowpass=1800}={}){
    if(!this.ctx||!this.master)return;
    const sr=this.ctx.sampleRate,n=Math.max(1,Math.floor(sr*duration));
    const b=this.ctx.createBuffer(1,n,sr),d=b.getChannelData(0);
    for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
    const src=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain();
    filter.type='lowpass';filter.frequency.value=lowpass;gain.gain.value=volume;
    src.buffer=b;src.connect(filter);filter.connect(gain);gain.connect(this.master);
    const t=this.ctx.currentTime+when;src.start(t);
  }

  titleCue(){
    this.tone(330,.14,{type:'triangle',volume:.13});
    this.tone(495,.18,{type:'triangle',volume:.11,when:.10});
    this.tone(660,.26,{type:'triangle',volume:.10,when:.20});
  }
  bubble(){this.tone(520,.10,{type:'sine',volume:.13,endFreq:980});}
  scream(){
    this.tone(760,.28,{type:'sawtooth',volume:.09,endFreq:230});
    this.tone(940,.22,{type:'square',volume:.035,endFreq:300,when:.02});
  }
  crush(count=1){
    this.noise(.16,{volume:Math.min(.2,.10+count*.025),lowpass:900});
    this.tone(105,.15,{type:'square',volume:.10,endFreq:55});
  }
  alarm(){this.tone(880,.075,{type:'square',volume:.055});}
  crazyAlarm(){
    for(let i=0;i<10;i++)this.tone(i%2?760:520,.07,{type:'square',volume:.045,when:i*.14});
  }
}
