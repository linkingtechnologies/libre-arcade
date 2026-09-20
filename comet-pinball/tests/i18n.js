'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..'),script=fs.readFileSync(path.join(root,'public/js/i18n.js'),'utf8');
function load(nav,storage){
  const ctx=vm.createContext({navigator:nav,localStorage:storage});ctx.window=ctx;ctx.globalThis=ctx;
  vm.runInContext(script,ctx,{filename:'public/js/i18n.js'});return ctx.CometI18n;
}
const prefs={it:{language:'it-IT',languages:['it-IT','en-US']},en:{language:'en-US',languages:['en-US']}};
assert.equal(load(prefs.en,null).getLanguage(),'en','English is the default');
assert.equal(load(prefs.it,null).getLanguage(),'it','Italian browser selects Italian');
assert.equal(load({language:'fr-FR',languages:['fr-FR']},null).getLanguage(),'en','other locales select English');
assert.equal(load({language:'en-US',languages:['en-US','it-IT']},null).getLanguage(),'it','an Italian language in browser preferences selects Italian');
assert.equal(load(prefs.en,{getItem:()=> 'it'}).getLanguage(),'it','saved preference overrides browser');
assert.equal(load(prefs.it,{getItem:()=> 'en'}).getLanguage(),'en','saved English preference overrides Italian browser');
assert.equal(load(prefs.it,{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')}}).getLanguage(),'it','blocked storage does not prevent language detection');
const values={};const api=load(prefs.en,{getItem:k=>values[k],setItem(k,v){values[k]=v}});
assert.equal(api.setLanguage('it'),'it');assert.equal(values['comet-pinball-language'],'it');
assert.equal(api.t('play'),'▶ GIOCA');assert.equal(api.setLanguage('en'),'en');assert.equal(api.t('play'),'▶ PLAY');
assert.equal(api.setLanguage('xx'),'en','unsupported values do not change language');
assert.equal(Object.keys(api.copy.en).length,Object.keys(api.copy.it).length);
for(const key of Object.keys(api.copy.en))assert(api.copy.it[key]&&api.copy.en[key],`missing UI translation: ${key}`);
console.log('PASS language: EN default, Italian browser, saved preference, blocked storage, complete dictionary');
