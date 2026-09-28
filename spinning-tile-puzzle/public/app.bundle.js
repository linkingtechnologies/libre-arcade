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


(function(global){'use strict';global.SpinningTileI18N={
 en:{gameMenu:'Game',newGame:'New puzzle',puzzleMenu:'Puzzle',gallery:'Gallery',myImage:'My image',preview:'Preview',direction:'Direction',clockwise:'Clockwise',counterClockwise:'Counter-clockwise',backgroundColor:'Background',helpMenu:'Help',help:'Instructions',credits:'Credits',changeLanguage:'Change language',gameControls:'Game controls',boardLabel:'Spinning tile puzzle board',boardHint:'Activate one of the six intersections. A normal click spins clockwise; Shift plus click spins counter-clockwise. Keys 1 to 6 spin the corresponding intersection.',complete:'Puzzle complete!',choosePicture:'Choose a picture',galleryIntro:'The ten photographs included with the original 2010 collection.',helpTitle:'How to play',help1:'Rebuild the picture by spinning the seven hexagonal tiles into their correct positions and orientations.',help2:'Each move acts at one of the six intersections where three tiles meet. The three surrounding tiles orbit around that point together.',help3:'Click or tap an intersection to spin clockwise.',help4:'On desktop, hold Shift while clicking to spin counter-clockwise. On touch, choose the direction from Puzzle → Direction.',help5:'The puzzle is complete only when every tile is back in its original position and orientation.',help6:'After completion, click or tap the puzzle to mix it again.',originalCredit:'Original game: Spinning Tile Puzzle, part of Virtual Toybox Puzzle Collection 2010.08.11 by Jonathan Hulka. GPL-3.0-or-later.',restorationCredit:'HTML5 restoration and preservation by',photosCredit:'Photographs ©',licensedUnder:'licensed under',cursorCredit:'Original rotation cursor artwork from the GPL-licensed 2010 program.',imageError:'Unable to open this image.',loading:'Loading image…',previewTitle:'Picture preview',previewAlt:'Puzzle image preview',closeLabel:'Close'},
 it:{gameMenu:'Partita',newGame:'Nuovo puzzle',puzzleMenu:'Puzzle',gallery:'Galleria',myImage:'Mia immagine',preview:'Anteprima',direction:'Direzione',clockwise:'Orario',counterClockwise:'Antiorario',backgroundColor:'Sfondo',helpMenu:'Aiuto',help:'Istruzioni',credits:'Crediti',changeLanguage:'Cambia lingua',gameControls:'Controlli di gioco',boardLabel:'Tabellone del puzzle a tessere rotanti',boardHint:'Attiva uno dei sei punti di intersezione. Un click normale ruota in senso orario; Maiusc più click ruota in senso antiorario. I tasti da 1 a 6 ruotano la relativa intersezione.',complete:'Puzzle completato!',choosePicture:'Scegli un’immagine',galleryIntro:'Le dieci fotografie incluse nella raccolta originale del 2010.',helpTitle:'Come si gioca',help1:'Ricostruisci l’immagine riportando le sette tessere esagonali nella posizione e nell’orientamento corretti.',help2:'Ogni mossa agisce su uno dei sei punti d’intersezione in cui si incontrano tre tessere. Le tre tessere ruotano insieme attorno a quel punto.',help3:'Clicca o tocca un’intersezione per ruotare in senso orario.',help4:'Su desktop, tieni premuto Maiusc mentre clicchi per ruotare in senso antiorario. Su touch scegli la direzione da Puzzle → Direzione.',help5:'Il puzzle è completo solo quando ogni tessera è tornata nella posizione e nell’orientamento originale.',help6:'Dopo il completamento, clicca o tocca il puzzle per mescolarlo di nuovo.',originalCredit:'Gioco originale: Spinning Tile Puzzle, parte di Virtual Toybox Puzzle Collection 2010.08.11 di Jonathan Hulka. GPL-3.0-or-later.',restorationCredit:'Restauro e preservazione HTML5 di',photosCredit:'Fotografie ©',licensedUnder:'distribuite con licenza',cursorCredit:'Grafica originale dei cursori di rotazione dal programma 2010 distribuito sotto GPL.',imageError:'Impossibile aprire questa immagine.',loading:'Caricamento immagine…',previewTitle:'Anteprima immagine',previewAlt:'Anteprima dell’immagine del puzzle',closeLabel:'Chiudi'}
};})(typeof globalThis!=='undefined'?globalThis:this);


(function(){'use strict';
 const G=globalThis.SpinningTileGame,I18N=globalThis.SpinningTileI18N;
 const canvas=document.getElementById('game'),ctx=canvas.getContext('2d'),complete=document.getElementById('complete'),status=document.getElementById('loadStatus'),langBtn=document.getElementById('langBtn'),directionSelect=document.getElementById('directionSelect'),backgroundInput=document.getElementById('backgroundInput'),imageInput=document.getElementById('imageInput'),galleryDialog=document.getElementById('galleryDialog'),galleryGrid=document.getElementById('galleryGrid'),helpDialog=document.getElementById('helpDialog'),creditsDialog=document.getElementById('creditsDialog'),previewDialog=document.getElementById('previewDialog'),previewImage=document.getElementById('previewImage');
 const photos=[['Full-202-Tiger-Swallowtail.jpg','Tiger Swallowtail',[98,114,72]],['Full-24-The-Maroon-Bells.jpg','The Maroon Bells',[104,103,100]],['Full-237-Hanging-Lake.jpg','Hanging Lake',[78,102,68]],['Full-261-Yellow-Flower.jpg','Yellow Flower',[84,95,4]],['Full-266-Cascading-Falls.jpg','Cascading Falls',[77,68,38]],['Full-288-Tennessee-Sunset.jpg','Tennessee Sunset',[82,46,47]],['Full-333-Ladybug-in-the-Field.jpg','Ladybug in the Field',[46,64,9]],['Full-334-Light-of-the-Sky.jpg','Light of the Sky',[102,116,137]],['Full-446-Along-the-Banks.jpg','Along the Banks',[70,67,67]],['Full-454-ONeil-Bridge-in-the-Morning.jpg',"O'Neil Bridge in the Morning",[87,97,109]]];
 let lang='en',image=new Image(),imageSrc='assets/photos/Full-202-Tiger-Swallowtail.jpg',logical=null,geom=null,state=null,viewport=null,background=G.backgroundFromMean(98,114,72),hoverVertex=-1,pressedVertex=-1,activePointer=null,shiftDown=false;
 const cwIcon=new Image(),ccwIcon=new Image();cwIcon.src='assets/icons/cwcursor.png';ccwIcon.src='assets/icons/ccwcursor.png';
 function t(k){return I18N[lang][k]||k;} function applyI18n(){document.documentElement.lang=lang;document.querySelectorAll('[data-i18n]').forEach(e=>e.textContent=t(e.dataset.i18n));document.querySelectorAll('[data-i18n-aria]').forEach(e=>e.setAttribute('aria-label',t(e.dataset.i18nAria)));document.querySelectorAll('[data-i18n-alt]').forEach(e=>e.setAttribute('alt',t(e.dataset.i18nAlt)));langBtn.textContent=lang==='en'?'IT':'EN';directionSelect.options[0].textContent=t('clockwise');directionSelect.options[1].textContent=t('counterClockwise');}
 function closeMenus(){document.querySelectorAll('.toolbarMenu[open]').forEach(d=>d.removeAttribute('open'));}document.addEventListener('click',e=>{if(!e.target.closest('.toolbarMenu'))closeMenus();});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus();});document.querySelectorAll('.toolbarMenu').forEach(m=>m.addEventListener('toggle',()=>{if(m.open)document.querySelectorAll('.toolbarMenu').forEach(o=>{if(o!==m)o.removeAttribute('open');});}));
 function resizeCanvas(){const r=canvas.getBoundingClientRect(),dpr=Math.max(1,window.devicePixelRatio||1);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));if(logical)viewport=G.computeViewport(r.width,r.height,logical.width,logical.height,16);render();}
 function setBackground(c){background=c;backgroundInput.value=c;render();}
 function loadImage(src,mean=null){status.textContent=t('loading');status.classList.remove('hidden');const next=new Image();next.onload=()=>{image=next;imageSrc=src;const rgb=mean||[128,128,128];background=G.backgroundFromMean(...rgb);backgroundInput.value=background;status.classList.add('hidden');newGame();};next.onerror=()=>{status.textContent=t('imageError');status.classList.remove('hidden');};next.src=src;}
 function newGame(){if(!image.naturalWidth)return;logical=G.fitImage(image.naturalWidth,image.naturalHeight);geom=G.layout(logical.width,logical.height);state=G.mix();hoverVertex=-1;pressedVertex=-1;complete.classList.add('hidden');const r=canvas.getBoundingClientRect();viewport=G.computeViewport(r.width,r.height,logical.width,logical.height,16);render();}
 function hexPath(x,y,w,h){ctx.beginPath();ctx.moveTo(x+w/2,y);ctx.lineTo(x+w,y+h/4);ctx.lineTo(x+w,y+3*h/4);ctx.lineTo(x+w/2,y+h);ctx.lineTo(x,y+3*h/4);ctx.lineTo(x,y+h/4);ctx.closePath();}
 function renderTile(pos){const orig=state.originalIndex[pos],rot=state.rotation[pos],dst=G.tilePosition(geom,pos),src=G.tilePosition(geom,orig);if(!dst||!src)return;const w=geom.tileWidth,h=geom.tileHeight,dcx=dst.x+w/2,dcy=dst.y+h/2,scx=src.x+w/2,scy=src.y+h/2,angle=rot*Math.PI/3;
   ctx.save();hexPath(dst.x,dst.y,w,h);ctx.clip();ctx.translate(dcx,dcy);ctx.scale(1,geom.scaleFactor);ctx.rotate(angle);ctx.scale(1,1/geom.scaleFactor);ctx.drawImage(image,-scx,-scy,logical.width,logical.height);ctx.restore();
   const edge=Math.max(1,1/viewport.scale);ctx.save();ctx.lineWidth=edge;ctx.strokeStyle='rgba(0,0,0,.48)';hexPath(dst.x,dst.y,w,h);ctx.stroke();ctx.translate(edge*.7,edge*.7);ctx.strokeStyle='rgba(255,255,255,.28)';hexPath(dst.x,dst.y,w,h);ctx.stroke();ctx.restore();
 }
 function updateMouseCursor(){if(hoverVertex<0||!state||state.solved){canvas.style.cursor='default';return;}const ccw=shiftDown||Number(directionSelect.value)===G.SPIN_CCW;canvas.style.cursor=`url("assets/icons/${ccw?'ccwcursor':'cwcursor'}.png") 16 16, pointer`;}
 function render(){const cssW=canvas.clientWidth,cssH=canvas.clientHeight,dpr=Math.max(1,window.devicePixelRatio||1);ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=background;ctx.fillRect(0,0,cssW,cssH);if(!state||!viewport){ctx.restore();return;}ctx.translate(viewport.x,viewport.y);ctx.scale(viewport.scale,viewport.scale);ctx.drawImage(image,0,0,logical.width,logical.height);for(let i=0;i<7;i++)renderTile(i);ctx.restore();if(pressedVertex>=0&&!state.solved){const p=G.vertexPosition(geom,pressedVertex),x=viewport.x+p.x*viewport.scale,y=viewport.y+p.y*viewport.scale,icon=Number(directionSelect.value)===G.SPIN_CCW?ccwIcon:cwIcon;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.beginPath();ctx.arc(x,y,23,0,Math.PI*2);ctx.fillStyle='rgba(15,18,22,.55)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='rgba(255,255,255,.85)';ctx.stroke();ctx.drawImage(icon,x-16,y-16,32,32);ctx.restore();}updateMouseCursor();}
 function logicalPoint(e){if(!viewport)return null;const r=canvas.getBoundingClientRect();return G.canvasToLogical(e.clientX-r.left,e.clientY-r.top,viewport);}
 function pointerVertex(e){const p=logicalPoint(e);return p?G.getNearestVertex(geom,p.x,p.y):-1;}
 function currentDirection(e){return e&&e.shiftKey?G.SPIN_CCW:Number(directionSelect.value);}
 function activateVertex(v,dir){if(!state)return;if(state.solved){state=G.mix();complete.classList.add('hidden');render();return;}if(v>=0&&v<6){G.spin(state,v,dir);if(state.solved){complete.classList.remove('hidden');hoverVertex=-1;}render();}}
 canvas.addEventListener('pointermove',e=>{if(e.pointerType&&e.pointerType!=='mouse')return;hoverVertex=state&&!state.solved?pointerVertex(e):-1;updateMouseCursor();});canvas.addEventListener('pointerleave',()=>{hoverVertex=-1;updateMouseCursor();});
 canvas.addEventListener('pointerdown',e=>{if(!state)return;const v=pointerVertex(e);activePointer={id:e.pointerId,x:e.clientX,y:e.clientY,v,dir:currentDirection(e),type:e.pointerType||'mouse'};if(activePointer.type!=='mouse'&&v>=0){pressedVertex=v;render();}try{canvas.setPointerCapture(e.pointerId);}catch{}});canvas.addEventListener('pointerup',e=>{if(!activePointer||activePointer.id!==e.pointerId)return;const moved=Math.hypot(e.clientX-activePointer.x,e.clientY-activePointer.y),v=pointerVertex(e),a=activePointer;activePointer=null;pressedVertex=-1;if(moved<=12&&v===a.v)activateVertex(v,a.dir);else render();});canvas.addEventListener('pointercancel',()=>{activePointer=null;pressedVertex=-1;render();});
 canvas.addEventListener('keydown',e=>{if(!state)return;if(state.solved&&(e.key==='Enter'||e.key===' ')){e.preventDefault();activateVertex(-1,G.SPIN_CW);return;}if(/^[1-6]$/.test(e.key)){e.preventDefault();activateVertex(Number(e.key)-1,currentDirection(e));}});
 document.addEventListener('keydown',e=>{if(e.key==='Shift'){shiftDown=true;updateMouseCursor();}});document.addEventListener('keyup',e=>{if(e.key==='Shift'){shiftDown=false;updateMouseCursor();}});
 document.getElementById('newBtn').addEventListener('click',()=>{newGame();closeMenus();});backgroundInput.addEventListener('input',()=>setBackground(backgroundInput.value));directionSelect.addEventListener('change',()=>{updateMouseCursor();render();closeMenus();});document.getElementById('galleryBtn').addEventListener('click',()=>{galleryDialog.showModal();closeMenus();});document.getElementById('previewBtn').addEventListener('click',()=>{previewImage.src=imageSrc;previewDialog.showModal();closeMenus();});document.getElementById('helpBtn').addEventListener('click',()=>{helpDialog.showModal();closeMenus();});document.getElementById('creditsBtn').addEventListener('click',()=>{creditsDialog.showModal();closeMenus();});document.querySelectorAll('dialog .close').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));langBtn.addEventListener('click',()=>{lang=lang==='en'?'it':'en';applyI18n();});imageInput.addEventListener('change',()=>{const f=imageInput.files&&imageInput.files[0];if(!f)return;const r=new FileReader();r.onload=()=>loadImage(String(r.result));r.onerror=()=>{status.textContent=t('imageError');status.classList.remove('hidden');};r.readAsDataURL(f);imageInput.value='';closeMenus();});
 photos.forEach(([file,name,mean])=>{const b=document.createElement('button');b.className='photoChoice';b.type='button';b.innerHTML=`<img src="assets/photos/thumbs/${file}" alt=""><span>${name}</span>`;b.addEventListener('click',()=>{galleryDialog.close();loadImage(`assets/photos/${file}`,mean);});galleryGrid.appendChild(b);});
 window.addEventListener('resize',resizeCanvas);applyI18n();requestAnimationFrame(()=>{resizeCanvas();loadImage(imageSrc,photos[0][2]);});
})();

