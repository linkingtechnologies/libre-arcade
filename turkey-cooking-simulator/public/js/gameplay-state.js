/*
 * Turkey Cooking Simulator - Headless gameplay state
 * SPDX-License-Identifier: GPL-3.0-only
 */
import { cToF } from './thermal-model.js';

export const Difficulty = Object.freeze({ CASUAL:'casual', HARDCORE:'hardcore' });

export const TURKEY_TYPE_MODIFIERS = Object.freeze({
  'Organic Turkey': 1.03,
  'Free Range Turkey': 1.02,
  'Sunny Farms Turkey': 0.98,
  'Pastured Turkey': 1.05,
  'General Turkey': 1.00,
});

export const MARKET_STATIC = Object.freeze({
  'Frills Box': { cost: 3.00, kind:'frills' },
  'Temperature Probe': { cost: 9.00, kind:'probe' },
  'Oven Light in a Box': { cost: 15.00, kind:'ovenLight' },
  'Alarm Clock': { cost: 6.00, kind:'alarm' },
  'Cookbook': { cost: 3.00, kind:'cookbook' },
  'Repurposed Stuffing': { cost: 2.00, kind:'stuffing', modifier:1.05 },
  'Exquisite Stuffing': { cost: 3.00, kind:'stuffing', modifier:1.08 },
  'Special Stuffing': { cost: 6.00, kind:'stuffing', modifier:1.17 },
});

const TURKEY_PRICE_MULTIPLIER = Object.freeze({
  'Organic Turkey':1.20,
  'Free Range Turkey':1.00,
  'Sunny Farms Turkey':0.60,
  'Pastured Turkey':1.40,
  'General Turkey':0.80,
});

export function makeTurkeyOffers(weightsLb) {
  const names = Object.keys(TURKEY_PRICE_MULTIPLIER);
  if (!Array.isArray(weightsLb) || weightsLb.length !== names.length) throw new TypeError('five turkey weights required');
  return Object.fromEntries(names.map((name,i)=>[name, {
    kind:'turkey', weightLb:Number(weightsLb[i]), cost:Number(weightsLb[i]) * TURKEY_PRICE_MULTIPLIER[name]
  }]));
}

export class HeadlessGameState {
  constructor({wallet=45, difficulty=Difficulty.CASUAL, turkeyOffers=makeTurkeyOffers([10.10,12.20,14.30,16.40,18.50])}={}) {
    this.wallet = Number(wallet);
    this.difficulty = difficulty;
    this.hardcoreModifier = difficulty === Difficulty.HARDCORE ? 20 : 1;
    this.frillsModifier = 1;
    this.stuffingTypeModifier = 1;
    this.turkeyTypeModifier = 1;
    this.turkeyBought = false;
    this.turkeyType = '';
    this.turkeyWeight = 8;
    this.alarmBought = false;
    this.boughtOvenLight = false;
    this.hasProbe = false;
    this.hasCookbook = false;
    this.purchasedItems = [];
    this.market = {...MARKET_STATIC, ...turkeyOffers};
    this.storeVisits = 0;
    this.dialogueHeard = 0;
    this.ovenOpened = 0;
    this.peekRecords = [];
    this.turkeyCookCounter = 0;
  }

  setDifficulty(difficulty) {
    if (!Object.values(Difficulty).includes(difficulty)) throw new RangeError('unknown difficulty');
    this.difficulty=difficulty;
    this.hardcoreModifier=difficulty===Difficulty.HARDCORE?20:1;
  }

  visitStore(){ this.storeVisits++; }

  purchase(name) {
    const item=this.market[name];
    if (!item) return {ok:false, reason:'unavailable'};
    if (this.wallet < item.cost) return {ok:false, reason:'insufficient-funds'};
    if (item.kind==='turkey' && this.turkeyBought) return {ok:false, reason:'turkey-already-bought'};

    this.wallet -= item.cost;
    this.purchasedItems.push(name);
    delete this.market[name];

    if(item.kind==='turkey'){
      this.turkeyBought=true;
      this.turkeyType=name;
      this.turkeyWeight=item.weightLb;
      this.turkeyTypeModifier=TURKEY_TYPE_MODIFIERS[name];
    } else if(item.kind==='frills') this.frillsModifier=5;
    else if(item.kind==='alarm') this.alarmBought=true;
    else if(item.kind==='ovenLight') this.boughtOvenLight=true;
    else if(item.kind==='probe') this.hasProbe=true;
    else if(item.kind==='cookbook') this.hasCookbook=true;
    else if(item.kind==='stuffing') this.stuffingTypeModifier=Math.max(this.stuffingTypeModifier,item.modifier);

    return {ok:true, name, wallet:this.wallet};
  }

  addRecord(record){ this.peekRecords.push({...record}); }

  snapshot(){
    return JSON.parse(JSON.stringify({
      wallet:this.wallet,difficulty:this.difficulty,hardcoreModifier:this.hardcoreModifier,
      frillsModifier:this.frillsModifier,stuffingTypeModifier:this.stuffingTypeModifier,
      turkeyTypeModifier:this.turkeyTypeModifier,turkeyBought:this.turkeyBought,
      turkeyType:this.turkeyType,turkeyWeight:this.turkeyWeight,alarmBought:this.alarmBought,
      boughtOvenLight:this.boughtOvenLight,hasProbe:this.hasProbe,hasCookbook:this.hasCookbook,
      purchasedItems:this.purchasedItems,market:this.market,storeVisits:this.storeVisits,
      dialogueHeard:this.dialogueHeard,ovenOpened:this.ovenOpened,peekRecords:this.peekRecords,
      turkeyCookCounter:this.turkeyCookCounter
    }));
  }

  importState(state){
    const clone=JSON.parse(JSON.stringify(state));
    Object.assign(this, clone);
    return this;
  }

  static fromState(state){
    const g=new HeadlessGameState({wallet:Number(state.wallet),difficulty:state.difficulty});
    return g.importState(state);
  }
}


export const SKIN_SCORE_CHART = Object.freeze({
  raw:-1000, undercooked:-100, 'slightly cooked':75, cooked:500, overcooked:200, dry:-300, burnt:-500, fire:-500
});
export const CORE_SCORE_CHART = Object.freeze({
  raw:0, undercooked:125, 'slightly cooked':600, cooked:1000, overcooked:750, dry:400, burnt:0, fire:0
});

export function scoreDistribution(inputTempF, layer) {
  // 165 F for the core, 260 F for the skin (the final ScoreScreen passes 'skin' for the skin).
  const desiredAverage = layer==='skin' ? 260 : 165;
  const variance=1000;
  return Math.exp(-(Math.pow(inputTempF-desiredAverage,2)/(2*variance)));
}

export function calculateLegacyScore(turkeyState, modifiers={}) {
  const skinKey=turkeyState.skin.condition[2];
  const coreKey=turkeyState.core.condition[2];
  // The final ScoreScreen scores the skin by the highest temperature it ever reached, not by its temperature when served.
  const outerTemp=Number(cToF(turkeyState.skin.highestC).toFixed(2));
  const coreTemp=Number(cToF(turkeyState.core.tempC).toFixed(2));
  const outerTempScore=scoreDistribution(outerTemp,'skin')*200;
  const coreTempScore=scoreDistribution(coreTemp)*200;

  let base=0;
  base += parseInt(SKIN_SCORE_CHART[skinKey] ?? 0);
  base += parseInt(CORE_SCORE_CHART[coreKey] ?? 0);
  base += parseInt(outerTempScore.toFixed(0));
  base += parseInt(coreTempScore.toFixed(0));

  const turkeyMod=modifiers.turkeyTypeModifier ?? 1;
  const stuffing=modifiers.stuffingTypeModifier ?? 1;
  const frills=modifiers.frillsModifier ?? 1;
  const hardcore=modifiers.hardcoreModifier ?? 1;
  const total=base*turkeyMod*stuffing*frills*hardcore;
  return {base,total,roundedTotal:Number(total.toFixed(0)),outerTempF:outerTemp,coreTempF:coreTemp,
    components:{skinCondition:SKIN_SCORE_CHART[skinKey]??0,coreCondition:CORE_SCORE_CHART[coreKey]??0,
      outerTempScore:parseInt(outerTempScore.toFixed(0)),coreTempScore:parseInt(coreTempScore.toFixed(0))}};
}

export class JsonSaveStore {
  constructor(storage,key='libreArcade.turkeyCookingSimulator.save.v1') { this.storage=storage; this.key=key; }
  save(state){ const payload={version:1,savedAt:new Date(0).toISOString(),state:state.snapshot?state.snapshot():state}; this.storage.setItem(this.key,JSON.stringify(payload)); return payload; }
  load(){ const raw=this.storage.getItem(this.key); if(!raw) return null; const p=JSON.parse(raw); if(p.version!==1) throw new Error('unsupported save version'); return p; }
  clear(){ this.storage.removeItem(this.key); }
}
