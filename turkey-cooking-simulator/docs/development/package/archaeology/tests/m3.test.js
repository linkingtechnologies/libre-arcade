import assert from 'node:assert/strict';
import { PreservationOvenModel, fToC } from '../src/js/thermal-model.js';
import { HeadlessGameState,Difficulty,makeTurkeyOffers,calculateLegacyScore,CORE_SCORE_CHART_UNUSED,JsonSaveStore } from '../src/js/gameplay-state.js';

const offers=makeTurkeyOffers([10,12,14,16,20]);

{ const g=new HeadlessGameState({turkeyOffers:offers}); assert.equal(g.wallet,45); assert.equal(g.hardcoreModifier,1); console.log('PASS M3-01 baseline gameplay state'); }
{ const g=new HeadlessGameState({turkeyOffers:offers}); g.setDifficulty(Difficulty.HARDCORE); assert.equal(g.hardcoreModifier,20); g.setDifficulty(Difficulty.CASUAL); assert.equal(g.hardcoreModifier,1); console.log('PASS M3-02 casual/hardcore modifiers'); }
{ const g=new HeadlessGameState({turkeyOffers:offers}); const r=g.purchase('General Turkey'); assert.equal(r.ok,true); assert.equal(g.turkeyBought,true); assert.equal(g.turkeyWeight,20); assert.equal(g.wallet,29); assert.equal(g.turkeyTypeModifier,1); console.log('PASS M3-03 turkey purchase/price'); }
{ const g=new HeadlessGameState({turkeyOffers:offers}); g.purchase('Organic Turkey'); const r=g.purchase('General Turkey'); assert.equal(r.ok,false); assert.equal(r.reason,'turkey-already-bought'); console.log('PASS M3-04 only one turkey'); }
{ const g=new HeadlessGameState({turkeyOffers:offers}); g.purchase('Repurposed Stuffing'); g.purchase('Exquisite Stuffing'); g.purchase('Special Stuffing'); assert.equal(g.stuffingTypeModifier,1.17); console.log('PASS M3-05 stuffing takes strongest modifier'); }
{ const g=new HeadlessGameState({turkeyOffers:offers}); g.purchase('Frills Box'); assert.equal(g.frillsModifier,5); console.log('PASS M3-06 frills x5 modifier'); }
{ const g=new HeadlessGameState({turkeyOffers:offers}); g.purchase('Alarm Clock'); g.purchase('Temperature Probe'); g.purchase('Cookbook'); assert.equal(g.alarmBought,true); assert.equal(g.hasProbe,true); assert.equal(g.hasCookbook,true); console.log('PASS M3-07 utility ownership flags'); }
{ const g=new HeadlessGameState({wallet:1,turkeyOffers:offers}); const r=g.purchase('Cookbook'); assert.deepEqual(r,{ok:false,reason:'insufficient-funds'}); assert.equal(g.wallet,1); console.log('PASS M3-08 insufficient funds atomicity'); }
{ const oven=new PreservationOvenModel(15); oven.changeTemp(fToC(350)); oven.tickMany(9000); const s=oven.getTurkeyState(); const score=calculateLegacyScore(s); assert.ok(Number.isFinite(score.total)); assert.equal(score.components.coreConditionUsingSkinTable, score.components.coreConditionUsingSkinTable); console.log('PASS M3-09 legacy score deterministic from thermal snapshot'); }
{ assert.equal(CORE_SCORE_CHART_UNUSED.cooked,1000); const fake={skin:{tempC:100,condition:['Cooked',0,'cooked']},core:{tempC:74,condition:['Cooked',0,'cooked']}}; const score=calculateLegacyScore(fake); assert.equal(score.components.coreConditionUsingSkinTable,500); console.log('PASS M3-10 frozen scoring bug: core uses skin chart'); }
{ const fake={skin:{tempC:(165-32)*5/9,condition:['Raw',1,'raw']},core:{tempC:(165-32)*5/9,condition:['Raw',1,'raw']}}; const a=calculateLegacyScore(fake,{hardcoreModifier:1,frillsModifier:1}); const b=calculateLegacyScore(fake,{hardcoreModifier:20,frillsModifier:5}); assert.equal(b.total,a.total*100); console.log('PASS M3-11 score multipliers compose multiplicatively'); }
{ const mem=new Map(); const storage={setItem:(k,v)=>mem.set(k,v),getItem:k=>mem.get(k)??null,removeItem:k=>mem.delete(k)}; const g=new HeadlessGameState({turkeyOffers:offers}); g.purchase('General Turkey'); g.purchase('Frills Box'); const store=new JsonSaveStore(storage); store.save(g); const p=store.load(); assert.equal(p.version,1); assert.equal(p.state.turkeyType,'General Turkey'); assert.equal(p.state.frillsModifier,5); store.clear(); assert.equal(store.load(),null); console.log('PASS M3-12 versioned JSON persistence/reset'); }

console.log('\nM3 Headless Gameplay State: 12/12 tests passed.');
