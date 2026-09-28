// GPL-3.0-or-later. Clean JavaScript port of the Virtual Toybox Puzzle
// Collection 2010.08.11 jigsaw geometry distributed in puzzlegames.jar.
// SquareJigsawManager used a distinct pre-JigsawCutter edge algorithm.
// HexJigsawManager already used the edge construction later generalized by
// JigsawCutter, so its geometry is intentionally delegated to the 2012 port.
import {makeRng,squareBestFit,createHexGeometry as createHexGeometry2012} from './geometry2012.js';

const ri=(rng,n)=>Math.floor(rng()*n);
const jdiv=(a,b)=>Math.trunc(a/b);

function render2010SquareEdge(path,x1,y1,x2,y2,cp,bubbleSize,bubbleDirection,dimension,direction,tileWidth,tileHeight){
  // Direct port of SquareJigsawManager.buildEdge() from 2010.08.11.
  const X=0;
  let a1,b1,a2,b2,midB;
  if(dimension===X){
    a1=x1;b1=y1;a2=x2;b2=y2;midB=tileHeight/2;
  }else{
    // Transpose coordinates for horizontal edges, matching the Java code.
    a1=y1;b1=x1;a2=y2;b2=x2;midB=tileWidth/2;
  }
  const midA=(a2-a1)*(midB-b1)/(b2-b1)+a1;
  const cpStemA1=bubbleDirection===0?a1:Math.min(bubbleDirection*a2,bubbleDirection*a1)*bubbleDirection;
  const cpStemA2=bubbleDirection===0?a1:Math.min(bubbleDirection*a2,bubbleDirection*a1)*bubbleDirection;
  const bubbleStemFactor=.30;
  const stemA1=bubbleDirection*bubbleSize*bubbleStemFactor+midA*.25+a1*.75;
  const stemA2=bubbleDirection*bubbleSize*bubbleStemFactor+midA*.25+a2*.75;
  const bubbleA=bubbleDirection*bubbleSize+midA;
  const cpBubbleA1=bubbleA+(stemA1-stemA2);
  const cpBubbleA2=bubbleA+(stemA2-stemA1);
  const cpBubbleB1=midB-1.5*direction*Math.abs(bubbleA-stemA1);
  const cpBubbleB2=midB+1.5*direction*Math.abs(bubbleA-stemA2);
  const bubbleB=(cpBubbleB1+cpBubbleB2)/2;
  const stemB1=cpBubbleB1*bubbleStemFactor+midB*(1-bubbleStemFactor);
  const stemB2=cpBubbleB2*bubbleStemFactor+midB*(1-bubbleStemFactor);
  if(dimension===X){
    path.bezierCurveTo(a1,cp,cpStemA1,midB,stemA1,stemB1);
    path.quadraticCurveTo(cpBubbleA1,cpBubbleB1,bubbleA,bubbleB);
    path.quadraticCurveTo(cpBubbleA2,cpBubbleB2,stemA2,stemB2);
    path.bezierCurveTo(cpStemA2,midB,a2,cp,a2,b2);
  }else{
    path.bezierCurveTo(cp,a1,midB,cpStemA1,stemB1,stemA1);
    path.quadraticCurveTo(cpBubbleB1,cpBubbleA1,bubbleB,bubbleA);
    path.quadraticCurveTo(cpBubbleB2,cpBubbleA2,stemB2,stemA2);
    path.bezierCurveTo(midB,cpStemA2,cp,a2,b2,a2);
  }
}

export function createSquareGeometry2010(boardWidth,boardHeight,targetCount,seed){
  const fit=squareBestFit(boardWidth,boardHeight,targetCount),cols=fit.across,rows=fit.down;
  const bubbleMinFactor=.30,bubbleMaxFactor=.40,controlPointVarianceFactor=.10,cornerVarianceFactor=.20;
  let tw=jdiv(boardWidth+boardHeight,cols+rows);
  const maxTW=Math.trunc(boardWidth/(cols-2*cornerVarianceFactor));
  const maxTH=Math.trunc(boardHeight/(rows-2*cornerVarianceFactor));
  tw=Math.min(tw,maxTW,maxTH);
  const th=tw,spacingX=tw,spacingY=tw;
  const controlPointVariance=Math.trunc(tw*controlPointVarianceFactor);
  const cornerVariance=Math.trunc(tw*cornerVarianceFactor);
  const bubbleMin=Math.trunc((tw-cornerVariance*2)*bubbleMinFactor);
  const bubbleMax=Math.trunc((tw-cornerVariance*2)*bubbleMaxFactor);
  const leftOffset=jdiv(boardWidth-cols*spacingX-tw+spacingX,2);
  const topOffset=jdiv(boardHeight-rows*spacingY-th+spacingY,2);
  const rightOffset=boardWidth-leftOffset-tw*cols;
  const bottomOffset=boardHeight-topOffset-th*rows;
  const topVariance=Math.min(cornerVariance,topOffset);
  const bottomVariance=Math.min(cornerVariance,bottomOffset);
  const leftVariance=Math.min(cornerVariance,leftOffset);
  const rightVariance=Math.min(cornerVariance,rightOffset);
  const rng=makeRng(seed);
  const arr=()=>Array.from({length:cols+1},()=>Array(rows+1).fill(0));
  const cornerOffsetX=arr(),cornerOffsetY=arr(),bubbleSizeX=arr(),bubbleSizeY=arr(),bubbleSideX=arr(),bubbleSideY=arr(),controlPointOffsetX=arr(),controlPointOffsetY=arr();

  for(let x=0;x<=cols;x++)for(let y=0;y<=rows;y++){
    bubbleSizeX[x][y]=ri(rng,bubbleMax-bubbleMin)+bubbleMin;
    bubbleSideX[x][y]=ri(rng,2)*2-1;
    cornerOffsetX[x][y]=ri(rng,cornerVariance*2-1)-cornerVariance+1;
    bubbleSizeY[x][y]=ri(rng,bubbleMax-bubbleMin)+bubbleMin;
    bubbleSideY[x][y]=ri(rng,2)*2-1;
    cornerOffsetY[x][y]=ri(rng,cornerVariance*2-1)-cornerVariance+1;
    if(controlPointVariance>0){
      controlPointOffsetX[x][y]=ri(rng,controlPointVariance*2-1)-controlPointVariance+1;
      controlPointOffsetY[x][y]=ri(rng,controlPointVariance*2-1)-controlPointVariance+1;
    }
  }
  // Original edge clipping/stretching rules.
  for(let x=0;x<=cols;x++){
    cornerOffsetY[x][0]=-topVariance;
    cornerOffsetY[x][rows]=bottomVariance;
    bubbleSizeY[x][0]=bubbleSizeY[x][rows]=0;
    bubbleSideY[x][0]=bubbleSideY[x][rows]=0;
    controlPointOffsetY[x][0]=controlPointOffsetY[x][rows]=0;
  }
  for(let y=0;y<=rows;y++){
    cornerOffsetX[0][y]=-leftVariance;
    cornerOffsetX[cols][y]=rightVariance;
    bubbleSizeX[0][y]=bubbleSizeX[cols][y]=0;
    bubbleSideX[0][y]=bubbleSideX[cols][y]=0;
    controlPointOffsetX[0][y]=controlPointOffsetX[cols][y]=0;
  }

  function buildPath(x,y){
    const p=new Path2D();
    let i=0,j=0;
    let px=cornerOffsetX[x+i][y+j],py=cornerOffsetY[x+i][y+j];
    p.moveTo(px,py);let pxx=px,pyy=py;
    i=1;
    let cp=tw/2+controlPointOffsetX[x][y+j];
    px=cornerOffsetX[x+i][y+j]+tw;py=cornerOffsetY[x+i][y+j];
    render2010SquareEdge(p,pxx,pyy,px,py,cp,bubbleSizeY[x][y+j],bubbleSideY[x][y+j],1,1,tw,th);pxx=px;pyy=py;
    j=1;
    cp=th/2+controlPointOffsetY[x+i][y];
    px=cornerOffsetX[x+i][y+j]+tw;py=cornerOffsetY[x+i][y+j]+th;
    render2010SquareEdge(p,pxx,pyy,px,py,cp,bubbleSizeX[x+i][y],bubbleSideX[x+i][y],0,1,tw,th);pxx=px;pyy=py;
    i=0;
    cp=tw/2+controlPointOffsetX[x][y+j];
    px=cornerOffsetX[x+i][y+j];py=cornerOffsetY[x+i][y+j]+th;
    render2010SquareEdge(p,pxx,pyy,px,py,cp,bubbleSizeY[x][y+j],bubbleSideY[x][y+j],1,-1,tw,th);pxx=px;pyy=py;
    j=0;
    cp=th/2+controlPointOffsetY[x+i][y];
    px=cornerOffsetX[x+i][y+j];py=cornerOffsetY[x+i][y+j];
    render2010SquareEdge(p,pxx,pyy,px,py,cp,bubbleSizeX[x+i][y],bubbleSideX[x+i][y],0,-1,tw,th);
    p.closePath();return p;
  }
  const tiles=[];
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const index=y*cols+x;
    tiles.push({index,gx:x,gy:y,origX:leftOffset+x*spacingX,origY:topOffset+y*spacingY,path:buildPath(x,y)});
  }
  return {shape:'square',era:'2010',algorithm:'Virtual Toybox 2010 square',cols,rows,tileCount:tiles.length,tileWidth:tw,tileHeight:th,spacingX,spacingY,leftOffset,topOffset,rotationSteps:4,tiles,parameters:{bubbleMinFactor,bubbleMaxFactor,controlPointVarianceFactor,cornerVarianceFactor,bubbleStemFactor:.30}};
}

export function createHexGeometry2010(boardWidth,boardHeight,targetCount,seed){
  // The 2010 HexJigsawManager already contains the edge algorithm later moved
  // into JigsawCutter. Constants and clipping/indexing are unchanged in the
  // 2012 source tree, so delegating avoids fabricating a historical delta.
  const g=createHexGeometry2012(boardWidth,boardHeight,targetCount,seed);
  return {...g,era:'2010',algorithm:'Virtual Toybox 2010 hex (mathematically retained in 2012)',historicalEquivalentTo2012:true};
}
