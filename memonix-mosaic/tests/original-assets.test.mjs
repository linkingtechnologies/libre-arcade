import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname, resolve} from 'node:path';
import {MOSAIC_FAMILY_COLORS, MOSAIC_SHAPE_NAMES, originalTileAssetPath, originalTileShapeName} from '../public/src/tile_visuals.js';
import {tileArchiveId} from '../public/src/model.js';

const here=dirname(fileURLToPath(import.meta.url));
const root=resolve(here,'..');
const publicRoot=resolve(root,'public');
const manifest=JSON.parse(await readFile(resolve(publicRoot,'assets/mosaic/original-asset-manifest.json'),'utf8'));

function sha256(buf){return createHash('sha256').update(buf).digest('hex');}
function pngSize(buf){
  const sig='89504e470d0a1a0a';
  assert.equal(buf.subarray(0,8).toString('hex'),sig);
  return {width:buf.readUInt32BE(16),height:buf.readUInt32BE(20)};
}

test('all 50 recovered Mosaic assets are present and hash-verified', async()=>{
  assert.equal(manifest.length,50);
  for(let tile=0;tile<50;tile++){
    const row=manifest[tile];
    const rel=originalTileAssetPath(tile);
    assert.equal(row.asset_path,rel);
    assert.equal(`${row.family}_${row.suffix}`,tileArchiveId(tile));
    assert.equal(row.shape,originalTileShapeName(tile));
    const bytes=await readFile(resolve(publicRoot,rel));
    assert.equal(sha256(bytes),row.png_sha256);
    assert.deepEqual(pngSize(bytes),{width:64,height:64});
  }
});

test('certified family colours and shape vocabulary match recovered originals',()=>{
  assert.deepEqual(MOSAIC_FAMILY_COLORS,['#df0000','#00dfdf','#00df00','#df00df','#0000df']);
  assert.deepEqual(MOSAIC_SHAPE_NAMES,[
    'triangle-up','square','circle','diamond','trapezoid','vertical-oval','triangle-down','stepped-cross','right-semicircle','bottom-semicircle'
  ]);
});

test('recovered historical package and artwork license notice are bundled', async()=>{
  const pkg=await readFile(resolve(root,'reference/memonix_1.6_src.tar.bz2'));
  assert.equal(sha256(pkg),'c5bd236c5cff2ffc07d98aff698368f32149c2428229fcde913e93bced250eab');
  const license=await readFile(resolve(root,'reference/MemonixSourceCode-License.txt'),'utf8');
  assert.match(license,/GNU General Public License version 3/i);
  assert.match(license,/with this artwork pack/i);
});
