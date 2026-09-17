import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

const root=process.cwd();
const forbiddenExt=new Set(['.swf','.zip','.psd','.wav','.mp3','.exe','.dll','.lib','.lha','.rar']);
const forbiddenNames=new Set(['tmp-quicktap-series.mjs','tmp-flipper-matrix.mjs','exact-rest.mjs','exact-rest2.mjs','rest-grid.mjs']);
const bad=[];
async function walk(dir){
  for(const ent of await readdir(dir,{withFileTypes:true})){
    if(['game','node_modules','.git'].includes(ent.name)) continue;
    const full=path.join(dir,ent.name), rel=path.relative(root,full);
    if(ent.isDirectory()) await walk(full);
    else {
      if(forbiddenExt.has(path.extname(ent.name).toLowerCase())) bad.push(rel);
      if(forbiddenNames.has(ent.name)) bad.push(rel);
      if(rel.startsWith(`reference${path.sep}`) && path.extname(ent.name).toLowerCase()!=='.md') bad.push(rel);
    }
  }
}
await walk(root);
assert.deepEqual([...new Set(bad)],[],`public source contains quarantined or temporary files: ${bad.join(', ')}`);
console.log('Public source-tree guardrail: PASS');
