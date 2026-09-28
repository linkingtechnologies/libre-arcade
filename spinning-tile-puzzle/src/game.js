(function (global) {
  'use strict';

  const SPIN_CW = 1;
  const SPIN_CCW = -1;
  const TILE_COUNT = 7;
  const VERTEX_COUNT = 6;
  const MIX_COUNT = 5;
  const SQRT3 = Math.sqrt(3);

  function randomInt(rng, max) {
    if (rng && typeof rng.nextInt === 'function') return rng.nextInt(max);
    return Math.floor(rng() * max);
  }
  function idiv(a,b){ return Math.trunc(a/b); }

  // Faithful descriptor math from HexSpinnerManager/HexTileManager 2010.08.11.
  function layout(boardWidth, boardHeight) {
    const otherWidth = idiv(boardWidth * 7, 6);
    let tileWidth = idiv(otherWidth * 2, 7); // other.tilesAcross == 6, fitEdgeTiles == false
    let tileHeight = idiv(boardHeight * 4, 10); // other.tilesDown == 3
    if (tileHeight * SQRT3 > tileWidth * 2) tileHeight = Math.trunc(tileWidth * 2 / SQRT3);
    else tileWidth = Math.trunc(tileHeight * SQRT3 / 2);
    tileHeight -= tileHeight % 4;
    tileWidth -= tileWidth % 2;
    const spacingX = idiv(tileWidth, 2);
    const spacingY = idiv(tileHeight * 3, 4);
    const leftOffset = idiv(boardWidth - 5 * spacingX - tileWidth + spacingX, 2);
    const topOffset = idiv(boardHeight - 3 * spacingY - tileHeight + spacingY, 2);
    const scaleFactor = (tileHeight / tileWidth) / (2 / SQRT3);
    return { boardWidth, boardHeight, tileCount:TILE_COUNT, tilesAcross:5, tilesDown:3,
      tileWidth, tileHeight, spacingX, spacingY, leftOffset, topOffset,
      rotationSteps:6, scaleFactor };
  }

  function superExpandedIndex(flatIndex) {
    // HexTileManager with 6 columns / 3 rows used internally by HexSpinnerManager.
    if (flatIndex < 0 || flatIndex >= 9) return null;
    let x = (flatIndex % 6) * 2;
    let y = Math.floor(flatIndex / 6) * 2;
    if (x >= 6) { y += 1; x -= 5; }
    return {x,y};
  }

  function expandedIndex(flatIndex) {
    if (flatIndex < 0 || flatIndex >= TILE_COUNT) return null;
    const p = superExpandedIndex(flatIndex + 1 + Math.floor(flatIndex / 5));
    return p && p.x > 0 ? {x:p.x-1,y:p.y} : null;
  }

  function superFlatIndex(x,y) {
    if (((x+y)&1)!==0 || x<0 || x>=6 || y<0 || y>=3) return -1;
    return Math.floor(y/2)*3 + Math.floor((y+1)/2)*3 + Math.floor(x/2);
  }

  function flatIndex(x,y) {
    const result0 = superFlatIndex(x+1,y);
    if (result0 > -1 && result0 !== 6) return result0 - 1 - Math.floor(result0/6);
    return -1;
  }

  function tilePosition(l, flat) {
    const p=expandedIndex(flat); if(!p) return null;
    return {x:l.leftOffset+p.x*l.spacingX, y:l.topOffset+p.y*l.spacingY};
  }

  function vertexPosition(l, v) {
    if(v<0||v>=6) return null;
    return {x:l.leftOffset+l.tileWidth+(v%3)*l.spacingX,
      y:l.topOffset+idiv(l.tileHeight*3,4)+l.spacingY*Math.floor(v/3)+idiv(l.tileHeight,4)*((v+1)%2)};
  }

  function getNearestVertex(l,x,y){
    const yOff=y-l.topOffset-idiv(l.tileHeight,2);
    const xOff=x-l.leftOffset-idiv(l.spacingX*3,2);
    if(yOff<0||xOff<0) return -1;
    const row=Math.floor(yOff/l.spacingY), column=Math.floor(xOff/l.spacingX);
    return row<2&&column<3 ? column+row*3 : -1;
  }

  function createSolvedState(){
    return { originalIndex:Array.from({length:TILE_COUNT},(_,i)=>i), rotation:Array(TILE_COUNT).fill(0), solved:true, spinVertex:-1 };
  }
  function cloneState(s){return {originalIndex:s.originalIndex.slice(),rotation:s.rotation.slice(),solved:s.solved,spinVertex:s.spinVertex};}
  function isSolved(s){return s.originalIndex.every((v,i)=>v===i&&s.rotation[i]===0);}

  // Direct port of HexSpinnerManager.spin(). A spin orbits exactly three tiles and
  // rotates each moved tile by two of the six 60-degree rotation steps.
  function spin(state, vertex, direction){
    if(vertex<0||vertex>=VERTEX_COUNT||!(direction===SPIN_CW||direction===SPIN_CCW)) return [];
    const x=vertex%3, y=Math.floor(vertex/3);
    const newRotation=Array.from({length:3},()=>Array(2).fill(0));
    const newLocation=Array.from({length:3},()=>Array(2).fill(0));
    const changed=[];
    for(let j=0;j<=1;j++) for(let i=-1;i<=1;i++){
      const tX=x+i+1, tY=y+j;
      if(((tX+tY)&1)===1){
        let newI=i+1, newJ=j;
        const ySide=-2*j+1;
        if(i===0){ newJ+=ySide; newI+=ySide*direction; }
        else if(ySide*direction===i){ newJ+=ySide; newI-=ySide*direction; }
        else newI+=ySide*direction*2;
        const ti=flatIndex(tX,tY);
        let r=state.rotation[ti]+direction*2; while(r<0)r+=6; r%=6;
        newRotation[newI][newJ]=r; newLocation[newI][newJ]=state.originalIndex[ti];
      }
    }
    for(let j=0;j<=1;j++) for(let i=-1;i<=1;i++){
      const tX=x+i+1,tY=y+j;
      if(((tX+tY)&1)===1){
        const ti=flatIndex(tX,tY);
        state.rotation[ti]=newRotation[i+1][j]; state.originalIndex[ti]=newLocation[i+1][j]; changed.push(ti);
      }
    }
    state.spinVertex=vertex; state.solved=isSolved(state); return changed;
  }

  // Faithful port of SpinnerHandler.mix(): five passes; each pass shuffles seven
  // indices, even though vertex index 6 is invalid and intentionally becomes a no-op.
  function mix(rng=Math.random){
    const state=createSolvedState();
    const indices=Array.from({length:TILE_COUNT},(_,i)=>i);
    for(let pass=0;pass<MIX_COUNT;pass++){
      for(let j=0;j<indices.length;j++){
        const index=randomInt(rng,indices.length); const t=indices[j];indices[j]=indices[index];indices[index]=t;
      }
      for(let j=0;j<indices.length;j++) spin(state,indices[j],randomInt(rng,2)===0?SPIN_CCW:SPIN_CW);
    }
    state.solved=false; // matches SpinnerHandler even in the unlikely event mix returns solved
    state.spinVertex=-1; return state;
  }

  function fitImage(width,height,maxWidth=1100,maxHeight=760){
    const scale=Math.min(1,maxWidth/width,maxHeight/height);
    return {width:Math.max(1,Math.floor(width*scale)),height:Math.max(1,Math.floor(height*scale))};
  }
  function computeViewport(canvasWidth,canvasHeight,logicalWidth,logicalHeight,padding=18){
    const aw=Math.max(1,canvasWidth-padding*2), ah=Math.max(1,canvasHeight-padding*2);
    const scale=Math.min(aw/logicalWidth,ah/logicalHeight), width=logicalWidth*scale,height=logicalHeight*scale;
    return {scale,x:(canvasWidth-width)/2,y:(canvasHeight-height)/2,width,height};
  }
  function canvasToLogical(x,y,v){return {x:(x-v.x)/v.scale,y:(y-v.y)/v.scale};}

  function rgbToHsb(r,g,b){const cmax=Math.max(r,g,b),cmin=Math.min(r,g,b),brightness=cmax/255,saturation=cmax!==0?(cmax-cmin)/cmax:0;let hue=0;if(saturation!==0){const redc=(cmax-r)/(cmax-cmin),greenc=(cmax-g)/(cmax-cmin),bluec=(cmax-b)/(cmax-cmin);if(r===cmax)hue=bluec-greenc;else if(g===cmax)hue=2+redc-bluec;else hue=4+greenc-redc;hue/=6;if(hue<0)hue+=1;}return{h:hue,s:saturation,b:brightness};}
  function hsbToHex(h,s,v){let r=0,g=0,b=0;if(s===0){r=g=b=Math.floor(v*255+.5);}else{let hh=(h-Math.floor(h))*6,f=hh-Math.floor(hh),p=v*(1-s),q=v*(1-s*f),t=v*(1-s*(1-f));switch(Math.floor(hh)){case 0:r=v;g=t;b=p;break;case 1:r=q;g=v;b=p;break;case 2:r=p;g=v;b=t;break;case 3:r=p;g=q;b=v;break;case 4:r=t;g=p;b=v;break;default:r=v;g=p;b=q;}r=Math.floor(r*255+.5);g=Math.floor(g*255+.5);b=Math.floor(b*255+.5);}return '#'+[r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('');}
  function backgroundFromMean(r,g,b){const h=rgbToHsb(r,g,b);const br=(h.b<.35||h.b>.65)?.5:h.b+.15;return hsbToHex(h.h+.5,1,br);}

  const api={SPIN_CW,SPIN_CCW,TILE_COUNT,VERTEX_COUNT,MIX_COUNT,layout,expandedIndex,flatIndex,tilePosition,vertexPosition,getNearestVertex,createSolvedState,cloneState,isSolved,spin,mix,fitImage,computeViewport,canvasToLogical,backgroundFromMean};
  global.SpinningTileGame=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
