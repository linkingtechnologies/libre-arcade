import { World, C } from './engine.mjs';
import { TOTAL_LEVELS, clampUnlocked, unlockAfterCompletion, clampPlayableLevel } from './progress.mjs';
import { normalizeLanguage } from './settings.mjs';
import { AudioSystem } from './audio.mjs';
import { drawArcadeText, fitArcadeTextSize } from './arcade-text.mjs';

const canvas=document.querySelector('#game');
const ctx=canvas.getContext('2d');
const levelSelect=document.querySelector('#levelSelect');
const titleEl=document.querySelector('#levelTitle');
const statusEl=document.querySelector('#status');
const menuBtn=document.querySelector('#menuBtn');
const pauseBtn=document.querySelector('#pauseBtn');
const restartBtn=document.querySelector('#restartBtn');
const langBtn=document.querySelector('#langBtn');
const soundBtn=document.querySelector('#soundBtn');
const musicBtn=document.querySelector('#musicBtn');
const leftBtn=document.querySelector('#leftBtn');
const rightBtn=document.querySelector('#rightBtn');
const helpEl=document.querySelector('#help');

const qs=new URLSearchParams(location.search);
const archaeology=qs.get('all')==='1';
const seedParam=qs.get('seed');
function storageGet(key,fallback=null){try{const v=localStorage.getItem(key);return v===null?fallback:v;}catch{return fallback;}}
function storageSet(key,value){try{localStorage.setItem(key,String(value));}catch{}}
function hashSeed(text){let h=2166136261>>>0;for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)>>>0;}return h||1;}
function seededRng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
let lang=normalizeLanguage(storageGet('diskfield-lang'),navigator.language||'');
let unlocked=clampUnlocked(storageGet('diskfield-unlocked',1));
if(archaeology)unlocked=TOTAL_LEVELS;
let level=clampPlayableLevel(qs.get('level')||0,unlocked,archaeology);
let screen=qs.has('level')?'play':'menu';
let world=null,previewWorld=null,paused=false,acc=0,last=performance.now(),completePulse=0,endTicks=0;
let uiTick=0,menuSelected=0,selectSelected=level,optionsSelected=0;
let soundOn=storageGet('diskfield-sound','on')!=='off';
let musicOn=storageGet('diskfield-music','on')!=='off';
const audio=new AudioSystem({soundOn,musicOn});
const input={left:false,right:false};
let hitRegions=[];

const tr={
  en:{menu:'Menu',pause:'Pause',resume:'Resume',restart:'Restart',sound:'Sounds: on',soundOff:'Sounds: off',music:'Music: on',musicOff:'Music: off',help:'Hold ← / → to rotate the red field. Guide the disk into the target. P pauses.',done:'Level complete',paused:'Paused',level:'Level',arch:'Archaeology mode: all levels unlocked',start:'Start game',select:'Select level',options:'Options',credits:'Credits',back:'Back',selectTitle:'Select Level',optionsTitle:'Options',creditsTitle:'Credits',language:'Language',theEnd:'The End',continue:'Press any key or tap to return',credits1:'Original game: Jeremy Appleyard (Tigga), PyWeek 5, 2007',credits2:'HTML5 restoration: Libre Arcade',credits3:'Thanks for playing!',left:'Rotate counter-clockwise',right:'Rotate clockwise',progress:'Progress'},
  it:{menu:'Menu',pause:'Pausa',resume:'Riprendi',restart:'Ricomincia',sound:'Suoni: sì',soundOff:'Suoni: no',music:'Musica: sì',musicOff:'Musica: no',help:'Tieni premuto ← / → per ruotare il campo rosso. Porta il disco nel bersaglio. P mette in pausa.',done:'Livello completato',paused:'In pausa',level:'Livello',arch:'Modalità archeologia: tutti i livelli sbloccati',start:'Inizia',select:'Scegli livello',options:'Opzioni',credits:'Crediti',back:'Indietro',selectTitle:'Scegli livello',optionsTitle:'Opzioni',creditsTitle:'Crediti',language:'Lingua',theEnd:'Fine',continue:'Premi un tasto o tocca per tornare',credits1:'Gioco originale: Jeremy Appleyard (Tigga), PyWeek 5, 2007',credits2:'Restauro HTML5: Libre Arcade',credits3:'Grazie per aver giocato!',left:'Ruota in senso antiorario',right:'Ruota in senso orario',progress:'Progresso'}
};
const levelNamesEn=['Intro','Off to the side…','Around a corner','Up we go!','Watch the chute!','Careful around that wall','Dodge!','Be sure to get a run up','Holes','Under and over','Stay on track','Down and up','Black holes!','Level 14','Level 15','Level 16','Level 17'];
const levelNamesIt=['Introduzione','Di lato…','Dietro l’angolo','Su!','Attento allo scivolo!','Attento a quel muro','Schiva!','Prendi la rincorsa','Buchi','Sotto e sopra','Resta in pista','Giù e su','Buchi neri!','Livello 14','Livello 15','Livello 16','Livello 17'];
function T(k){return tr[lang][k];}
function levelName(i){return (lang==='it'?levelNamesIt:levelNamesEn)[i];}

function setScreen(next){screen=next;document.body.dataset.screen=next;hitRegions=[];input.left=input.right=false;if(next!=='play')paused=false;if(next==='end')endTicks=5*C.TICK_RATE;if(next==='select')setPreview(selectSelected);updateUi();try{canvas.focus({preventScroll:true});}catch{canvas.focus();}}
function updateUi(){
  menuBtn.textContent=T('menu');pauseBtn.textContent=paused?T('resume'):T('pause');restartBtn.textContent=T('restart');langBtn.textContent=lang==='it'?'EN':'IT';soundBtn.textContent=soundOn?T('sound'):T('soundOff');musicBtn.textContent=musicOn?T('music'):T('musicOff');helpEl.textContent=T('help');
  document.documentElement.lang=lang;
  titleEl.textContent=`${T('level')} ${level+1} · ${levelName(level)}`;
  statusEl.textContent=archaeology?T('arch'):(paused?T('paused'):`${T('progress')}: ${unlocked}/${TOTAL_LEVELS}`);
  leftBtn.setAttribute('aria-label',T('left'));rightBtn.setAttribute('aria-label',T('right'));
  pauseBtn.setAttribute('aria-pressed',paused?'true':'false');
  soundBtn.setAttribute('aria-pressed',soundOn?'true':'false');
  musicBtn.setAttribute('aria-pressed',musicOn?'true':'false');
  canvas.setAttribute('aria-label',`${T('level')} ${level+1}. ${T('help')}`);
  levelSelect.innerHTML='';for(let i=0;i<TOTAL_LEVELS;i++){const o=document.createElement('option');o.value=i;o.textContent=`${i+1}. ${levelName(i)}`;o.disabled=i>=unlocked;o.selected=i===level;levelSelect.append(o);}
}

function randomWorld(i){const rng=(i===6&&seedParam!==null)?seededRng(hashSeed(`${seedParam}:${i}`)):Math.random;return new World(i,{randomizeDodge:i===6,rng});}
function loadLevel(i){level=Math.max(0,Math.min(TOTAL_LEVELS-1,i));world=randomWorld(level);paused=false;acc=0;completePulse=0;updateUi();}
function previewWorldFor(i){
  const isDodge=i===6;
  const rng=(isDodge&&seedParam!==null)?seededRng(hashSeed(`${seedParam}:preview:${i}`)):Math.random;
  return new World(i,{randomizeDodge:isDodge,rng});
}
function setPreview(i){selectSelected=Math.max(0,Math.min(unlocked-1,i));previewWorld=previewWorldFor(selectSelected);}
function startLevel(i){loadLevel(i);setScreen('play');}

function ensureAudio(){void audio.unlock();return audio.ctx||audio.ensure();}
function unlockAudioFromGesture(){void audio.unlock();}
function uiBeep(){audio.uiBeep();}
function audioEvents(before){
  if(!soundOn)return;
  for(let i=0;i<world.disks.length;i++){
    const d=world.disks[i],b=before[i];
    if(d.collided){const afterSpeed=Math.hypot(d.realSpeed.v[0],d.realSpeed.v[1]);const loss=Math.max(0,b.speed-afterSpeed);audio.thud(Math.min(1,.18+loss/5));}
    if(b.holeStep===0&&d.holeStep===30)audio.blackHoleIn();
    if(b.holeStep===4&&d.holeStep===3)audio.whiteHoleOut();
  }
}

function tick(){
  if(screen==='play'&&!paused){
    if(input.left)world.rotate(false);else if(input.right)world.rotate(true);
    const before=world.disks.map(d=>({holeStep:d.holeStep,speed:Math.hypot(d.realSpeed.v[0],d.realSpeed.v[1])}));world.update();audioEvents(before);
    if(world.finished){audio.levelComplete();completePulse=12;if(level<TOTAL_LEVELS-1){unlocked=unlockAfterCompletion(unlocked,level);storageSet('diskfield-unlocked',unlocked);level++;world=randomWorld(level);updateUi();}else{audio.endGame();setScreen('end');}}
  } else if(screen==='select'&&previewWorld){previewWorld.updatePreview();}
  else if(screen==='end'&&endTicks>0){endTicks--;if(endTicks===0)setScreen('menu');}
  uiTick++;
}

function normRect(r){const x=Math.min(r.left,r.right),y=Math.min(r.top,r.bottom);return [x,y,Math.abs(r.w),Math.abs(r.h)];}
function circle(x,y,r,fill){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();}
function drawBorder(){ctx.fillStyle='#000';ctx.fillRect(0,0,800,16);ctx.fillRect(0,584,800,16);ctx.fillRect(0,0,16,600);ctx.fillRect(784,0,16,600);}
function drawQuarterDisk(x,y,r,rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);for(let j=0;j<4;j++){ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,r,j*Math.PI/2,(j+1)*Math.PI/2);ctx.closePath();ctx.fillStyle=j%2?'#fff':'#000';ctx.fill();}ctx.restore();}
function drawTarget(w){for(let j=0;j<4;j++){ctx.beginPath();ctx.moveTo(w.winPos[0],w.winPos[1]);ctx.arc(w.winPos[0],w.winPos[1],C.END_RADIUS,j*Math.PI/2,(j+1)*Math.PI/2);ctx.closePath();ctx.fillStyle=j%2?'#f00':'#000';ctx.fill();}}
function drawDisk(d){ctx.save();ctx.translate(d.pos.v[0],d.pos.v[1]);ctx.rotate(d.rotation);ctx.scale(d.scale,d.scale);for(let j=0;j<4;j++){ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,d.radius,j*Math.PI/2,(j+1)*Math.PI/2);ctx.closePath();ctx.fillStyle=j%2?'#fff':'#000';ctx.fill();}ctx.restore();}
function drawArrows(w,preview=false){ctx.lineCap='round';ctx.lineJoin='round';for(const col of w.arrows)for(const a of col){const s=a.strength();if(s<=1e-5){circle(a.pos[0],a.pos[1],preview?1.5:1,'#f00');continue;}const p=a.fixedProportion();const red=Math.max(0,Math.min(255,Math.round(255*(1-2*p)))),blue=Math.max(0,Math.min(255,Math.round(255*p)));ctx.strokeStyle=`rgb(${red},0,${blue})`;ctx.lineWidth=Math.max(.45,preview?s/2:s);const angle=Math.atan2(a.vector[1],a.vector[0]);ctx.save();ctx.translate(a.pos[0],a.pos[1]);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-5,-5);ctx.lineTo(5,-.5);ctx.lineTo(5,.5);ctx.lineTo(-5,5);ctx.stroke();ctx.restore();}}
function drawWorld(w,{x=0,y=0,width=800,height=600,preview=false,showDisk=true}={}){
  ctx.save();ctx.fillStyle='#cccc00';ctx.fillRect(x,y,width,height);ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();ctx.translate(x,y+height);ctx.scale(width/800,-height/600);
  drawArrows(w,preview);
  for(const wall of w.walls){if(!wall.alive)continue;const [wx,wy,ww,hh]=normRect(wall.rect);ctx.fillStyle=wall.killer?'#f00':(wall.crumble?'#99804d':'#000');ctx.fillRect(wx,wy,ww,hh);}
  ctx.fillStyle='#000';ctx.fillRect(0,0,800,16);ctx.fillRect(0,584,800,16);ctx.fillRect(0,0,16,600);ctx.fillRect(784,0,16,600);
  for(const h of w.holes){circle(h.pos[0],h.pos[1],h.radius,'#000');circle(h.target[0],h.target[1],h.radius,'#fff');}
  drawTarget(w);if(showDisk)for(const d of w.disks)if(!d.finished)drawDisk(d);ctx.restore();
}

function canvasText(text,x,y,size=54,align='left',weight=900){drawArcadeText(ctx,text,x,y,size,{align,color:'#000'});}
function canvasTextFit(text,x,y,preferredSize,maxWidth,{align='left',minSize=12}={}){const size=fitArcadeTextSize(text,preferredSize,maxWidth,minSize);drawArcadeText(ctx,text,x,y,size,{align,color:'#000'});return size;}
function addHit(kind,index,x,y,w,h){hitRegions.push({kind,index,x,y,w,h});}
function drawMenuCursor(y){drawQuarterDisk(105,y,30,uiTick*8*Math.PI/180);}
function renderMenu(){ctx.fillStyle='#cccc00';ctx.fillRect(0,0,800,600);drawBorder();canvasText('DISK FIELD',76,116,78,'left',900);const labels=[T('start'),T('select'),T('options'),T('credits')];const ys=[270,366,462,546];for(let i=0;i<labels.length;i++){canvasText(labels[i].toUpperCase(),160,ys[i],46);addHit('menu',i,145,ys[i]-36,570,72);}drawMenuCursor(ys[menuSelected]);}
function renderSelect(){ctx.fillStyle='#cccc00';ctx.fillRect(0,0,800,600);drawBorder();canvasText(T('selectTitle').toUpperCase(),400,78,54,'center');const total=unlocked+1;let center=Math.max(0,Math.min(selectSelected-2,total-5));if(total<=5)center=0;const visible=[];for(let i=center;i<Math.min(total,center+5);i++)visible.push(i);const y0=210;const listX=128;const listMaxWidth=244;visible.forEach((i,row)=>{const isBack=i===unlocked;const label=(isBack?T('back'):`${T('level')} ${i+1}`).toUpperCase();canvasTextFit(label,listX,y0+row*66,32,listMaxWidth,{minSize:26});addHit('select',i,58,y0+row*66-28,322,56);if(i===selectSelected)drawQuarterDisk(92,y0+row*66,26,uiTick*8*Math.PI/180);});if(selectSelected<unlocked&&previewWorld){drawWorld(previewWorld,{x:400,y:210,width:360,height:270,preview:true,showDisk:false});ctx.save();ctx.strokeStyle='#000';ctx.lineWidth=3;ctx.strokeRect(400,210,360,270);ctx.restore();canvasTextFit(levelName(selectSelected),580,506,22,340,{align:'center',minSize:14});}}
function renderOptions(){ctx.fillStyle='#cccc00';ctx.fillRect(0,0,800,600);drawBorder();canvasText(T('optionsTitle').toUpperCase(),400,82,66,'center');const items=[soundOn?T('sound'):T('soundOff'),musicOn?T('music'):T('musicOff'),`${T('language')}: ${lang==='it'?'Italiano':'English'}`,T('back')];const ys=[220,310,400,490];items.forEach((s,i)=>{canvasText(s.toUpperCase(),150,ys[i],36);addHit('options',i,130,ys[i]-32,560,64);if(i===optionsSelected)drawMenuCursor(ys[i]);});}
function renderCredits(){ctx.fillStyle='#cccc00';ctx.fillRect(0,0,800,600);drawBorder();canvasText(T('creditsTitle').toUpperCase(),400,82,66,'center');ctx.fillStyle='#000';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='700 25px system-ui,sans-serif';wrapText(T('credits1'),400,238,650,34);wrapText(T('credits2'),400,330,650,34);ctx.font='600 20px system-ui,sans-serif';wrapText(T('credits3'),400,404,650,28);canvasText(T('back').toUpperCase(),400,526,34,'center');addHit('credits',0,300,492,200,62);}
function wrapText(text,x,y,maxWidth,lineHeight){const words=text.split(' ');let line='',yy=y;for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,yy);line=word;yy+=lineHeight;}else line=test;}if(line)ctx.fillText(line,x,yy);}
function renderEnd(){ctx.fillStyle='#cccc00';ctx.fillRect(0,0,800,600);drawBorder();canvasText(T('theEnd').toUpperCase(),400,280,92,'center');ctx.fillStyle='#000';ctx.font='700 22px system-ui,sans-serif';ctx.textAlign='center';ctx.fillText(T('continue'),400,370);addHit('end',0,0,0,800,600);}
function renderPlay(){drawWorld(world);if(completePulse>0){ctx.fillStyle=`rgba(255,255,255,${Math.min(.26,completePulse/44)})`;ctx.fillRect(0,0,800,600);completePulse--;}if(paused){ctx.fillStyle='rgba(255,255,255,.30)';ctx.fillRect(0,0,800,600);canvasText(T('paused').toUpperCase(),400,300,80,'center');}}
function render(){ctx.setTransform(1,0,0,1,0,0);hitRegions=[];if(screen==='menu')renderMenu();else if(screen==='select')renderSelect();else if(screen==='options')renderOptions();else if(screen==='credits')renderCredits();else if(screen==='end')renderEnd();else renderPlay();}

function activateMenu(i){ensureAudio();uiBeep();if(i===0)startLevel(0);else if(i===1){selectSelected=Math.min(level,unlocked-1);setScreen('select');}else if(i===2){optionsSelected=0;setScreen('options');}else if(i===3)setScreen('credits');}
function activateSelect(i){ensureAudio();uiBeep();if(i===unlocked)setScreen('menu');else startLevel(i);}
function activateOption(i){ensureAudio();uiBeep();if(i===0){soundOn=!soundOn;audio.setSound(soundOn);storageSet('diskfield-sound',soundOn?'on':'off');updateUi();}else if(i===1){musicOn=!musicOn;audio.setMusic(musicOn);storageSet('diskfield-music',musicOn?'on':'off');updateUi();}else if(i===2){lang=lang==='it'?'en':'it';storageSet('diskfield-lang',lang);updateUi();}else setScreen('menu');}
function moveSelection(delta){ensureAudio();uiBeep();if(screen==='menu')menuSelected=(menuSelected+delta+4)%4;else if(screen==='select'){const total=unlocked+1;selectSelected=(selectSelected+delta+total)%total;if(selectSelected<unlocked)setPreview(selectSelected);else previewWorld=null;}else if(screen==='options')optionsSelected=(optionsSelected+delta+4)%4;}

function pointFromEvent(e){const r=canvas.getBoundingClientRect();return [(e.clientX-r.left)*800/r.width,(e.clientY-r.top)*600/r.height];}

// Browsers require Web Audio to be resumed from a user gesture. Listen globally so
// toolbar controls, canvas/touch play and keyboard navigation all unlock music.
addEventListener('pointerdown',unlockAudioFromGesture,{capture:true});
addEventListener('keydown',unlockAudioFromGesture,{capture:true});
addEventListener('touchstart',unlockAudioFromGesture,{capture:true,passive:true});
canvas.addEventListener('pointerdown',e=>{ensureAudio();const [x,y]=pointFromEvent(e);for(let i=hitRegions.length-1;i>=0;i--){const h=hitRegions[i];if(x>=h.x&&x<=h.x+h.w&&y>=h.y&&y<=h.y+h.h){if(h.kind==='menu')activateMenu(h.index);else if(h.kind==='select')activateSelect(h.index);else if(h.kind==='options')activateOption(h.index);else if(h.kind==='credits'||h.kind==='end')setScreen('menu');return;}}});

function bindHold(el,key){const on=e=>{if(screen!=='play')return;e.preventDefault();ensureAudio();input[key]=true;el.setPointerCapture?.(e.pointerId);};const off=e=>{e.preventDefault();input[key]=false;};el.addEventListener('pointerdown',on);el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off);}
bindHold(leftBtn,'left');bindHold(rightBtn,'right');
addEventListener('keydown',e=>{
  if(screen==='play'){
    if(e.code==='ArrowLeft'){input.left=true;e.preventDefault();ensureAudio();}else if(e.code==='ArrowRight'){input.right=true;e.preventDefault();ensureAudio();}else if(e.code==='KeyP'||e.code==='Pause'){paused=!paused;updateUi();e.preventDefault();}else if(e.code==='KeyR'){loadLevel(level);e.preventDefault();}else if(e.code==='Escape'){setScreen('menu');e.preventDefault();}
    return;
  }
  if(screen==='end'){setScreen('menu');e.preventDefault();return;}
  if(e.code==='ArrowUp'){moveSelection(-1);e.preventDefault();}else if(e.code==='ArrowDown'){moveSelection(1);e.preventDefault();}else if(e.code==='Enter'||e.code==='Space'){if(screen==='menu')activateMenu(menuSelected);else if(screen==='select')activateSelect(selectSelected);else if(screen==='options')activateOption(optionsSelected);else if(screen==='credits')setScreen('menu');e.preventDefault();}else if(e.code==='Escape'){if(screen!=='menu')setScreen('menu');e.preventDefault();}
});
addEventListener('keyup',e=>{if(e.code==='ArrowLeft')input.left=false;else if(e.code==='ArrowRight')input.right=false;});
addEventListener('blur',()=>{input.left=input.right=false;});
document.addEventListener('visibilitychange',()=>{input.left=input.right=false;if(document.hidden&&screen==='play'&&!paused){paused=true;updateUi();}});
levelSelect.addEventListener('change',()=>startLevel(Number(levelSelect.value)));restartBtn.addEventListener('click',()=>{ensureAudio();loadLevel(level);});pauseBtn.addEventListener('click',()=>{ensureAudio();paused=!paused;updateUi();});menuBtn.addEventListener('click',()=>setScreen('menu'));langBtn.addEventListener('click',()=>{lang=lang==='it'?'en':'it';storageSet('diskfield-lang',lang);updateUi();});soundBtn.addEventListener('click',()=>{soundOn=!soundOn;audio.setSound(soundOn);storageSet('diskfield-sound',soundOn?'on':'off');updateUi();});musicBtn.addEventListener('click',()=>{musicOn=!musicOn;audio.setMusic(musicOn);storageSet('diskfield-music',musicOn?'on':'off');updateUi();});

function frame(now){const dt=Math.min(.25,(now-last)/1000);last=now;acc+=dt;const step=1/C.TICK_RATE;let n=0;while(acc>=step&&n<8){tick();acc-=step;n++;}if(n===8)acc=0;render();requestAnimationFrame(frame);}

loadLevel(level);if(screen==='select')setPreview(selectSelected);setScreen(screen);requestAnimationFrame(frame);
