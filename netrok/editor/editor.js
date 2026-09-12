/* Netrok 0.95 level editor - SPDX-License-Identifier: GPL-3.0-or-later */
(() => {
  'use strict';
  const I=window.NetrokI18n;
  const tr=(key,vars={})=>I?I.t(key,vars):key;
  const ROWS=13,COLS=400,TILE=16,W=COLS*TILE,H=ROWS*TILE;
  const CUSTOM_KEY='netrok095.customLevel.v1', DRAFT_KEY='netrok095.editorDraft.v1', MAX_LEVEL_FILE_BYTES=256*1024;
  const ALLOWED=[...Array.from({length:18},(_,i)=>i),21,...Array.from({length:6},(_,i)=>23+i),...Array.from({length:9},(_,i)=>29+i),40,41,...Array.from({length:27},(_,i)=>61+i),150,152,154,156,158,160,162,165,200,201,202,203];
  const $=id=>document.getElementById(id);
  const canvas=$('mapCanvas'),ctx=canvas.getContext('2d',{alpha:false}),viewport=$('mapViewport'),palette=$('palette');
  const sourceLevel=$('sourceLevel'),screenJump=$('screenJump'),zoomEl=$('zoom'),gridEl=$('grid'),status=$('status'),selectedOut=$('selectedTile'),cursorInfo=$('cursorInfo'),dirtyMark=$('dirtyMark'),levelName=$('levelName');
  const bgColor=$('bgColor'),bgR=$('bgR'),bgG=$('bgG'),bgB=$('bgB');
  const images=new Map(); let tiles=new Array(ROWS*COLS).fill(0),background=[0,0,0],selected=1,tool='paint',dirty=false,name=tr('editor.level_copy',{n:1});
  let undoStack=[],redoStack=[],pointerDown=false,dragSnapshotTaken=false,lastCell=-1;

  function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
  function idx(r,c){return r*COLS+c;}
  function snapshot(){return {tiles:tiles.slice(),background:background.slice(),name};}
  function restore(s){tiles=s.tiles.slice();background=s.background.slice();name=s.name||tr('editor.untitled');syncBackground();setDirty(true);render();}
  function pushUndo(){undoStack.push(snapshot());if(undoStack.length>60)undoStack.shift();redoStack=[];syncUndo();}
  function syncUndo(){ $('undo').disabled=!undoStack.length; $('redo').disabled=!redoStack.length; }
  function setDirty(v){dirty=!!v;dirtyMark.textContent=dirty?tr('editor.modified'):'';levelName.textContent=name;}
  function setStatus(msg){status.textContent=msg;}
  function hex(v){return v.toString(16).padStart(2,'0');}
  function syncBackground(){background=background.map(v=>clamp(Number(v)||0,0,255));bgR.value=background[0];bgG.value=background[1];bgB.value=background[2];bgColor.value='#'+background.map(hex).join('');}
  function setBackground(next,record=true){if(record)pushUndo();background=next.map(v=>clamp(Number(v)||0,0,255));syncBackground();setDirty(true);render();}
  function workspaceFromEntry(entry,title){tiles=entry.tiles.slice();background=(entry.background||tiles.slice(0,3)).slice(0,3);tiles[0]=tiles[1]=tiles[2]=0;name=title;undoStack=[];redoStack=[];syncUndo();syncBackground();setDirty(false);render();viewport.scrollLeft=0;}
  function serialized(){const out=tiles.slice();out[0]=background[0];out[1]=background[1];out[2]=background[2];return out;}
  function customRecord(){return {version:1,name,background:background.slice(),tiles:serialized()};}
  function parseLegacy(text,fileName=tr('editor.import')){const vals=String(text).trim().split(/\s+/).filter(Boolean).map(Number);if(vals.length!==ROWS*COLS||vals.some(v=>!Number.isInteger(v)))throw new Error(tr('file.invalid_level'));if(vals.slice(0,3).some(v=>v<0||v>255))throw new Error(tr('file.invalid_bg'));if(vals.slice(3).some(v=>v<0||v>203))throw new Error(tr('file.unsupported_blocks'));return {background:vals.slice(0,3),tiles:vals,name:fileName};}
  function download(text,filename){const blob=new Blob([text],{type:'text/plain'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

  function render(){
    ctx.imageSmoothingEnabled=false;ctx.fillStyle=`rgb(${background.join(',')})`;ctx.fillRect(0,0,W,H);
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){const id=tiles[idx(r,c)];if(!id)continue;const im=images.get(id);if(im)ctx.drawImage(im,c*TILE,r*TILE);}
    if(gridEl.checked){ctx.save();ctx.strokeStyle='rgba(255,255,255,.25)';ctx.lineWidth=1;ctx.beginPath();for(let c=0;c<=COLS;c++){const x=c*TILE+.5;ctx.moveTo(x,0);ctx.lineTo(x,H);}for(let r=0;r<=ROWS;r++){const y=r*TILE+.5;ctx.moveTo(0,y);ctx.lineTo(W,y);}ctx.stroke();ctx.restore();}
  }
  function applyZoom(){const z=Number(zoomEl.value)||1;canvas.style.width=`${W*z}px`;canvas.style.height=`${H*z}px`;}
  function cellFromEvent(e){const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*canvas.width/rect.width,y=(e.clientY-rect.top)*canvas.height/rect.height;const c=clamp(Math.floor(x/TILE),0,COLS-1),r=clamp(Math.floor(y/TILE),0,ROWS-1);return {r,c,i:idx(r,c)};}
  function updateCursor(e){const cell=cellFromEvent(e);cursorInfo.textContent=tr('editor.cursor',{x:cell.c,y:cell.r,block:tiles[cell.i]});}
  function paintCell(cell){let value=selected;if(tool==='erase')value=0;if(tool==='pick'){setSelected(tiles[cell.i]);tool='paint';syncTools();return;}if(tool==='fill'){floodFill(cell,value);return;}if(tiles[cell.i]!==value){tiles[cell.i]=value;setDirty(true);render();}}
  function floodFill(cell,value){const target=tiles[cell.i];if(target===value)return;const q=[cell.i],seen=new Uint8Array(tiles.length);while(q.length){const i=q.pop();if(seen[i]||tiles[i]!==target)continue;seen[i]=1;tiles[i]=value;const r=Math.floor(i/COLS),c=i%COLS;if(c>0)q.push(i-1);if(c<COLS-1)q.push(i+1);if(r>0)q.push(i-COLS);if(r<ROWS-1)q.push(i+COLS);}setDirty(true);render();}
  function placeCloud(cell,n){const width=n+1;if(cell.r>=ROWS-1||cell.c+width>COLS){setStatus(tr('editor.cloud_no_fit'));return;}pushUndo();const top=[76,...Array(Math.max(0,n-1)).fill(77),78],bottom=[73,...Array(Math.max(0,n-1)).fill(74),75];for(let x=0;x<width;x++){tiles[idx(cell.r,cell.c+x)]=top[x];tiles[idx(cell.r+1,cell.c+x)]=bottom[x];}setDirty(true);render();setStatus(tr('editor.cloud_placed'));}
  function setSelected(id){if(!ALLOWED.includes(Number(id)))return;selected=Number(id);selectedOut.textContent=String(selected);palette.querySelectorAll('button').forEach(b=>b.classList.toggle('active',Number(b.dataset.tile)===selected));}
  function syncTools(){document.querySelectorAll('[data-tool]').forEach(b=>b.classList.toggle('active',b.dataset.tool===tool));}

  function buildPalette(){for(const id of ALLOWED){const b=document.createElement('button');b.type='button';b.dataset.tile=id;b.title=tr('editor.block_title',{id});const img=document.createElement('img');img.src=`../assets/png/${id}.png`;img.alt='';const span=document.createElement('span');span.textContent=id;b.append(img,span);b.addEventListener('click',()=>{setSelected(id);tool='paint';syncTools();});palette.appendChild(b);}setSelected(selected);}
  async function loadImages(){await Promise.all(ALLOWED.map(id=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images.set(id,im);resolve();};im.onerror=()=>reject(new Error(tr('editor.missing_asset',{id})));im.src=`../assets/png/${id}.png`;})));}

  for(let n=1;n<=20;n++){const o=document.createElement('option');o.value=n;o.dataset.levelNumber=String(n);o.textContent=tr('editor.level',{n});sourceLevel.appendChild(o);const sc=document.createElement('option');sc.value=n;sc.textContent=`${n}`;screenJump.appendChild(sc);}
  $('loadOriginal').addEventListener('click',()=>{const n=sourceLevel.value,entry=window.NETROK_LEVELS[n];workspaceFromEntry(entry,tr('editor.level_copy',{n}));setStatus(tr('editor.loaded_copy',{n}));});
  $('newLevel').addEventListener('click',()=>{pushUndo();tiles.fill(0);background=[0,0,0];name=tr('editor.untitled');syncBackground();setDirty(true);render();setStatus(tr('editor.blank'));});
  $('undo').addEventListener('click',()=>{if(!undoStack.length)return;redoStack.push(snapshot());restore(undoStack.pop());syncUndo();});
  $('redo').addEventListener('click',()=>{if(!redoStack.length)return;undoStack.push(snapshot());restore(redoStack.pop());syncUndo();});
  zoomEl.addEventListener('change',applyZoom);gridEl.addEventListener('change',render);screenJump.addEventListener('change',()=>{const z=Number(zoomEl.value)||1;viewport.scrollLeft=(Number(screenJump.value)-1)*320*z;});
  document.querySelectorAll('[data-tool]').forEach(b=>b.addEventListener('click',()=>{tool=b.dataset.tool;syncTools();}));
  document.querySelectorAll('[data-cloud]').forEach(b=>b.addEventListener('click',()=>{tool=`cloud${b.dataset.cloud}`;syncTools();setStatus(tr('editor.cloud_prompt',{n:b.dataset.cloud}));}));
  [bgR,bgG,bgB].forEach((el,i)=>el.addEventListener('change',()=>{const next=background.slice();next[i]=el.value;setBackground(next);}));
  bgColor.addEventListener('change',()=>{const h=bgColor.value;setBackground([parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]);});

  canvas.addEventListener('pointermove',e=>{updateCursor(e);if(pointerDown&&['paint','erase'].includes(tool)){const cell=cellFromEvent(e);if(cell.i!==lastCell){paintCell(cell);lastCell=cell.i;}}});
  canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);pointerDown=true;dragSnapshotTaken=false;const cell=cellFromEvent(e);lastCell=cell.i;if(tool.startsWith('cloud')){placeCloud(cell,Number(tool.slice(5)));tool='paint';syncTools();return;}if(['paint','erase','fill'].includes(tool)){pushUndo();dragSnapshotTaken=true;}paintCell(cell);});
  function endPointer(e){pointerDown=false;lastCell=-1;try{canvas.releasePointerCapture(e.pointerId);}catch(_){} }
  canvas.addEventListener('pointerup',endPointer);canvas.addEventListener('pointercancel',endPointer);

  $('importLevel').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',async()=>{const f=$('importFile').files&&$('importFile').files[0];if(!f)return;try{if(f.size>MAX_LEVEL_FILE_BYTES)throw new Error(tr('file.too_large'));const e=parseLegacy(await f.text(),f.name);workspaceFromEntry(e,f.name);setDirty(true);setStatus(tr('editor.imported',{name:f.name}));}catch(err){setStatus(tr('extras.import_failed',{message:err.message}));}$('importFile').value='';});
  $('exportLevel').addEventListener('click',()=>{download(serialized().join('\n')+'\n',(name.replace(/[^a-z0-9_-]+/gi,'_')||'netrok-level')+'.level');setStatus(tr('editor.exported'));});
  $('saveDraft').addEventListener('click',()=>{try{localStorage.setItem(DRAFT_KEY,JSON.stringify(customRecord()));setDirty(false);setStatus(tr('editor.draft_saved'));}catch(e){setStatus(tr('editor.draft_save_fail'));}});
  $('loadDraft').addEventListener('click',()=>{try{const d=JSON.parse(localStorage.getItem(DRAFT_KEY)||'null');if(!d)throw new Error('No draft');workspaceFromEntry(d,d.name||tr('editor.untitled'));setStatus(tr('editor.draft_loaded'));}catch(e){setStatus(tr('editor.no_draft'));}});
  $('playtest').addEventListener('click',()=>{try{localStorage.setItem(CUSTOM_KEY,JSON.stringify(customRecord()));dirty=false;window.location.href='../index.html?custom=1&return=editor%2Findex.html';}catch(e){setStatus(tr('editor.playtest_fail'));}});

  window.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.code==='KeyZ'){e.preventDefault();$('undo').click();}if((e.ctrlKey||e.metaKey)&&(e.code==='KeyY'||(e.shiftKey&&e.code==='KeyZ'))){e.preventDefault();$('redo').click();}if(e.code==='BracketLeft'||e.code==='BracketRight'){e.preventDefault();const z=Number(zoomEl.value)||1;viewport.scrollLeft+=e.code==='BracketLeft'?-320*z:320*z;}});
  window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});

  document.addEventListener('netrok-language-change',()=>{
    sourceLevel.querySelectorAll('option[data-level-number]').forEach(o=>{o.textContent=tr('editor.level',{n:o.dataset.levelNumber});});
    palette.querySelectorAll('button[data-tile]').forEach(b=>{b.title=tr('editor.block_title',{id:b.dataset.tile});});
    setDirty(dirty);
  });

  buildPalette();applyZoom();syncTools();syncBackground();
  loadImages().then(()=>{workspaceFromEntry(window.NETROK_LEVELS['1'],tr('editor.level_copy',{n:1}));setStatus(tr('editor.ready'));}).catch(err=>{console.error(err);setStatus(tr('editor.asset_fail',{message:err.message}));});
})();
