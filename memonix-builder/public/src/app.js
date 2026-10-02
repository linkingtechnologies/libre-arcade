import { BUILDER_ASSETS, CATEGORY_ASSETS, CATEGORIES } from './assets.js';
import { createRng, emptyBoard, generateBuilder, availableAssets, remainingCount, isSolved, wrongCells, secondsFromMs } from './model.js';
import { loadSettings, saveSettings as persistSettings, readBest, writeBest, clearScores, clearAllLocalData } from './storage.js';
import { MENU_LAYOUT } from './menu_layout.js';

const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const W=800,H=600,GRID_X=44,GRID_Y=44,CELL=64;
const LIBRE_ARCADE_URL='https://linkingtechnologies.github.io/libre-arcade/';
const CREDIT_LINK={x:286,y:480,w:228,h:34};
const UI_ASSETS={mainmenu:'../assets/ui/original/mainmenu.jpg',builderPreview:'../assets/ui/original/builder-preview.png',menuFrame:'../assets/ui/original/mode-hover-frame.png',start:'../assets/ui/original/start.jpg',startDigits:'../assets/ui/original/start2.jpg',countdownLabel:'../assets/ui/original/start3.jpg',game:'../assets/ui/original/game.jpg',gamePanel:'../assets/ui/original/game2.png',game3:'../assets/ui/original/game3.png',errorX:'../assets/ui/original/error-x.png',errorShade:'../assets/ui/original/error-shade.png',inactive:'../assets/ui/original/inactive-overlay.png',box:'../assets/ui/original/box.jpg'};

const STR={
 en:{title:'MEMONIX',mode:'BUILDER',newGame:'New Game',options:'Options',instructions:'Instructions',scores:'Top Scores',credits:'Credits',back:'Back',
 size:'Board size',difficulty:'Difficulty',countdown:'Preview countdown',seconds:'seconds',on:'On',off:'Off',sound:'Sound',language:'Language',
 diff:['Very easy','Easy','Normal','Hard','Very hard'],start:'START',reset:'RESET',menu:'MENU',mist:'Show the errors',time:'Time',best:'Best',
 preview:'Memorize the building',rebuild:'Rebuild the same building',categories:['Windows','Walls','Doors','Roof'],empty:'EMPTY',remaining:'remaining',
 win1:'Congratulations!',win2:'You rebuilt the house!',newBtn:'New',menuBtn:'Menu',clearScores:'Clear scores',resetData:'Reset local data',yes:'Yes',no:'No',
 clearAsk:'Clear all Builder records?',resetAsk:'Reset settings and all scores?',scoresNote:'Best completion time in seconds. Lower is better.',
 help1:'Memorize the completed building during the preview.',help2:'When play begins, rebuild it exactly using the four component groups.',
 help3:'Select Windows, Walls, Doors or Roof. Use the arrows to choose a required component, then drag it onto the grid or select it and tap a cell.',
 help4:'Only the copies still required by the target remain available. Placed pieces can be dragged again; with a mouse, right-click removes a piece.',
 help5:'Very hard marks an incorrect placement for about half a second, then clears the entire reconstruction. Hard and Very hard remove mistake help.',
 credit1:'Original game: Memonix 1.6 — Builder mode',credit2:'Michael Kurinnoy / Viewizard Games (2003–2006)',
 credit3:'Original source code and recovered artwork: GNU GPL v3 option under Viewizard dual licensing.',credit4:'Faithful HTML5 restoration and preservation for Libre Arcade.',
 credit5:'The original Memonix title artwork and Builder preview are preserved. Standalone navigation, bilingual labels and sounds are documented adaptations.'},
 it:{title:'MEMONIX',mode:'BUILDER',newGame:'Nuova partita',options:'Opzioni',instructions:'Istruzioni',scores:'Record',credits:'Crediti',back:'Indietro',
 size:'Dimensione',difficulty:'Difficoltà',countdown:'Tempo di memorizzazione',seconds:'secondi',on:'Attivo',off:'Disattivo',sound:'Audio',language:'Lingua',
 diff:['Molto facile','Facile','Normale','Difficile','Molto difficile'],start:'INIZIA',reset:'RESET',menu:'MENU',mist:'Mostra gli errori',time:'Tempo',best:'Record',
 preview:'Memorizza la costruzione',rebuild:'Ricostruisci la stessa costruzione',categories:['Finestre','Muri','Porte','Tetto'],empty:'VUOTO',remaining:'rimasti',
 win1:'Complimenti!',win2:'Hai ricostruito la casa!',newBtn:'Nuova',menuBtn:'Menu',clearScores:'Azzera record',resetData:'Azzera dati locali',yes:'Sì',no:'No',
 clearAsk:'Azzerare tutti i record di Builder?',resetAsk:'Azzerare impostazioni e record?',scoresNote:'Miglior tempo in secondi. Più basso è meglio.',
 help1:'Memorizza la costruzione completa durante l’anteprima.',help2:'Quando inizia la partita, ricostruiscila esattamente usando i quattro gruppi di componenti.',
 help3:'Scegli Finestre, Muri, Porte o Tetto. Usa le frecce per selezionare un componente necessario, poi trascinalo sulla griglia oppure selezionalo e tocca una cella.',
 help4:'Restano disponibili solo le copie ancora necessarie. I pezzi posati possono essere trascinati di nuovo; con il mouse, click destro rimuove un pezzo.',
 help5:'A Molto difficile un pezzo errato viene segnalato per circa mezzo secondo, poi l’intera ricostruzione viene cancellata. Difficile e Molto difficile eliminano l’aiuto errori.',
 credit1:'Gioco originale: Memonix 1.6 — modalità Builder',credit2:'Michael Kurinnoy / Viewizard Games (2003–2006)',
 credit3:'Codice sorgente e grafica recuperata: opzione GNU GPL v3 nel dual licensing Viewizard.',credit4:'Restauro HTML5 fedele e preservazione per Libre Arcade.',
 credit5:'La grafica titolo originale Memonix e il preview Builder sono preservati. Navigazione standalone, etichette bilingui e suoni sono adattamenti documentati.'}
};

let settings=loadSettings(localStorage);
let screen='menu',returnScreen='menu';
let target=emptyBoard(),player=emptyBoard(),lastTemplate=0,currentTemplate=null;
let previewStarted=0,playStarted=0,finishSeconds=0,bestSeconds=null;
let category='windows',selectedAsset=null,categoryIndex=0;
// eslint-disable-next-line no-unused-vars -- tracked for pointer-state symmetry with onDown/onUp/pointercancel; not read elsewhere
let hover={x:-1,y:-1},dragging=null,pointerDown=false,mistHeld=false,suppressClick=false;
let penalty=null,penaltyUntil=0,seedCounter=(Date.now()^0x5a17c9e3)>>>0;
let audioCtx=null,confirmClear=false,confirmReset=false;

const images=new Map();
function imageFor(key){
 if(!key||typeof Image==='undefined')return null;
 if(images.has(key))return images.get(key);
 const meta=BUILDER_ASSETS[key]; if(!meta)return null;
 const img=new Image();img.decoding='async';img.src=new URL(`../${meta.path}`,import.meta.url).href;images.set(key,img);return img;
}
for(const k of Object.keys(BUILDER_ASSETS)) imageFor(k);
function imageReady(img){return !!(img&&img.complete&&img.naturalWidth>0);}

const uiImages=new Map();
function uiImage(key){
 if(!key||typeof Image==='undefined')return null;
 if(uiImages.has(key))return uiImages.get(key);
 const rel=UI_ASSETS[key];if(!rel)return null;
 const img=new Image();img.decoding='async';img.src=new URL(rel,import.meta.url).href;uiImages.set(key,img);return img;
}
for(const k of Object.keys(UI_ASSETS))uiImage(k);
function drawUI(key,dx,dy,dw,dh,sx=null,sy=null,sw=null,sh=null){
 const img=uiImage(key);if(!imageReady(img))return false;
 if(sx===null)ctx.drawImage(img,dx,dy,dw,dh);else ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh);
 return true;
}

function t(k){return STR[settings.lang][k];}
function syncLang(){document.documentElement.lang=settings.lang;}
function save(){syncLang();persistSettings(localStorage,settings);}
syncLang();
function nextSeed(){seedCounter=(seedCounter+0x9e3779b9)>>>0;return seedCounter;}
function hit(x,y,r){if(typeof x==='object'&&x){r=y;y=x.y;x=x.x;}return !!r&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;}
function rect(x,y,w,h){return{x,y,w,h};}
function rr(x,y,w,h,r=12){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function text(s,x,y,size=18,color='#17376f',align='left',weight='normal'){ctx.fillStyle=color;ctx.font=`${weight} ${size}px Arial`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);}

function tone(kind='click'){
 if(!settings.sound)return;
 try{audioCtx||=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=kind==='error'?'square':'sine';o.frequency.setValueAtTime(kind==='win'?523:kind==='error'?145:360,now);if(kind==='win')o.frequency.linearRampToValueAtTime(784,now+.28);g.gain.setValueAtTime(kind==='error'?.12:.09,now);g.gain.exponentialRampToValueAtTime(.001,now+(kind==='win'?.35:.15));o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(now+(kind==='win'?.36:.17));}catch{}
}

function goldButton(x,y,w,h,label,opts={}){
 const hot=opts.enabled!==false&&hit(hover.x,hover.y,{x,y,w,h});ctx.save();const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,hot?'#fff69a':'#fff178');g.addColorStop(.5,'#ffd42c');g.addColorStop(1,'#f1a006');rr(x,y,w,h,h/2);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=opts.enabled===false?'#9c8b6d':'#b86a00';ctx.lineWidth=3;ctx.stroke();rr(x+4,y+4,w-8,h-8,(h-8)/2);ctx.strokeStyle='#ffffffb5';ctx.lineWidth=2;ctx.stroke();if(label)text(label,x+w/2,y+h/2+1,opts.size||20,opts.color||'#183d9e','center','bold');ctx.restore();return hot;
}
function drawBackdrop(){const g=ctx.createLinearGradient(0,0,W,0);g.addColorStop(0,'#43206f');g.addColorStop(.5,'#5aa8ed');g.addColorStop(1,'#9fe7ff');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='#76ce6a';ctx.fillRect(0,565,W,35);for(let x=0;x<W;x+=7){ctx.strokeStyle='#3aa451';ctx.beginPath();ctx.moveTo(x,600);ctx.lineTo(x+(x%5)-2,575-(x%13));ctx.stroke();}}
function drawTitle(){text(t('title'),400,190,66,'#f5c33b','center','bold');ctx.strokeStyle='#825618';ctx.lineWidth=3;ctx.strokeText(t('title'),400,190);text(t('mode'),400,242,34,'#fff','center','bold');ctx.strokeStyle='#77378d';ctx.lineWidth=4;ctx.strokeText(t('mode'),400,242);}

function drawAsset(key,x,y,size=64,alpha=1){
 if(!key)return;const img=imageFor(key);ctx.save();ctx.globalAlpha=alpha;
 if(imageReady(img))ctx.drawImage(img,x,y,size,size);else{ctx.fillStyle='#fff';ctx.fillRect(x,y,size,size);ctx.strokeStyle='#333';ctx.strokeRect(x+.5,y+.5,size-1,size-1);text('…',x+size/2,y+size/2,22,'#777','center','bold');}ctx.restore();
}
function drawInactiveCell(x,y){if(!drawUI('inactive',x,y,CELL,CELL,0,0,64,64)){ctx.fillStyle='#aaa7df';ctx.fillRect(x,y,CELL,CELL);ctx.strokeStyle='#35406f';ctx.strokeRect(x+.5,y+.5,CELL-1,CELL-1);}}
function drawEmptyCell(x,y){drawAsset('0',x,y,CELL);}
function drawErrorMark(x,y){
 const shade=drawUI('errorShade',x,y,CELL,CELL,0,0,64,64);const cross=drawUI('errorX',x,y,CELL,CELL,0,0,64,64);
 if(!shade&&!cross){ctx.save();ctx.strokeStyle='#ff1c1c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(x+12,y+12);ctx.lineTo(x+52,y+52);ctx.moveTo(x+52,y+12);ctx.lineTo(x+12,y+52);ctx.stroke();ctx.restore();}
}
function drawGrid(source,preview=false){
 const mistakes=(settings.difficulty<=2&&screen==='play'&&(mistHeld||hit(hover.x,hover.y,rect(590,401,176,41))))?wrongCells(player,target):[];
 for(let x=0;x<8;x++)for(let y=0;y<8;y++){
  const px=GRID_X+x*CELL,py=GRID_Y+y*CELL;
  if(!preview&&target[x][y]===null)drawInactiveCell(px,py);
  const a=preview?target[x][y]:source[x][y];if(a)drawAsset(a,px,py,CELL);
 }
 for(const [x,y] of mistakes)drawErrorMark(GRID_X+x*CELL,GRID_Y+y*CELL);
 if(penalty){const[x,y]=penalty;drawErrorMark(GRID_X+x*CELL,GRID_Y+y*CELL);}
}

function currentAvailable(cat=category){return availableAssets(target,player,cat,dragging?.source==='palette'?dragging.asset:null);}
function ensureSelection(){
 let list=currentAvailable();
 if(!list.length){for(const c of CATEGORIES){const l=currentAvailable(c);if(l.length){category=c;list=l;break;}}}
 if(!list.length){selectedAsset=null;categoryIndex=0;return;}
 let idx=list.indexOf(selectedAsset);if(idx<0)idx=Math.min(categoryIndex,list.length-1);categoryIndex=Math.max(0,idx);selectedAsset=list[categoryIndex];
}
function selectCategory(c){category=c;categoryIndex=0;selectedAsset=null;ensureSelection();tone();}
function cycleAsset(delta){const list=currentAvailable();if(!list.length){selectedAsset=null;return;}let idx=list.indexOf(selectedAsset);if(idx<0)idx=0;idx=(idx+delta+list.length)%list.length;categoryIndex=idx;selectedAsset=list[idx];tone();}

function newTarget(){
 player=emptyBoard();dragging=null;penalty=null;confirmClear=false;confirmReset=false;
 const g=generateBuilder({size:settings.size,difficulty:settings.difficulty,previousTemplate:lastTemplate,random:createRng(nextSeed())});
 target=g.target;currentTemplate=g.templateIndex;lastTemplate=g.templateIndex;category='windows';selectedAsset=null;categoryIndex=0;ensureSelection();previewStarted=performance.now();screen='preview';
}
function startPlay(){player=emptyBoard();ensureSelection();playStarted=performance.now();screen='play';tone();}
function finish(){finishSeconds=secondsFromMs(performance.now()-playStarted);bestSeconds=readBest(localStorage,settings.difficulty,settings.size);if(bestSeconds===null||finishSeconds<bestSeconds){bestSeconds=finishSeconds;writeBest(localStorage,settings.difficulty,settings.size,finishSeconds);}screen='win';tone('win');}
function afterPlacement(x,y){
 if(settings.difficulty===4&&player[x][y]!==null&&player[x][y]!==target[x][y]){penalty=[x,y];penaltyUntil=performance.now()+500;tone('error');return;}
 if(isSolved(player,target))finish(); else ensureSelection();
}

const MENU_TILE_SETS=Object.freeze({
 instructions:['12_03/61','12_03/64','12_03/72','12_03/78'],
 options:['2_03/01','2_03/03','2_03/05','2_03/07'],
 credits:['3_03/32','4_03/33','1_03/13','4_04/45'],
});
function drawHistoricalMenuBackground(){
 const bg=uiImage('mainmenu');
 if(imageReady(bg))ctx.drawImage(bg,0,0,800,600,0,0,800,600);
 else{drawBackdrop();drawTitle();}
}
function drawMenuSlot(slot,kind){
 const {x,y,w,h,labelX,labelY,labelW,labelH}=slot;
 const hot=hit(hover.x,hover.y,rect(x,y,w,h))||hit(hover.x,hover.y,rect(labelX,labelY,labelW,labelH));
 ctx.save();ctx.fillStyle='#fff';ctx.fillRect(x,y,w,h);
 if(kind==='play'){
  const preview=uiImage('builderPreview');
  if(imageReady(preview))ctx.drawImage(preview,x,y,w,h);
  else{drawAsset('3_03/32',x,y,64);drawAsset('4_03/33',x+64,y,64);drawAsset('2_03/03',x,y+64,64);drawAsset('1_03/13',x+64,y+64,64);}
 }else{
  const tiles=MENU_TILE_SETS[kind];
  drawAsset(tiles[0],x,y,64);drawAsset(tiles[1],x+64,y,64);drawAsset(tiles[2],x,y+64,64);drawAsset(tiles[3],x+64,y+64,64);
 }
 if(hot){
  const frame=uiImage('menuFrame');
  if(imageReady(frame))ctx.drawImage(frame,x-6,y-6,140,140);
  else{ctx.strokeStyle='#ff1f1f';ctx.lineWidth=4;ctx.strokeRect(x-4,y-4,w+8,h+8);}
 }else{ctx.strokeStyle='rgba(55,45,55,.8)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);}
 ctx.restore();
 const label=kind==='play'?t('mode'):kind==='instructions'?t('instructions'):kind==='options'?t('options'):t('credits');
 goldButton(labelX,labelY,labelW,labelH,label,{size:kind==='instructions'&&settings.lang==='it'?15:17,color:kind==='play'?'#d91d24':kind==='instructions'?'#238e4d':kind==='options'?'#7b318d':'#b53749'});
}
function drawMenu(){
 drawHistoricalMenuBackground();
 const m=MENU_LAYOUT;
 drawMenuSlot(m.slots.play,'play');
 drawMenuSlot(m.slots.instructions,'instructions');
 drawMenuSlot(m.slots.options,'options');
 drawMenuSlot(m.slots.credits,'credits');
 goldButton(m.utilities.language.x,m.utilities.language.y,m.utilities.buttonW,m.utilities.buttonH,settings.lang==='en'?'EN → IT':'IT → EN',{size:17,color:'#65438f'});
 goldButton(m.utilities.audio.x,m.utilities.audio.y,m.utilities.buttonW,m.utilities.buttonH,`${t('sound')}: ${settings.sound?t('on'):t('off')}`,{size:16,color:'#24429d'});
 goldButton(m.utilities.scores.x,m.utilities.scores.y,m.utilities.buttonW,m.utilities.buttonH,t('scores'),{size:settings.lang==='it'?17:16,color:'#6b49a5'});
 goldButton(m.utilities.play.x,m.utilities.play.y,m.utilities.buttonW,m.utilities.buttonH,t('newGame'),{size:settings.lang==='it'?16:18,color:'#d93430'});
}
function historicalButton(x,y,w,h,label,opts={}){const original=opts.original!==false&&settings.lang==='en';if(!original)return goldButton(x,y,w,h,label,opts);const hot=hit(hover.x,hover.y,rect(x,y,w,h));if(hot){ctx.save();rr(x+2,y+2,w-4,h-4,h/2);ctx.strokeStyle='#fff9';ctx.lineWidth=3;ctx.stroke();ctx.restore();}return hot;}
function drawPreviewCountdown(sec){
 if(sec===null)return;
 const labelReady=drawUI('countdownLabel',586,35,181,81);const digits=String(Math.max(0,sec)%1000).padStart(3,'0').split('').map(Number);let digitsReady=true;
 for(let i=0;i<3;i++){const sx=[3,32,61][i],dx=[632,661,690][i];digitsReady=drawUI('startDigits',dx,112,29,34,sx,2+digits[i]*36,29,34)&&digitsReady;}
 if(!labelReady||!digitsReady)goldButton(590,34,176,50,`${sec} s`,{size:17,color:'#9c3424'});
}
function drawPreview(){const historical=drawUI('start',0,0,W,H,0,0,W,H);if(!historical){drawBackdrop();for(let x=0;x<8;x++)for(let y=0;y<8;y++)drawEmptyCell(GRID_X+x*CELL,GRID_Y+y*CELL);}drawGrid(target,true);const sec=settings.countdownOn?Math.max(0,settings.countdown-secondsFromMs(performance.now()-previewStarted)):null;drawPreviewCountdown(sec);historicalButton(590,344,176,41,t('start'),{color:'#169d42',original:historical});historicalButton(590,401,176,41,t('reset'),{original:historical});historicalButton(590,458,176,41,t('options'),{color:'#963d9d',original:historical});historicalButton(590,515,176,41,t('menu'),{color:'#c32828',original:historical});}
function categoryButton(c,i){const y=144+i*52;goldButton(714,y,64,43,'',{size:1});const list=CATEGORY_ASSETS[c];const key=currentAvailable(c)[0]||list[0];drawAsset(key,728,y+5,32);if(c===category){ctx.strokeStyle='#6d1b92';ctx.lineWidth=4;ctx.strokeRect(717,y+3,58,37);}}
function arrowButton(y,dir){goldButton(580,y,106,42,dir>0?'▼':'▲',{size:25,color:'#1b32d4'});}
function drawGameTime(secs){
 const v=Math.max(0,secs)%1000,d=[Math.floor(v/100),Math.floor(v/10)%10,v%10];let ok=true;
 for(let i=0;i<3;i++){const sx=[3,24,45][i]+69*d[i],dx=688+21*i;ok=drawUI('game',dx,50,21,28,sx,601,21,28)&&ok;}
 if(!ok)text(String(v).padStart(3,'0'),720,64,24,'#c82929','center','bold');
}
function drawBuilderSelector(){
 const historical=drawUI('gamePanel',578,144,202,202,163,2,202,202);
 if(!historical){CATEGORIES.forEach(categoryButton);arrowButton(144,-1);arrowButton(301,1);}else{
  const i=CATEGORIES.indexOf(category);if(i>=0)drawUI('game3',715,143+i*52,65,46,148,46+i*52,65,46);
  if(hit(hover.x,hover.y,rect(580,144,106,42))||hit(hover.x,hover.y,rect(580,301,106,42))){ctx.save();ctx.strokeStyle='#fff9';ctx.lineWidth=2;ctx.strokeRect(580,hit(hover.x,hover.y,rect(580,144,106,42))?144:301,106,42);ctx.restore();}
 }
 if(selectedAsset)drawAsset(selectedAsset,602,212,64);else text(t('empty'),634,244,16,'#55356d','center','bold');
}
function drawPlay(){
 const historical=drawUI('game',0,0,W,H,0,0,W,H);if(!historical){drawBackdrop();for(let x=0;x<8;x++)for(let y=0;y<8;y++){const px=GRID_X+x*CELL,py=GRID_Y+y*CELL;if(target[x][y]===null)drawInactiveCell(px,py);else drawEmptyCell(px,py);}}drawGrid(player,false);const secs=secondsFromMs(performance.now()-playStarted);drawGameTime(secs);drawBuilderSelector();
 if(settings.difficulty<=2)historicalButton(590,401,176,41,t('mist'),{size:16,color:'#189a43',original:historical});historicalButton(590,458,176,41,t('reset'),{original:historical});historicalButton(590,515,176,41,t('menu'),{color:'#c32828',original:historical});
 if(dragging)drawAsset(dragging.asset,hover.x-32,hover.y-32,64,.9);
}
function panel(title){drawBackdrop();ctx.fillStyle='rgba(255,255,255,.92)';rr(125,55,550,490,24);ctx.fill();ctx.strokeStyle='#8e54a4';ctx.lineWidth=4;ctx.stroke();text(title,400,93,32,'#66347e','center','bold');}
function drawOptions(){panel(t('options'));text(t('size'),190,155,19);[2,4,6,8].forEach((s,i)=>goldButton(350+i*78,132,64,42,String(s),{color:settings.size===s?'#7b2d98':'#23419e'}));text(t('difficulty'),190,220,19);for(let d=0;d<5;d++)goldButton(302+d*72,198,67,42,String(d+1),{color:settings.difficulty===d?'#7b2d98':'#23419e'});text(t('diff')[settings.difficulty],405,260,16,'#734686','center','bold');text(t('countdown'),190,318,19);goldButton(440,294,72,42,settings.countdownOn?t('on'):t('off'),{color:settings.countdownOn?'#158e45':'#a64040'});goldButton(527,294,62,42,'−');goldButton(597,294,62,42,'+');text(`${settings.countdown} ${t('seconds')}`,593,355,16,'#513a6c','center','bold');text(t('sound'),190,405,19);goldButton(355,382,92,42,settings.sound?t('on'):t('off'));text(t('language'),470,405,19);goldButton(575,382,70,42,settings.lang.toUpperCase());goldButton(180,468,200,44,t('resetData'),{size:16,color:'#a43a32'});goldButton(455,468,160,44,t('back'));
 if(confirmReset){ctx.fillStyle='#fff';rr(210,230,380,150,18);ctx.fill();ctx.strokeStyle='#a64a4a';ctx.stroke();text(t('resetAsk'),400,275,18,'#653b58','center','bold');goldButton(255,315,120,40,t('yes'),{color:'#a52d2d'});goldButton(425,315,120,40,t('no'));}}
function drawInstructions(){panel(t('instructions'));let y=145;for(const k of ['help1','help2','help3','help4','help5']){y=wrapText(t(k),175,y,450,18,21)+8;}goldButton(315,482,170,44,t('back'));}
function wrapText(s,x,y,maxWidth,size,lineHeight){ctx.font=`${size}px Arial`;ctx.fillStyle='#3d3561';ctx.textAlign='left';ctx.textBaseline='top';let line='',yy=y;for(const word of s.split(' ')){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,yy);line=word;yy+=lineHeight;}else line=test;}if(line)ctx.fillText(line,x,yy);return yy+lineHeight;}
function drawCredits(){panel(t('credits'));[t('credit1'),t('credit2'),t('credit3'),t('credit4'),t('credit5')].forEach((s,i)=>wrapText(s,175,140+i*62,450,17,22));ctx.fillStyle='#285ec3';ctx.fillRect(CREDIT_LINK.x,CREDIT_LINK.y+CREDIT_LINK.h-5,CREDIT_LINK.w,2);text('Libre Arcade ↗',400,CREDIT_LINK.y+16,19,'#285ec3','center','bold');goldButton(315,525,170,42,t('back'));}
function drawScores(){panel(t('scores'));text(t('scoresNote'),400,125,15,'#684f78','center');const sizes=[2,4,6,8];text('D',230,165,16,'#56356e','center','bold');sizes.forEach((s,i)=>text(`${s}×${s}`,315+i*88,165,16,'#56356e','center','bold'));for(let d=0;d<5;d++){text(String(d+1),230,205+d*48,16,'#56356e','center','bold');for(let i=0;i<4;i++){const b=readBest(localStorage,d,sizes[i]);text(b===null?'—':`${b}s`,315+i*88,205+d*48,16,'#23467d','center');}}goldButton(205,470,175,42,t('clearScores'),{size:16,color:'#a43a32'});goldButton(430,470,165,42,t('back'));if(confirmClear){ctx.fillStyle='#fff';rr(210,230,380,150,18);ctx.fill();ctx.strokeStyle='#a64a4a';ctx.stroke();text(t('clearAsk'),400,275,18,'#653b58','center','bold');goldButton(255,315,120,40,t('yes'),{color:'#a52d2d'});goldButton(425,315,120,40,t('no'));}}
function drawWin(){drawPlay();const historical=drawUI('box',200,200,400,200,0,0,400,200);if(!historical){ctx.fillStyle='rgba(25,12,45,.68)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#fff';rr(205,185,390,220,20);ctx.fill();ctx.strokeStyle='#a76a14';ctx.lineWidth=4;ctx.stroke();}text(t('win1'),400,240,28,'#7a3a8c','center','bold');text(t('win2'),400,278,18,'#3a4d84','center','bold');text(`${t('time')}: ${finishSeconds}s   ${t('best')}: ${bestSeconds}s`,400,316,16,'#6a506a','center','bold');if(historical){text(t('newBtn'),315,370,17,'#243b8f','center','bold');text(t('menuBtn'),484,370,17,'#243b8f','center','bold');}else{goldButton(245,350,130,42,t('newBtn'),{color:'#168d42'});goldButton(425,350,130,42,t('menu'),{color:'#b73232'});}}

function render(){
 if(penalty&&performance.now()>=penaltyUntil){player=emptyBoard();penalty=null;ensureSelection();}
 if(screen==='preview'&&settings.countdownOn&&secondsFromMs(performance.now()-previewStarted)>=settings.countdown)startPlay();
 ctx.clearRect(0,0,W,H);if(screen==='menu')drawMenu();else if(screen==='preview')drawPreview();else if(screen==='play')drawPlay();else if(screen==='win')drawWin();else if(screen==='options')drawOptions();else if(screen==='instructions')drawInstructions();else if(screen==='credits')drawCredits();else if(screen==='scores')drawScores();requestAnimationFrame(render);
}

function coords(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
function gridCell(p){if(p.x<GRID_X||p.y<GRID_Y||p.x>=GRID_X+512||p.y>=GRID_Y+512)return null;return{x:Math.floor((p.x-GRID_X)/64),y:Math.floor((p.y-GRID_Y)/64)};}
function onDown(p,e){pointerDown=true;hover=p;
 if(screen==='play'&&!penalty){
  if(settings.difficulty<=2&&hit(p,rect(590,401,176,41))){mistHeld=true;return;}
  for(let i=0;i<4;i++)if(hit(p,rect(716,144+i*52,60,41))){selectCategory(CATEGORIES[i]);return;}
  if(hit(p,rect(580,144,106,42))){cycleAsset(-1);return;}if(hit(p,rect(580,301,106,42))){cycleAsset(1);return;}
  if(hit(p,rect(602,212,64,64))&&selectedAsset&&remainingCount(target,player,selectedAsset)>0){dragging={asset:selectedAsset,source:'palette'};return;}
  const c=gridCell(p);if(c&&player[c.x][c.y]){dragging={asset:player[c.x][c.y],source:'grid',sourceX:c.x,sourceY:c.y};player[c.x][c.y]=null;ensureSelection();return;}
 }
 handleClick(p,e,true);
}
// eslint-disable-next-line no-unused-vars -- e kept for signature symmetry with onDown, which does use it
function onUp(p,e){pointerDown=false;mistHeld=false;hover=p;if(screen==='play'&&dragging&&!penalty){suppressClick=true;const c=gridCell(p);const d=dragging;dragging=null;if(c){player[c.x][c.y]=d.asset;afterPlacement(c.x,c.y);}else ensureSelection();return;} }

function handleClick(p,e,fromDown=false){
 if(screen==='menu'){
  const m=MENU_LAYOUT;
  const inside=s=>hit(p,rect(s.x,s.y,s.w,s.h))||hit(p,rect(s.labelX,s.labelY,s.labelW,s.labelH));
  if(inside(m.slots.play)){newTarget();tone();return;}
  if(inside(m.slots.instructions)){screen='instructions';tone();return;}
  if(inside(m.slots.options)){returnScreen='menu';screen='options';tone();return;}
  if(inside(m.slots.credits)){screen='credits';tone();return;}
  if(hit(p,rect(m.utilities.language.x,m.utilities.language.y,m.utilities.buttonW,m.utilities.buttonH))){settings.lang=settings.lang==='en'?'it':'en';save();tone();return;}
  if(hit(p,rect(m.utilities.audio.x,m.utilities.audio.y,m.utilities.buttonW,m.utilities.buttonH))){settings.sound=!settings.sound;save();tone();return;}
  if(hit(p,rect(m.utilities.scores.x,m.utilities.scores.y,m.utilities.buttonW,m.utilities.buttonH))){screen='scores';tone();return;}
  if(hit(p,rect(m.utilities.play.x,m.utilities.play.y,m.utilities.buttonW,m.utilities.buttonH))){newTarget();tone();return;}
 }
 if(screen==='preview'){
  if(hit(p,rect(590,344,176,41))){startPlay();return;}if(hit(p,rect(590,401,176,41))){newTarget();tone();return;}if(hit(p,rect(590,458,176,41))){returnScreen='preview';screen='options';tone();return;}if(hit(p,rect(590,515,176,41))){screen='menu';tone();return;}
 }
 if(screen==='play'&&!penalty){
  if(hit(p,rect(590,458,176,41))){newTarget();tone();return;}if(hit(p,rect(590,515,176,41))){screen='menu';tone();return;}
  if(!fromDown){const c=gridCell(p);if(c&&selectedAsset&&remainingCount(target,player,selectedAsset)>0){player[c.x][c.y]=selectedAsset;afterPlacement(c.x,c.y);return;}}
 }
 if(screen==='win'){if(hit(p,rect(257,355,116,30))){newTarget();tone();return;}if(hit(p,rect(426,355,116,30))){screen='menu';tone();return;}}
 if(screen==='options'){
  if(confirmReset){if(hit(p,rect(255,315,120,40))){settings=clearAllLocalData(localStorage);syncLang();confirmReset=false;tone();return;}if(hit(p,rect(425,315,120,40))){confirmReset=false;tone();return;}return;}
  [2,4,6,8].forEach((s,i)=>{if(hit(p,rect(350+i*78,132,64,42))){settings.size=s;save();tone();}});for(let d=0;d<5;d++)if(hit(p,rect(302+d*72,198,67,42))){settings.difficulty=d;save();tone();}
  if(hit(p,rect(440,294,72,42))){settings.countdownOn=!settings.countdownOn;save();tone();return;}if(hit(p,rect(527,294,62,42))){settings.countdown=settings.countdown<=1?99:settings.countdown-1;save();tone();return;}if(hit(p,rect(597,294,62,42))){settings.countdown=settings.countdown>=99?1:settings.countdown+1;save();tone();return;}if(hit(p,rect(355,382,92,42))){settings.sound=!settings.sound;save();tone();return;}if(hit(p,rect(575,382,70,42))){settings.lang=settings.lang==='en'?'it':'en';save();tone();return;}if(hit(p,rect(180,468,200,44))){confirmReset=true;tone();return;}if(hit(p,rect(455,468,160,44))){screen=returnScreen;tone();return;}
 }
 if(screen==='instructions'){if(hit(p,rect(315,482,170,44))){screen='menu';tone();return;}}
 if(screen==='credits'){if(hit(p,CREDIT_LINK)){window.open(LIBRE_ARCADE_URL,'_blank','noopener,noreferrer');return;}if(hit(p,rect(315,525,170,42))){screen='menu';tone();return;}}
 if(screen==='scores'){
  if(confirmClear){if(hit(p,rect(255,315,120,40))){clearScores(localStorage);confirmClear=false;tone();return;}if(hit(p,rect(425,315,120,40))){confirmClear=false;tone();return;}return;}
  if(hit(p,rect(205,470,175,42))){confirmClear=true;tone();return;}if(hit(p,rect(430,470,165,42))){screen='menu';tone();return;}
 }
}

canvas.addEventListener('pointermove',e=>{hover=coords(e);});
canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture?.(e.pointerId);onDown(coords(e),e);});
canvas.addEventListener('pointerup',e=>onUp(coords(e),e));
// eslint-disable-next-line no-unused-vars -- e kept for pointer-handler signature symmetry, same as onUp
canvas.addEventListener('pointercancel',e=>{pointerDown=false;mistHeld=false;if(dragging?.source==='grid'){ensureSelection();}dragging=null;});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(screen!=='play'||penalty)return;const p=coords(e),c=gridCell(p);if(c&&player[c.x][c.y]){player[c.x][c.y]=null;ensureSelection();tone();}});
canvas.addEventListener('click',e=>{if(suppressClick){suppressClick=false;return;}if(screen==='play')handleClick(coords(e),e,false);});

syncLang();
requestAnimationFrame(render);

export const __builderTest={getState:()=>({screen,target,player,currentTemplate,selectedAsset,category}),newTarget,startPlay,finish,handleClick};
