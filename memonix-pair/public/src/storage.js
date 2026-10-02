export const SETTINGS_KEY='memonix-pair-settings-v1';
export const SCORES_KEY='memonix-pair-scores-v1';
export const DEFAULT_SETTINGS=Object.freeze({lang:'en',sound:true,size:4,difficulty:0,countdownOn:true,countdown:30});

export function loadSettings(store){
  try{
    const raw=JSON.parse(store.getItem(SETTINGS_KEY)||'null')||{};
    const s={...DEFAULT_SETTINGS,...raw};
    if(!['en','it'].includes(s.lang))s.lang='en';
    if(![2,4,6,8].includes(s.size))s.size=4;
    if(![0,1,2].includes(s.difficulty))s.difficulty=0;
    s.countdown=Math.min(99,Math.max(1,Number(s.countdown)||30));
    s.countdownOn=!!s.countdownOn;
    s.sound=!!s.sound;
    return s;
  }catch{return {...DEFAULT_SETTINGS};}
}
export function saveSettings(store,s){store.setItem(SETTINGS_KEY,JSON.stringify(s));}
const scoreKey=(size,difficulty)=>`${size}x${size}:d${difficulty}`;
export function readBest(store,size,difficulty){try{const all=JSON.parse(store.getItem(SCORES_KEY)||'{}');const v=all[scoreKey(size,difficulty)];return Number.isFinite(v)?v:null;}catch{return null;}}
export function writeBest(store,size,difficulty,seconds){let all={};try{all=JSON.parse(store.getItem(SCORES_KEY)||'{}')||{};}catch{}const k=scoreKey(size,difficulty),old=all[k];if(!Number.isFinite(old)||seconds<old){all[k]=seconds;store.setItem(SCORES_KEY,JSON.stringify(all));return true;}return false;}
export function clearScores(store){store.removeItem(SCORES_KEY);}
export function clearAllLocalData(store){store.removeItem(SETTINGS_KEY);store.removeItem(SCORES_KEY);return {...DEFAULT_SETTINGS};}
