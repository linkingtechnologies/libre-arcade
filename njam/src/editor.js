/* Browser adaptation of Njam 1.21's integrated level editor. GPL-3.0-or-later. */
import { LevelSet, TILE, MAPW, MAPH, MAPSIZE, MAPS } from './game.js';

export class NjamEditor {
  constructor(){
    this.maps=Array.from({length:MAPS},()=>new Uint8Array(MAPSIZE));
    for(const m of this.maps)m.fill(TILE.WALL);
    this.current=0;this.buffer=this.makeRuntime(this.maps[0]);this.kind='COOP';this.changed=false;this.swapLevel=-1;this.filename='';
  }
  makeRuntime(src){
    const m=new Uint8Array(src);
    m[(MAPH-2)*MAPW+1]=TILE.EMPTY;
    m[1*MAPW+(MAPW-2)]=TILE.EMPTY;
    m[(MAPH-2)*MAPW+(MAPW-2)]=TILE.EMPTY;
    return m;
  }
  commit(){this.maps[this.current]=new Uint8Array(this.buffer);}
  setCurrent(i,{commit=true}={}){
    if(commit)this.commit();this.current=Math.max(0,Math.min(MAPS-1,i|0));this.buffer=this.makeRuntime(this.maps[this.current]);
  }
  loadDef(def,kind='COOP'){
    const set=new LevelSet(def);for(let i=0;i<MAPS;i++)this.maps[i]=set.rawMap(i);
    this.kind=kind;this.filename=def.id;this.current=0;this.buffer=this.makeRuntime(this.maps[0]);this.changed=false;this.swapLevel=-1;
  }
  loadBytes(bytes,kind='COOP',filename='IMPORTED'){
    if(!(bytes instanceof Uint8Array)||bytes.length!==MAPS*MAPSIZE)throw new Error(`Expected ${MAPS*MAPSIZE} bytes`);
    for(let m=0;m<MAPS;m++){
      const out=new Uint8Array(MAPSIZE),base=m*MAPSIZE;
      for(let x=0;x<MAPW;x++)for(let y=0;y<MAPH;y++)out[y*MAPW+x]=bytes[base+x*MAPH+y];
      this.maps[m]=out;
    }
    this.kind=kind;this.filename=filename;this.current=0;this.buffer=this.makeRuntime(this.maps[0]);this.changed=false;this.swapLevel=-1;
  }
  tile(x,y){if(x<0||y<0||x>=MAPW||y>=MAPH)return TILE.WALL;return this.buffer[y*MAPW+x];}
  setTile(x,y,t){if(x<0||y<0||x>=MAPW||y>=MAPH)return;this.buffer[y*MAPW+x]=Math.max(0,Math.min(9,t|0));this.changed=true;}
  isPlayable(){return this.tile(1,1)!==TILE.WALL;}
  togglePlayable(){this.setTile(1,1,this.isPlayable()?TILE.WALL:TILE.EMPTY);}
  clear(){this.buffer.fill(TILE.WALL);this.buffer[(MAPH-2)*MAPW+1]=TILE.EMPTY;this.buffer[1*MAPW+(MAPW-2)]=TILE.EMPTY;this.buffer[(MAPH-2)*MAPW+(MAPW-2)]=TILE.EMPTY;this.changed=true;}
  undo(){this.buffer=this.makeRuntime(this.maps[this.current]);}
  previous(){if(this.current>0)this.setCurrent(this.current-1);}
  next(){if(this.current<MAPS-1)this.setCurrent(this.current+1);}
  swap(){
    if(this.swapLevel<0){this.swapLevel=this.current;return 'armed';}
    if(this.swapLevel===this.current){this.swapLevel=-1;return 'cancelled';}
    this.commit();const t=this.maps[this.current];this.maps[this.current]=this.maps[this.swapLevel];this.maps[this.swapLevel]=t;this.buffer=this.makeRuntime(this.maps[this.current]);this.swapLevel=-1;this.changed=true;return 'swapped';
  }
  count(type){let n=0;for(const v of this.buffer)if(v===type)n++;return n;}
  validateCurrent(){
    if(!this.isPlayable())return {ok:false,message:'LEVEL IS NOT MARKED AS PLAYABLE'};
    if(this.count(TILE.DOOR)!==1)return {ok:false,message:'THERE MUST BE EXACTLY ONE DOOR ON LEVEL!'};
    if(this.count(TILE.GHOUSE)!==1)return {ok:false,message:'THERE MUST BE EXACTLY ONE PENTAGRAM ON LEVEL!'};
    return {ok:true};
  }
  validateForSave(){
    this.commit();
    for(let i=0;i<MAPS;i++){
      if(this.maps[i][1*MAPW+1]===TILE.WALL)break;
      const b=this.makeRuntime(this.maps[i]);let door=0,gh=0;for(const v of b){if(v===TILE.DOOR)door++;if(v===TILE.GHOUSE)gh++;}
      if(door!==1)return {ok:false,message:`THERE MUST BE EXACTLY ONE DOOR ON LEVEL ${i+1}`};
      if(gh!==1)return {ok:false,message:`THERE MUST BE EXACTLY ONE PENTAGRAM ON LEVEL ${i+1}`};
    }
    return {ok:true};
  }
  exportBytes(){
    this.commit();const out=new Uint8Array(MAPS*MAPSIZE);
    for(let m=0;m<MAPS;m++){const base=m*MAPSIZE,map=this.maps[m];for(let x=0;x<MAPW;x++)for(let y=0;y<MAPH;y++)out[base+x*MAPH+y]=map[y*MAPW+x];}
    return out;
  }
  toLevelSetDef(id='EDITOR'){
    const bytes=this.exportBytes();let s='';const step=0x8000;for(let i=0;i<bytes.length;i+=step)s+=String.fromCharCode(...bytes.subarray(i,i+step));
    let valid=MAPS;for(let i=0;i<MAPS;i++)if(this.maps[i][1*MAPW+1]===TILE.WALL){valid=i;break;}
    return {id,filename:`${id}.${this.kind}`,validMaps:Math.max(1,valid),bytesBase64:btoa(s)};
  }
}
