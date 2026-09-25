import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../public/js/app.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/style.css',import.meta.url),'utf8');
test('Player interface contains no technical save-format or developer copy outside Credits',()=>{
 const credits=html.match(/<dialog id="creditsDialog"[\s\S]*?<\/dialog>/)?.[0];
 assert.ok(credits);
 const playerHtml=html.replace(credits,'');
 assert.doesNotMatch(playerHtml.replace(/<[^>]*>/g,' '),/\b(?:GPLv3|MIT license|JSON|\.sg|beta|debug|engineState|Libre Arcade)\b/i);
 assert.doesNotMatch(app,/This web version has its own save files|Questa versione web usa i propri salvataggi|Windows game saves cannot be opened/i);
 assert.match(credits,/Libre Arcade/);
});
test('On first load feedback bar is hidden; destructive reset belongs in Menu, not help',()=>{
 assert.match(html,/<footer id="statusBar" hidden>/);
 assert.doesNotMatch(app,/updateLocale\(\);msg\('ready'\)/);
 assert.match(css,/footer\[hidden\]\{display:none\}/);
 const menu=html.match(/<dialog id="menuDialog"[\s\S]*?<\/dialog>/)?.[0];
 const help=html.match(/<dialog id="helpDialog"[\s\S]*?<\/dialog>/)?.[0];
 assert.match(menu, /id="resetData"/);
 assert.doesNotMatch(help, /id="resetData"/);
 assert.match(app, /resetConfirm:'Start fresh\?/);
});
