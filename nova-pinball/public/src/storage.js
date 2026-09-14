// SPDX-License-Identifier: GPL-3.0-or-later
const memory = new Map();

function browserStorage(){
  try{return globalThis.localStorage ?? null;}catch{return null;}
}

export function getStored(key,fallback=null){
  const name=String(key);
  try{
    const store=browserStorage();
    if(store){
      const value=store.getItem(name);
      if(value!==null){memory.set(name,value);return value;}
    }
  }catch{}
  return memory.has(name)?memory.get(name):fallback;
}

export function setStored(key,value){
  const name=String(key),text=String(value);
  memory.set(name,text);
  try{
    const store=browserStorage();
    if(store){store.setItem(name,text);return true;}
  }catch{}
  return false;
}
