/* Njam 1.21 hiscore.dat browser adapter. GPL-3.0-or-later. */
const KEY='njam-1.21-hiscore-v1';

// The OS4 1.21 archive ships hiscore.dat with ten empty 0/0 records. The executable
// contains named defaults, but immediately overwrites them when that file is present.
const PACKAGED_DEFAULT=Array.from({length:10},()=>({name:'',points:0,level:0}));
const ALLOWED='0123456789abcdefghijklmnopqrstuvwxyz. :)(!*';

export class HighScores {
  constructor(storage){
    if(storage===undefined){try{storage=globalThis.localStorage;}catch{storage=null;}}
    this.storage=storage;this.rows=this.load();this.last=-1;
  }
  load(){
    try{
      const v=JSON.parse(this.storage?.getItem(KEY)||'null');
      if(Array.isArray(v)&&v.length===10)return v.map(r=>({name:String(r.name||'').slice(0,9),points:Number(r.points)||0,level:Number(r.level)||0}));
    }catch{}
    return PACKAGED_DEFAULT.map(x=>({...x}));
  }
  save(){try{this.storage?.setItem(KEY,JSON.stringify(this.rows));}catch{}}
  qualifies(score){let i=9;while(i>-1&&score>this.rows[i].points)i--;return i<9?i+1:-1;}
  insert(score,level){
    const idx=this.qualifies(score);if(idx<0){this.last=-1;return -1;}
    for(let i=9;i>idx;i--)this.rows[i]={...this.rows[i-1]};
    this.rows[idx]={name:'',points:score,level};this.last=idx;this.save();return idx;
  }
  normalizeName(name){
    let out='';for(const ch of String(name).toLowerCase())if(ALLOWED.includes(ch)&&out.length<9)out+=ch.toUpperCase();return out;
  }
  commitName(idx,name){
    if(idx<0||idx>9)return false;const n=this.normalizeName(name);if(!n)return false;this.rows[idx].name=n;this.last=idx;this.save();return true;
  }
  resetPackaged(){this.rows=PACKAGED_DEFAULT.map(x=>({...x}));this.last=-1;this.save();}
}
