import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read = name => readFileSync(new URL(name.endsWith('.js')?`../public/js/${name}`:`../public/${name}`, import.meta.url),'utf8');
const html=read('index.html'),app=read('app.js'),css=read('style.css');

test('M3: every DOM id referenced by the interface exists in the published HTML',()=>{
  const defined=new Set([...html.matchAll(/\bid="([\w-]+)"/g)].map(m=>m[1]));
  const referenced=new Set([...app.matchAll(/\$\('([\w-]+)'\)/g)].map(m=>m[1]));
  for(const id of referenced) assert.ok(defined.has(id),`missing DOM element: ${id}`);
});

test('M3: interface does not reference remote runtime dependencies or telemetry endpoints',()=>{
  assert.match(html,/type="module" src="js\/app\.js"/);
  assert.doesNotMatch(html,/<(?:script|link)[^>]+(?:src|href)="https?:\/\//i);
  assert.doesNotMatch(app,/\b(fetch|sendBeacon|XMLHttpRequest|WebSocket)\s*\(/);
  assert.match(css,/body\{margin:0;overflow:hidden\}/);
  assert.match(css,/height:100dvh/);
  assert.match(css,/touch-action:none/);
  assert.match(html,/https:\/\/linkingtechnologies\.github\.io\/libre-arcade\//);
});

test('M3: IT/EN key sets cover every translated interface label and status',()=>{
  const english=app.match(/\ben:\{(.+?)\},\s*\bit:\{/s)?.[1];
  const italian=app.match(/\bit:\{(.+?)\}\s*\};/s)?.[1];
  assert.ok(english&&italian);
  const keys=section=>new Set([...section.matchAll(/(?:^|,)\s*(\w+):'/g)].map(m=>m[1]));
  const en=keys(english),it=keys(italian);
  assert.deepEqual([...en].sort(),[...it].sort(),'one translation has missing labels');
  const used=new Set([
    ...[...html.matchAll(/data-i18n="(\w+)"/g)].map(m=>m[1]),
    ...[...html.matchAll(/data-control="(\w+)"/g)].map(m=>m[1]),
    ...[...app.matchAll(/\bmsg\('([\w]+)'\)/g)].map(m=>m[1]),
    'boardLabel','previewLabel','resume','paused','gameOver','resetConfirm'
  ]);
  for(const key of used) assert.ok(en.has(key)&&it.has(key),`missing translation: ${key}`);
});

test('M3: publication remains a static frontend with no external asset imports',()=>{
  const rootFiles=['index.html','style.css'];
  const jsFiles=['app.js','engine.js','shapes.js'];
  for(const name of [...rootFiles,...jsFiles]){
    const src=read(name);
    assert.doesNotMatch(src,/\bimport\s*(?:.*?\sfrom\s*)?['"]https?:\/\//);
    assert.doesNotMatch(src,/https?:\/\/(?:fonts\.|cdn\.|unpkg\.)/i);
  }
});