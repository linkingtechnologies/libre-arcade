import {getStored,setStored} from '../public/src/storage.js';

const original=Object.getOwnPropertyDescriptor(globalThis,'localStorage');
try{
  delete globalThis.localStorage;
  if(setStored('fallback','one')!==false)throw new Error('missing-storage write should report fallback');
  if(getStored('fallback')!=='one')throw new Error('memory fallback failed');

  Object.defineProperty(globalThis,'localStorage',{configurable:true,get(){throw new Error('blocked');}});
  if(setStored('blocked','two')!==false)throw new Error('blocked storage should report fallback');
  if(getStored('blocked')!=='two')throw new Error('blocked-storage memory fallback failed');

  const data=new Map();
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:{
    getItem:k=>data.has(k)?data.get(k):null,
    setItem:(k,v)=>data.set(k,String(v))
  }});
  if(setStored('persisted','three')!==true)throw new Error('working storage write not reported');
  if(getStored('persisted')!=='three'||data.get('persisted')!=='three')throw new Error('working storage roundtrip failed');
}finally{
  if(original)Object.defineProperty(globalThis,'localStorage',original);else delete globalThis.localStorage;
}
console.log('OK — safe storage: persistent when available, in-memory fallback when unavailable');
