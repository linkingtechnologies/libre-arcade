const START = [[70,400],[71,400],[73,200],[70,200],[73,200],[78,200],[77,400],[78,400],[80,200],[78,200],[77,200],[75,200]];
const SUCCESS = [[77,600],[75,600],[73,800],[75,600],[77,600],[75,600],[73,600],[75,600],[77,600],[73,800],[73,800]];
const CRASH = [[73,800],[73,800],[73,400],[73,400],[75,400],[76,400],[75,400],[73,400],[73,400],[71,400],[73,1000]];

function midiToHz(note) { return 440 * Math.pow(2, (note - 69) / 12); }
export class AudioEngine {
  constructor() { this.enabled = true; this.ctx = null; }
  setEnabled(v) { this.enabled = !!v; if (!v && this.ctx) this.ctx.suspend(); }
  async ensure() {
    if (!this.enabled) return;
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }
  tone(note, duration=50, volume=100, delay=0) {
    if (!this.enabled) return;
    this.ensure().then(() => {
      const t = this.ctx.currentTime + delay/1000;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(midiToHz(note), t);
      const amp = Math.max(0, Math.min(1, volume/100)) * 0.08;
      gain.gain.setValueAtTime(amp, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.02,duration/1000));
      osc.connect(gain).connect(this.ctx.destination);
      osc.start(t); osc.stop(t + Math.max(0.03,duration/1000));
    });
  }
  sequence(seq) {
    let d = 0;
    for (const [n,ms] of seq) { this.tone(n, ms, 100, d); d += ms; }
    return d;
  }
  startMelody(){ return this.sequence(START); }
  successMelody(){ return this.sequence(SUCCESS); }
  crashMelody(){ return this.sequence(CRASH); }
  motor(){ this.tone(30,141,100); }
  bomb(life){ this.tone(110-life,20,10); }
  impact(){ this.tone(10,25,100); }
}
