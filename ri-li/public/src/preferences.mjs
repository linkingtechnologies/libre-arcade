/* Ri-li 2.0.1 browser preferences. SPDX-License-Identifier: GPL-3.0-only */
import { DEFAULT_LANGUAGE, LANGUAGES } from './languages.mjs';
const KEY='rili-2.0.1';
export const DEFAULT_PREFS=Object.freeze({
  version:1,language:'it',difficulty:'normal',maxUnlocked:1,sfxVolume:1,musicVolume:1,help:true,fullscreen:false,
  highScores:Array.from({length:8},()=>({score:0,name:''}))
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)));
const scores=v=>Array.from({length:8},(_,i)=>({score:Math.max(0,Math.trunc(Number(v?.[i]?.score)||0)),name:String(v?.[i]?.name??'').slice(0,79)}));
export function sanitizePrefs(p={}){return {
  version:1,language:LANGUAGES.includes(p.language)?p.language:DEFAULT_LANGUAGE,difficulty:['easy','normal','hard'].includes(p.difficulty)?p.difficulty:'normal',
  maxUnlocked:Math.max(1,Math.min(50,Math.trunc(Number(p.maxUnlocked)||1))),sfxVolume:clamp(p.sfxVolume??1,0,1),musicVolume:clamp(p.musicVolume??1,0,1),
  help:p.help!==false,fullscreen:Boolean(p.fullscreen),highScores:scores(p.highScores)
};}
export class PreferenceStore{
  constructor(storage=globalThis.localStorage){this.storage=storage;this.value=this.load();}
  load(){
    try{
      let raw=this.storage?.getItem(KEY);
      const value=raw?sanitizePrefs(JSON.parse(raw)):sanitizePrefs(DEFAULT_PREFS);
      if(raw)this.storage?.setItem(KEY,JSON.stringify(value));
      return value;
    }catch{return sanitizePrefs(DEFAULT_PREFS);}
  }
  save(p=this.value){this.value=sanitizePrefs(p);try{this.storage?.setItem(KEY,JSON.stringify(this.value));}catch{}return this.value;}
  update(patch){return this.save({...this.value,...patch});}
  reset(){try{this.storage?.removeItem(KEY);}catch{}return this.save(DEFAULT_PREFS);}
}
