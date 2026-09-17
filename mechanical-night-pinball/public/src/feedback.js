const EVENT_TEXT = {
  it: {
    multiplier: 'Moltiplicatore aumentato', extraBall: 'Palla extra!', ballLost: 'Palla persa', gameOver: 'Partita finita',
    rampEntrance: 'Rampa attiva', rampLeft: 'Rampa sinistra completata', rampRight: 'Rampa destra completata',
    tunnel: 'Tunnel!', thirdRamp: 'Terza rampa!', thirdRampReady: 'Terza rampa pronta'
  },
  en: {
    multiplier: 'Multiplier increased', extraBall: 'Extra ball!', ballLost: 'Ball lost', gameOver: 'Game over',
    rampEntrance: 'Ramp active', rampLeft: 'Left ramp complete', rampRight: 'Right ramp complete',
    tunnel: 'Tunnel!', thirdRamp: 'Third ramp!', thirdRampReady: 'Third ramp ready'
  }
};

const SIGNIFICANT_SOURCE = {
  rampActivate0:'rampEntrance', rampActivate1:'rampEntrance', rampActivate2:'rampEntrance',
  rampFinishLeft:'rampLeft', rampFinishRight:'rampRight',
  tunnelLeft:'tunnel', tunnelRight:'tunnel', thirdRamp:'thirdRamp'
};

export class FeedbackController {
  constructor({toast,scoreBurst}) {
    this.toast=toast; this.scoreBurst=scoreBurst; this.toastTimer=0; this.scoreTimer=0;
  }
  reset(){clearTimeout(this.toastTimer);clearTimeout(this.scoreTimer);this.toast.textContent='';this.toast.classList.remove('show');this.scoreBurst.textContent='';this.scoreBurst.classList.remove('show','major');}
  toastEvent(type,language='it',duration=1200){const text=EVENT_TEXT[language]?.[type];if(!text)return;clearTimeout(this.toastTimer);this.toast.textContent=text;this.toast.classList.remove('show');void this.toast.offsetWidth;this.toast.classList.add('show');this.toastTimer=setTimeout(()=>this.toast.classList.remove('show'),duration);}
  score(points,source,language='it'){
    clearTimeout(this.scoreTimer);this.scoreBurst.textContent=`+${Number(points).toLocaleString(language==='it'?'it-IT':'en-US')}`;
    this.scoreBurst.classList.remove('show','major');if(points>=1000)this.scoreBurst.classList.add('major');void this.scoreBurst.offsetWidth;this.scoreBurst.classList.add('show');
    this.scoreTimer=setTimeout(()=>this.scoreBurst.classList.remove('show','major'),650);
    const event=SIGNIFICANT_SOURCE[source];if(event)this.toastEvent(event,language,event==='thirdRamp'?1800:1050);
  }
}
