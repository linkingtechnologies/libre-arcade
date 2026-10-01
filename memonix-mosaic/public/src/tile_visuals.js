// Memonix: Mosaic original tile artwork.
//
// The 50 runtime bitmaps were recovered from gamedata.vfs contained in the
// historical source package memonix_1.6_src.tar.bz2. The package's License.txt
// explicitly references GNU GPL v3 "with this artwork pack".
//
// The distributable browser assets are lossless PNG conversions of the original
// 64x64 BMP pixels. A small vector fallback is kept only for environments where
// Image is unavailable (for example the dependency-free Node smoke test).

export const MOSAIC_FAMILY_COLORS = ['#df0000','#00dfdf','#00df00','#df00df','#0000df'];
export const MOSAIC_FAMILY_LIGHT  = ['#ff6666','#66ffff','#66ff66','#ff66ff','#6666ff'];
export const MOSAIC_FAMILY_DARK   = ['#8f0000','#008f8f','#008f00','#8f008f','#00008f'];

// Slot order follows the historical archive load order _1.._9,_0.
export const MOSAIC_SHAPE_NAMES = [
  'triangle-up',
  'square',
  'circle',
  'diamond',
  'trapezoid',
  'vertical-oval',
  'triangle-down',
  'stepped-cross',
  'right-semicircle',
  'bottom-semicircle',
];

const SUFFIXES = [1,2,3,4,5,6,7,8,9,0];
const imageCache = new Map();

function validateTile(tile){
  if(!Number.isInteger(tile)||tile<0||tile>=50) throw new Error('Unsupported Mosaic tile');
}

export function originalTileAssetPath(tile){
  validateTile(tile);
  const family=Math.floor(tile/10)+1;
  const suffix=SUFFIXES[tile%10];
  return `assets/mosaic/${family}_${suffix}.png`;
}

export function originalTileShapeName(tile){
  validateTile(tile);
  return MOSAIC_SHAPE_NAMES[tile%10];
}

function imageFor(tile){
  if(typeof Image==='undefined') return null;
  if(imageCache.has(tile)) return imageCache.get(tile);
  const img=new Image();
  img.decoding='async';
  img.src=new URL(`../${originalTileAssetPath(tile)}`, import.meta.url).href;
  imageCache.set(tile,img);
  return img;
}

export function preloadOriginalTiles(){
  if(typeof Image==='undefined') return [];
  return Array.from({length:50},(_,tile)=>imageFor(tile));
}

function drawVectorFallback(ctx,tile,x,y,size){
  const fam=Math.floor(tile/10), slot=tile%10;
  const color=MOSAIC_FAMILY_COLORS[fam];
  // eslint-disable-next-line no-unused-vars -- unused since the shapes below use translate/scale instead
  const cx=x+size/2, cy=y+size/2;
  const s=size/64;

  ctx.save();
  ctx.fillStyle='#fff';
  ctx.fillRect(x,y,size,size);
  ctx.translate(x,y);ctx.scale(s,s);
  ctx.fillStyle=color;
  ctx.strokeStyle='#fff';
  ctx.lineWidth=5;
  ctx.lineJoin='round';
  ctx.lineCap='round';
  ctx.beginPath();
  switch(slot){
    case 0: // _1 triangle up
      ctx.moveTo(32,5);ctx.lineTo(58,57);ctx.lineTo(6,57);ctx.closePath();break;
    case 1: // _2 square
      ctx.roundRect(8,7,48,50,2);break;
    case 2: // _3 circle
      ctx.arc(32,32,27,0,Math.PI*2);break;
    case 3: // _4 diamond
      ctx.moveTo(32,5);ctx.lineTo(59,32);ctx.lineTo(32,59);ctx.lineTo(5,32);ctx.closePath();break;
    case 4: // _5 trapezoid
      ctx.moveTo(20,7);ctx.lineTo(44,7);ctx.lineTo(56,57);ctx.lineTo(8,57);ctx.closePath();break;
    case 5: // _6 vertical oval
      ctx.ellipse(32,32,17,27,0,0,Math.PI*2);break;
    case 6: // _7 triangle down
      ctx.moveTo(6,7);ctx.lineTo(58,7);ctx.lineTo(32,59);ctx.closePath();break;
    case 7: // _8 stepped cross
      ctx.moveTo(21,8);ctx.lineTo(43,8);ctx.lineTo(43,15);ctx.lineTo(51,15);ctx.lineTo(51,23);ctx.lineTo(58,23);ctx.lineTo(58,41);ctx.lineTo(51,41);ctx.lineTo(51,49);ctx.lineTo(43,49);ctx.lineTo(43,56);ctx.lineTo(21,56);ctx.lineTo(21,49);ctx.lineTo(13,49);ctx.lineTo(13,41);ctx.lineTo(6,41);ctx.lineTo(6,23);ctx.lineTo(13,23);ctx.lineTo(13,15);ctx.lineTo(21,15);ctx.closePath();break;
    case 8: // _9 right-facing semicircle with vertical left edge
      ctx.moveTo(20,5);ctx.lineTo(20,59);ctx.arc(20,32,27,-Math.PI/2,Math.PI/2);ctx.closePath();break;
    case 9: // _0 lower semicircle with horizontal top edge
      ctx.moveTo(5,21);ctx.lineTo(59,21);ctx.arc(32,21,27,0,Math.PI);ctx.closePath();break;
  }
  ctx.fill();ctx.stroke();
  // Fine family-colour inner rim visible in the original anti-aliased bitmaps.
  ctx.strokeStyle=color;ctx.lineWidth=1;ctx.stroke();
  ctx.restore();
}

export function drawMosaicTile(ctx,tile,x,y,size=64,selected=false){
  if(tile===null||tile===undefined) return;
  validateTile(tile);
  const img=imageFor(tile);
  if(img&&img.complete&&img.naturalWidth>0){
    ctx.drawImage(img,x,y,size,size);
  }else{
    drawVectorFallback(ctx,tile,x,y,size);
  }
  if(selected){
    ctx.save();
    ctx.strokeStyle='#fff49b';
    ctx.lineWidth=Math.max(2,size*.045);
    ctx.strokeRect(x+2,y+2,size-4,size-4);
    ctx.restore();
  }
}

// Start fetching all 50 assets as soon as the module loads in a browser.
preloadOriginalTiles();
