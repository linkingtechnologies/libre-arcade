/* Browser persistence is a deliberately non-native format: original controls.txt
 * contains Pygame integer keycodes; highscores.txt contains score:name lines.
 * Explicit historical text import/export lives in native-files.js; these
 * local JSON keys themselves are not binary/text compatible.
 * GPL-3.0-or-later, (C) 2026 Libre Arcade contributors.
 */
export const DEFAULT_BINDINGS=Object.freeze({up:'ArrowUp',down:'ArrowDown',left:'ArrowLeft',right:'ArrowRight',shoot:'Space',shield:'ControlLeft'});
export const ORIGINAL_HIGHSCORES=Object.freeze([[8128,'PERFECT'],[6173,'PRIME'],[4540,'11BC'],[3798,'RAND'],[3141,'PI'],[2718,'E'],[1764,'LIFE^2'],[1024,'10^1010'],[525,'BAR'],[325,'FOO']].map(([score,name])=>Object.freeze({score,name})));
export const BINDINGS_KEY='libre-arcade.ai.bindings.m6';
export const SCORES_KEY='libre-arcade.ai.highscores.m6';
export function safeStore(store,key,value){try{store?.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
export function safeRead(store,key){try{const s=store?.getItem(key);return s?JSON.parse(s):null;}catch{return null;}}
export function validBindings(v){return Boolean(v&&typeof v==='object'&&!Array.isArray(v)&&
  Object.keys(DEFAULT_BINDINGS).every(k=>typeof v[k]==='string'&&/^[A-Za-z][A-Za-z0-9]{0,31}$/.test(v[k])));}
export function loadBindings(store){const saved=safeRead(store,BINDINGS_KEY);return saved?.version===1&&validBindings(saved.bindings)?{...saved.bindings}:{...DEFAULT_BINDINGS};}
export function saveBindings(store,bindings){if(!validBindings(bindings))return false;return safeStore(store,BINDINGS_KEY,{version:1,bindings});}
export function validScores(records){return Array.isArray(records)&&records.length===10&&records.every(v=>v&&
  Number.isSafeInteger(v.score)&&v.score>=0&&typeof v.name==='string'&&/^[\x20-\x39\x3b-\x7e]{0,10}$/.test(v.name)&&v.name===v.name.trim())&&
  records.every((x,i)=>i===0||records[i-1].score>=x.score);}
export function loadScores(store){const saved=safeRead(store,SCORES_KEY);
  return saved?.version===1&&validScores(saved.records)?saved.records.map(v=>({...v})):ORIGINAL_HIGHSCORES.map(v=>({...v}));}
export function qualifies(scores,score){return validScores(scores)&&Number.isSafeInteger(score)&&score>scores[9].score;}
export function insertScore(scores,score,name){if(!validScores(scores)||!Number.isSafeInteger(score)||score<0)throw new Error('Invalid highscore');
  if(!qualifies(scores,score))return scores.map(v=>({...v}));
  if(typeof name!=='string'||!/^[\x20-\x39\x3b-\x7e]{0,10}$/.test(name)||name!==name.trim())throw new Error('Invalid name');
  // Python original: tuples (score, name) sort(reverse=True), including tie order.
  return [...scores.map(v=>({...v})),{score,name:name.toUpperCase()}]
    .sort((a,b)=>b.score-a.score||(a.name<b.name?1:a.name>b.name?-1:0)).slice(0,10);
}
export function saveScores(store,scores){return validScores(scores)&&safeStore(store,SCORES_KEY,{version:1,records:scores});}

/** Clear only this game's saved keys; unrelated origin data is not touched. */
export function clearLocalData(store){
  if(!store || typeof store.removeItem!=='function')return false;
  try{store.removeItem(BINDINGS_KEY);store.removeItem(SCORES_KEY);return true;}catch{return false;}
}
