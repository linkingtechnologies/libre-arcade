import assert from 'node:assert/strict';
import {PreferenceStore} from '../src/preferences.mjs';
class Mem { constructor(){this.m=new Map()} getItem(k){return this.m.get(k)??null} setItem(k,v){this.m.set(k,String(v))} removeItem(k){this.m.delete(k)} }
let checks=0;const eq=(a,b)=>{assert.equal(a,b);checks++};
const mem=new Mem(),a=new PreferenceStore(mem);
eq(a.value.language,'it');eq(a.value.maxUnlocked,1);eq(a.value.highScores.length,8);
a.update({language:'en',maxUnlocked:17,sfxVolume:.3,musicVolume:.8,highScores:[{score:123,name:'ABC'}]});
const b=new PreferenceStore(mem);eq(b.value.language,'en');eq(b.value.maxUnlocked,17);eq(b.value.sfxVolume,.3);eq(b.value.highScores[0].score,123);eq(b.value.highScores[0].name,'ABC');
b.update({maxUnlocked:999,sfxVolume:-4,musicVolume:9});eq(b.value.maxUnlocked,50);eq(b.value.sfxVolume,0);eq(b.value.musicVolume,1);
const c=new PreferenceStore(mem);c.reset();eq(c.value.maxUnlocked,1);eq(c.value.highScores[0].score,0);eq(mem.getItem('rili-2.0.1')!==null,true);
console.log(`preferences: ${checks} checks PASS`);
