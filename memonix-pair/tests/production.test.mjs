import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_SETTINGS, SETTINGS_KEY, SCORES_KEY, clearAllLocalData } from '../public/src/storage.js';
const root=fileURLToPath(new URL('..',import.meta.url));
const publicRoot=path.join(root,'public');
function memoryStorage(){const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),has:k=>m.has(k)};}
test('complete local-data reset removes settings and score store',()=>{const s=memoryStorage();s.setItem(SETTINGS_KEY,'{}');s.setItem(SCORES_KEY,JSON.stringify({'2x2:d0':42,'8x8:d2':99}));const out=clearAllLocalData(s);assert.deepEqual(out,{...DEFAULT_SETTINGS});assert.equal(s.has(SETTINGS_KEY),false);assert.equal(s.has(SCORES_KEY),false);});
test('release metadata is clean first release',()=>{const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));assert.equal(pkg.name,'memonix-pair');assert.equal(pkg.version,'1.0.0');const cl=fs.readFileSync(path.join(root,'CHANGELOG.md'),'utf8');assert.match(cl,/Initial Libre Arcade release/);assert.doesNotMatch(cl,/\bM[2345]\b/);});
test('responsive no-scroll shell and touch canvas are present',()=>{const css=fs.readFileSync(path.join(publicRoot,'css/style.css'),'utf8');assert.match(css,/overflow:hidden/);assert.match(css,/100vh/);assert.match(css,/aspect-ratio:4\/3/);assert.match(css,/touch-action:none/);});
test('EN IT production UI and saved document language sync are wired',()=>{const app=fs.readFileSync(path.join(publicRoot,'src/app.js'),'utf8');for(const s of ['New Game','Nuova partita','Instructions','Istruzioni','Reset local data','Azzera dati locali'])assert.ok(app.includes(s),s);assert.match(app,/document\.documentElement\.lang=settings\.lang/);assert.match(app,/syncLang\(\);/);});
test('Credits expose clickable Libre Arcade URL and no milestone text',()=>{const app=fs.readFileSync(path.join(publicRoot,'src/app.js'),'utf8');assert.ok(app.includes('https://linkingtechnologies.github.io/libre-arcade/'));assert.match(app,/window\.open\(LIBRE_ARCADE_URL/);assert.doesNotMatch(app,/Pair M[2345]/);});
test('production archaeology docs use stable names and old milestone docs are absent',()=>{for(const p of ['docs/GAMEPLAY_PARITY.md','docs/VISUAL_PARITY.md','docs/MENU_FIDELITY.md','docs/RELEASE_CHECKLIST.md'])assert.ok(fs.existsSync(path.join(root,p)),p);for(const p of ['docs/M2_PARITY.md','docs/M3_VISUAL_PARITY.md','docs/M4_MENU_FIDELITY.md'])assert.equal(fs.existsSync(path.join(root,p)),false,p);});
