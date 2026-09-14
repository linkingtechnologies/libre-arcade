import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import crypto from 'node:crypto';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const publicDir=path.join(root,'public');
const files=[];
const walk=dir=>{
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,e.name);
    if(e.isDirectory())walk(p); else files.push(p);
  }
};
walk(publicDir);
const rel=p=>path.relative(root,p).replaceAll('\\','/');

const forbiddenMedia=/\.(wav|it|xm|mod|s3m|ttf|otf|xcf|png|jpe?g|gif|webp)$/i;
const badMedia=files.map(rel).filter(x=>forbiddenMedia.test(x));
if(badMedia.length)throw new Error('quarantined/original-style media present: '+badMedia.join(', '));

for(const f of files.filter(p=>/\.(html|css|js|mjs|json)$/i.test(p))){
  const text=fs.readFileSync(f,'utf8');
  const external=[...text.matchAll(/https?:\/\/[^\s)`'"]+/gi)].map(m=>m[0]).filter(u=>!/^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(u)).filter(u=>!/^https?:\/\/(grugnetto\.goatcounter\.com|gc\.zgo\.at)(?:\/|$)/i.test(u));
  if(external.length) throw new Error(`external runtime URL found in ${rel(f)}: ${external.join(', ')}`);
}

const forbiddenArchives=/\.(love|zip|exe)$/i;
const badArchives=files.map(rel).filter(x=>forbiddenArchives.test(x));
if(badArchives.length)throw new Error('original/release archive embedded in public package: '+badArchives.join(', '));


const oggs=files.map(rel).filter(x=>/\.ogg$/i.test(x));
const expectedMusic={
  'public/assets/music-modern/arcade-pulse.ogg':'01303e7d2bee0cde0f8ce74ca851a7720dc08c94937af9ff4d0c4e18a62209f2',
  'public/assets/music-modern/dreamy-orbit.ogg':'9a17aec3da6f494b160fa11a02fd862b38955fcc71cc5a0b61a74fa35bfc8b7b',
  'public/assets/music-modern/wormhole-drive.ogg':'5dad0a38f5fe5c4c8ef1a7c38c2431279e23abb89c0433f8c61c6308196b71ee',
};
if(oggs.length!==3||oggs.some(x=>!(x in expectedMusic)))throw new Error('unexpected OGG media in package: '+oggs.join(', '));
for(const [name,expected] of Object.entries(expectedMusic)){
  const got=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex');
  if(got!==expected)throw new Error(`modern music hash mismatch: ${name}`);
}
if(!fs.existsSync(path.join(root,'public/assets/music-modern/CREDITS.md')))throw new Error('modern music credits missing');

const upstreamCreditsPath=path.join(root,'docs/UPSTREAM_CREDITS.md');
if(!fs.existsSync(upstreamCreditsPath))throw new Error('historical upstream credits document missing');
const upstreamCredits=fs.readFileSync(upstreamCreditsPath,'utf8');
for(const name of ['Wesley "keyboard monkey" Werner','Eric Ahnell','Beyond','Sizenko Alexander','Nate Halley','Steve Dekorte','Tomas Pettersson','Software Heritage']){
  if(!upstreamCredits.includes(name))throw new Error(`missing historical upstream credit: ${name}`);
}

const app=fs.readFileSync(path.join(root,'public/src/app.js'),'utf8');
if(/ShiftLeft|ShiftRight/.test(app))throw new Error('Shift binding returned');
for(const f of ['app.js','audio.js','music.js','dotfont.js','camera.js','gameplay.js','physics.js','scores.js','storage.js']){
  const text=fs.readFileSync(path.join(root,'public/src',f),'utf8');
  if(!text.startsWith('// SPDX-License-Identifier: GPL-3.0-or-later'))throw new Error(`missing SPDX in src/${f}`);
}
console.log('OK — 1.0.0 distribution audit: historical quarantine intact; only 3 declared CC0 OGG tracks are bundled');
