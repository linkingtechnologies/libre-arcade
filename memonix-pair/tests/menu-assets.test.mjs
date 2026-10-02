import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';
import { MENU_LAYOUT } from '../public/src/menu_layout.js';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..','public');
const sha=b=>createHash('sha256').update(b).digest('hex');

test('historical Pair menu assets are packaged and hash-verified',async()=>{
 const manifest=JSON.parse(await readFile(resolve(root,'assets/ui/original/menu-asset-manifest.json'),'utf8'));
 assert.equal(manifest.assets.length,3);
 for(const asset of manifest.assets){const bytes=await readFile(resolve(root,asset.distributed_path));assert.equal(sha(bytes),asset.distributed_sha256,asset.distributed_path);}
 const bg=manifest.assets.find(a=>a.historical_vfs_path==='DATA/mainmenu.jpg');assert.equal(bg.distributed_sha256,'b80923760684034f5551d208c19464b9f94350c913d69ee1d40dc1da266f4ee9');
 const preview=manifest.assets.find(a=>a.historical_vfs_path==='DATA/pr_p.bmp');assert.ok(preview);
});

test('Pair keeps its historical suite slot at 496,66',()=>{assert.deepEqual([MENU_LAYOUT.slots.play.x,MENU_LAYOUT.slots.play.y,MENU_LAYOUT.slots.play.w,MENU_LAYOUT.slots.play.h],[496,66,128,128]);});

test('home renders untouched historical 800x600 title viewport',async()=>{const app=await readFile(resolve(root,'src/app.js'),'utf8');assert.match(app,/ctx\.drawImage\(bg,0,0,800,600,0,0,800,600\)/);assert.doesNotMatch(app,/maskHistoricalCopyright|bottomMask|copyrightMask/);assert.match(app,/pair-preview\.png/);assert.match(app,/mode-hover-frame\.png/);});
