/* Ri-li 2.0.1 browser audio wrapper. SPDX-License-Identifier: GPL-3.0-only */
const SFX={click:'audio/clic.wav',crash:'audio/crash.wav',end:'audio/end.wav',stretch:'audio/etire.wav',life:'audio/live.wav',lose:'audio/lose.wav',shrink:'audio/reduit.wav',speed:'audio/speed.wav',wagon:'audio/wagon.wav'};
const MUSIC={menu:'audio/menu.ogg',game1:'audio/jeu1.ogg',game2:'audio/jeu2.ogg'};
export const AUDIO_FILES=Object.freeze({sfx:{...SFX},music:{...MUSIC}});
export class AudioManager{
  constructor(){this.sfxVolume=1;this.musicVolume=1;this.enabled=false;this.music=null;this.musicKey=null;this.gameTrack=1;this.lastClick=-1e9;this.sfx=new Map();}
  setVolumes(sfx,music){this.sfxVolume=Math.max(0,Math.min(1,+sfx));this.musicVolume=Math.max(0,Math.min(1,+music));if(this.music)this.music.volume=this.#musicGain(this.musicKey);}
  #musicGain(key){return this.musicVolume*(key==='menu'?0.5:1);}
  async unlock(){if(this.enabled)return;this.enabled=true;for(const [k,url] of Object.entries(SFX)){const a=new Audio(url);a.preload='auto';this.sfx.set(k,a);}if(this.musicKey)this.playMusic(this.musicKey,true);}   // not awaited: play() answers when the tune has started, and the key that unlocks the sound must not wait for that
  play(name,clockMs=performance.now()){if(!this.enabled||this.sfxVolume<=0)return;if(name==='click'){if(clockMs-this.lastClick<=120)return;this.lastClick=clockMs;}const base=this.sfx.get(name);if(!base)return;const a=base.cloneNode();a.volume=this.sfxVolume;a.play().catch(()=>{});}
  async playMusic(key,force=false){this.musicKey=key;if(!this.enabled)return;if(!force&&this.music&&this.music.dataset?.key===key&&!this.music.paused)return;if(this.music){this.music.pause();this.music.currentTime=0;}const a=new Audio(MUSIC[key]);a.loop=true;a.volume=this.#musicGain(key);a.dataset.key=key;this.music=a;try{await a.play();}catch{}}
  stopMusic(){if(this.music){this.music.pause();this.music.currentTime=0;this.music=null;}this.musicKey=null;}
  menuMusic(){return this.playMusic('menu');}
  startGameMusic(){this.gameTrack=1;return this.playMusic('game1');}
  nextGameMusic(){this.gameTrack=this.gameTrack===1?2:1;return this.playMusic(`game${this.gameTrack}`,true);}
  pause(paused){if(!this.music)return;if(paused)this.music.pause();else if(this.enabled)this.music.play().catch(()=>{});}
  diagnostics(){return {enabled:this.enabled,musicKey:this.musicKey,musicPaused:this.music?.paused??null,sfxLoaded:this.sfx.size,sfxVolume:this.sfxVolume,musicVolume:this.musicVolume};}
}
