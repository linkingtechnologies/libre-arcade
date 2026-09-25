import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(name.endsWith('.js')?`../public/js/${name}`:`../public/${name}`,import.meta.url),'utf8');
const html=read('index.html'),js=read('app.js'),css=read('style.css');
test('M4: credits and Libre Arcade link appear only in Credits dialog, not on the play screen or guide',()=>{
 assert.match(html,/<dialog id="creditsDialog"[\s\S]*?<\/dialog>/);
 const credits=html.match(/<dialog id="creditsDialog"[\s\S]*?<\/dialog>/)?.[0];
 assert.ok(credits);
 assert.match(credits,/https:\/\/linkingtechnologies\.github\.io\/libre-arcade\//);
 assert.doesNotMatch(html.replace(credits,''),/Libre Arcade|libre-arcade/i);
 assert.match(credits,/originalCredit/);
 assert.match(credits,/portCredit/);
});
test('M4: guide explains goal, controls, settings and saving in both languages',()=>{
 for(const id of ['rules','controlsTitle','keys','optionsTitle','customHelp','savingTitle','saveInfo'])assert.match(html,new RegExp(`data-i18n="${id}"`));
 for(const id of ['helpDialog','creditsDialog','settingsDialog','menuDialog'])assert.match(html,new RegExp(`id="${id}"`));
 for(const term of ['Original OGLBricks','OGLBricks originale','Save downloads','Salva ne scarica','Settings','Impostazioni'])assert.ok(js.includes(term),term);
});
test('M4: small portrait and landscape layouts include compact controls and no page scrolling',()=>{
 assert.match(css,/@media\(max-width:650px\) and \(orientation:portrait\)/);
 assert.match(css, /grid-template-columns:clamp\(68px,21vw,90px\) repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css, /@media\(max-height:520px\)/);
 assert.match(css, /height:100dvh/);
 assert.match(css, /body\{margin:0;overflow:hidden\}/);
});
