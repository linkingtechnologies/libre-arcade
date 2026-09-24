/* Original, programmatically generated sound cues for the web adaptation.
 * NOT samples from the historic WAV collection and NOT an audio parity claim.
 * GPL-3.0-or-later (C) 2026 Libre Arcade contributors.
 */
export const AUDIO_KEY='libre-arcade.ai.sound.m12';
export const CUES=Object.freeze({
  shoot:{start:680,end:190,seconds:.085,type:'square',gain:.060},
  thrust:{start:95,end:45,seconds:.105,type:'sawtooth',gain:.020},
  hit:{start:115,end:42,seconds:.20,type:'triangle',gain:.11},
  ship:{start:250,end:35,seconds:.52,type:'sawtooth',gain:.080},
  saucer:{start:340,end:265,seconds:.19,type:'sine',gain:.055},
  wave:{start:390,end:740,seconds:.26,type:'sine',gain:.045},
  shield:{start:160,end:360,seconds:.12,type:'sine',gain:.030}
});
export function loadSoundEnabled(store){try{return store?.getItem(AUDIO_KEY)!=='off';}catch{return true;}}
export function saveSoundEnabled(store,enabled){try{store?.setItem(AUDIO_KEY,enabled?'on':'off');return !!store;}catch{return false;}}
export function createSoundEngine({AudioContextClass=null,enabled=true}={}){
  let ctx=null,last=Object.create(null),on=Boolean(enabled);
  const minInterval={shoot:.045,thrust:.14,hit:.07,ship:.25,saucer:.35,wave:.5,shield:.18};
  function unlock(){
    if(!on||!AudioContextClass)return false;
    try{
      if(!ctx)ctx=new AudioContextClass();
      if(ctx.state==='suspended')void Promise.resolve(ctx.resume()).catch(()=>{});
      return true;
    }catch{return false;}
  }
  function setEnabled(next){on=Boolean(next);if(!on){try{ctx?.suspend();}catch{}}return on;}
  function play(name){
    const cue=CUES[name];if(!on||!ctx||ctx.state!=='running'||!cue)return false;
    const now=ctx.currentTime;if(now-(last[name]??-Infinity)<(minInterval[name]??0))return false;last[name]=now;
    try{
      const osc=ctx.createOscillator(),gain=ctx.createGain();
      osc.type=cue.type;osc.frequency.setValueAtTime(cue.start,now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(1,cue.end),now+cue.seconds);
      gain.gain.setValueAtTime(.0001,now);
      gain.gain.exponentialRampToValueAtTime(cue.gain,now+.006);
      gain.gain.exponentialRampToValueAtTime(.0001,now+cue.seconds);
      osc.connect(gain);gain.connect(ctx.destination);osc.start(now);osc.stop(now+cue.seconds+.015);
      osc.onended=()=>{try{osc.disconnect();gain.disconnect();}catch{}};
      return true;
    }catch{return false;}
  }
  return {unlock,setEnabled,play,get enabled(){return on;},get available(){return Boolean(AudioContextClass);}};
}
