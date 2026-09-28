/* Libre Jigsaw browser bundle — GPL-3.0-or-later. Generated from src/*.js so the game also works from file://. */
'use strict';

const I18N=(()=>{
const STRINGS={
 en:{gameControls:"Game controls",gameMenu:"Game",puzzleMenu:"Puzzle",helpMenu:"Help",changeLanguage:"Change language",boardLabel:"Jigsaw puzzle board",closeLabel:"Close",new:"New puzzle",save:"Save",open:"Open",gallery:"Gallery",myImage:"My image",shape:"Shape",square:"Classic",hex:"Hexagonal",pieces:"Pieces",area:"Area",help:"Help",credits:"Credits",complete:"Puzzle complete!",choosePicture:"Choose a picture",galleryIntro:"The original collection included these ten photographs.",helpTitle:"How to play",help1:"Drag pieces close to their correct neighbours: they snap together and then move as a group.",help2:"Click a piece to rotate it counter-clockwise. Right-click rotates clockwise. While dragging, the left and right arrow keys also rotate the group.",help3:"Drag across an empty area to select several pieces or groups and move them together.",help4:"Use areas 1, 2 and 3 to organise the table. Keys 1, 2 and 3 switch area quickly.",help5:"Choose Gallery for one of the original photographs, or My image for a picture from your device. Your own image stays in the browser.",help6:"Save downloads your current puzzle. Open restores a saved puzzle, including a personal image when one was used.",restorationCredit:"HTML5 restoration and preservation by",loadingImage:"Loading image…",imageLoadError:"This image could not be opened. Try JPG, PNG, GIF or WebP.",loadingPuzzle:"Opening puzzle…",puzzleSaved:"Puzzle saved",puzzleLoaded:"Puzzle opened",saveLoadError:"This saved puzzle could not be opened.",legacySaveUnsupported:"This older Libre Jigsaw save is not supported yet."},
 it:{gameControls:"Controlli di gioco",gameMenu:"Partita",puzzleMenu:"Puzzle",helpMenu:"Aiuto",changeLanguage:"Cambia lingua",boardLabel:"Tavolo del puzzle",closeLabel:"Chiudi",new:"Nuovo puzzle",save:"Salva",open:"Apri",gallery:"Galleria",myImage:"Mia immagine",shape:"Forma",square:"Classica",hex:"Esagonale",pieces:"Pezzi",area:"Area",help:"Istruzioni",credits:"Crediti",complete:"Puzzle completato!",choosePicture:"Scegli un'immagine",galleryIntro:"La raccolta originale includeva queste dieci fotografie.",helpTitle:"Come si gioca",help1:"Trascina i pezzi vicino ai loro vicini corretti: si agganciano e poi si muovono come un unico gruppo.",help2:"Fai clic su un pezzo per ruotarlo in senso antiorario. Il clic destro ruota in senso orario. Durante il trascinamento puoi usare anche le frecce sinistra e destra.",help3:"Trascina su un'area vuota per selezionare più pezzi o gruppi e spostarli insieme.",help4:"Usa le aree 1, 2 e 3 per organizzare il tavolo. I tasti 1, 2 e 3 cambiano area rapidamente.",help5:"Scegli Galleria per una delle fotografie originali, oppure Mia immagine per una foto dal dispositivo. La tua immagine rimane nel browser.",help6:"Salva scarica la partita corrente. Apri ripristina un puzzle salvato, compresa un’immagine personale se era stata usata.",restorationCredit:"Restauro e preservazione HTML5 di",loadingImage:"Caricamento immagine…",imageLoadError:"Impossibile aprire questa immagine. Prova JPG, PNG, GIF o WebP.",loadingPuzzle:"Apertura puzzle…",puzzleSaved:"Puzzle salvato",puzzleLoaded:"Puzzle aperto",saveLoadError:"Impossibile aprire questo puzzle salvato.",legacySaveUnsupported:"Questo vecchio salvataggio di Libre Jigsaw non è ancora supportato."}
};
function applyLanguage(lang){document.documentElement.lang=lang;const s=STRINGS[lang];document.querySelectorAll('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(s[k])el.textContent=s[k]});document.querySelectorAll('[data-i18n-aria]').forEach(el=>{const k=el.dataset.i18nAria;if(s[k])el.setAttribute('aria-label',s[k])});}

return {STRINGS,applyLanguage};
})();

const G2012=(()=>{
// GPL-3.0-or-later. Clean JavaScript port of Jonathan Hulka's 2011/2012
// JigsawCutter + SquareJigsawManager + HexJigsawManager geometry.
// See specs/ARCHAEOLOGY.md.
const TAU=Math.PI*2;
function makeRng(seed){let s=(seed>>>0)||0x6d2b79f5;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
const ri=(rng,n)=>Math.floor(rng()*n);
const trunc=n=>n<0?Math.ceil(n):Math.floor(n);
function rotatePoint(p,angle,cx,cy){const c=Math.cos(angle),s=Math.sin(angle),x=p.x-cx,y=p.y-cy;return{x:cx+x*c-y*s,y:cy+x*s+y*c};}
function edgeCurve(corners,controls,i,a,b,cp,bubbleSize,bubbleDirection){
 const direction=b.x-a.x>0?1:-1,midY=(a.y+b.y)/2,midX=cp,cpStemY1=a.y*.65+b.y*.35,cpStemY2=b.y*.65+a.y*.35,bubbleY=bubbleDirection*bubbleSize+midY,temp=direction*Math.abs(bubbleY-midY)/Math.sqrt(3),cpBubbleX1=midX-temp,cpBubbleX2=midX+temp,stemX1=cpBubbleX1*.25+midX*.75,stemX2=cpBubbleX2*.25+midX*.75,stemY1=bubbleY*.25+cpStemY1*.75,stemY2=bubbleY*.25+cpStemY2*.75;
 controls[i*6]={x:cp*.6+a.x*.4,y:a.y};controls[i*6+1]={x:midX,y:cpStemY1};corners[i*4+1]={x:stemX1,y:stemY1};controls[i*6+2]={x:cpBubbleX1,y:bubbleY};corners[i*4+2]={x:midX,y:bubbleY};controls[i*6+3]={x:cpBubbleX2,y:bubbleY};corners[i*4+3]={x:stemX2,y:stemY2};controls[i*6+4]={x:midX,y:cpStemY2};controls[i*6+5]={x:cp*.6+b.x*.4,y:b.y};
}
function renderPath(sideCount,corners,controls){const p=new Path2D();p.moveTo(corners[0].x,corners[0].y);for(let i=0;i<sideCount;i++){p.bezierCurveTo(controls[i*6].x,controls[i*6].y,controls[i*6+1].x,controls[i*6+1].y,corners[i*4+1].x,corners[i*4+1].y);p.quadraticCurveTo(controls[i*6+2].x,controls[i*6+2].y,corners[i*4+2].x,corners[i*4+2].y);p.quadraticCurveTo(controls[i*6+3].x,controls[i*6+3].y,corners[i*4+3].x,corners[i*4+3].y);p.bezierCurveTo(controls[i*6+4].x,controls[i*6+4].y,controls[i*6+5].x,controls[i*6+5].y,corners[((i+1)%sideCount)*4].x,corners[((i+1)%sideCount)*4].y);}p.closePath();return p;}

function squareBestFit(width,height,count){let across=Math.floor(Math.sqrt(count*width/height))-1,down=0,total=0;while(total<count){across++;const tH=Math.floor(width/across);down=Math.max(1,Math.floor((height+tH/2)/tH));total=across*down;}return{across,down,total};}
function createSquareGeometry(boardWidth,boardHeight,targetCount,seed){
 const fit=squareBestFit(boardWidth,boardHeight,targetCount),cols=fit.across,rows=fit.down;
 const cornerVarianceFactor=.12,bubbleMinFactor=.30,bubbleMaxFactor=.40,controlPointVarianceFactor=.05;
 let tw=Math.floor((boardWidth+boardHeight)/(cols+rows));const maxTW=Math.floor(boardWidth/(cols-2*cornerVarianceFactor)),maxTH=Math.floor(boardHeight/(rows-2*cornerVarianceFactor));tw=Math.min(tw,maxTW,maxTH);
 const th=tw,spacingX=tw,spacingY=tw,cornerVariance=Math.max(1,Math.floor(tw*cornerVarianceFactor)),controlVariance=Math.floor(tw*controlPointVarianceFactor),bubbleMin=Math.floor((tw-cornerVariance*2)*bubbleMinFactor),bubbleMax=Math.max(bubbleMin+1,Math.floor((tw-cornerVariance*2)*bubbleMaxFactor));
 const leftOffset=Math.floor((boardWidth-cols*spacingX-tw+spacingX)/2),topOffset=Math.floor((boardHeight-rows*spacingY-th+spacingY)/2),rightOffset=boardWidth-leftOffset-tw*cols,bottomOffset=boardHeight-topOffset-th*rows;
 const topVariance=Math.min(cornerVariance,topOffset),bottomVariance=Math.min(cornerVariance,bottomOffset),leftVariance=Math.min(cornerVariance,leftOffset),rightVariance=Math.min(cornerVariance,rightOffset),rng=makeRng(seed),data=new Map(),key=(x,y)=>`${x},${y}`;
 for(let y=-1;y<=rows;y++)for(let x=-1;x<=cols;x++){const d={cornerX:ri(rng,cornerVariance*2-1)-cornerVariance+1,cornerY:ri(rng,cornerVariance*2-1)-cornerVariance+1,bubble:[0,0],dir:[0,0],cp:[0,0]};for(let k=0;k<2;k++){d.bubble[k]=ri(rng,bubbleMax-bubbleMin)+bubbleMin;d.dir[k]=ri(rng,2)*2-1;d.cp[k]=controlVariance===0?0:ri(rng,controlVariance*2-1)-controlVariance+1;}if(x===-1||x===cols-1){d.bubble[1]=0;d.cp[1]=0;}if(y===0||y===rows){d.bubble[0]=0;d.cp[0]=0;}data.set(key(x,y),d);}
 for(let y=-1;y<=rows;y++){data.get(key(0,y)).cornerX=-leftVariance;data.get(key(cols,y)).cornerX=rightVariance;}for(let x=-1;x<=cols;x++){data.get(key(x,0)).cornerY=-topVariance;data.get(key(x,rows)).cornerY=bottomVariance;}
 const mask=[{x:0,y:0},{x:tw,y:0},{x:tw,y:th},{x:0,y:th}],center={x:tw/2,y:th/2};
 function cornerOwner(x,y,i){return i===0?[x,y]:i===1?[x+1,y]:i===2?[x+1,y+1]:[x,y+1];}
 function buildPath(x,y){const corners=new Array(16),controls=new Array(24);for(let i=0;i<4;i++){const [ox,oy]=cornerOwner(x,y,i),d=data.get(key(ox,oy));corners[i*4]={x:mask[i].x+d.cornerX,y:mask[i].y+d.cornerY};}for(let i=0;i<4;i++){const topIndex=i%2;let ex=x,ey=y;if(i===2)ey=y+1;else if(i===3)ex=x-1;const d=data.get(key(ex,ey)),theta=topIndex*Math.PI/2,a=rotatePoint(corners[i*4],-theta,center.x,center.y),b=rotatePoint(corners[((i+1)%4)*4],-theta,center.x,center.y);if(d.bubble[topIndex]===0&&d.cp[topIndex]===0){for(let j=0;j<6;j++)controls[i*6+j]={...b};for(let j=1;j<4;j++)corners[i*4+j]={...b};}else edgeCurve(corners,controls,i,a,b,(a.x+b.x)/2+d.cp[topIndex],d.bubble[topIndex],d.dir[topIndex]);for(let j=0;j<6;j++)controls[i*6+j]=rotatePoint(controls[i*6+j],theta,center.x,center.y);for(let j=1;j<4;j++)corners[i*4+j]=rotatePoint(corners[i*4+j],theta,center.x,center.y);}return renderPath(4,corners,controls);}
 const tiles=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const index=y*cols+x;tiles.push({index,gx:x,gy:y,origX:leftOffset+x*spacingX,origY:topOffset+y*spacingY,path:buildPath(x,y)});}
 return{shape:'square',era:'2012',algorithm:'Libre Jigsaw 2012 JigsawCutter',cols,rows,tileCount:tiles.length,tileWidth:tw,tileHeight:th,spacingX,spacingY,leftOffset,topOffset,rotationSteps:4,tiles,parameters:{bubbleMinFactor,bubbleMaxFactor,controlPointVarianceFactor,cornerVarianceFactor}};
}

function hexBestFit(width,height,count){let across=Math.floor(Math.sqrt(count*width/height))*2-1,down=0,total=0;while(total<count){across+=1;const tW=Math.floor(2*width/(across-1)),tH=Math.floor(tW*2/Math.sqrt(3)),vUnit=Math.max(1,Math.floor(tH/4)),vUnits=Math.floor((height+Math.floor(vUnit/2))/vUnit);down=Math.floor((vUnits+1)/3);total=Math.floor((across+1)/2)*Math.floor((down+1)/2)+Math.floor(across/2)*Math.floor(down/2);}return{across,down,total};}
const HEX_NEIGHBORS=[[1,-1],[2,0],[1,1],[-1,1],[-2,0],[-1,-1]];
function createHexGeometry(boardWidth,boardHeight,targetCount,seed){
 const fit=hexBestFit(boardWidth,boardHeight,targetCount),cols=fit.across,rows=fit.down,sqrt3=Math.sqrt(3),cornerVarianceFactor=.10,bubbleMinFactor=.20,bubbleMaxFactor=.25,controlPointVarianceFactor=.05;
 let tW=Math.floor(2*boardWidth/(cols-1)),tH=4*Math.floor(boardHeight/(rows*3-1)),tW2=Math.floor(tH*sqrt3/2),cv=Math.floor(Math.min(tW2,tW)*cornerVarianceFactor),maxTW=Math.floor(((boardWidth+2*cv)/(cols-1))*2),maxTH=Math.floor(((boardHeight+2*cv)/(rows*3-1))*4),maxTW2=Math.floor(maxTH*sqrt3/2);maxTW=Math.min(maxTW,maxTW2);tW=Math.floor(tW/2)+Math.floor(tH*sqrt3);tW=Math.min(tW,maxTW);tH=Math.floor(2*tW/sqrt3);tH-=tH%4;tW-=tW%2;
 const spacingX=Math.floor(tW/2),spacingY=Math.floor(tH*3/4),leftOffset=trunc((boardWidth-cols*spacingX-tW+spacingX)/2),topOffset=trunc((boardHeight-rows*spacingY-tH+spacingY)/2),controlVariance=Math.floor(tW*controlPointVarianceFactor),cornerVariance=Math.max(1,Math.floor(tW*cornerVarianceFactor)),bubbleMin=Math.floor((tW-cornerVariance*2)*bubbleMinFactor),bubbleMax=Math.max(bubbleMin+1,Math.floor((tW-cornerVariance*2)*bubbleMaxFactor));
 const calcTop=topOffset+Math.floor(tH/4),calcBottom=boardHeight-calcTop-Math.floor((rows*3-1)*tH/4),calcLeft=leftOffset+Math.floor(tW/2),calcRight=boardWidth-calcLeft-Math.floor((cols-1)*tW/2),topVariance=Math.min(cornerVariance,calcTop),bottomVariance=Math.min(cornerVariance,calcBottom),leftVariance=Math.min(cornerVariance,calcLeft),rightVariance=Math.min(cornerVariance,calcRight),midX=Math.floor(tW/2),clipY=Math.floor(tH/4),rng=makeRng(seed),data=new Map(),key=(x,y)=>`${x},${y}`;
 for(let y=-1;y<=rows;y++)for(let x=-2;x<=cols;x++)if((x+y)%2===0){const d={cornerX:[0,0],cornerY:[0,0],bubble:[0,0,0],dir:[0,0,0],cp:[0,0,0]};for(let k=0;k<2;k++){d.cornerX[k]=ri(rng,cornerVariance*2-1)-cornerVariance+1;d.cornerY[k]=ri(rng,cornerVariance*2-1)-cornerVariance+1;}for(let k=0;k<3;k++){d.bubble[k]=ri(rng,bubbleMax-bubbleMin)+bubbleMin;d.dir[k]=ri(rng,2)*2-1;d.cp[k]=controlVariance===0?0:ri(rng,controlVariance*2-1)-controlVariance+1;}
   if(x===-2){d.bubble[1]=0;d.cp[1]=0;}else if(x===-1){for(let k=0;k<2;k++)d.cornerX[k]=midX-leftVariance;for(let k=0;k<3;k++){d.bubble[k]=0;d.cp[k]=0;}}else if(x===0){for(let k=0;k<2;k++)d.cornerX[k]=-leftVariance;}else if(x===cols-2){d.bubble[1]=0;d.cp[1]=0;}else if(x===cols-1){for(let k=0;k<2;k++)d.cornerX[k]=rightVariance;for(let k=0;k<3;k++){d.bubble[k]=0;d.cp[k]=0;}}else if(x===cols){for(let k=0;k<2;k++)d.cornerX[k]=rightVariance-midX;}
   if(y===-1){d.cornerY[1]=-topVariance;d.bubble[2]=0;d.cp[2]=0;}else if(y===0){d.cornerY[0]=clipY-topVariance;d.bubble[0]=0;d.cp[0]=0;}else if(y===rows-1){d.cornerY[1]=bottomVariance-clipY;d.bubble[2]=0;d.cp[2]=0;}else if(y===rows){d.cornerY[0]=bottomVariance;d.bubble[0]=0;d.cp[0]=0;}
   data.set(key(x,y),d);
 }
 const mask=[{x:tW/2,y:0},{x:tW,y:tH/4},{x:tW,y:tH*3/4},{x:tW/2,y:tH},{x:0,y:tH*3/4},{x:0,y:tH/4}],center={x:tW/2,y:tH/2},cornerOwner=[[0,0],[1,-1],[1,1],[0,0],[-1,1],[-1,-1]],cornerIndex=[0,1,0,1,0,1],edgeOwner=[[0,0],[0,0],[0,0],[-1,1],[-2,0],[-1,-1]];
 function buildPath(x,y){const corners=new Array(24),controls=new Array(36);for(let i=0;i<6;i++){const [dx,dy]=cornerOwner[i],d=data.get(key(x+dx,y+dy)),ci=cornerIndex[i];if(!d)throw new Error(`missing hex corner owner ${x+dx},${y+dy}`);corners[i*4]={x:mask[i].x+d.cornerX[ci],y:mask[i].y+d.cornerY[ci]};}for(let i=0;i<6;i++){const topIndex=i%3,[dx,dy]=edgeOwner[i],d=data.get(key(x+dx,y+dy));if(!d)throw new Error(`missing hex edge owner ${x+dx},${y+dy}`);const theta=Math.PI/6+topIndex*TAU/6,a=rotatePoint(corners[i*4],-theta,center.x,center.y),b=rotatePoint(corners[((i+1)%6)*4],-theta,center.x,center.y);if(d.bubble[topIndex]===0&&d.cp[topIndex]===0){for(let j=0;j<6;j++)controls[i*6+j]={...b};for(let j=1;j<4;j++)corners[i*4+j]={...b};}else edgeCurve(corners,controls,i,a,b,(a.x+b.x)/2+d.cp[topIndex],d.bubble[topIndex],d.dir[topIndex]);for(let j=0;j<6;j++)controls[i*6+j]=rotatePoint(controls[i*6+j],theta,center.x,center.y);for(let j=1;j<4;j++)corners[i*4+j]=rotatePoint(corners[i*4+j],theta,center.x,center.y);}return renderPath(6,corners,controls);}
 const tiles=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)if((x+y)%2===0){const index=tiles.length;tiles.push({index,gx:x,gy:y,origX:leftOffset+x*spacingX,origY:topOffset+y*spacingY,path:buildPath(x,y)});}
 return{shape:'hex',cols,rows,tileCount:tiles.length,tileWidth:tW,tileHeight:tH,spacingX,spacingY,leftOffset,topOffset,rotationSteps:6,neighborOffsets:HEX_NEIGHBORS,tiles};
}

function rotateVectorSteps(x,y,steps,totalSteps){const a=steps*TAU/totalSteps,c=Math.cos(a),s=Math.sin(a);return{x:x*c-y*s,y:x*s+y*c};}
function rotateVector(x,y,steps){const v=rotateVectorSteps(x,y,steps,4);return{x:Math.round(v.x),y:Math.round(v.y)};}
function areGridNeighbors(a,b,shape){const dx=b.gx-a.gx,dy=b.gy-a.gy;if(shape==='hex')return HEX_NEIGHBORS.some(([x,y])=>x===dx&&y===dy)?{dx,dy}:null;return Math.abs(dx)+Math.abs(dy)===1?{dx,dy}:null;}

return {makeRng,squareBestFit,hexBestFit,createSquareGeometry,createHexGeometry,rotateVectorSteps,rotateVector,areGridNeighbors};
})();

const G2010=(()=>{
const {makeRng,squareBestFit}=G2012; const createHexGeometry2012=G2012.createHexGeometry;
// GPL-3.0-or-later. Clean JavaScript port of the Virtual Toybox Puzzle
// Collection 2010.08.11 jigsaw geometry distributed in puzzlegames.jar.
// SquareJigsawManager used a distinct pre-JigsawCutter edge algorithm.
// HexJigsawManager already used the edge construction later generalized by
// JigsawCutter, so its geometry is intentionally delegated to the 2012 port.

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

function createSquareGeometry2010(boardWidth,boardHeight,targetCount,seed){
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

function createHexGeometry2010(boardWidth,boardHeight,targetCount,seed){
  // The 2010 HexJigsawManager already contains the edge algorithm later moved
  // into JigsawCutter. Constants and clipping/indexing are unchanged in the
  // 2012 source tree, so delegating avoids fabricating a historical delta.
  const g=createHexGeometry2012(boardWidth,boardHeight,targetCount,seed);
  return {...g,era:'2010',algorithm:'Virtual Toybox 2010 hex (mathematically retained in 2012)',historicalEquivalentTo2012:true};
}

return {createSquareGeometry2010,createHexGeometry2010};
})();

const SNAPMOD=(()=>{
const {areGridNeighbors,rotateVectorSteps}=G2012;
// GPL-3.0-or-later.
// Snap-policy preservation for Virtual Toybox Puzzle Collection 2010.08.11
// and Libre Jigsaw (policy changed 2011-02-08).

const SNAP_THRESHOLD=5;

function expectedNeighborVector(a,n,geom){
  return rotateVectorSteps(n.dx*geom.spacingX,n.dy*geom.spacingY,a.rotation,geom.rotationSteps);
}

function neighborCorrection(a,b,geom,threshold=SNAP_THRESHOLD){
  if(a.rotation!==b.rotation)return null;
  const n=areGridNeighbors(a,b,geom.shape);
  if(!n)return null;
  const v=expectedNeighborVector(a,n,geom);
  const dx=(b.x-a.x)-v.x;
  const dy=(b.y-a.y)-v.y;
  // Java used strict comparisons: -snapThreshold < adjustment < snapThreshold.
  return (-threshold<dx&&dx<threshold&&-threshold<dy&&dy<threshold)?{dx,dy}:null;
}

/**
 * Find every external connected group that can snap to at least one tile in
 * the moving group. One representative correction is enough because members
 * of a connected group already have exact relative placement.
 */
function collectSnapCandidates(pieces,movingGroup,geom,threshold=SNAP_THRESHOLD){
  const moving=pieces.filter(p=>p.group===movingGroup);
  const movingSet=new Set(moving);
  const byGroup=new Map();
  let order=0;
  for(const a of moving){
    for(const b of pieces){
      if(movingSet.has(b)||b.group===movingGroup)continue;
      const correction=neighborCorrection(a,b,geom,threshold);
      if(!correction||byGroup.has(b.group))continue;
      const members=pieces.filter(p=>p.group===b.group);
      byGroup.set(b.group,{
        group:b.group,
        size:members.length,
        dx:correction.dx,
        dy:correction.dy,
        // Retain deterministic board order for equal-size groups.
        order:order++,
        z:Math.max(...members.map(p=>p.z??0))
      });
    }
  }
  return [...byGroup.values()];
}

function javaIntDivision(n,d){return Math.trunc(n/d);}

/**
 * Virtual Toybox 2010.08.11 mouseReleased policy.
 * External sets are first aligned to the dragged set, then the merged result
 * is re-centred using the Java weighted-average calculation. The dragged set
 * contributes zero to the numerator and its size to the denominator.
 */
function planSnap2010(movingSize,candidates){
  if(!candidates.length)return null;
  const total=movingSize+candidates.reduce((s,c)=>s+c.size,0);
  const weightedX=candidates.reduce((s,c)=>s+c.size*c.dx,0);
  const weightedY=candidates.reduce((s,c)=>s+c.size*c.dy,0);
  const center={dx:javaIntDivision(weightedX,total),dy:javaIntDivision(weightedY,total)};
  const external=new Map();
  for(const c of candidates)external.set(c.group,{dx:center.dx-c.dx,dy:center.dy-c.dy});
  return{policy:'2010',moving:center,external,anchorGroup:null,totalSize:total};
}

/**
 * Libre Jigsaw policy introduced 2011-02-08.
 * The largest on-board connected set is the anchor and does not move. The
 * dragged set and any other candidate sets are translated onto that anchor.
 */
function planSnap2012(movingSize,candidates){
  if(!candidates.length)return null;
  const ranked=[...candidates].sort((a,b)=>b.size-a.size||b.z-a.z||a.order-b.order);
  const anchor=ranked[0];
  const moving={dx:anchor.dx,dy:anchor.dy};
  const external=new Map();
  for(const c of candidates){
    external.set(c.group,c.group===anchor.group?{dx:0,dy:0}:{dx:anchor.dx-c.dx,dy:anchor.dy-c.dy});
  }
  return{policy:'2012',moving,external,anchorGroup:anchor.group,totalSize:movingSize+candidates.reduce((s,c)=>s+c.size,0)};
}

function planSnap(policy,movingSize,candidates){
  return policy==='2010'?planSnap2010(movingSize,candidates):planSnap2012(movingSize,candidates);
}

return {SNAP_THRESHOLD,expectedNeighborVector,neighborCorrection,collectSnapCandidates,planSnap2010,planSnap2012,planSnap};
})();

const LAYERS=(()=>{
const LAYER_COUNT=3;

function normalizeLayer(layer){
  const n=Number(layer);
  return Number.isInteger(n)&&n>=0&&n<LAYER_COUNT?n:0;
}

function visiblePieces(pieces,layer){
  const target=normalizeLayer(layer);
  return pieces.filter(p=>p.layer===target);
}

function uniqueGroupsFromPieces(pieces){
  return new Set(pieces.map(p=>p.group));
}

function moveGroupsToLayer(pieces,groupIds,layer){
  const target=normalizeLayer(layer),groups=groupIds instanceof Set?groupIds:new Set(groupIds);
  let moved=0;
  for(const p of pieces){
    if(groups.has(p.group)&&p.layer!==target){p.layer=target;moved++;}
  }
  return moved;
}

function normalizeRect(a,b){
  return{x:Math.min(a.x,b.x),y:Math.min(a.y,b.y),w:Math.abs(b.x-a.x),h:Math.abs(b.y-a.y)};
}

function rectsIntersect(a,b){
  return a.x<=b.x+b.w&&a.x+a.w>=b.x&&a.y<=b.y+b.h&&a.y+a.h>=b.y;
}

return {LAYER_COUNT,normalizeLayer,visiblePieces,uniqueGroupsFromPieces,moveGroupsToLayer,normalizeRect,rectsIntersect};
})();

const SAVEGAME=(()=>{
// GPL-3.0-or-later. Browser-native save format for the HTML5 restoration.
const SAVE_FORMAT='libre-jigsaw-html5';
const SAVE_VERSION=2;

function finiteNumber(v,name){
  if(typeof v!=='number'||!Number.isFinite(v))throw new Error(`Invalid ${name}`);
  return v;
}
function finiteInt(v,name){
  finiteNumber(v,name);
  if(!Number.isInteger(v))throw new Error(`Invalid ${name}`);
  return v;
}
function createSaveData(state){
  return {
    format:SAVE_FORMAT,
    formatVersion:SAVE_VERSION,
    game:'Libre Jigsaw',
    savedAt:new Date().toISOString(),
    shape:state.shape,
    requestedPieces:state.requestedPieces,
    actualPieces:state.pieces.length,
    seed:state.seed>>>0,
    board:{width:state.board.width,height:state.board.height},
    playfield:{width:state.playfield.width,height:state.playfield.height},
    currentLayer:state.currentLayer,
    complete:Boolean(state.complete),
    image:state.image,
    pieces:state.pieces.map(p=>({
      index:p.index,x:p.x,y:p.y,rotation:p.rotation,
      group:p.group,z:p.z,layer:p.layer
    }))
  };
}
function validateSaveData(raw){
  if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('Invalid save');
  if(raw.format!==SAVE_FORMAT||![1,SAVE_VERSION].includes(raw.formatVersion))throw new Error('Unsupported save');
  if(raw.game!=='Libre Jigsaw')throw new Error('Wrong game');
  if(raw.shape!=='square'&&raw.shape!=='hex')throw new Error('Invalid shape');
  finiteInt(raw.requestedPieces,'requestedPieces');
  if(![12,24,48,96].includes(raw.requestedPieces))throw new Error('Unsupported requestedPieces');
  finiteInt(raw.actualPieces,'actualPieces');
  finiteInt(raw.seed,'seed');
  if(raw.seed<0||raw.seed>0xffffffff)throw new Error('Invalid seed');
  if(!raw.board||typeof raw.board!=='object')throw new Error('Invalid board');
  if(finiteNumber(raw.board.width,'board.width')<=0||finiteNumber(raw.board.height,'board.height')<=0)throw new Error('Invalid board');
  if(raw.formatVersion>=2){
    if(!raw.playfield||typeof raw.playfield!=='object')throw new Error('Invalid playfield');
    if(finiteNumber(raw.playfield.width,'playfield.width')<=0||finiteNumber(raw.playfield.height,'playfield.height')<=0)throw new Error('Invalid playfield');
  }
  finiteInt(raw.currentLayer,'currentLayer');
  if(raw.currentLayer<0||raw.currentLayer>2)throw new Error('Invalid currentLayer');
  if(!raw.image||typeof raw.image!=='object')throw new Error('Invalid image');
  if(raw.image.kind==='gallery'){
    if(typeof raw.image.file!=='string'||!raw.image.file.endsWith('.jpg'))throw new Error('Invalid gallery image');
  }else if(raw.image.kind==='embedded'){
    if(typeof raw.image.data!=='string'||!raw.image.data.startsWith('data:image/'))throw new Error('Invalid embedded image');
  }else throw new Error('Invalid image kind');
  if(!Array.isArray(raw.pieces)||raw.pieces.length!==raw.actualPieces||raw.pieces.length<1)throw new Error('Invalid pieces');
  const seen=new Set();
  for(const p of raw.pieces){
    if(!p||typeof p!=='object')throw new Error('Invalid piece');
    finiteInt(p.index,'piece.index');
    if(seen.has(p.index))throw new Error('Duplicate piece');
    seen.add(p.index);
    finiteNumber(p.x,'piece.x');finiteNumber(p.y,'piece.y');
    finiteInt(p.rotation,'piece.rotation');finiteInt(p.group,'piece.group');finiteInt(p.z,'piece.z');finiteInt(p.layer,'piece.layer');
    if(p.layer<0||p.layer>2)throw new Error('Invalid piece layer');
  }
  return raw;
}
function parseSaveText(text){
  if(typeof text!=='string'||!text.trim())throw new Error('Empty save');
  if(/^\s*version:/i.test(text)){
    const e=new Error('Legacy Java save');e.code='LEGACY_LJF';throw e;
  }
  let raw;
  try{raw=JSON.parse(text)}catch{throw new Error('Invalid JSON save')}
  return validateSaveData(raw);
}
function stringifySaveData(data){return JSON.stringify(validateSaveData(data),null,2)+'\n';}

return {SAVE_FORMAT,SAVE_VERSION,createSaveData,validateSaveData,parseSaveText,stringifySaveData};
})();

const COMPLETION=(()=>{
// GPL-3.0-or-later. Pure completion-placement helper derived from Libre Jigsaw finishGame().
function planSolvedPlacement(anchor,geom,canvasWidth,canvasHeight){
  if(!anchor||!geom)throw new Error('Missing completion state');
  const normalizeSteps=anchor.rotation? -anchor.rotation:0;
  const boardOriginX=anchor.x-anchor.origX;
  const boardOriginY=anchor.y-anchor.origY;
  const targetX=(canvasWidth-geom.boardWidth)/2;
  const targetY=(canvasHeight-geom.boardHeight)/2;
  return{normalizeSteps,dx:targetX-boardOriginX,dy:targetY-boardOriginY};
}

return {planSolvedPlacement};
})();

const VIEWPORT=(()=>{
// GPL-3.0-or-later. Resolution-independent logical playfield helpers.
function computeViewport(canvasWidth,canvasHeight,playfieldWidth,playfieldHeight){
  if(!(canvasWidth>0&&canvasHeight>0&&playfieldWidth>0&&playfieldHeight>0))throw new Error('Invalid viewport dimensions');
  const scale=Math.min(canvasWidth/playfieldWidth,canvasHeight/playfieldHeight);
  return{
    scale,
    offsetX:(canvasWidth-playfieldWidth*scale)/2,
    offsetY:(canvasHeight-playfieldHeight*scale)/2,
    width:playfieldWidth*scale,
    height:playfieldHeight*scale
  };
}
function canvasToPlayfield(x,y,viewport){
  return{x:(x-viewport.offsetX)/viewport.scale,y:(y-viewport.offsetY)/viewport.scale};
}
function playfieldToCanvas(x,y,viewport){
  return{x:x*viewport.scale+viewport.offsetX,y:y*viewport.scale+viewport.offsetY};
}

return {computeViewport,canvasToPlayfield,playfieldToCanvas};
})();


(()=>{
const {applyLanguage,STRINGS}=I18N;
const {createSquareGeometry,createHexGeometry,makeRng,rotateVectorSteps}=G2012;
const {createSquareGeometry2010,createHexGeometry2010}=G2010;
const {collectSnapCandidates,planSnap2012,SNAP_THRESHOLD}=SNAPMOD;
const {LAYER_COUNT,visiblePieces,moveGroupsToLayer,normalizeRect,rectsIntersect}=LAYERS;
const {createSaveData,parseSaveText,stringifySaveData}=SAVEGAME;
const {planSolvedPlacement}=COMPLETION;
const {computeViewport,canvasToPlayfield}=VIEWPORT;

const canvas=document.querySelector('#game'),ctx=canvas.getContext('2d'),newBtn=document.querySelector('#newBtn'),saveBtn=document.querySelector('#saveBtn'),saveInput=document.querySelector('#saveInput'),galleryBtn=document.querySelector('#galleryBtn'),galleryDialog=document.querySelector('#galleryDialog'),galleryGrid=document.querySelector('#galleryGrid'),imageInput=document.querySelector('#imageInput'),pieceCount=document.querySelector('#pieceCount'),shapeSelect=document.querySelector('#shapeSelect'),layerSelect=document.querySelector('#layerSelect'),langBtn=document.querySelector('#langBtn'),complete=document.querySelector('#complete'),loadStatus=document.querySelector('#loadStatus');
const PHOTOS=[
 ['Full-202-Tiger-Swallowtail.jpg','Tiger Swallowtail'],
 ['Full-24-The-Maroon-Bells.jpg','The Maroon Bells'],
 ['Full-237-Hanging-Lake.jpg','Hanging Lake'],
 ['Full-261-Yellow-Flower.jpg','Yellow Flower'],
 ['Full-266-Cascading-Falls.jpg','Cascading Falls'],
 ['Full-288-Tennessee-Sunset.jpg','Tennessee Sunset'],
 ['Full-333-Ladybug-in-the-Field.jpg','Ladybug in the Field'],
 ['Full-334-Light-of-the-Sky.jpg','Light of the Sky'],
 ['Full-446-Along-the-Banks.jpg','Along the Banks'],
 ['Full-454-ONeil-Bridge-in-the-Morning.jpg',"O'Neil Bridge in the Morning"]
];
let lang=(['en','it'].includes(readPref('lang','en'))?readPref('lang','en'):'en'),image=new Image(),currentImage={kind:'gallery',file:PHOTOS[0][0],title:PHOTOS[0][1]},imageURL=assetUrl('assets/photos/'+PHOTOS[0][0]),geom,pieces=[],drag=null,dpr=1,boardImage=document.createElement('canvas'),seed=Date.now()>>>0,currentLayer=0,selectedGroups=new Set(),gameComplete=false,playfield={width:0,height:0},viewport={scale:1,offsetX:0,offsetY:0};
const SNAP=SNAP_THRESHOLD;

function assetUrl(path){return new URL(path,document.baseURI).href;}
function readPref(key,fallback){try{return localStorage.getItem('libreJigsaw.'+key)||fallback}catch{return fallback}}
function savePref(key,value){try{localStorage.setItem('libreJigsaw.'+key,String(value))}catch{}}
function createGeometryForBoard(boardWidth,boardHeight){const count=Number(pieceCount.value),g=shapeSelect.value==='hex'?createHexGeometry(boardWidth,boardHeight,count,seed):createSquareGeometry(boardWidth,boardHeight,count,seed);g.boardWidth=boardWidth;g.boardHeight=boardHeight;return g;}
function createGeometryForPlayfield(){const fit=fitImageRect(playfield.width,playfield.height,image.naturalWidth,image.naturalHeight);return createGeometryForBoard(fit.w,fit.h);}
function updateViewport(){const cw=canvas.clientWidth,ch=canvas.clientHeight;if(playfield.width>0&&playfield.height>0&&cw>0&&ch>0){viewport=computeViewport(cw,ch,playfield.width,playfield.height);}else{viewport={scale:1,offsetX:0,offsetY:0};if(playfield.width>0&&playfield.height>0&&(cw===0||ch===0))requestAnimationFrame(()=>{updateViewport();draw();});}}
function resize(){const r=canvas.getBoundingClientRect();dpr=Math.max(1,window.devicePixelRatio||1);canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);if(image.complete&&image.naturalWidth&&!pieces.length)newGame(false);updateViewport();draw();}
function fitImageRect(w,h,iw,ih){const pad=Math.max(18,Math.min(w,h)*.06),maxW=w-pad*2,maxH=h-pad*2,s=Math.min(maxW/iw,maxH/ih,.95);return{w:Math.max(140,Math.floor(iw*s)),h:Math.max(105,Math.floor(ih*s))};}
function rebuildImage(){boardImage.width=geom.boardWidth||1;boardImage.height=geom.boardHeight||1;const g=boardImage.getContext('2d');g.clearRect(0,0,boardImage.width,boardImage.height);g.drawImage(image,0,0,boardImage.width,boardImage.height);}
function newGame(bump=true){if(!image.naturalWidth)return;if(bump)seed=randomSeed();playfield={width:Math.max(1,canvas.clientWidth),height:Math.max(1,canvas.clientHeight)};geom=createGeometryForPlayfield();rebuildImage();const w=playfield.width,h=playfield.height,rng=makeRng(seed^0x9e3779b9),margin=Math.max(geom.tileWidth,geom.tileHeight)*.25;pieces=geom.tiles.map((t,i)=>({...t,x:margin+rng()*Math.max(1,w-geom.tileWidth-margin*2),y:margin+rng()*Math.max(1,h-geom.tileHeight-margin*2),rotation:Math.floor(rng()*geom.rotationSteps),group:i,z:i,layer:0}));shuffle(pieces,rng);pieces.forEach((p,i)=>p.z=i);currentLayer=0;layerSelect.value='0';selectedGroups.clear();drag=null;gameComplete=false;complete.classList.add('hidden');updateViewport();draw();}
function randomSeed(){try{return crypto.getRandomValues(new Uint32Array(1))[0]>>>0}catch{return(Math.random()*0xffffffff)>>>0}}
function shuffle(a,rng){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}
function groupOf(id){return pieces.filter(p=>p.group===id);}
function bringGroupTop(id){const g=groupOf(id),s=new Set(g);pieces=[...pieces.filter(p=>!s.has(p)),...g];pieces.forEach((p,i)=>p.z=i);}
function bringGroupsTop(groups){const s=new Set(groups),top=pieces.filter(p=>s.has(p.group));pieces=[...pieces.filter(p=>!s.has(p.group)),...top];pieces.forEach((p,i)=>p.z=i);}
function stepAngle(rotation){return rotation*Math.PI*2/geom.rotationSteps;}
function localPoint(p,x,y){const cx=p.x+geom.tileWidth/2,cy=p.y+geom.tileHeight/2,a=-stepAngle(p.rotation),dx=x-cx,dy=y-cy,c=Math.cos(a),s=Math.sin(a);return{x:dx*c-dy*s+geom.tileWidth/2,y:dx*s+dy*c+geom.tileHeight/2};}
function hit(x,y){for(let i=pieces.length-1;i>=0;i--){const p=pieces[i];if(p.layer!==currentLayer)continue;const q=localPoint(p,x,y);if(ctx.isPointInPath(p.path,q.x,q.y))return p;}return null;}
function drawPiece(p){ctx.save();ctx.translate(p.x+geom.tileWidth/2,p.y+geom.tileHeight/2);ctx.rotate(stepAngle(p.rotation));ctx.translate(-geom.tileWidth/2,-geom.tileHeight/2);ctx.save();ctx.clip(p.path);ctx.drawImage(boardImage,-p.origX,-p.origY);if(selectedGroups.has(p.group)){ctx.fillStyle='rgba(70,190,255,.22)';ctx.fillRect(0,0,geom.tileWidth,geom.tileHeight);}ctx.restore();ctx.lineWidth=selectedGroups.has(p.group)?2:1;ctx.strokeStyle=selectedGroups.has(p.group)?'rgba(120,220,255,.95)':'rgba(0,0,0,.58)';ctx.stroke(p.path);ctx.restore();}
function drawMarquee(){if(!drag||drag.mode!=='marquee')return;const r=normalizeRect(drag.start,drag.last);ctx.save();ctx.setLineDash([7,5]);ctx.lineWidth=1.5;ctx.strokeStyle='rgba(150,225,255,.95)';ctx.fillStyle='rgba(90,180,230,.12)';ctx.fillRect(r.x,r.y,r.w,r.h);ctx.strokeRect(r.x+.5,r.y+.5,r.w,r.h);ctx.restore();}
function draw(){const w=canvas.clientWidth,h=canvas.clientHeight;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.setTransform(dpr*viewport.scale,0,0,dpr*viewport.scale,dpr*viewport.offsetX,dpr*viewport.offsetY);for(const p of pieces)if(p.layer===currentLayer)drawPiece(p);drawMarquee();}
function pos(e){const r=canvas.getBoundingClientRect(),q=canvasToPlayfield(e.clientX-r.left,e.clientY-r.top,viewport);return q;}
function moveGroup(id,dx,dy){for(const p of groupOf(id)){p.x+=dx;p.y+=dy;}}
function moveGroups(groups,dx,dy){for(const id of groups)moveGroup(id,dx,dy);}
function rotateGroupSteps(anchor,steps){const g=groupOf(anchor.group),cx=anchor.x+geom.tileWidth/2,cy=anchor.y+geom.tileHeight/2;for(const p of g){const pcx=p.x+geom.tileWidth/2,pcy=p.y+geom.tileHeight/2,v=rotateVectorSteps(pcx-cx,pcy-cy,steps,geom.rotationSteps);p.x=cx+v.x-geom.tileWidth/2;p.y=cy+v.y-geom.tileHeight/2;p.rotation=(p.rotation+steps%geom.rotationSteps+geom.rotationSteps)%geom.rotationSteps;}}
function rotateGroup(anchor,dir){rotateGroupSteps(anchor,dir);draw();}
function centerSolvedGroup(groupId,normalizeRotation=true){const g=groupOf(groupId);if(!g.length)return;const initial=planSolvedPlacement(g[0],geom,playfield.width,playfield.height);if(normalizeRotation&&initial.normalizeSteps)rotateGroupSteps(g[0],initial.normalizeSteps);const anchor=groupOf(groupId)[0],plan=planSolvedPlacement(anchor,geom,playfield.width,playfield.height);moveGroup(groupId,plan.dx,plan.dy);currentLayer=anchor.layer;layerSelect.value=String(currentLayer);}
function finishGame(groupId){centerSolvedGroup(groupId,true);selectedGroups.clear();drag=null;gameComplete=true;complete.classList.remove('hidden');draw();}
function trySnap(groupId){const active=visiblePieces(pieces,currentLayer),movingSize=groupOf(groupId).length,candidates=collectSnapCandidates(active,groupId,geom,SNAP),plan=planSnap2012(movingSize,candidates);if(!plan)return false;moveGroup(groupId,plan.moving.dx,plan.moving.dy);for(const c of candidates){const d=plan.external.get(c.group);if(d)moveGroup(c.group,d.dx,d.dy);}const merged=new Set(candidates.map(c=>c.group));for(const p of pieces)if(merged.has(p.group))p.group=groupId;if(groupOf(groupId).length===pieces.length)finishGame(groupId);return true;}
function clearSelection(){selectedGroups.clear();}
function rotatedBounds(p){const cx=p.x+geom.tileWidth/2,cy=p.y+geom.tileHeight/2,a=stepAngle(p.rotation),c=Math.cos(a),s=Math.sin(a),pts=[[p.x,p.y],[p.x+geom.tileWidth,p.y],[p.x+geom.tileWidth,p.y+geom.tileHeight],[p.x,p.y+geom.tileHeight]].map(([x,y])=>{const dx=x-cx,dy=y-cy;return{x:cx+dx*c-dy*s,y:cy+dx*s+dy*c};});const xs=pts.map(q=>q.x),ys=pts.map(q=>q.y);return{x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};}
function pieceIntersectsRect(p,r){const b=rotatedBounds(p);if(!rectsIntersect(b,r))return false;const ix0=Math.max(b.x,r.x),iy0=Math.max(b.y,r.y),ix1=Math.min(b.x+b.w,r.x+r.w),iy1=Math.min(b.y+b.h,r.y+r.h);if(ix1<ix0||iy1<iy0)return false;const steps=6;for(let yi=0;yi<=steps;yi++)for(let xi=0;xi<=steps;xi++){const x=ix0+(ix1-ix0)*xi/steps,y=iy0+(iy1-iy0)*yi/steps,q=localPoint(p,x,y);if(ctx.isPointInPath(p.path,q.x,q.y))return true;}return false;}
function setSelection(r){const groups=new Set();for(let i=pieces.length-1;i>=0;i--){const p=pieces[i];if(p.layer===currentLayer&&pieceIntersectsRect(p,r))groups.add(p.group);}selectedGroups=groups;if(groups.size)bringGroupsTop(groups);}
function switchLayer(layer){if(gameComplete)return;const next=Math.max(0,Math.min(LAYER_COUNT-1,Number(layer)||0));let transfer=new Set();if(drag?.mode==='group')transfer.add(drag.group);else if(drag?.mode==='selection')transfer=new Set(drag.groups);else if(selectedGroups.size)transfer=new Set(selectedGroups);if(transfer.size)moveGroupsToLayer(pieces,transfer,next);currentLayer=next;layerSelect.value=String(next);draw();}
function setLoadStatus(key=''){if(!loadStatus)return;loadStatus.dataset.statusKey=key;const text=key?(STRINGS[lang]?.[key]||key):'';loadStatus.textContent=text;loadStatus.classList.toggle('hidden',!text);}
function setImageSource(src,meta,onReady){setLoadStatus('loadingImage');const next=new Image();next.decoding='async';next.onload=()=>{image=next;imageURL=src;if(meta)currentImage=meta;setLoadStatus('');if(onReady){try{onReady();}catch{setLoadStatus('saveLoadError');}}else newGame(true);};next.onerror=()=>setLoadStatus('imageLoadError');next.src=src;}
function loadUserImage(file){if(!file)return;setLoadStatus('loadingImage');const reader=new FileReader();reader.onerror=()=>setLoadStatus('imageLoadError');reader.onload=()=>{const data=String(reader.result);setImageSource(data,{kind:'embedded',name:file.name||'image',mime:file.type||'image/*',data});};reader.readAsDataURL(file);}
function buildGallery(){galleryGrid.replaceChildren();for(const [file,title] of PHOTOS){const b=document.createElement('button');b.type='button';b.className='photoChoice';b.dataset.src=assetUrl('assets/photos/'+file);b.title=title;const img=document.createElement('img');img.src=assetUrl('assets/photos/thumbs/'+file);img.alt=title;img.loading='lazy';const caption=document.createElement('span');caption.textContent=title;b.append(img,caption);b.addEventListener('click',()=>{setImageSource(b.dataset.src,{kind:'gallery',file,title});galleryDialog.close();});galleryGrid.appendChild(b);}}
function saveGameFile(){if(!geom||!pieces.length)return;const data=createSaveData({shape:shapeSelect.value,requestedPieces:Number(pieceCount.value),seed,board:{width:geom.boardWidth,height:geom.boardHeight},playfield,currentLayer,complete:gameComplete,image:currentImage,pieces}),blob=new Blob([stringifySaveData(data)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a'),stamp=new Date().toISOString().slice(0,10);a.href=url;a.download=`libre-jigsaw-${stamp}.ljf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),0);setLoadStatus('puzzleSaved');}
function restoreSave(data){shapeSelect.value=data.shape;pieceCount.value=String(data.requestedPieces);savePref('shape',data.shape);savePref('pieces',data.requestedPieces);seed=data.seed>>>0;const legacy=data.formatVersion===1;playfield=legacy?{width:Math.max(1,canvas.clientWidth),height:Math.max(1,canvas.clientHeight)}:{width:data.playfield.width,height:data.playfield.height};geom=legacy?createGeometryForPlayfield():createGeometryForBoard(data.board.width,data.board.height);rebuildImage();if(geom.tiles.length!==data.pieces.length)throw new Error('piece count mismatch');const sx=legacy?geom.boardWidth/data.board.width:1,sy=legacy?geom.boardHeight/data.board.height:1,byIndex=new Map(geom.tiles.map(t=>[t.index,t]));pieces=data.pieces.map(s=>{const t=byIndex.get(s.index);if(!t)throw new Error('piece index mismatch');return{...t,x:s.x*sx,y:s.y*sy,rotation:((s.rotation%geom.rotationSteps)+geom.rotationSteps)%geom.rotationSteps,group:s.group,z:s.z,layer:s.layer};});pieces.sort((a,b)=>a.z-b.z);pieces.forEach((p,i)=>p.z=i);currentLayer=data.currentLayer;layerSelect.value=String(currentLayer);selectedGroups.clear();drag=null;gameComplete=false;complete.classList.add('hidden');updateViewport();if(data.complete&&pieces.length){const groups=new Set(pieces.map(p=>p.group));if(groups.size!==1)throw new Error('invalid completed groups');finishGame(pieces[0].group);}else draw();setLoadStatus('puzzleLoaded');}
function loadSavedGame(file){if(!file)return;setLoadStatus('loadingPuzzle');const reader=new FileReader();reader.onerror=()=>setLoadStatus('saveLoadError');reader.onload=()=>{let data;try{data=parseSaveText(String(reader.result));}catch(e){setLoadStatus(e?.code==='LEGACY_LJF'?'legacySaveUnsupported':'saveLoadError');return;}let src,meta;if(data.image.kind==='gallery'){const known=PHOTOS.find(([f])=>f===data.image.file);if(!known){setLoadStatus('saveLoadError');return;}meta={kind:'gallery',file:known[0],title:known[1]};src=assetUrl('assets/photos/'+known[0]);}else{meta={kind:'embedded',name:data.image.name||'image',mime:data.image.mime||'image/*',data:data.image.data};src=data.image.data;}setImageSource(src,meta,()=>restoreSave(data));};reader.readAsText(file);}

canvas.addEventListener('pointerdown',e=>{if(gameComplete||e.button!==0)return;canvas.focus();const p=pos(e),piece=hit(p.x,p.y);if(piece){if(selectedGroups.size&&selectedGroups.has(piece.group)){bringGroupsTop(selectedGroups);drag={mode:'selection',groups:new Set(selectedGroups),start:p,last:p,moved:false,pointerId:e.pointerId};}else{if(selectedGroups.size)clearSelection();bringGroupTop(piece.group);drag={mode:'group',piece,group:piece.group,start:p,last:p,moved:false,pointerId:e.pointerId};}}else{if(selectedGroups.size)clearSelection();drag={mode:'marquee',start:p,last:p,moved:false,pointerId:e.pointerId};}canvas.setPointerCapture(e.pointerId);draw();});
canvas.addEventListener('pointermove',e=>{if(gameComplete||!drag||e.pointerId!==drag.pointerId)return;const p=pos(e),dx=p.x-drag.last.x,dy=p.y-drag.last.y;if(Math.hypot(p.x-drag.start.x,p.y-drag.start.y)>4)drag.moved=true;if(drag.mode==='group')moveGroup(drag.group,dx,dy);else if(drag.mode==='selection')moveGroups(drag.groups,dx,dy);drag.last=p;draw();});
canvas.addEventListener('pointerup',e=>{if(gameComplete||!drag||e.pointerId!==drag.pointerId)return;const d=drag;drag=null;if(d.mode==='group'){if(d.moved)trySnap(d.group);else rotateGroup(d.piece,-1);}else if(d.mode==='marquee'&&d.moved){setSelection(normalizeRect(d.start,d.last));}draw();});
canvas.addEventListener('pointercancel',()=>{drag=null;draw();});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(gameComplete)return;const p=pos(e),piece=hit(p.x,p.y);if(!piece)return;if(selectedGroups.size&&selectedGroups.has(piece.group))return;if(selectedGroups.size)clearSelection();bringGroupTop(piece.group);rotateGroup(piece,1);trySnap(piece.group);});
canvas.addEventListener('keydown',e=>{if(gameComplete)return;if(e.key==='1'||e.key==='2'||e.key==='3'){e.preventDefault();switchLayer(Number(e.key)-1);return;}if(!drag||drag.mode!=='group')return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();rotateGroup(drag.piece,e.key==='ArrowLeft'?-1:1);drag.group=drag.piece.group;}});
const toolbarMenus=[...document.querySelectorAll('.toolbarMenu')];
function closeToolbarMenus(except=null){for(const m of toolbarMenus)if(m!==except)m.removeAttribute('open');}
for(const menu of toolbarMenus)menu.addEventListener('toggle',()=>{if(menu.open)closeToolbarMenus(menu);});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('.toolbarMenu'))closeToolbarMenus();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeToolbarMenus();});
newBtn.addEventListener('click',()=>{newGame(true);closeToolbarMenus();});
saveBtn.addEventListener('click',()=>{saveGameFile();closeToolbarMenus();});
saveInput.addEventListener('click',()=>{saveInput.value='';});
saveInput.addEventListener('change',()=>{loadSavedGame(saveInput.files?.[0]);closeToolbarMenus();});
galleryBtn.addEventListener('click',()=>{closeToolbarMenus();galleryDialog.showModal();});
pieceCount.addEventListener('change',()=>{savePref('pieces',pieceCount.value);newGame(true);closeToolbarMenus()});
shapeSelect.addEventListener('change',()=>{savePref('shape',shapeSelect.value);newGame(true);closeToolbarMenus()});
layerSelect.addEventListener('change',()=>{switchLayer(layerSelect.value);closeToolbarMenus();});
imageInput.addEventListener('click',()=>{imageInput.value='';});
imageInput.addEventListener('change',()=>{loadUserImage(imageInput.files?.[0]);closeToolbarMenus();});
langBtn.addEventListener('click',()=>{lang=lang==='en'?'it':'en';savePref('lang',lang);applyLanguage(lang);langBtn.textContent=lang==='en'?'IT':'EN';if(loadStatus?.dataset.statusKey)setLoadStatus(loadStatus.dataset.statusKey);});
for(const[b,d]of[['helpBtn','helpDialog'],['creditsBtn','creditsDialog']])document.querySelector('#'+b).addEventListener('click',()=>{closeToolbarMenus();document.querySelector('#'+d).showModal();});
document.querySelectorAll('dialog .close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
const storedShape=readPref('shape','square'),storedPieces=readPref('pieces','24');if(['square','hex'].includes(storedShape))shapeSelect.value=storedShape;if(['12','24','48','96'].includes(storedPieces))pieceCount.value=storedPieces;layerSelect.value='0';
buildGallery();applyLanguage(lang);langBtn.textContent=lang==='en'?'IT':'EN';image.onload=()=>newGame(true);image.onerror=()=>setLoadStatus('imageLoadError');image.src=imageURL;window.addEventListener('resize',resize);resize();

})();
