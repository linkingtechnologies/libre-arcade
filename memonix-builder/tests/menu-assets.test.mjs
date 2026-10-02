import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..','public');
const sha=b=>createHash('sha256').update(b).digest('hex');

test('historical Builder menu assets are present and hash-verified',async()=>{
  const manifest=JSON.parse(await readFile(resolve(root,'assets/ui/original/menu-asset-manifest.json'),'utf8'));
  assert.equal(manifest.assets.length,3);
  const bg=manifest.assets.find(a=>a.historical_vfs_path==='DATA/mainmenu.jpg');
  assert.ok(bg);
  assert.equal(bg.source_sha256,bg.distributed_sha256,'mainmenu.jpg must remain byte-identical');
  const preview=manifest.assets.find(a=>a.historical_vfs_path==='DATA/pr_b.bmp');
  assert.ok(preview);
  for(const asset of manifest.assets){
    const bytes=await readFile(resolve(root,asset.distributed_path));
    assert.equal(sha(bytes),asset.distributed_sha256,asset.distributed_path);
  }
});

test('app references historical title background, Builder preview and hover frame',async()=>{
  const app=await readFile(resolve(root,'src/app.js'),'utf8');
  assert.match(app,/mainmenu\.jpg/);
  assert.match(app,/builder-preview\.png/);
  assert.match(app,/mode-hover-frame\.png/);
});

test('home renders untouched historical 800x600 title viewport',async()=>{
  const app=await readFile(resolve(root,'src/app.js'),'utf8');
  assert.match(app,/ctx\.drawImage\(bg,0,0,800,600,0,0,800,600\)/);
  assert.doesNotMatch(app,/maskHistoricalCopyright|bottomMask|copyrightMask/);
});
