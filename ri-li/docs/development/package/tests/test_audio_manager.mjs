import assert from 'node:assert/strict';
class FakeAudio{
  constructor(src=''){this.src=src;this.loop=false;this.volume=1;this.currentTime=0;this.paused=true;this.dataset={};}
  play(){this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
  cloneNode(){return new FakeAudio(this.src);}
}
globalThis.Audio=FakeAudio;globalThis.performance={now:()=>1000};
const {AudioManager,AUDIO_FILES}=await import('../src/audio.mjs');let checks=0;const eq=(a,b)=>{assert.equal(a,b);checks++};
const a=new AudioManager();a.setVolumes(.7,.8);await a.menuMusic();eq(a.musicKey,'menu');eq(a.enabled,false);
await a.unlock();eq(a.enabled,true);eq(a.sfx.size,9);eq(a.musicKey,'menu');eq(a.music.volume,.4);eq(a.music.paused,false);
a.startGameMusic();await Promise.resolve();eq(a.musicKey,'game1');eq(a.music.volume,.8);a.nextGameMusic();await Promise.resolve();eq(a.musicKey,'game2');a.pause(true);eq(a.music.paused,true);a.pause(false);eq(a.music.paused,false);
eq(Object.keys(AUDIO_FILES.sfx).length,9);eq(Object.keys(AUDIO_FILES.music).length,3);
console.log(`audio manager: ${checks} checks PASS`);
