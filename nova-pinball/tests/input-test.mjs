import fs from 'node:fs';
const app=fs.readFileSync(new URL('../public/src/app.js', import.meta.url),'utf8');
const index=fs.readFileSync(new URL('../public/index.html', import.meta.url),'utf8');
const readme=fs.readFileSync(new URL('../README.md', import.meta.url),'utf8');
for (const [name,text] of [['app.js',app],['index.html',index]]) {
  if (/ShiftLeft|ShiftRight|Shift\/Frecce|Shift\/Arrows/.test(text)) throw new Error(`${name}: active Shift binding/help remains`);
}
if (!app.includes("key==='z'") || !app.includes("key==='m'")) throw new Error('Z/M controls not bound');
if (!app.includes("if(!e.repeat)nudge()")) throw new Error('Space repeat guard missing');
if (!/Z \/ Left Arrow/.test(readme) || !/M \/ Right Arrow/.test(readme)) throw new Error('README controls not updated');
console.log('input controls OK: Z/M + arrows; no Shift binding; Space repeat guarded');
