/* Libre Arcade synthesized sound effects. No external samples or network requests. */
// Sound is deliberately separate from the historical OGLBricks rules.
export const SOUND_EVENTS = Object.freeze(['move','rotate','land','clear','gameOver','start','toggle']);
const NOTES = Object.freeze({
  move:     [[240,0,.048,'sine',.32]],
  rotate:   [[420,0,.076,'triangle',.50]],
  land:     [[170,0,.095,'triangle',.65],[105,.032,.096,'sine',.34]],
  clear:    [[520,0,.095,'sine',.62],[660,.085,.105,'sine',.60],[880,.18,.155,'sine',.64]],
  gameOver: [[330,0,.16,'triangle',.58],[246,.17,.18,'triangle',.57],[164,.36,.29,'sine',.58]],
  start:    [[440,0,.105,'sine',.40],[590,.10,.13,'sine',.43]],
  toggle:   [[660,0,.12,'sine',.40]]
});
// Public scheduling function permits offline waveform tests of the actual signal.
export function scheduleEffect(context,destination,event,at=context.currentTime){
  const notes=NOTES[event];if(!notes)return 0;
  for(const [frequency,offset,duration,wave,loudness] of notes){
    const begin=at+offset,end=begin+duration;
    const oscillator=context.createOscillator(),envelope=context.createGain();
    oscillator.type=wave;oscillator.frequency.setValueAtTime(frequency,begin);
    envelope.gain.setValueAtTime(0,begin);
    envelope.gain.linearRampToValueAtTime(loudness,begin+Math.min(.012,duration*.24));
    envelope.gain.exponentialRampToValueAtTime(.0001,end);
    oscillator.connect(envelope);envelope.connect(destination);
    oscillator.start(begin);oscillator.stop(end+.005);
    oscillator.onended=()=>{oscillator.disconnect();envelope.disconnect();};
  }
  return notes.length;
}
export class SoundPlayer {
  constructor({enabled=true,contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)()}={}){
    this.enabled=!!enabled;this.contextFactory=contextFactory;this.context=null;this.master=null;this.lastMove=-Infinity;
  }
  unlock(){
    if(!this.enabled)return false;
    try{
      if(!this.context){
        this.context=this.contextFactory();this.master=this.context.createGain();
        this.master.gain.value=.11;this.master.connect(this.context.destination);
      }
      if(this.context.state==='suspended')this.context.resume()?.catch?.(()=>{});
      return true;
    }catch{return false;}
  }
  setEnabled(enabled){
    this.enabled=!!enabled;
    if(this.master){
      // Gain changes immediately: even a note already playing is muted.
      this.master.gain.setValueAtTime(this.enabled?.11:0,this.context.currentTime);
    }
    if(this.enabled)this.unlock();
  }
  play(event){
    if(!this.enabled||!NOTES[event]||!this.unlock())return false;
    const time=this.context.currentTime;
    if(event==='move'&&time-this.lastMove<.075)return false;
    if(event==='move')this.lastMove=time;
    try{return scheduleEffect(this.context,this.master,event,time)>0;}catch{return false;}
  }
}
