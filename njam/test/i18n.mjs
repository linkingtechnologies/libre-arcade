import assert from 'node:assert/strict';
import { I18N, MENU_INFO_IT } from '../src/i18n.js';
import { MENU_SCRIPT } from '../src/menu-script.js';

assert.deepEqual(Object.keys(I18N.it).sort(),Object.keys(I18N.en).sort(),'IT/EN dictionaries must expose the same keys');
assert.equal(I18N.it.menu.length,6);assert.equal(I18N.en.menu.length,6);
assert.equal(I18N.it.options.length,5);assert.equal(I18N.en.options.length,5);
assert.equal(I18N.it.editorSide.length,I18N.en.editorSide.length);
const englishInfo=MENU_SCRIPT.filter(part=>part.lines?.[0]!=='CONTACT INFORMATION');
assert.equal(MENU_INFO_IT.length,englishInfo.length,'Italian historical help carousel must match the English card count');
for(const part of MENU_INFO_IT)for(const line of part.lines)assert.ok(line.length<=60,`Italian menu info line too long (${line.length}): ${line}`);
for(const lang of ['it','en'])for(const label of I18N[lang].menu)assert.ok(label.length<=24,`${lang} menu label too long: ${label}`);

const allUiStrings=[];
function collect(v){if(typeof v==='string')allUiStrings.push(v);else if(Array.isArray(v))for(const x of v)collect(x);else if(v&&typeof v==='object')for(const x of Object.values(v))collect(x);}
collect(I18N);collect(MENU_INFO_IT);
const uiText=allUiStrings.join('\n');
assert.ok(!/\b(?:parity|production candidate|offline build|SDL|WebRTC|WebSocket|debug|protocol|packet|TCP|FPS)\b/i.test(uiText),'technical wording leaked into player-facing translations');
assert.ok(!/original behaviour|comportamento originale|level set|\bskin\b/i.test(uiText),'developer-facing wording leaked into player-facing translations');

console.log('Njam bilingual clean UI tests: OK');
