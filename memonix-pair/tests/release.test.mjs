import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';import { fileURLToPath } from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const publicRoot=path.join(root,'public');
test('all 72 distributed Pair PNGs exist',()=>{const dir=path.join(publicRoot,'assets/pair');const files=fs.readdirSync(dir).filter(x=>x.endsWith('.png'));assert.equal(files.length,72);assert.ok(files.includes('back.png'));assert.ok(!files.includes('toys-015.png'));});
test('reference source archive and recovered license are present',()=>{assert.ok(fs.existsSync(path.join(root,'reference/memonix_1.6_src.tar.bz2')));assert.match(fs.readFileSync(path.join(root,'reference/Memonix-License.txt'),'utf8'),/GNU General Public License version 3/i);});
test('PNG manifest contains 72 recovered assets',()=>{const lines=fs.readFileSync(path.join(root,'docs/pair-png-manifest.csv'),'utf8').trim().split(/\r?\n/);assert.equal(lines.length,73);});
test('responsive shell prevents vertical scrolling',()=>{const css=fs.readFileSync(path.join(publicRoot,'css/style.css'),'utf8');assert.match(css,/overflow:hidden/);assert.match(css,/aspect-ratio:4\/3/);assert.match(css,/100vh/);});
test('historical Start/Game UI assets are present with frozen hashes',()=>{
 const expected={
  'start.jpg':'49b49141b2303caf5789208812eb92f35edd4ab2a6915f56a206c765c18ce924',
  'start2.jpg':'d1b44a7c9cc1250824bf3f771bcda204ee008525814a7b5f215ee1d2f09528da',
  'start3.jpg':'d8a162902e3308dd1960201a130ceee01543c9b4a497fba537bb1c23a9e77363',
  'game.jpg':'a0018456a1ad35b98276d38f681644b2790b2c12f4592647496494cd9af40a70',
  'game2.png':'7cd7fb40630cef9955a0a2b052c3c2b792e1c79129d0a3ebaa861c648ea9457b',
  'box.jpg':'bf31ecdb419b1988ca592f6b802026b2a83178714855cf5993ff9590e0d291fd',
  'blank-cell.png':'bffc8ba164dce4be6b7bcd0f9cd3a21c60f4c6d56febeb942a0110623f69397b'
 };
 for(const [name,hash] of Object.entries(expected)){const b=fs.readFileSync(path.join(publicRoot,'assets/ui/original',name));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),hash,name);}
});

test('release packages historical title/menu assets',()=>{for(const p of ['assets/ui/original/mainmenu.jpg','assets/ui/original/pair-preview.png','assets/ui/original/mode-hover-frame.png','assets/ui/original/menu-asset-manifest.json','src/menu_layout.js'])assert.ok(fs.existsSync(path.join(publicRoot,p)),p);assert.ok(fs.existsSync(path.join(root,'docs/MENU_FIDELITY.md')),'docs/MENU_FIDELITY.md');});
