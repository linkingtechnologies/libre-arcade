/* SPDX-License-Identifier: GPL-3.0-or-later */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.LanMasterCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP_CODES = [0,1,3,4,5,9,13,15];
  const ROTATE_LEFT = [0,2,1,3,4,6,7,8,5,10,11,12,9,14,13,16,17,18,15];
  const PINS = [0x00,0x03,0x0C,0xC3,0x0F,0x09,0x05,0x06,0x0A,0x0B,0x0D,0x07,0x0E,0xA5,0x69,0x02,0x08,0x01,0x04];
  const TERM_DELTA = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,16,-1,-16];
  const DIRS = [[-1,0,1,2],[1,0,2,1],[0,-1,4,8],[0,1,8,4]];

  function randStep(seed) {
    const carry = (seed & 0x80) ? 1 : 0;
    let value = (seed << 1) & 0xff;
    if (carry) value ^= 0xcf;
    return { seed:value, carry };
  }

  function rotate(tile, turns) {
    for (let i=0; i<(turns & 3); i++) tile = ROTATE_LEFT[tile];
    return tile;
  }

  function pins(tile, channel) { return (PINS[tile] >> (4*channel)) & 0x0f; }

  function boardFromMap(map) {
    const board=[];
    for (let y=0;y<12;y++) for (let x=0;x<12;x++) board.push(map[(y+1)*16+(x+1)]);
    return board;
  }

  function cursorFromStartPos(pos) {
    return {x:Math.max(0,Math.min(11,(pos&15)-1)),y:Math.max(0,Math.min(11,(pos>>4)-1))};
  }

  function unpackLevel(level, seed) {
    const map=new Array(256).fill(0);
    for (let i=0;i<144;i++) {
      let tile=MAP_CODES[level.tile_classes[i]];
      const r=randStep(seed); seed=r.seed;
      tile=rotate(tile,(seed&3)+1);
      const x=i%12,y=(i/12)|0;
      map[(y+1)*16+(x+1)]=tile;
    }
    const terminals=[];
    for(let i=0;i<256;i++) if(map[i]>=15&&map[i]<=18) terminals.push(i);

    for(const off of terminals) {
      let count=0;
      while(count<4) {
        const delta=TERM_DELTA[map[off]];
        if(map[off+delta]===0) break;
        map[off]=ROTATE_LEFT[map[off]];
        count++;
      }
    }
    return {seed,map,terminals,board:boardFromMap(map)};
  }

  function trace(map,startOrdinal=0) {
    const terminals=[];
    for(let i=0;i<256;i++) if(map[i]>=15&&map[i]<=18) terminals.push(i);
    if(!terminals.length) return {all:false,reached:0,total:0,visited:new Set(),terminals};
    const root=terminals[startOrdinal%terminals.length];
    const seen=new Set(),stack=[[root,0]];
    while(stack.length) {
      const [off,ch]=stack.pop(),key=off+':'+ch;
      if(seen.has(key)) continue;
      const p=pins(map[off],ch);
      if(!p) continue;
      seen.add(key);
      const x=off&15,y=off>>4;
      for(const [dx,dy,outBit,inBit] of DIRS) {
        if(!(p&outBit)) continue;
        const nx=x+dx,ny=y+dy;
        if(nx<0||nx>15||ny<0||ny>15) continue;
        const noff=ny*16+nx;
        for(let nch=0;nch<2;nch++) if(pins(map[noff],nch)&inBit) stack.push([noff,nch]);
      }
    }
    let reached=0;
    for(const off of terminals) if(seen.has(off+':0')) reached++;
    if(seen.size===1){reached=0;seen.clear()}
    return {all:reached===terminals.length,reached,total:terminals.length,visited:seen,terminals};
  }

  function counterDecrement(value) {
    let lo=value&0xff,hi=(value>>8)&0xff;
    lo=(lo-1)&0xff;
    if(lo!==0) return (hi<<8)|lo;
    if(hi===0) return 0;
    hi=(hi-1)&0xff;
    return (hi<<8)|lo;
  }

  function counterTicksToZero(value) {
    let ticks=0;
    while(value){value=counterDecrement(value);ticks++;if(ticks>1000000)throw new Error('counter');}
    return ticks;
  }

  function chooseRandomRotation(map,seed) {
    let r,offset;
    do{r=randStep(seed);seed=r.seed;offset=seed;}while(map[offset]===0);
    r=randStep(seed);seed=r.seed;
    return {seed,offset,amount:(seed&2)|1,x:(offset&15)-1,y:(offset>>4)-1};
  }

  function reloadRandomCounter(rrotTime,seed) {
    const r=randStep(seed);seed=r.seed;
    const jitter=seed&0x7f;
    const sum=jitter+(rrotTime&0xff)+r.carry;
    const lo=sum&0xff;
    const hi=(((rrotTime>>8)&0xff)+(sum>0xff?1:0))&0xff;
    return {seed,counter:(hi<<8)|lo,randValue:seed,carry:r.carry};
  }

  function onlinePercent(level,reached){return Math.min(100,(reached*level.term_fp)>>8);}

  return {MAP_CODES,ROTATE_LEFT,PINS,randStep,rotate,pins,boardFromMap,cursorFromStartPos,
          unpackLevel,trace,counterDecrement,counterTicksToZero,chooseRandomRotation,
          reloadRandomCounter,onlinePercent};
});
