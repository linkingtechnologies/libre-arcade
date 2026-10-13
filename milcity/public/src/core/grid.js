// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

import {CONFIG} from './config.js';
export const CELL={WATER:1,GRASS:2,CONSTRUCTION:3,DESTROYED:28,BURNING:29,EXPLOSION_1:30,EXPLOSION_2:31,EXPLOSION_3:32,EXPLOSION_4:33,EXPLOSION_5:34};
export class Grid {
  constructor(w=CONFIG.gridWidth,h=CONFIG.gridHeight,fill=CELL.WATER){ this.w=w; this.h=h; this.cells=Array.from({length:h},()=>Array(w).fill(fill)); this.buildings=[]; this.shields=[]; }
  inBounds(x,y,w=1,h=1){ return x>=0&&y>=0&&x+w<=this.w&&y+h<=this.h; }
  get(x,y){ return this.inBounds(x,y)?this.cells[y][x]:0; }
  set(x,y,v){ if(this.inBounds(x,y)) this.cells[y][x]=v; }
  cloneTerrain(){ const g=new Grid(this.w,this.h,CELL.WATER); g.cells=this.cells.map(row=>row.map(v=>v===CELL.WATER?CELL.WATER:CELL.GRASS)); return g; }
  freeGrass(x,y,w,h){ if(!this.inBounds(x,y,w,h)) return false; for(let yy=y;yy<y+h;yy++) for(let xx=x;xx<x+w;xx++) if(this.get(xx,yy)!==CELL.GRASS||this.shields.some(s=>s.x===xx&&s.y===yy)) return false; return true; }
}
function blocked(g,p){
  let c=0; if(p.x===0||g.get(p.x-1,p.y)===CELL.GRASS)c++; if(p.y===0||g.get(p.x,p.y-1)===CELL.GRASS)c++;
  if(p.x===g.w-1||g.get(p.x+1,p.y)===CELL.GRASS)c++; if(p.y===g.h-1||g.get(p.x,p.y+1)===CELL.GRASS)c++; return c===4;
}
function walkerNext(g,p,rng){
  if(blocked(g,p)){
    do {p.x=rng.nextInt(g.w);p.y=rng.nextInt(g.h);} while(g.get(p.x,p.y)===CELL.GRASS);
  } else {
    const lx=p.x,ly=p.y;
    for(;;){
      p.x=lx;p.y=ly;
      switch(rng.nextInt(4)){case 0:if(p.x>0)p.x--;break;case 1:if(p.x<g.w-1)p.x++;break;case 2:if(p.y>0)p.y--;break;case 3:if(p.y<g.h-1)p.y++;break;}
      if((p.x!==lx||p.y!==ly)&&g.get(p.x,p.y)!==CELL.GRASS)break;
    }
  }
  g.set(p.x,p.y,CELL.GRASS);
}
export function buildRandomWalkGrid(fresh,w=30,h=30,targetWater=50){
  const g=new Grid(w,h,CELL.WATER), walkers=[];
  // Historical implementation used one java.util.Random per walker: `fresh()` makes one (see rng.js).
  for(let i=0;i<10;i++){
    const wr=fresh(); const p={x:wr.nextInt(w),y:wr.nextInt(h),rng:wr}; g.set(p.x,p.y,CELL.GRASS); walkers.push(p);
  }
  const waterPercent=()=>100*g.cells.flat().filter(v=>v===CELL.WATER).length/(w*h);
  let guard=0; while(waterPercent()>targetWater&&guard++<200000)for(const p of walkers)walkerNext(g,p,p.rng);
  return g;
}
