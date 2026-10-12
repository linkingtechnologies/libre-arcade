// SPDX-License-Identifier: GPL-3.0-or-later
// Tiny, dependency-free UI preference helper. Game state is intentionally not persisted.
export const UI_PREFS_KEY='libre-arcade.lawn-mower.ui.v1';
export const DEFAULT_UI_PREFS=Object.freeze({language:'en',audio:true});

export function normalizeUiPrefs(value={}){
  return {language:value.language==='it'?'it':'en',audio:value.audio!==false};
}
function resolveStorage(storage){
  if(storage!==undefined)return storage;
  // Access to window.localStorage itself can throw a SecurityError in hardened/privacy contexts.
  return globalThis.localStorage;
}
export function loadUiPrefs(storage){
  try{
    storage=resolveStorage(storage);
    const raw=storage?.getItem(UI_PREFS_KEY);
    return normalizeUiPrefs(raw?JSON.parse(raw):DEFAULT_UI_PREFS);
  }catch{return {...DEFAULT_UI_PREFS};}
}
export function saveUiPrefs(prefs,storage){
  const normalized=normalizeUiPrefs(prefs);
  try{storage=resolveStorage(storage);storage?.setItem(UI_PREFS_KEY,JSON.stringify(normalized));}catch{}
  return normalized;
}
export function resetUiPrefs(storage){
  try{storage=resolveStorage(storage);storage?.removeItem(UI_PREFS_KEY);}catch{}
  return {...DEFAULT_UI_PREFS};
}
