import fs from 'node:fs';
import { World } from '../public/js/engine.mjs';

const app = fs.readFileSync(new URL('../public/js/app.mjs', import.meta.url), 'utf8');
const html = fs.readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');

for (const forbidden of ['MAKISUPA.TTF','tradeyourkid.ogg','.wav','thud.ogg','thud2.ogg','thud3.ogg']) {
  if (app.includes(forbidden) || html.includes(forbidden)) throw new Error(`public build references quarantined asset: ${forbidden}`);
}
for (const required of ['menuBtn','levelSelect','leftBtn','rightBtn']) {
  if (!html.includes(`id="${required}"`)) throw new Error(`missing UI control ${required}`);
}

const w = new World(16);
const before = w.disks.map(d => [...d.pos.v]);
for (let i=0;i<60;i++) w.updatePreview();
const after = w.disks.map(d => [...d.pos.v]);
if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('preview mode moved a disk');

console.log('PASS: M2 static/public-asset checks');
console.log('PASS: selector preview leaves disks stationary');
