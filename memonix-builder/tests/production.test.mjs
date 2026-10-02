import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SETTINGS, SETTINGS_KEY, scoreKey, clearAllLocalData } from '../public/src/storage.js';
const root=fileURLToPath(new URL('..',import.meta.url));
const publicRoot=path.join(root,'public');
function memoryStorage(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),has:k=>m.has(k)};}
test('complete local-data reset removes settings and all 20 score keys',()=>{const s=memoryStorage();s.setItem(SETTINGS_KEY,'{}');for(let d=0;d<5;d++)for(const z of [2,4,6,8])s.setItem(scoreKey(d,z),'42');const out=clearAllLocalData(s);assert.deepEqual(out,{...DEFAULT_SETTINGS});assert.equal(s.has(SETTINGS_KEY),false);for(let d=0;d<5;d++)for(const z of [2,4,6,8])assert.equal(s.has(scoreKey(d,z)),false);});
test('release metadata is clean first release',()=>{const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));assert.equal(pkg.name,'memonix-builder');assert.equal(pkg.version,'1.0.0');const cl=fs.readFileSync(path.join(root,'CHANGELOG.md'),'utf8');assert.match(cl,/Initial Libre Arcade release/);assert.doesNotMatch(cl,/\bM[2345]\b/);});
test('responsive no-scroll shell and touch canvas are present',()=>{const css=fs.readFileSync(path.join(publicRoot,'css/style.css'),'utf8');assert.match(css,/overflow:hidden/);assert.match(css,/100vh/);assert.match(css,/aspect-ratio:4\/3/);assert.match(css,/touch-action:none/);});
test('EN IT production UI and saved document language sync are wired',()=>{const app=fs.readFileSync(path.join(publicRoot,'src/app.js'),'utf8');for(const s of ['New Game','Nuova partita','Instructions','Istruzioni','Reset local data','Azzera dati locali'])assert.ok(app.includes(s),s);assert.match(app,/document\.documentElement\.lang=settings\.lang/);assert.match(app,/syncLang\(\);\s*requestAnimationFrame\(render\)/);});
test('Credits expose clickable Libre Arcade URL and no milestone text',()=>{const app=fs.readFileSync(path.join(publicRoot,'src/app.js'),'utf8');assert.ok(app.includes('https://linkingtechnologies.github.io/libre-arcade/'));assert.match(app,/window\.open\(LIBRE_ARCADE_URL/);assert.doesNotMatch(app,/Builder M[2345]/);});
