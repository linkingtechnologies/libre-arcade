import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const publicRoot=path.join(root,'public');
test('all 88 recovered Builder PNG assets are packaged',()=>{let n=0;function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);if(e.isDirectory())walk(p);else if(p.endsWith('.png'))n++;}}walk(path.join(publicRoot,'assets/builder'));assert.equal(n,88);});
test('release contains license, reference bundle and archaeology docs',()=>{for(const p of ['LICENSE','reference/Memonix-License.txt','reference/memonix_1.6_src.tar.bz2','docs/BEHAVIOR_ORACLE.md','docs/builder-templates.json'])assert.ok(fs.existsSync(path.join(root,p)),p);});

import { BUILDER_ASSETS } from '../public/src/assets.js';
test('every asset catalog path exists',()=>{for(const a of Object.values(BUILDER_ASSETS))assert.ok(fs.existsSync(path.join(publicRoot,a.path)),a.path);});


test('release packages historical Start/Game UI assets',()=>{for(const p of ['assets/ui/original/start.jpg','assets/ui/original/start2.jpg','assets/ui/original/start3.jpg','assets/ui/original/game.jpg','assets/ui/original/game2.png','assets/ui/original/game3.png','assets/ui/original/error-x.png','assets/ui/original/error-shade.png','assets/ui/original/inactive-overlay.png','assets/ui/original/box.jpg'])assert.ok(fs.existsSync(path.join(publicRoot,p)),p);});

test('release packages historical title/menu assets',()=>{for(const p of ['assets/ui/original/mainmenu.jpg','assets/ui/original/builder-preview.png','assets/ui/original/mode-hover-frame.png','assets/ui/original/menu-asset-manifest.json'])assert.ok(fs.existsSync(path.join(publicRoot,p)),p);for(const p of ['docs/MENU_FIDELITY.md'])assert.ok(fs.existsSync(path.join(root,p)),p);assert.ok(fs.existsSync(path.join(publicRoot,'src/menu_layout.js')),'src/menu_layout.js');});
