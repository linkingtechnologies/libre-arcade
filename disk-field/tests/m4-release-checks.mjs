import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runtimeLevel } from '../public/js/engine.mjs';
import { normalizeLanguage, defaultLanguage } from '../public/js/settings.mjs';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const app=fs.readFileSync(path.join(root,'public/js/app.mjs'),'utf8');
const audio=fs.readFileSync(path.join(root,'public/js/audio.mjs'),'utf8');
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));

if(pkg.version !== '0.6.2') throw new Error(`expected reviewed version 0.6.2, got ${pkg.version}`);

function sha256(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
const expectedHashes={
  'public/js/engine.mjs':'d5648df0976156e4c57f579fd1dc82f55ab87828916b92b18422478e8afc6b97',
  'public/js/levels.mjs':'d7d3d032693bd2634c4291989d25f05a1cc571c1e03476f78bf089546355f455',
  'reference/archives/DiskField v1.0.zip':'d0e69dc0c4f07a886de8bd7be3fb474316b7c21af0c23a47e29fe519df4b141d',
  'reference/archives/DiskField v1.01.zip':'e12e14c9ba5a3e92635cb4d0510c245129a97b4576a82aadd8531dfba35ec26f'
};
for(const [rel,expected] of Object.entries(expectedHashes)){
  const file=path.join(root,rel);
  if(rel.startsWith('reference/') && !fs.existsSync(file)) {
    console.log(`SKIP: optional private upstream archive not included in public repository: ${rel}`);
    continue;
  }
  const got=sha256(file);
  if(got!==expected) throw new Error(`integrity mismatch ${rel}: ${got}`);
}

if(/user-scalable\s*=\s*no/i.test(html)) throw new Error('viewport disables user zoom');
if(!audio.includes('if(!Ctor)return null')) throw new Error('Web Audio unsupported-browser fallback missing');
if(!app.includes("soundBtn.setAttribute('aria-pressed'")) throw new Error('sound toggle aria-pressed state missing');
if(!app.includes("pauseBtn.setAttribute('aria-pressed'")) throw new Error('pause toggle aria-pressed state missing');
if(!app.includes('randomizeDodge:isDodge')) throw new Error('selector Dodge preview is not historically randomized');
if(normalizeLanguage('it','en-US')!=='it' || normalizeLanguage('en','it-IT')!=='en') throw new Error('valid stored language not preserved');
if(normalizeLanguage('fr','it-IT')!=='it' || normalizeLanguage('broken','en-GB')!=='en') throw new Error('invalid stored language fallback failed');
if(defaultLanguage('it-IT')!=='it' || defaultLanguage('de-DE')!=='en') throw new Error('navigator language fallback failed');

// Dodge! must be affected by RNG when requested, while the static source snapshot remains unchanged.
const seqA=[0.10,0.20,0.30,0.40,0.50,0.60,0.70,0.80,0.90,0.15];
const seqB=[0.91,0.81,0.71,0.61,0.51,0.41,0.31,0.21,0.11,0.95];
function seqRng(seq){let i=0;return()=>seq[(i++)%seq.length];}
const a=runtimeLevel(6,{randomizeDodge:true,rng:seqRng(seqA)});
const b=runtimeLevel(6,{randomizeDodge:true,rng:seqRng(seqB)});
const fixed=runtimeLevel(6,{randomizeDodge:false,rng:seqRng(seqA)});
const moving=l=>l.walls.filter(w=>w.type==='MovingWall').map(w=>[w.rect.y,w.yVel]);
if(JSON.stringify(moving(a))===JSON.stringify(moving(b))) throw new Error('Dodge RNG has no effect');
if(JSON.stringify(moving(a))===JSON.stringify(moving(fixed))) throw new Error('randomized Dodge unexpectedly equals frozen exported snapshot');
for(const l of [a,b]) for(const w of moving(l)) if(!w.every(Number.isFinite)) throw new Error('non-finite randomized Dodge wall state');

console.log('PASS: M4 release hardening checks');
console.log('PASS: physics/level baseline hashes unchanged; optional private archives checked if present');
console.log('PASS: Dodge selector/runtime randomization remains controllable and finite');
console.log('PASS: browser audio degrades safely and viewport permits user zoom');
