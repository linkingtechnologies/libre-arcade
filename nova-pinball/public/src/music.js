// SPDX-License-Identifier: GPL-3.0-or-later
// Optional modern replacement music. The original Beyond soundtrack is not redistributed.
export const MUSIC_TRACKS={
  none:{label:'None',src:null},
  dreamy:{label:'Dreamy Orbit',src:'assets/music-modern/dreamy-orbit.ogg'},
  arcade:{label:'Arcade Pulse',src:'assets/music-modern/arcade-pulse.ogg'},
  wormhole:{label:'Wormhole Drive',src:'assets/music-modern/wormhole-drive.ogg'},
  playlist:{label:'Playlist',src:null},
};
const PLAYLIST=['dreamy','arcade','wormhole'];

export class ModernMusic {
  constructor({choice='none',volume=.36}={}){
    this.choice=MUSIC_TRACKS[choice]?choice:'none';
    this.volume=Math.max(0,Math.min(1,Number(volume)||0));
    this.player=typeof Audio!=='undefined'?new Audio():null;
    this.unlocked=false;
    this.pageActive=true;
    this.playlistIndex=0;
    this.loadedKey=null;
    if(this.player){
      this.player.preload='auto';
      this.player.volume=this.volume;
      this.player.addEventListener('ended',()=>this._onEnded());
      this._configureForChoice(false);
    }
  }
  get label(){return MUSIC_TRACKS[this.choice]?.label||'None';}
  setVolume(v){
    this.volume=Math.max(0,Math.min(1,Number(v)||0));
    if(this.player)this.player.volume=this.volume;
  }
  setChoice(choice,{autoplay=true}={}){
    if(!MUSIC_TRACKS[choice])choice='none';
    this.choice=choice;
    this.playlistIndex=0;
    this._configureForChoice(autoplay);
  }
  _trackKey(){return this.choice==='playlist'?PLAYLIST[this.playlistIndex%PLAYLIST.length]:this.choice;}
  _configureForChoice(autoplay=true){
    if(!this.player)return;
    if(this.choice==='none'){
      this.player.pause();this.player.removeAttribute('src');this.loadedKey=null;return;
    }
    const key=this._trackKey(),track=MUSIC_TRACKS[key];
    if(key!==this.loadedKey){
      this.player.src=track.src;this.loadedKey=key;this.player.load?.();
    }
    this.player.loop=this.choice!=='playlist';
    this.player.volume=this.volume;
    if(autoplay&&this.unlocked&&this.pageActive)this.play();
  }
  async unlock(){
    this.unlocked=true;
    if(this.choice==='none'||!this.pageActive)return false;
    return this.play();
  }
  async play(){
    if(!this.player||this.choice==='none'||!this.pageActive)return false;
    try{await this.player.play();return true;}catch{return false;}
  }
  pause(){this.player?.pause();}
  setPageActive(active){
    this.pageActive=!!active;
    if(!this.pageActive)this.pause();
    else if(this.unlocked&&this.choice!=='none')this.play();
  }
  _onEnded(){
    if(this.choice!=='playlist')return;
    this.playlistIndex=(this.playlistIndex+1)%PLAYLIST.length;
    this.loadedKey=null;
    this._configureForChoice(true);
  }
}
