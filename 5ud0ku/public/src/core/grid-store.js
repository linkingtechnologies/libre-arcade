import { gridToBytes, gridFromBytes } from './grid-codec.js';
export const AUTO_SAVE_FILENAME='AUTO_SAVE';
export class MemoryStorageBackend { constructor(){this.m=new Map();} get(k){return this.m.get(k)??null;} set(k,v){this.m.set(k,new Uint8Array(v));} delete(k){this.m.delete(k);} keys(){return [...this.m.keys()];} }
export class LocalStorageBackend {
  constructor(prefix='5ud0ku:'){this.prefix=prefix;}
  set(k,v){let s='';for(const x of v)s+=String.fromCharCode(x);localStorage.setItem(this.prefix+k,btoa(s));}
  get(k){const x=localStorage.getItem(this.prefix+k);if(x==null)return null;const s=atob(x),b=new Uint8Array(s.length);for(let i=0;i<s.length;i++)b[i]=s.charCodeAt(i);return b;}
  delete(k){localStorage.removeItem(this.prefix+k);} keys(){const a=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k?.startsWith(this.prefix))a.push(k.slice(this.prefix.length));}return a;}
}
export class GridStore {
  constructor(backend){this.backend=backend;}
  saveGrid(grid,filename){if(filename==='SETTINGS'||filename==='PREF_LANG')return false;try{this.backend.set(filename,gridToBytes(grid));return true;}catch{return false;}}
  loadGrid(filename){try{const b=this.backend.get(filename);return b?gridFromBytes(b):null;}catch{return null;}}
  autosaveGrid(grid){return this.saveGrid(grid,AUTO_SAVE_FILENAME);} getAutoSaveGrid(){return this.loadGrid(AUTO_SAVE_FILENAME);}
  deleteGrid(filename){if(filename==='SETTINGS')return false;try{this.backend.delete(filename);return true;}catch{return false;}}
  getStoredGridFilenames(){try{return this.backend.keys().filter(x=>x!=='SETTINGS'&&x!=='PREF_LANG');}catch{return [];} }
  clearAll(){try{for(const key of this.backend.keys())this.backend.delete(key);return true;}catch{return false;}}
}
