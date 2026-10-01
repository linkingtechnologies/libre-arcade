import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..','public');
const sha=b=>createHash('sha256').update(b).digest('hex');

test('historical menu assets are present and hash-verified', async()=>{
  const manifest=JSON.parse(await readFile(resolve(root,'assets/ui/original/menu-asset-manifest.json'),'utf8'));
  assert.equal(manifest.assets.length,3);
  const bg=manifest.assets.find(a=>a.historical_vfs_path==='DATA/mainmenu.jpg');
  assert.ok(bg);
  assert.equal(bg.source_sha256,bg.distributed_sha256,'mainmenu.jpg must remain byte-identical');
  for(const asset of manifest.assets){
    const bytes=await readFile(resolve(root,asset.distributed_path));
    assert.equal(sha(bytes),asset.distributed_sha256,asset.distributed_path);
  }
});

test('app references the original title background and Mosaic preview assets', async()=>{
  const app=await readFile(resolve(root,'src/app.js'),'utf8');
  assert.match(app,/assets\/ui\/original\/mainmenu\.jpg/);
  assert.match(app,/assets\/ui\/original\/mosaic-preview\.png/);
  assert.match(app,/assets\/ui\/original\/mode-hover-frame\.png/);
});

test('standalone home renders the historical 800x600 title viewport without masking it', async()=>{
  const app=await readFile(resolve(root,'src/app.js'),'utf8');
  assert.match(app,/ctx\.drawImage\(bg,0,0,800,600,0,0,800,600\)/);
  assert.doesNotMatch(app,/ctx\.drawImage\(bg,0,568,800,16,0,584,800,16\)/);
  assert.match(app,/embedded historical copyright line/);
});

test('Credits exposes a clickable Libre Arcade link', async()=>{
  const app=await readFile(resolve(root,'src/app.js'),'utf8');
  assert.match(app,/https:\/\/linkingtechnologies\.github\.io\/libre-arcade\//);
  assert.match(app,/Libre Arcade ↗/);
  assert.match(app,/window\.open\(LIBRE_ARCADE_URL,'_blank','noopener,noreferrer'\)/);
});
