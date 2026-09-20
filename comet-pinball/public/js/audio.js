/* M12: Original, generated Web Audio sounds. Never mutates the physics engine. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CometAudio=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const rateLimit={flipper:.065,bumper:.065,wall:.115,sling:.085,plunge:.16,drain:.25,menu:.09};
  function create(contextFactory,musicElement){
    let ctx=null,master=null,musicGain=null,muted=false,music=true,musicVolume=.65,disposed=false,nextNote=0,noteIndex=0;
    let musicPlaying=false;
    const track=musicElement&&typeof musicElement.play==='function'?musicElement:null;
    if(track){track.loop=true;track.preload='auto';track.volume=musicVolume;}
    const last=Object.create(null);
    function init(){
      if(disposed)return false;
      if(ctx)return true;
      const C=contextFactory || (typeof window!=='undefined'&&(window.AudioContext||window.webkitAudioContext));
      if(!C)return false;
      try{
        ctx=new C();master=ctx.createGain();master.gain.value=.19;master.connect(ctx.destination);
        musicGain=ctx.createGain();musicGain.gain.value=.18;musicGain.connect(master);return true;
      }catch{return false;}
    }
    function unlock(){if(!init())return false;try{if(ctx.state==='suspended')ctx.resume().catch(()=>{});}catch{}return true;}
    function envelope(g,when,duration,volume){
      g.gain.setValueAtTime(.0001,when);g.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),when+.008);
      g.gain.exponentialRampToValueAtTime(.0001,when+duration);
    }
    function tone(freq,duration,volume,type='sine',slide=1,when=null,bus=null){
      if(!ctx||muted||ctx.state==='suspended')return;
      const t=when===null?ctx.currentTime:when;
      const o=ctx.createOscillator(),g=ctx.createGain();o.type=type;
      o.frequency.setValueAtTime(Math.max(30,freq),t);o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide),t+duration);
      envelope(g,t,duration,volume);o.connect(g);g.connect(bus||master);
      o.start(t);o.stop(t+duration+.015);
      o.onended=()=>{try{o.disconnect();g.disconnect();}catch{}};
    }
    function play(which){
      if(!ctx||muted||ctx.state==='suspended')return false;
      const t=ctx.currentTime;
      if(!(which in rateLimit)||t-(last[which]??-100)<rateLimit[which])return false;
      last[which]=t;
      if(which==='flipper'){tone(130,.055,.46,'triangle',1.75);tone(60,.045,.24,'square',.63);}
      else if(which==='bumper'){tone(660,.19,.50,'sine',.61);tone(990,.13,.24,'triangle',1.24);}
      else if(which==='sling'){tone(290,.11,.4,'triangle',1.9);tone(780,.08,.18,'sine',.75);}
      else if(which==='wall'){tone(410,.055,.13,'triangle',.66);}
      else if(which==='plunge'){tone(130,.22,.48,'sawtooth',2.65);tone(650,.15,.17,'sine',.73);}
      else if(which==='drain'){tone(510,.45,.31,'sine',.31);tone(260,.51,.24,'triangle',.30);}
      else if(which==='menu'){tone(550,.075,.12,'sine',1.18);}
      return true;
    }
    const melody=[0,3,7,10,7,3,5,8,12,8,5,3,0,-2,3,7];
    // The licensed recording is a separate HTML media element; oscillator SFX
    // remain on their own Web Audio bus. The old melody is a fallback ONLY for
    // legacy test hosts without a media element, never layered over the track.
    function updateMusic(active){
      if(track){
        const shouldPlay=!!active&&music&&!disposed;
        if(!shouldPlay){
          if(musicPlaying||!track.paused){track.pause();musicPlaying=false;}
          return;
        }
        track.volume=musicVolume;
        if(!musicPlaying||track.paused){
          musicPlaying=true;
          try{const promise=track.play();if(promise&&typeof promise.catch==='function')promise.catch(()=>{musicPlaying=false;});}
          catch{musicPlaying=false;}
        }
        return;
      }
      if(!ctx||muted||!music||!active||ctx.state==='suspended'){nextNote=0;return;}
      if(!nextNote||nextNote<ctx.currentTime-.20)nextNote=ctx.currentTime+.04;
      let count=0;
      while(nextNote<ctx.currentTime+.16&&count++<3){
        const n=melody[noteIndex++%melody.length];tone(164.81*Math.pow(2,n/12),.24,.10,'sine',1,nextNote,musicGain);
        nextNote+=.34;
      }
    }
    function setMuted(value){muted=!!value;nextNote=0;return muted;}
    function setMusic(value){music=!!value;nextNote=0;if(!music)updateMusic(false);return music;}
    function setMusicVolume(value){musicVolume=Math.max(0,Math.min(1,Number(value)||0));if(track)track.volume=musicVolume;return musicVolume;}
    function close(){disposed=true;updateMusic(false);if(ctx&&ctx.close)ctx.close().catch(()=>{});ctx=null;}
    return {unlock,play,updateMusic,setMuted,setMusic,setMusicVolume,close,get muted(){return muted;},get music(){return music;},get musicVolume(){return musicVolume;},get available(){return !!ctx;}};
  }
  return {create};
});
