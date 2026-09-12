import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { STRINGS } from '../public/src/ui/i18n.js';

const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');

function shape(value){
  if(Array.isArray(value))return ['array',value.length];
  if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,shape(value[k])]));
  return typeof value;
}

test('English and Italian UI dictionaries stay structurally aligned',()=>{
  assert.deepEqual(shape(STRINGS.en),shape(STRINGS.it));
});

test('production HTML exposes all primary controls and both dialogs',()=>{
  const html=read('public/index.html');
  for(const id of ['game','new-game','pause','instructions-open','language','sound','about-open','touch-controls','prev','swap','next','instructions','about','screen-status','name-entry','player-name','name-save']){
    assert.match(html,new RegExp(`id=["']${id}["']`),`missing #${id}`);
  }
});

test('page has local favicon and production metadata with only the site-wide GoatCounter beacon as a remote reference',()=>{
  const html=read('public/index.html');
  assert.match(html,/rel="icon" href="\.\/favicon\.svg"/);
  assert.match(html,/name="description"/);
  const withoutAnalytics = html.replace(/https:\/\/grugnetto\.goatcounter\.com(\/count)?/g, '').replace(/https:\/\/gc\.zgo\.at/g, '');
  assert.doesNotMatch(withoutAnalytics,/https?:\/\//i);
  assert.ok(fs.existsSync(new URL('public/favicon.svg',root)));
});

test('viewport shell explicitly prevents document scrolling',()=>{
  const css=read('public/styles.css');
  assert.match(css,/html,body\{[^}]*overflow:hidden/);
  assert.match(css,/\.app\{[^}]*height:100dvh[^}]*overflow:hidden/);
  assert.match(css,/\.stage\{[^}]*min-height:0[^}]*overflow:hidden/);
});

test('player-facing copy avoids implementation jargon',()=>{
  const html=read('public/index.html');
  assert.doesNotMatch(html,/Web preservation port/i);
  assert.doesNotMatch(html,/clean-room|GPL-2\.0|dkbk\.dat/i);
  for(const lang of ['en','it']){
    assert.doesNotMatch(STRINGS[lang].subtitle,/port|GPL|datafile|clean-room|restor|preserv|storico|historical/i);
    assert.doesNotMatch(STRINGS[lang].aboutBody,/GPL|datafile|clean-room|restor|preserv|storico|historical|repository/i);
    assert.doesNotMatch(STRINGS[lang].aboutCredit,/GPL|datafile|clean-room|restor|preserv|storico|historical|repository/i);
  }
});

test('touch-oriented copy explains tap navigation',()=>{
  assert.match(STRINGS.en.anyKey,/Tap/i);
  assert.match(STRINGS.it.anyKey,/Tocca/i);
  assert.match(STRINGS.en.pressEnter,/tap/i);
  assert.match(STRINGS.it.pressEnter,/tocca/i);
});

test('repo-safe runtime never references quarantined historical datafile',()=>{
  for(const file of ['public/index.html','public/src/main.js','public/src/audio.js','public/src/render/canvas.js','public/src/ui/i18n.js']){
    assert.doesNotMatch(read(file),/dkbk\.dat/i,`${file} references dkbk.dat`);
  }
});


test('English and Italian include localized accessibility labels',()=>{
  for(const lang of ['en','it'])for(const key of ['menuLabel','stageLabel','touchControlsLabel','gameCanvasLabel','gameHelp']){
    assert.equal(typeof STRINGS[lang][key],'string');
    assert.ok(STRINGS[lang][key].trim().length>0,`${lang}.${key} is empty`);
  }
});

test('canvas uses high-density smooth rendering rather than forced pixel scaling',()=>{
  const css=read('public/styles.css'),renderer=read('public/src/render/canvas.js');
  assert.doesNotMatch(css,/image-rendering:pixelated/i);
  assert.match(renderer,/setPixelRatio/);
  assert.match(renderer,/imageSmoothingQuality='high'/);
});
