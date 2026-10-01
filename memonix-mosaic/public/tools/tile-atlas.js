import { MOSAIC_FAMILY_NAMES, tileArchiveId, tileArchivePath } from '../src/model.js';
import { originalTileAssetPath, originalTileShapeName } from '../src/tile_visuals.js';

const grid=document.getElementById('grid');
for(let family=0;family<5;family++){
  const h=document.createElement('div');h.className='family';h.textContent=`Family ${family+1}: ${MOSAIC_FAMILY_NAMES[family]}`;grid.appendChild(h);
  for(let slot=0;slot<10;slot++){
    const tile=family*10+slot;
    const box=document.createElement('div');box.className='tile';
    const img=document.createElement('img');img.width=64;img.height=64;img.src=`../${originalTileAssetPath(tile)}`;img.alt=originalTileShapeName(tile);
    const id=document.createElement('div');id.className='id';id.textContent=tileArchiveId(tile);
    id.title=`${tileArchivePath(tile)} — ${originalTileShapeName(tile)}`;
    box.append(img,id);grid.appendChild(box);
  }
}
