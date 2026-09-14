let plays=0,pauses=0;
class FakeAudio {
  constructor(){this.src='';this.volume=1;this.loop=false;this.preload='';this.handlers={};}
  addEventListener(name,fn){this.handlers[name]=fn;}
  async play(){plays++;return true;}
  pause(){pauses++;}
  load(){}
  removeAttribute(name){if(name==='src')this.src='';}
  end(){this.handlers.ended?.();}
}
global.Audio=FakeAudio;
const {ModernMusic,MUSIC_TRACKS}=await import('../public/src/music.js');
const m=new ModernMusic({choice:'none',volume:.36});
if(Object.keys(MUSIC_TRACKS).length!==5)throw new Error('music choices incomplete');
if(await m.unlock()!==false)throw new Error('none should not start music');
m.setChoice('dreamy',{autoplay:false});
if(!m.player.src.endsWith('dreamy-orbit.ogg'))throw new Error('dreamy track not loaded');
await m.unlock();if(plays<1)throw new Error('music did not start after user unlock');
m.setVolume(.7);if(Math.abs(m.player.volume-.7)>.001)throw new Error('music volume not applied');
m.setChoice('playlist');
if(m.player.loop)throw new Error('playlist must rotate instead of looping one file');
const before=m.player.src;m.player.end();
if(m.player.src===before)throw new Error('playlist did not advance');
m.setPageActive(false);if(pauses<1)throw new Error('music not paused when page hidden');
console.log('OK — modern CC0 music choices, persistence-facing API, playlist rotation and page pause');
