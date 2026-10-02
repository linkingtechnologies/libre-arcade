export const SETTINGS_KEY='memonix-builder.settings.v1';
export const SCORE_PREFIX='memonix-builder.best.';
export const DEFAULT_SETTINGS=Object.freeze({lang:'en',sound:true,size:4,difficulty:0,countdownOn:true,countdown:30});

export function loadSettings(storage){
  try{
    const raw=JSON.parse(storage.getItem(SETTINGS_KEY)||'null')||{};
    const s={...DEFAULT_SETTINGS,...raw};
    if(!['en','it'].includes(s.lang))s.lang='en';
    if(![2,4,6,8].includes(s.size))s.size=4;
    if(![0,1,2,3,4].includes(s.difficulty))s.difficulty=0;
    s.countdown=Math.min(99,Math.max(1,Number(s.countdown)||30));
    s.countdownOn=!!s.countdownOn;s.sound=!!s.sound;
    return s;
  }catch{return {...DEFAULT_SETTINGS};}
}
export function saveSettings(storage,s){storage.setItem(SETTINGS_KEY,JSON.stringify(s));}
export function scoreKey(d,s){return `${SCORE_PREFIX}${d}.${s}`;}
export function readBest(storage,d,s){const v=storage.getItem(scoreKey(d,s));return v===null?null:Number(v);}
export function writeBest(storage,d,s,v){storage.setItem(scoreKey(d,s),String(v));}
export function clearScores(storage){for(let d=0;d<5;d++)for(const s of [2,4,6,8])storage.removeItem(scoreKey(d,s));}
export function clearAllLocalData(storage){clearScores(storage);storage.removeItem(SETTINGS_KEY);return {...DEFAULT_SETTINGS};}
