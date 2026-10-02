import { HOUSE_TEMPLATES } from './templates.js';
import { BUILDER_ASSETS, CATEGORY_ASSETS, CATEGORIES } from './assets.js';

export const BOARD_N = 8;
export const SIZES = Object.freeze([2,4,6,8]);
export const DIFFICULTIES = Object.freeze([0,1,2,3,4]);

export function emptyBoard(){
  return Array.from({length:BOARD_N},()=>Array(BOARD_N).fill(null));
}

export function createRng(seed=0x12345678){
  let a=seed>>>0;
  return ()=>{
    a=(a+0x6D2B79F5)>>>0;
    let t=a;
    t=Math.imul(t^(t>>>15),t|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return ((t^(t>>>14))>>>0)/4294967296;
  };
}

function rint(random,n){ return Math.floor(random()*n); }
function wrapSubtract(v,max,step){ while(v>max) v-=step; return v; }

const A103 = Object.freeze([
  '1_03/a-03','1_03/a-04','1_03/13','1_03/14','1_03/a-14','12_03/78','12_03/70','12_03/71',
  '1_03/17','1_03/a-12','1_03/a-13','1_03/15','1_03/16','1_03/20','1_03/21','1_03/a-01','1_03/a-18',
  '12_03/61','12_03/62','12_03/63','12_03/64','12_03/65','12_03/66','12_03/67','12_03/68','12_03/72',
  '12_03/73','12_03/74','12_03/76','12_03/77','12_03/79','12_03/80','12_03/81','12_03/83'
]);
const A203 = Object.freeze([
  '12_03/70','12_03/71','2_03/01','2_03/02','2_03/03','2_03/04','2_03/05','2_03/06','2_03/07','2_03/60','2_03/75',
  '12_03/61','12_03/62','12_03/63','12_03/64','12_03/65','12_03/66','12_03/67','12_03/68','12_03/72','12_03/73',
  '12_03/74','12_03/76','12_03/77','12_03/78','12_03/79','12_03/80','12_03/81','12_03/83'
]);
const A403 = Object.freeze([
  '4_03/42','4_03/43','4_03/44','4_03/47','4_03/48','4_03/49','4_03/b-01','4_03/b-02','4_03/b-03','4_03/b-06'
]);

function cachedFacadePick(state, name, alternatives, difficulty, random, d1Range=alternatives.length){
  if(difficulty===0){
    if(state[name][0]===null) state[name][0]=1+rint(random,alternatives.length);
    return alternatives[state[name][0]-1];
  }
  if(difficulty===1){
    if(state[name][0]===null){ state[name][0]=1+rint(random,d1Range); return alternatives[state[name][0]-1]; }
    if(state[name][1]===null){ state[name][1]=1+rint(random,d1Range); return alternatives[state[name][1]-1]; }
    if(state[name][2]===null){ state[name][2]=1+rint(random,d1Range); return alternatives[state[name][2]-1]; }
    // Historical quirk: 1 + fmod(rand,2) can only be 1 or 2,
    // so the first cached alternative is not chosen here.
    const test1=1+rint(random,2);
    return alternatives[state[name][test1]-1];
  }
  return alternatives[rint(random,alternatives.length)];
}

function resolveCode(code, state, difficulty, random){
  let test, first;
  switch(code){
    case 0: return null;
    case 10150:
      test=wrapSubtract(rint(random,1+difficulty),2,2);
      if(test===0){ state.Ltr=true; return '1_01_50/a-09'; }
      if(test===1) return '1_01_50/a-17';
      return '12_01_50/a-02';
    case 10230:
      test=wrapSubtract(rint(random,1+difficulty),2,2);
      return ['12_02_30/a-11','1_02_30/19','1_02_30/a-15'][test];
    case 103:
      first=rint(random,100);
      if(first<=60-difficulty*10) return '12_03/a-19';
      return cachedFacadePick(state,'El103',A103,difficulty,random,34);
    case 10430:
      test=rint(random,1+difficulty); if(test>1)test=0;
      return test===0?'12_04_30/a-10':'1_04_30/18';
    case 10550:
      test=wrapSubtract(rint(random,1+difficulty),2,2);
      if(test===0){ state.Rtr=true; return '1_05_50/a-06'; }
      if(test===1)return '12_05_50/a-05';
      return '12_05_50/a-16';
    case 20150:
      test=rint(random,1+difficulty); if(test>1)test=0;
      if(state.Ltr) return '2_01_50/a-08';
      return test===0?'12_01_50/a-02':'2_01_50/10';
    case 20230:
      test=rint(random,1+difficulty); if(test>1)test=0;
      return test===0?'12_02_30/a-11':'2_02_30/08';
    case 203:
      first=rint(random,100);
      if(first<=60-difficulty*10) return '12_03/a-19';
      return cachedFacadePick(state,'El203',A203,difficulty,random,29);
    case 20430:
      test=rint(random,1+difficulty); if(test>1)test=0;
      return test===0?'12_04_30/a-10':'2_04_30/09';
    case 20550:
      test=wrapSubtract(rint(random,1+difficulty),2,2);
      if(state.Rtr) return '2_05_50/a-07';
      return ['12_05_50/a-05','2_05_50/11','12_05_50/a-16'][test];
    case 30150: return state.Ltr?'3_01_50/39':'3_01_50/35';
    case 30230: return '3_02_30/41';
    case 303: return '3_03/32';
    case 30430: return '3_04_30/40';
    case 30550: return state.Rtr?'3_05_50/38':'3_05_50/37';
    case 402:
      test=wrapSubtract(rint(random,2+difficulty),3,3);
      return ['4_02/34','4_02/46','4_02/50','4_02/b-04'][test];
    case 403:
      first=rint(random,100);
      if(first<=60-difficulty*10) return '4_03/33';
      return cachedFacadePick(state,'El403',A403,difficulty,random,6);
    case 404:
      test=wrapSubtract(rint(random,2+difficulty),3,3);
      return ['4_04/36','4_04/45','4_04/51','4_04/b-05'][test];
    default: throw new Error(`Unknown Builder structural code ${code}`);
  }
}

export function chooseTemplate(previousTemplate, random=Math.random){
  let idx=previousTemplate;
  while(idx===previousTemplate) idx=rint(random,HOUSE_TEMPLATES.length);
  return idx;
}

export function generateBuilder({size=4,difficulty=0,previousTemplate=0,random=Math.random,templateIndex=null}={}){
  if(!SIZES.includes(size)) throw new Error('Invalid Builder size');
  if(!DIFFICULTIES.includes(difficulty)) throw new Error('Invalid Builder difficulty');
  const chosen=templateIndex===null?chooseTemplate(previousTemplate,random):templateIndex;
  if(chosen<0||chosen>=HOUSE_TEMPLATES.length) throw new Error('Invalid template index');
  const state={Ltr:false,Rtr:false,El103:[null,null,null],El203:[null,null,null],El403:[null,null,null]};
  const full=emptyBoard();
  const tpl=HOUSE_TEMPLATES[chosen];
  // Exact source traversal: for (i=7..0) for (j=7..0), housedata[mask][j][i].
  for(let x=7;x>=0;x--) for(let y=7;y>=0;y--){
    full[x][y]=resolveCode(tpl[y][x],state,difficulty,random);
    if(full[x][y]!==null && !BUILDER_ASSETS[full[x][y]]) throw new Error(`Missing asset ${full[x][y]}`);
  }
  const target=full.map(col=>col.slice());
  if(size<8){
    const lo=4-size/2, hi=3+size/2;
    for(let x=0;x<8;x++) for(let y=0;y<8;y++) if(x<lo||x>hi||y<lo||y>hi) target[x][y]=null;
  }
  return {target,fullTarget:full,templateIndex:chosen};
}

export function assetCounts(board){
  const m=new Map();
  for(let x=0;x<8;x++)for(let y=0;y<8;y++){
    const a=board[x][y]; if(a===null)continue; m.set(a,(m.get(a)||0)+1);
  }
  return m;
}

export function remainingCount(target,player,assetKey,draggedAsset=null){
  let need=0,placed=0;
  for(let x=0;x<8;x++)for(let y=0;y<8;y++){
    if(target[x][y]===assetKey)need++;
    if(player[x][y]===assetKey)placed++;
  }
  // A copy currently dragged from the palette has already been taken from inventory.
  const draggingFromPalette=draggedAsset===assetKey?1:0;
  return Math.max(0,need-placed-draggingFromPalette);
}

export function availableAssets(target,player,category,draggedAsset=null){
  if(!CATEGORIES.includes(category)) return [];
  return CATEGORY_ASSETS[category].filter(a=>remainingCount(target,player,a,draggedAsset)>0);
}

export function isSolved(player,target){
  for(let x=0;x<8;x++)for(let y=0;y<8;y++) if(player[x][y]!==target[x][y]) return false;
  return true;
}

export function wrongCells(player,target){
  const out=[];
  for(let x=0;x<8;x++)for(let y=0;y<8;y++) if(player[x][y]!==null && player[x][y]!==target[x][y]) out.push([x,y]);
  return out;
}

export function secondsFromMs(ms){ return Math.floor(Math.max(0,ms)/1000); }
export { CATEGORIES };
