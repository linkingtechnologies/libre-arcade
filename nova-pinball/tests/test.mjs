import fs from 'node:fs';
const t=JSON.parse(fs.readFileSync(new URL('../public/data/table.json',import.meta.url)));
const count=type=>t.components.filter(x=>x.type===type).length;
const expected={wall:31,trigger:18,bumper:3,kicker:2,flipper:2,gate:2};
for(const [k,v] of Object.entries(expected)) if(count(k)!==v) throw new Error(`${k}: ${count(k)} != ${v}`);
if(t.ball.r!==15 || t.components.length!==58) throw new Error('baseline mismatch');
const fl=t.components.filter(x=>x.type==='flipper');
if(fl.some(x=>!x.pivot || !x.orientation)) throw new Error('invalid flipper definition');
console.log('OK — table baseline:',t.components.length,'components');
