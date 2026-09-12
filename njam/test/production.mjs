import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));

const required=[
  'index.html','style.css','LICENSE','README.md','THIRD_PARTY_NOTICES.md',
  'src/main.js','src/game.js','src/editor.js','src/highscores.js','src/levels-data.js','src/i18n.js',
  'assets/mainmenu.jpg','assets/options.jpg','assets/sprites.png','assets/font-yellow.png','assets/font-blue.png',
  'assets/music/satisfy.ogg','assets/music/ritam.ogg','assets/music/dali.ogg'
];
for(const f of required)assert.ok(exists(f),`missing required file: ${f}`);

for(const f of fs.readdirSync(path.join(root,'assets/sfx')))assert.ok(fs.statSync(path.join(root,'assets/sfx',f)).size>0,`empty SFX: ${f}`);

const html=read('index.html'), main=read('src/main.js');
const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
for(const m of main.matchAll(/\$\('#([^']+)'\)/g))assert.ok(ids.has(m[1]),`JS selector missing from HTML: #${m[1]}`);

for(const file of ['index.html','style.css',...fs.readdirSync(path.join(root,'src')).filter(f=>f.endsWith('.js')).map(f=>`src/${f}`)]){
  const text=read(file);
  for(const m of text.matchAll(/["']((?:assets|src)\/[^"']+\.(?:png|jpg|jpeg|wav|ogg|xm|s3m|js))["']/gi)){
    if(!m[1].includes('${'))assert.ok(exists(m[1]),`missing runtime asset referenced by ${file}: ${m[1]}`);
  }
}

const sums=read('reference/archives/SHA256SUMS').trim().split(/\r?\n/);
for(const line of sums){
  const [want,name]=line.trim().split(/\s+/,2);const buf=fs.readFileSync(path.join(root,'reference/archives',name));
  const got=crypto.createHash('sha256').update(buf).digest('hex');assert.equal(got,want,`archive checksum mismatch: ${name}`);
}


// Player-facing menu must advertise only implemented features and support IT/EN.
const i18n=read('src/i18n.js');
assert.ok(main.includes("const labels=t('menu')"),'localized six-item menu missing');
assert.ok(i18n.includes("menu:['Un giocatore','Due giocatori','Duello a due','Opzioni','Editor livelli','Esci']"),'Italian menu missing');
assert.ok(i18n.includes("menu:['One player game','Two player game','Two player duel','Options','Level editor','Exit']"),'English menu missing');
assert.ok(main.includes("settings.lang=settings.lang==='it'?'en':'it'"),'language toggle missing');
assert.ok(!main.includes('NETWORK DUEL NOT PORTED'),'disabled network entry leaked into player UI');
assert.ok(!html.includes('offline parity')&&!html.includes('production candidate')&&!html.includes('Web Archaeology Port'),'technical build wording leaked into player UI');
assert.ok(main.includes('mainSelected<5')&&main.includes('mainSelected=5;activateMainMenuItem()'),'keyboard navigation still targets removed menu rows');

// Production package must stay network-independent at runtime.
for(const file of ['index.html','style.css','src/main.js','src/game.js','src/editor.js','src/highscores.js','src/levels-data.js','src/i18n.js']){
  const text=read(file);assert.ok(!/\bfetch\s*\(|new\s+WebSocket\s*\(|RTCPeerConnection\s*\(/.test(text),`unexpected runtime network API in ${file}`);
}

console.log('Njam production packaging tests: OK');
