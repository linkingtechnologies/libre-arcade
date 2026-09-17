import assert from 'node:assert/strict';
import { access, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const dist = path.resolve('dist');
for (const file of ['index.html','styles.css','LICENSE','ASSETS_LICENSE','LICENSING.md','THIRD_PARTY_NOTICES.md','SHA256SUMS','.nojekyll']) {
  await access(path.join(dist,file));
}
const forbiddenExtensions = new Set(['.swf','.zip','.psd','.wav','.mp3','.exe','.dll','.lib','.lha','.rar']);
const found=[];
async function walk(dir){
  for(const e of await readdir(dir,{withFileTypes:true})){
    const f=path.join(dir,e.name);
    const rel=path.relative(dist,f);
    if(rel.split(path.sep).some(s=>s.toLowerCase()==='reference')) found.push(rel);
    if(e.isDirectory()) await walk(f);
    else if(forbiddenExtensions.has(path.extname(e.name).toLowerCase())) found.push(rel);
  }
}
await walk(dist);
assert.deepEqual(found,[],'quarantined/reference material found in dist');
const html=await readFile(path.join(dist,'index.html'),'utf8');
assert.ok(html.includes('src/main.js'));
console.log('Production distribution guardrail: PASS');
