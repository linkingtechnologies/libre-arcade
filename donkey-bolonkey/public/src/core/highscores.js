const MAX_HISCORES=10;
const MAX_NAME_CHARS=22;
const DEFAULT_NAME='David A. Capello';
const DEFAULT_SCORE=100;

export class HighScores{
  constructor(storage=globalThis.localStorage){
    this.storage=storage;
    this.key='dkbk.hiscores.v1';
    this.entries=this.load();
    this.editingIndex=-1;
  }

  defaults(){
    return Array.from({length:MAX_HISCORES},()=>({name:DEFAULT_NAME,score:DEFAULT_SCORE}));
  }

  load(){
    try{
      const raw=this.storage?.getItem?.(this.key);
      if(!raw)return this.defaults();
      const parsed=JSON.parse(raw);
      if(!Array.isArray(parsed)||parsed.length!==MAX_HISCORES)return this.defaults();
      return parsed.map(e=>({
        name:String(e?.name??'').slice(0,MAX_NAME_CHARS),
        score:Number.isFinite(Number(e?.score))?Math.trunc(Number(e.score)):DEFAULT_SCORE
      }));
    }catch{return this.defaults();}
  }

  save(){
    try{this.storage?.setItem?.(this.key,JSON.stringify(this.entries));}catch{/* storage unavailable */}
  }

  add(score){
    score=Math.trunc(Number(score)||0);
    for(let i=0;i<MAX_HISCORES;i++){
      // Historical hiscore.c uses strict greater-than, not >=.
      if(score>this.entries[i].score){
        this.entries.splice(i,0,{name:'',score});
        this.entries.length=MAX_HISCORES;
        this.editingIndex=i;
        this.save();
        return i;
      }
    }
    this.editingIndex=-1;
    return -1;
  }

  inputChar(ch){
    if(this.editingIndex<0||typeof ch!=='string'||ch.length!==1)return false;
    const code=ch.charCodeAt(0);
    if(code<32||code>=128)return false;
    const e=this.entries[this.editingIndex];
    if(e.name.length>=MAX_NAME_CHARS)return false;
    e.name+=ch;
    this.save();
    return true;
  }

  setEditingName(value){
    if(this.editingIndex<0)return false;
    const name=String(value??'').split('').filter(ch=>{const code=ch.charCodeAt(0);return code>=32&&code<128;}).join('').slice(0,MAX_NAME_CHARS);
    this.entries[this.editingIndex].name=name;
    this.save();
    return true;
  }

  backspace(){
    if(this.editingIndex<0)return false;
    const e=this.entries[this.editingIndex];
    if(!e.name.length)return false;
    e.name=e.name.slice(0,-1);
    this.save();
    return true;
  }

  finishEntry(){
    if(this.editingIndex<0)return false;
    this.editingIndex=-1;
    this.save();
    return true;
  }
}

export const HISCORE_LIMITS=Object.freeze({MAX_HISCORES,MAX_NAME_CHARS,DEFAULT_NAME,DEFAULT_SCORE});
