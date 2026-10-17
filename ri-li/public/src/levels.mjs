/* Ri-li 2.0.1 level-data parser. SPDX-License-Identifier: GPL-3.0-only */
export const LT = 17, HT = 15;
function be16(b,p){return (b[p]<<8)|b[p+1];}
export class LevelSet {
  constructor(bytes) {
    const b = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
    const n=be16(b,0); let pos=2; this.levels=[];
    for(let idx=0;idx<n;idx++){
      const cells=Array.from(b.slice(pos,pos+LT*HT));pos+=LT*HT;
      const startX=be16(b,pos),startY=be16(b,pos+2),startDir=be16(b,pos+4),nd=be16(b,pos+6);pos+=8;
      const decorations=[];for(let j=0;j<nd;j++){decorations.push([be16(b,pos),be16(b,pos+2),be16(b,pos+4)]);pos+=6;}
      this.levels.push({number:idx+1,cells,startX,startY,startDir,decorations});
    }
    if(pos!==b.length)throw new Error(`levels.dat under/overparsed ${pos}/${b.length}`);
  }
  get(n){if(n<1||n>this.levels.length)throw new Error(`bad level ${n}`);return this.levels[n-1];}
}
