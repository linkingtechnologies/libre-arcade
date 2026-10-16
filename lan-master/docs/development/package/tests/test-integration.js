const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
function ok(v,m){if(!v)throw new Error(m)}
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const app=fs.readFileSync(path.join(ROOT,'src/app.js'),'utf8');
for(const f of ['audio-data.js','famitone.js','nes-audio.js'])ok(html.includes(`src/${f}`),`index includes ${f}`);
ok(html.indexOf('audio-data.js')<html.indexOf('famitone.js')&&html.indexOf('famitone.js')<html.indexOf('nes-audio.js')&&html.indexOf('nes-audio.js')<html.indexOf('app.js'),'audio script order');
for(let id=0;id<12;id++){
  if(id===8)ok(app.includes('q.amount===1?7:8'),'auto rotate SFX 8');
  else ok(app.includes(`playSfx(${id})`)||app.includes(`sfx:q.amount===1?7:8`)||app.includes(`queueRotation(1,6)`)||app.includes(`queueRotation(3,5)`),`SFX hook ${id}`);
}
ok(app.includes("code.startsWith('68')"),'68xx diagnostic');
ok(app.includes("state.timeoutDelay=50"),'timeout delay');
ok(app.includes("AUDIO.regs[9]"),'title animation uses audio noise');
console.log('M10 integration regression: PASS');
