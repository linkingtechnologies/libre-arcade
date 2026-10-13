// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

import {STATUS} from '../core/combat.js';
import {CELL} from '../core/grid.js';

// MilCity 1.0.5 historical tile palette, measured from the preserved atlas.
// The browser renderer deliberately does NOT load or embed that PNG. These are
// procedural, integer-pixel drawings that preserve the original visual grammar
// while keeping the historical atlas reference-only until asset provenance is closed.
const C={
  water:'#0026ff',water2:'#2d54ff',ground:'#684127',construction:'#4cff00',
  red:'#ff0000',yellow:'#ffd800',black:'#000000',white:'#ffffff',grey:'#404040',
  navy:'#00137f',magenta:'#ff00dc',olive:'#b29e00',oliveDark:'#7a6c00',
  darkBrown:'#382215',purple:'#bf00fe',green:'#00ff00',radarBlue:'#0000ff'
};
let radarTimer=0;

function tileBase(ctx,x,y,s,c){ctx.fillStyle=c;ctx.fillRect(x,y,s,s)}
function px(ctx,x,y,s,rx,ry,w,h,c){
  const k=s/8;ctx.fillStyle=c;
  ctx.fillRect(Math.round(x+rx*k),Math.round(y+ry*k),Math.max(1,Math.round(w*k)),Math.max(1,Math.round(h*k)));
}
function p(ctx,x,y,s,rx,ry,c){px(ctx,x,y,s,rx,ry,1,1,c)}
function octagon(ctx,x,y,s,outer,inner=null){
  // Deliberately pixelated rather than anti-aliased Canvas arcs.
  px(ctx,x,y,s,2,0,4,1,outer);px(ctx,x,y,s,1,1,6,1,outer);px(ctx,x,y,s,0,2,8,4,outer);
  px(ctx,x,y,s,1,6,6,1,outer);px(ctx,x,y,s,2,7,4,1,outer);
  if(inner){px(ctx,x,y,s,2,2,4,4,inner);}
}

export function drawTerrainCell(ctx,type,x,y,s=8){
  if(type===CELL.WATER){
    tileBase(ctx,x,y,s,C.water);
    // Three tiny wave/spark clusters: same restrained two-blue language as 1.0.5,
    // intentionally not a traced copy of the atlas pixels.
    p(ctx,x,y,s,1,5,C.water2);p(ctx,x,y,s,2,4,C.water2);p(ctx,x,y,s,3,5,C.water2);
    p(ctx,x,y,s,5,1,C.water2);p(ctx,x,y,s,6,2,C.water2);
    p(ctx,x,y,s,5,6,C.water2);p(ctx,x,y,s,6,5,C.water2);p(ctx,x,y,s,7,6,C.water2);
    return;
  }
  tileBase(ctx,x,y,s,C.ground);
}

function drawConstruction(ctx,x,y,s){
  tileBase(ctx,x,y,s,C.ground);px(ctx,x,y,s,1,1,6,6,C.construction);
  p(ctx,x,y,s,2,2,C.black);p(ctx,x,y,s,5,2,C.black);p(ctx,x,y,s,2,5,C.black);p(ctx,x,y,s,5,5,C.black);
}
function drawSiloRing(ctx,x,y,s,c){tileBase(ctx,x,y,s,C.ground);octagon(ctx,x,y,s,C.black);octagon(ctx,x,y,s,c,C.black);}
function drawPowerPlant(ctx,type,x,y,s){
  tileBase(ctx,x,y,s,C.ground);px(ctx,x,y,s,1,0,7,8,C.navy);
  if(type===6){px(ctx,x,y,s,1,0,2,2,C.black);px(ctx,x,y,s,1,6,2,2,C.black);px(ctx,x,y,s,5,0,3,1,C.black);px(ctx,x,y,s,5,7,3,1,C.black);px(ctx,x,y,s,6,1,1,3,C.yellow);px(ctx,x,y,s,5,4,2,1,C.yellow);px(ctx,x,y,s,4,5,1,2,C.yellow);}
  else{px(ctx,x,y,s,0,0,2,1,C.black);px(ctx,x,y,s,0,7,2,1,C.black);px(ctx,x,y,s,6,0,2,2,C.ground);px(ctx,x,y,s,6,6,2,2,C.ground);px(ctx,x,y,s,0,1,1,3,C.yellow);px(ctx,x,y,s,1,4,2,1,C.yellow);px(ctx,x,y,s,2,5,1,2,C.yellow);}
}
function drawAirfield(ctx,type,x,y,s){
  tileBase(ctx,x,y,s,C.grey);
  const idx=type-8;
  if(idx===0){px(ctx,x,y,s,0,0,2,8,C.black);px(ctx,x,y,s,2,0,1,1,C.yellow);px(ctx,x,y,s,2,3,1,2,C.yellow);px(ctx,x,y,s,2,7,1,1,C.yellow);}
  else{px(ctx,x,y,s,0,0,1,1,C.yellow);px(ctx,x,y,s,7,0,1,1,C.yellow);px(ctx,x,y,s,0,7,1,1,C.yellow);px(ctx,x,y,s,7,7,1,1,C.yellow);px(ctx,x,y,s,3,4,2,1,C.yellow);}
}
function drawLaboratory(ctx,type,x,y,s){
  tileBase(ctx,x,y,s,C.ground);const left=type===11;
  // White dish/radome motif with magenta electronics and black mast.
  if(left){px(ctx,x,y,s,2,1,6,1,C.black);px(ctx,x,y,s,1,2,7,1,C.white);px(ctx,x,y,s,0,3,8,4,C.white);px(ctx,x,y,s,2,7,6,1,C.black);px(ctx,x,y,s,5,3,3,3,C.magenta);px(ctx,x,y,s,6,4,1,1,C.white);}
  else{px(ctx,x,y,s,0,1,6,1,C.black);px(ctx,x,y,s,0,2,7,1,C.white);px(ctx,x,y,s,0,3,8,4,C.white);px(ctx,x,y,s,0,7,6,1,C.black);px(ctx,x,y,s,0,3,3,3,C.magenta);px(ctx,x,y,s,1,4,1,1,C.white);}
}
function drawFactory(ctx,type,x,y,s){
  tileBase(ctx,x,y,s,C.red);const q=type-13;const top=q<2,left=q%2===0;
  if(top)px(ctx,x,y,s,0,0,8,1,C.ground);else px(ctx,x,y,s,0,7,8,1,C.black);
  if(left)px(ctx,x,y,s,0,0,1,8,C.ground);else px(ctx,x,y,s,7,0,1,8,C.black);
  // Central four-tile yellow/black industrial emblem.
  px(ctx,x,y,s,left?5:0,top?5:0,3,3,C.black);px(ctx,x,y,s,left?6:0,top?6:0,2,2,C.yellow);
}
function drawHouse(ctx,x,y,s){
  tileBase(ctx,x,y,s,C.ground);px(ctx,x,y,s,2,1,4,1,C.black);px(ctx,x,y,s,1,2,6,1,C.red);px(ctx,x,y,s,0,3,8,1,C.black);
  px(ctx,x,y,s,1,4,6,4,C.white);px(ctx,x,y,s,3,5,2,3,C.black);px(ctx,x,y,s,1,5,1,1,C.yellow);px(ctx,x,y,s,6,5,1,1,C.yellow);
}
function drawNuke(ctx,type,x,y,s){
  const q=type-18,row=Math.floor(q/3),col=q%3;tileBase(ctx,x,y,s,C.ground);
  // 3x3 red casing with an olive/yellow core. Geometry is independently coded,
  // not copied as an 8x8 bitmap from the historical atlas.
  if(row===0)px(ctx,x,y,s,0,2,8,6,C.red);else if(row===1)px(ctx,x,y,s,0,0,8,8,C.red);else px(ctx,x,y,s,0,0,8,6,C.red);
  if(col===0)px(ctx,x,y,s,0,0,1,8,C.black);if(col===2)px(ctx,x,y,s,7,0,1,8,C.black);
  if(row===0)px(ctx,x,y,s,0,0,8,1,C.black);if(row===2)px(ctx,x,y,s,0,7,8,1,C.black);
  if(row===1&&col===1){px(ctx,x,y,s,2,2,4,4,C.olive);px(ctx,x,y,s,3,1,2,6,C.oliveDark);}
  else if((row===0&&col===1)||(row===2&&col===1))px(ctx,x,y,s,1,row===0?0:4,6,4,C.olive);
  else if(row===1)px(ctx,x,y,s,col===0?4:0,1,4,6,C.olive);
}
function drawCommercial(ctx,x,y,s){
  tileBase(ctx,x,y,s,C.ground);px(ctx,x,y,s,1,1,6,6,C.black);px(ctx,x,y,s,2,1,4,6,C.navy);
  // Pixel-dollar; avoids platform font differences and anti-aliasing.
  px(ctx,x,y,s,4,2,1,5,C.yellow);px(ctx,x,y,s,3,2,3,1,C.yellow);px(ctx,x,y,s,3,4,3,1,C.yellow);px(ctx,x,y,s,2,6,3,1,C.yellow);p(ctx,x,y,s,2,3,C.yellow);p(ctx,x,y,s,5,5,C.yellow);
}
function drawDestroyed(ctx,x,y,s){
  tileBase(ctx,x,y,s,C.ground);px(ctx,x,y,s,2,1,4,1,C.darkBrown);px(ctx,x,y,s,1,2,6,4,C.darkBrown);px(ctx,x,y,s,2,6,4,1,C.darkBrown);
  px(ctx,x,y,s,3,2,2,1,C.black);px(ctx,x,y,s,2,3,4,2,C.black);px(ctx,x,y,s,3,5,2,1,C.black);
}
function drawBurning(ctx,x,y,s){
  tileBase(ctx,x,y,s,C.ground);px(ctx,x,y,s,2,3,5,4,C.red);px(ctx,x,y,s,3,2,4,4,C.red);px(ctx,x,y,s,4,1,3,5,C.red);px(ctx,x,y,s,4,3,3,3,C.yellow);px(ctx,x,y,s,3,6,4,1,C.black);p(ctx,x,y,s,7,1,C.red);
}
function drawExplosion(ctx,type,x,y,s){
  tileBase(ctx,x,y,s,C.ground);const f=type-30;
  if(f===0){px(ctx,x,y,s,3,2,2,4,C.red);px(ctx,x,y,s,2,3,4,2,C.red);px(ctx,x,y,s,3,3,2,2,C.yellow);return;}
  if(f===1){px(ctx,x,y,s,2,1,4,6,C.red);px(ctx,x,y,s,1,2,6,4,C.red);px(ctx,x,y,s,2,2,4,4,C.yellow);return;}
  if(f===2){px(ctx,x,y,s,1,0,6,8,C.red);px(ctx,x,y,s,0,1,8,6,C.red);px(ctx,x,y,s,1,1,6,6,C.yellow);px(ctx,x,y,s,3,3,2,2,C.black);return;}
  if(f===3){px(ctx,x,y,s,1,0,6,8,C.red);px(ctx,x,y,s,0,1,8,6,C.red);px(ctx,x,y,s,1,1,6,6,C.yellow);px(ctx,x,y,s,2,2,4,4,C.darkBrown);px(ctx,x,y,s,3,3,2,2,C.black);return;}
  px(ctx,x,y,s,1,0,6,8,C.red);px(ctx,x,y,s,0,1,8,6,C.red);px(ctx,x,y,s,1,1,6,6,C.darkBrown);px(ctx,x,y,s,2,2,4,4,C.black);
}

export function drawHistoricalCell(ctx,type,x,y,s=8){
  if(type===1||type===2)return drawTerrainCell(ctx,type,x,y,s);
  if(type===3)return drawConstruction(ctx,x,y,s);
  if(type===4)return drawSiloRing(ctx,x,y,s,C.red);
  if(type===5)return drawSiloRing(ctx,x,y,s,C.magenta);
  if(type===6||type===7)return drawPowerPlant(ctx,type,x,y,s);
  if(type>=8&&type<=10)return drawAirfield(ctx,type,x,y,s);
  if(type===11||type===12)return drawLaboratory(ctx,type,x,y,s);
  if(type>=13&&type<=16)return drawFactory(ctx,type,x,y,s);
  if(type===17)return drawHouse(ctx,x,y,s);
  if(type>=18&&type<=26)return drawNuke(ctx,type,x,y,s);
  if(type===27)return drawCommercial(ctx,x,y,s);
  if(type===28)return drawDestroyed(ctx,x,y,s);
  if(type===29)return drawBurning(ctx,x,y,s);
  if(type>=30&&type<=34)return drawExplosion(ctx,type,x,y,s);
  tileBase(ctx,x,y,s,'#555555');
}

// Exact 1.0.5 quirk: GridView itself advances explosion cells on every CITY
// render. At 10 FPS, 30→31→32→33→34→28 lasts roughly half a second.
export function drawCity(ctx,player,now,s=8,step=true){
  for(let y=0;y<30;y++)for(let x=0;x<30;x++){
    let type=player.grid.get(x,y),shielded=false;
    // a shielded cell is its type, negated: it is drawn as that, with a frame
    if(type<0){type=-type;shielded=true;}
    drawHistoricalCell(ctx,type,x*s,y*s,s);
    // (only the engine's ten pictures a second advance the explosions: a picture drawn for any other reason, `step` false, does not)
    if(step&&type>=CELL.EXPLOSION_1&&type<=CELL.EXPLOSION_5){
      type++;
      if(type>CELL.EXPLOSION_5)type=CELL.DESTROYED;
      player.grid.set(x,y,type);
    }
    if(shielded){ctx.strokeStyle=C.purple;ctx.lineWidth=1;ctx.strokeRect(x*s+.5,y*s+.5,s-1,s-1);}
  }
}

// Radar misses are negative byte values. The J2ME GridView darkens them by
// decrementing one step every ten MILITARY renders (10 FPS => once/second).
export function drawRadar(ctx,player,s=8,step=true){
  const decay=step&&radarTimer===0;
  for(let y=0;y<30;y++)for(let x=0;x<30;x++){
    const v=player.status[y][x];
    if(v===STATUS.WATER)ctx.fillStyle=C.radarBlue;
    else if(v===STATUS.GROUND)ctx.fillStyle=C.black;
    else if(v===STATUS.BUILDING_HIT)ctx.fillStyle=C.red;
    else if(v===STATUS.BUILDING_DESTROYED)ctx.fillStyle=C.green;
    else if(v===STATUS.DISCOVERED)ctx.fillStyle='#ffff00';
    else if(v>=-128&&v<=-1){const g=Math.max(0,Math.min(255,192+v));ctx.fillStyle=`rgb(${g},${g},${g})`;if(decay&&v>-128)player.status[y][x]=v-1;}
    else ctx.fillStyle=C.black;
    ctx.fillRect(x*s,y*s,s,s);
  }
  if(step)radarTimer=(radarTimer+1)%10;
}

export function resetVisualTimers(){radarTimer=0;}
export function getVisualState(){return {radarTimer};}
export function restoreVisualState(state){radarTimer=Number.isInteger(state?.radarTimer)?((state.radarTimer%10)+10)%10:0;}

function fitHudFont(ctx,text,maxWidth){
  let size=10;
  while(size>8){ctx.font=`bold ${size}px "Courier New", monospace`;if(ctx.measureText(text).width<=maxWidth)break;size-=0.5;}
  return size;
}

export function drawHud(ctx,lines){
  ctx.fillStyle='#cccccc';ctx.fillRect(0,240,240,80);
  ctx.fillStyle='#000';ctx.textAlign='left';ctx.textBaseline='alphabetic';
  const ys=[252,263,274,285,296,307];
  lines.forEach((text,i)=>{fitHudFont(ctx,text,230);ctx.fillText(text,5,ys[i]??(252+i*11));});
}

export const HISTORICAL_TILE_PALETTE=Object.freeze({...C});
