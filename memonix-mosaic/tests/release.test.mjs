import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile, access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
const publicRoot=resolve(root,'public');

async function exists(path){await access(resolve(root,path));return true;}
async function existsPublic(path){await access(resolve(publicRoot,path));return true;}

test('runtime entry points referenced by index.html exist', async()=>{
  const html=await readFile(resolve(publicRoot,'index.html'),'utf8');
  assert.match(html,/href="css\/style\.css"/);
  assert.match(html,/src="src\/app\.js"/);
  await existsPublic('css/style.css');
  await existsPublic('src/app.js');
});

test('release metadata contains no milestone label', async()=>{
  const files=['package.json','README.md','CHANGELOG.md','THIRD_PARTY_NOTICES.md'];
  for(const file of files){
    const text=await readFile(resolve(root,file),'utf8');
    assert.doesNotMatch(text,/\bM[2-9]\b|milestone|memonix-mosaic-m[2-9]/i, file);
  }
  const html=await readFile(resolve(publicRoot,'index.html'),'utf8');
  assert.doesNotMatch(html,/\bM[2-9]\b|milestone|memonix-mosaic-m[2-9]/i, 'index.html');
});

test('GPLv3 full license text and production documentation are present', async()=>{
  const license=await readFile(resolve(root,'LICENSE'),'utf8');
  assert.match(license,/GNU GENERAL PUBLIC LICENSE/);
  assert.match(license,/Version 3, 29 June 2007/);
  await exists('docs/RELEASE_CHECKLIST.md');
  await exists('reference/SOURCES.md');
  await exists('reference/memonix_1.6_src.tar.bz2');
  await exists('reference/MemonixSourceCode-License.txt');
  await exists('docs/ORIGINAL_ASSET_AUDIT.md');
  await existsPublic('assets/mosaic/original-asset-manifest.json');
  await existsPublic('assets/ui/original/menu-asset-manifest.json');
  await existsPublic('assets/ui/original/mainmenu.jpg');
  await existsPublic('assets/ui/original/mosaic-preview.png');
  await existsPublic('assets/ui/original/mode-hover-frame.png');
});
