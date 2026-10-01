import { createRng, emptyBoard, generateMosaic, isSolved, wrongCells, secondsFromMs } from './model.js';
import { drawMosaicTile, MOSAIC_FAMILY_COLORS, MOSAIC_FAMILY_LIGHT } from './tile_visuals.js';
import { MENU_LAYOUT } from './menu_layout.js';

const MENU_ASSET_PATHS = Object.freeze({
  background: 'assets/ui/original/mainmenu.jpg',
  mosaicPreview: 'assets/ui/original/mosaic-preview.png',
  hoverFrame: 'assets/ui/original/mode-hover-frame.png',
});
const menuImages = new Map();
function menuImage(name){
  if(typeof Image==='undefined') return null;
  if(menuImages.has(name)) return menuImages.get(name);
  const img=new Image();
  img.decoding='async';
  img.src=new URL(`../${MENU_ASSET_PATHS[name]}`, import.meta.url).href;
  menuImages.set(name,img);
  return img;
}
for(const name of Object.keys(MENU_ASSET_PATHS)) menuImage(name);
import { clearAllLocalData, clearRecords as clearStoredRecords, loadSettings as loadStoredSettings, readBest as readStoredBest, saveSettings as saveStoredSettings, writeBest } from './storage.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const W = 800, H = 600;
const GRID_X = 44, GRID_Y = 44, CELL = 64;
const SIZES = [2,4,6,8];
const DIFFS = [0,1,2,3,4];
const LIBRE_ARCADE_URL = 'https://linkingtechnologies.github.io/libre-arcade/';
const CREDITS_LINK_RECT = Object.freeze({x:286,y:474,w:228,h:34});

// Historical: family order follows the original red/cyan/green/lilac/blue source comments.
const STR = {
  en: {
    newGame:'New Game', topScores:'Top Scores', options:'Options', instructions:'Instructions', credits:'Credits', back:'Back',
    title:'MEMONIX', mode:'MOSAIC', size:'Board size', difficulty:'Difficulty', countdown:'Preview countdown', seconds:'seconds', on:'On', off:'Off',
    diff:['Very easy','Easy','Normal','Hard','Very hard'], startNow:'START', reset:'RESET', menu:'MENU', optionsBtn:'OPTIONS',
    time:'Time', best:'Best', noRecord:'—', mistakes:'Show the errors', winner:'Congratulations!', win2:'You are our Winner!', newBtn:'New', menuBtn:'Menu',
    language:'Language', sound:'Sound', previewHint:'Memorize the mosaic', reconstructHint:'Reconstruct the mosaic',
    help1:'Memorize the arrangement shown during the preview.', help2:'When play begins, rebuild the same mosaic with the selector on the right.',
    help3:'Choose a colour family, move through its ten tiles with the arrows, then drag or click a tile onto the board.',
    help4:'Placed tiles can be moved or overwritten. With a mouse, right-click a cell to clear it.', help5:'Very easy is symmetric. Very easy/easy use one family. Hard removes mistake help. Very hard clears the whole reconstruction after a wrong placement.',
    credit1:'Original game: Memonix 1.6 — Mosaic mode', credit2:'Michael Kurinnoy / Viewizard Games (2003–2006)',
    credit3:'Original source code: GNU GPL v3 option under Viewizard dual licensing.', credit4:'HTML5 restoration and preservation for Libre Arcade.',
    credit5:'The 50 Mosaic tiles and the main title artwork are original Viewizard assets recovered from the GPLv3 source package. Mosaic tiles were losslessly converted to PNG.',
    credit6:'The standalone menu preserves the original 800×600 Memonix composition and mode-slot coordinates, adapted only to expose Mosaic, Instructions, Options and Credits. Labels, utility buttons and sounds are modern reconstruction/adaptation.',
    scoresNote:'Best completion time in seconds. Lower is better.', clearScores:'Clear scores', yes:'Yes', no:'No', clearAsk:'Clear all Mosaic records?', resetData:'Reset local data', resetAsk:'Reset settings and all scores?', resetNote:'Restores English, 4×4, Very easy, 30-second preview and sound on.'
  },
  it: {
    newGame:'Nuova partita', topScores:'Record', options:'Opzioni', instructions:'Istruzioni', credits:'Crediti', back:'Indietro',
    title:'MEMONIX', mode:'MOSAIC', size:'Dimensione', difficulty:'Difficoltà', countdown:'Tempo di memorizzazione', seconds:'secondi', on:'Attivo', off:'Disattivo',
    diff:['Molto facile','Facile','Normale','Difficile','Molto difficile'], startNow:'INIZIA', reset:'RESET', menu:'MENU', optionsBtn:'OPZIONI',
    time:'Tempo', best:'Record', noRecord:'—', mistakes:'Mostra gli errori', winner:'Complimenti!', win2:'Hai completato il mosaico!', newBtn:'Nuovo', menuBtn:'Menu',
    language:'Lingua', sound:'Audio', previewHint:'Memorizza il mosaico', reconstructHint:'Ricostruisci il mosaico',
    help1:'Memorizza la disposizione mostrata durante l’anteprima.', help2:'Quando inizia la partita, ricostruisci lo stesso mosaico con il selettore a destra.',
    help3:'Scegli una famiglia cromatica, scorri le dieci tessere con le frecce e trascina o clicca una tessera sulla griglia.',
    help4:'Le tessere già posate possono essere spostate o sostituite. Con il mouse, click destro su una cella per svuotarla.', help5:'Molto facile è simmetrico. Molto facile/facile usano una sola famiglia. Difficile elimina l’aiuto errori. Molto difficile azzera tutto dopo una tessera sbagliata.',
    credit1:'Gioco originale: Memonix 1.6 — modalità Mosaic', credit2:'Michael Kurinnoy / Viewizard Games (2003–2006)',
    credit3:'Codice sorgente originale: opzione GNU GPL v3 nel dual licensing Viewizard.', credit4:'Restauro e preservazione HTML5 per Libre Arcade.',
    credit5:'Le 50 tessere Mosaic e la grafica principale del menu sono asset Viewizard originali recuperati dal pacchetto sorgente GPLv3. Le tessere Mosaic sono convertite senza perdita in PNG.',
    credit6:'Il menu standalone conserva composizione 800×600 e coordinate delle finestre dell’originale Memonix, adattate solo per Mosaic, Istruzioni, Opzioni e Crediti. Etichette, pulsanti di servizio e suoni sono ricostruzioni/adattamenti moderni.',
    scoresNote:'Miglior tempo in secondi. Più basso è meglio.', clearScores:'Azzera record', yes:'Sì', no:'No', clearAsk:'Azzerare tutti i record di Mosaic?', resetData:'Azzera dati locali', resetAsk:'Azzerare impostazioni e tutti i record?', resetNote:'Ripristina inglese, 4×4, Molto facile, anteprima 30 secondi e audio attivo.'
  }
};

const settings = loadStoredSettings(localStorage);
syncDocumentLanguage();
let screen = 'menu';
let returnScreen = 'menu';
let target = emptyBoard();
let player = emptyBoard();
// eslint-disable-next-line no-unused-vars -- tracked for parity with generateMosaic's return shape; not read elsewhere
let maskIndex = null;
let familyCycle = 0;
let targetFamily = 0;
let selectedFamily = 0;
let selectedSymbol = 1;
let previewStarted = 0;
let playStarted = 0;
let finishSeconds = 0;
let bestSeconds = null;
let hover = {x:-1,y:-1};
let dragging = null;
let penalty = null;
let penaltyUntil = 0;
let audioCtx = null;
let seedCounter = (Date.now() ^ Math.floor(Math.random()*0xffffffff)) >>> 0;
let confirmClear = false;
let confirmReset = false;

function syncDocumentLanguage(){ if(document.documentElement) document.documentElement.lang=settings.lang; }
function saveSettings(){ syncDocumentLanguage(); saveStoredSettings(localStorage, settings); }
function t(k){ return STR[settings.lang][k]; }
function rr(x,y,w,h,r=10){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function hit(x,y,rx,ry,rw,rh){return x>=rx&&x<=rx+rw&&y>=ry&&y<=ry+rh;}
function small(text,x,y,align='left',font='16px Arial',fill='#18376f'){
  ctx.fillStyle=fill;ctx.font=font;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(text,x,y);
}

function tone(kind='click'){
  if(!settings.sound) return;
  try {
    audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended') audioCtx.resume();
    const now=audioCtx.currentTime;
    const osc=audioCtx.createOscillator(), gain=audioCtx.createGain();
    osc.type=kind==='error'?'square':'sine';
    osc.frequency.setValueAtTime(kind==='win'?523:kind==='error'?145:360,now);
    if(kind==='win') osc.frequency.linearRampToValueAtTime(784,now+.28);
    gain.gain.setValueAtTime(kind==='error'?.12:.09,now);
    gain.gain.exponentialRampToValueAtTime(.001,now+(kind==='win'?.34:.14));
    osc.connect(gain);gain.connect(audioCtx.destination);osc.start(now);osc.stop(now+(kind==='win'?.36:.16));
  } catch {}
}

function nextSeed(){ seedCounter=(seedCounter+0x9e3779b9)>>>0; return seedCounter; }
function newPattern(){
  player=emptyBoard(); penalty=null; penaltyUntil=0; confirmClear=false; confirmReset=false;
  if(settings.difficulty<2){ familyCycle=(familyCycle+1)%5; targetFamily=familyCycle; } else targetFamily=0;
  const g=generateMosaic({size:settings.size,difficulty:settings.difficulty,random:createRng(nextSeed()),family:targetFamily});
  target=g.target;maskIndex=g.maskIndex;selectedFamily=settings.difficulty<2?targetFamily:0;selectedSymbol=1;
  previewStarted=performance.now();screen='preview';
}
function startPlay(){ player=emptyBoard();playStarted=performance.now();screen='play';tone('click'); }
function readBest(d=settings.difficulty,s=settings.size){ return readStoredBest(localStorage,d,s); }
function finish(){
  finishSeconds=secondsFromMs(performance.now()-playStarted);bestSeconds=readBest();
  if(bestSeconds===null||finishSeconds<bestSeconds){ bestSeconds=finishSeconds;writeBest(localStorage,settings.difficulty,settings.size,finishSeconds); }
  screen='win';tone('win');
}
function clearRecords(){ clearStoredRecords(localStorage); confirmClear=false; tone('click'); }
function resetLocalData(){ tone('click'); Object.assign(settings, clearAllLocalData(localStorage)); syncDocumentLanguage(); confirmReset=false; confirmClear=false; returnScreen='menu'; familyCycle=0; }
function afterPlacement(x,y){
  if(settings.difficulty===4 && player[x][y]!==null && player[x][y]!==target[x][y]){
    penalty=[x,y];penaltyUntil=performance.now()+500;tone('error');return;
  }
  if(isSolved(player,target)) finish();
}

function drawBackdrop(){
  const g=ctx.createLinearGradient(0,0,W,0);g.addColorStop(0,'#623b92');g.addColorStop(.22,'#5d8cd9');g.addColorStop(.6,'#35b7eb');g.addColorStop(1,'#50c6ed');
  ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  // stars/moon at left, recalling the night-to-day sweep of the original art.
  ctx.save();ctx.globalAlpha=.9;ctx.fillStyle='#ffe76a';
  for(const [x,y,r] of [[22,30,4],[52,17,3],[15,82,2.5],[93,40,2.5]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
  ctx.beginPath();ctx.arc(24,58,19,0,Math.PI*2);ctx.fill();ctx.fillStyle='#5d559d';ctx.beginPath();ctx.arc(33,50,19,0,Math.PI*2);ctx.fill();ctx.restore();
  drawCloud(320,80,1.0);drawCloud(650,92,.75);
  // grass band, procedural and non-original.
  const gg=ctx.createLinearGradient(0,520,0,600);gg.addColorStop(0,'rgba(88,200,90,0)');gg.addColorStop(.35,'#65cb65');gg.addColorStop(1,'#1f9944');ctx.fillStyle=gg;ctx.fillRect(0,500,W,100);
  ctx.save();ctx.strokeStyle='rgba(29,135,57,.7)';ctx.lineWidth=1;
  for(let x=0;x<W;x+=7){const h=8+((x*17)%21);ctx.beginPath();ctx.moveTo(x,600);ctx.lineTo(x+((x%3)-1)*4,600-h);ctx.stroke();}
  ctx.restore();
}
function drawCloud(x,y,s){
  ctx.save();ctx.fillStyle='rgba(255,255,255,.82)';ctx.beginPath();ctx.ellipse(x,y,55*s,19*s,0,0,Math.PI*2);ctx.ellipse(x-37*s,y+4*s,33*s,15*s,0,0,Math.PI*2);ctx.ellipse(x+38*s,y+5*s,37*s,15*s,0,0,Math.PI*2);ctx.ellipse(x-8*s,y-14*s,31*s,23*s,0,0,Math.PI*2);ctx.fill();ctx.restore();
}
function drawRainbow(){
  const colors=['#7a3aa7','#2c63d8','#2dbd74','#f0da42','#ef813a','#e64257'];ctx.save();ctx.lineCap='round';
  for(let i=0;i<colors.length;i++){ctx.strokeStyle=colors[i];ctx.lineWidth=9;ctx.beginPath();ctx.arc(400,180,210-i*9,Math.PI*1.08,Math.PI*1.92);ctx.stroke();}ctx.restore();
}
function goldButton(x,y,w,h,label,opts={}){
  const enabled=opts.enabled!==false; const hot=enabled&&hit(hover.x,hover.y,x,y,w,h);
  ctx.save();
  const grad=ctx.createLinearGradient(0,y,0,y+h);grad.addColorStop(0,hot?'#fff68a':'#fff27b');grad.addColorStop(.48,'#ffd62f');grad.addColorStop(1,hot?'#ffb716':'#f7a70b');
  rr(x,y,w,h,h/2);ctx.fillStyle=grad;ctx.fill();ctx.strokeStyle=enabled?'#b96b00':'#9c8b6d';ctx.lineWidth=3;ctx.stroke();
  rr(x+4,y+4,w-8,h-8,(h-8)/2);ctx.strokeStyle='rgba(255,255,255,.72)';ctx.lineWidth=2;ctx.stroke();
  ctx.font=opts.font||`bold italic ${Math.min(22,h*.5)}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=enabled?(opts.textColor||'#173a9a'):'#8c806b';ctx.fillText(label,x+w/2,y+h/2+1);ctx.restore(); return hot;
}
function arrowButton(x,y,w,h,dir){
  goldButton(x,y,w,h,'',{font:'1px Arial'});ctx.save();ctx.fillStyle='#1239d4';ctx.strokeStyle='#081a79';ctx.lineWidth=2;ctx.beginPath();
  const cx=x+w/2,cy=y+h/2,r=13;if(dir==='up'){ctx.moveTo(cx,cy-r);ctx.lineTo(cx+r,cy+r*.65);ctx.lineTo(cx-r,cy+r*.65);}else{ctx.moveTo(cx,cy+r);ctx.lineTo(cx+r,cy-r*.65);ctx.lineTo(cx-r,cy-r*.65);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
function familyButton(f,x,y){
  goldButton(x,y,60,41,'',{font:'1px Arial'});ctx.save();ctx.beginPath();ctx.arc(x+30,y+20.5,13.5,0,Math.PI*2);const g=ctx.createRadialGradient(x+25,y+15,2,x+30,y+20,15);g.addColorStop(0,MOSAIC_FAMILY_LIGHT[f]);g.addColorStop(1,MOSAIC_FAMILY_COLORS[f]);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=selectedFamily===f?'#6f188f':'#987200';ctx.lineWidth=selectedFamily===f?4:2;ctx.stroke();ctx.restore();
}
function timePill(seconds,label=t('time')){
  const x=586,y=30,w=181,h=54;goldButton(x,y,w,h,'',{font:'1px Arial'});ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 18px Arial';ctx.fillStyle='#a93a20';ctx.fillText(`${label}:`,x+51,y+27);ctx.font='bold 26px monospace';ctx.fillStyle='#bf1f24';ctx.fillText(String(seconds).padStart(3,'0'),x+125,y+27);ctx.restore();
}

const drawTile = (tile,x,y,size=64,selected=false) => drawMosaicTile(ctx,tile,x,y,size,selected);
function drawInactiveCell(px,py){
  ctx.fillStyle='#aaa7e5';ctx.fillRect(px,py,CELL,CELL);ctx.strokeStyle='#333b78';ctx.lineWidth=1.2;ctx.strokeRect(px+.5,py+.5,CELL-1,CELL-1);
  ctx.fillStyle='rgba(61,58,132,.18)';for(let yy=py+4;yy<py+CELL;yy+=5)for(let xx=px+4;xx<px+CELL;xx+=5)ctx.fillRect(xx,yy,1,1);
}
function drawActiveCell(px,py){ctx.fillStyle='#fff';ctx.fillRect(px,py,CELL,CELL);ctx.strokeStyle='#343434';ctx.lineWidth=1.2;ctx.strokeRect(px+.5,py+.5,CELL-1,CELL-1);}
function drawGrid(source,preview=false){
  const showMistakes=screen==='play'&&settings.difficulty<=2&&hit(hover.x,hover.y,590,401,176,41);
  const wrong=showMistakes?wrongCells(player,target):[];
  for(let x=0;x<8;x++)for(let y=0;y<8;y++){
    const px=GRID_X+x*CELL,py=GRID_Y+y*CELL,active=target[x][y]!==null;
    active?drawActiveCell(px,py):drawInactiveCell(px,py);
    if(preview&&active)drawTile(target[x][y],px,py,CELL);
    if(!preview&&active&&source[x][y]!==null)drawTile(source[x][y],px,py,CELL);
  }
  for(const [x,y] of wrong){ctx.save();ctx.strokeStyle='#ff2020';ctx.lineWidth=5;ctx.strokeRect(GRID_X+x*CELL+5,GRID_Y+y*CELL+5,CELL-10,CELL-10);ctx.beginPath();ctx.moveTo(GRID_X+x*CELL+13,GRID_Y+y*CELL+13);ctx.lineTo(GRID_X+(x+1)*CELL-13,GRID_Y+(y+1)*CELL-13);ctx.moveTo(GRID_X+(x+1)*CELL-13,GRID_Y+y*CELL+13);ctx.lineTo(GRID_X+x*CELL+13,GRID_Y+(y+1)*CELL-13);ctx.stroke();ctx.restore();}
  if(penalty){const [x,y]=penalty;ctx.save();ctx.strokeStyle='#ff1717';ctx.lineWidth=7;ctx.strokeRect(GRID_X+x*CELL+5,GRID_Y+y*CELL+5,CELL-10,CELL-10);ctx.beginPath();ctx.moveTo(GRID_X+x*CELL+14,GRID_Y+y*CELL+14);ctx.lineTo(GRID_X+(x+1)*CELL-14,GRID_Y+(y+1)*CELL-14);ctx.moveTo(GRID_X+(x+1)*CELL-14,GRID_Y+y*CELL+14);ctx.lineTo(GRID_X+x*CELL+14,GRID_Y+(y+1)*CELL-14);ctx.stroke();ctx.restore();}
}
function drawGame(preview=false){
  drawBackdrop();drawGrid(preview?target:player,preview);
  if(preview){
    if(settings.countdownOn)timePill(Math.max(0,settings.countdown-secondsFromMs(performance.now()-previewStarted)));
    goldButton(590,344,176,41,t('startNow'),{textColor:'#173a9a'});
    goldButton(590,401,176,41,t('reset'),{textColor:'#24429d'});
    goldButton(590,458,176,41,t('optionsBtn'),{textColor:'#7b318d'});
    goldButton(590,515,176,41,t('menu'),{textColor:'#c9382c'});
    small(t('previewHint'),678,320,'center','bold 16px Arial','#59448f');
  } else {
    timePill(secondsFromMs(performance.now()-playStarted));
    for(let f=0;f<5;f++)familyButton(f,716,124+49*f);
    arrowButton(580,144,106,41,'up');arrowButton(580,301,106,41,'down');
    drawTile(selectedFamily*10+selectedSymbol,602,212,64,true);
    if(settings.difficulty<=2)goldButton(590,401,176,41,t('mistakes'),{textColor:'#149542',font:'bold 17px Arial'});
    goldButton(590,458,176,41,t('reset'),{textColor:'#24429d'});goldButton(590,515,176,41,t('menu'),{textColor:'#c9382c'});
    const best=readBest();small(`${t('best')}: ${best===null?t('noRecord'):best+' s'}`,678,381,'center','bold 14px Arial','#673e84');
  }
  if(dragging)drawTile(dragging.tile,hover.x-32,hover.y-32,64,true);
}

function imageReady(img){ return !!(img&&img.complete&&img.naturalWidth>0); }

function drawHistoricalMenuBackground(){
  const bg=menuImage('background');
  if(imageReady(bg)){
    // mainmenu.jpg is the untouched historical 800x685 sprite sheet.
    // Memonix rendered its upper 800x600 viewport as the title screen.
    // Keep that viewport intact, including the embedded historical copyright line.
    ctx.drawImage(bg,0,0,800,600,0,0,800,600);
  }else{
    drawBackdrop();drawRainbow();
  }
}

function drawMenuSlot(slot,kind){
  const {x,y,w,h,labelX,labelY,labelW,labelH}=slot;
  const hot=hit(hover.x,hover.y,x,y,w,h)||hit(hover.x,hover.y,labelX,labelY,labelW,labelH);
  ctx.save();
  ctx.fillStyle='#fff';ctx.fillRect(x,y,w,h);

  if(kind==='play'){
    const preview=menuImage('mosaicPreview');
    if(imageReady(preview)) ctx.drawImage(preview,x,y,w,h);
    else {
      drawTile(0,x,y,64);drawTile(1,x+64,y,64);
      drawTile(7,x,y+64,64);drawTile(6,x+64,y+64,64);
    }
  }else{
    const base=kind==='instructions'?10:kind==='options'?20:30;
    drawTile(base+0,x,y,64);drawTile(base+1,x+64,y,64);
    drawTile(base+7,x,y+64,64);drawTile(base+6,x+64,y+64,64);
  }

  if(hot){
    const frame=menuImage('hoverFrame');
    if(imageReady(frame)) ctx.drawImage(frame,x-6,y-6,140,140);
    else {ctx.strokeStyle='#ff1f1f';ctx.lineWidth=4;ctx.strokeRect(x-4,y-4,w+8,h+8);}
  }else{
    ctx.strokeStyle='rgba(55,45,55,.8)';ctx.lineWidth=1;ctx.strokeRect(x+.5,y+.5,w-1,h-1);
  }
  ctx.restore();

  const label =
    kind==='play' ? t('mode') :
    kind==='instructions' ? t('instructions') :
    kind==='options' ? t('options') : t('credits');
  goldButton(labelX,labelY,labelW,labelH,label,{
    font:`bold italic ${kind==='instructions'&&settings.lang==='it'?15:17}px Arial`,
    textColor:kind==='play'?'#d91d24':kind==='instructions'?'#238e4d':kind==='options'?'#7b318d':'#b53749'
  });
}

function drawMenu(){
  drawHistoricalMenuBackground();
  const m=MENU_LAYOUT;

  drawMenuSlot(m.slots.instructions,'instructions');
  drawMenuSlot(m.slots.options,'options');
  drawMenuSlot(m.slots.play,'play');
  drawMenuSlot(m.slots.credits,'credits');

  // Cover/adapt the four historical lower navigation buttons in-place.
  goldButton(m.utilities.language.x,m.utilities.language.y,m.utilities.buttonW,m.utilities.buttonH,
    settings.lang==='en'?'EN → IT':'IT → EN',{font:'bold 17px Arial',textColor:'#65438f'});
  goldButton(m.utilities.audio.x,m.utilities.audio.y,m.utilities.buttonW,m.utilities.buttonH,
    `${t('sound')}: ${settings.sound?t('on'):t('off')}`,{font:'bold 16px Arial',textColor:'#24429d'});
  goldButton(m.utilities.scores.x,m.utilities.scores.y,m.utilities.buttonW,m.utilities.buttonH,
    t('topScores'),{font:`bold italic ${settings.lang==='it'?17:16}px Arial`,textColor:'#6b49a5'});
  goldButton(m.utilities.play.x,m.utilities.play.y,m.utilities.buttonW,m.utilities.buttonH,
    t('newGame'),{font:`bold italic ${settings.lang==='it'?16:18}px Arial`,textColor:'#d93430'});
}
function parchment(x,y,w,h){ctx.save();const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,'rgba(255,251,219,.97)');g.addColorStop(1,'rgba(255,224,130,.97)');rr(x,y,w,h,18);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='#b77719';ctx.lineWidth=3;ctx.stroke();ctx.restore();}
function heading(text,y=64){ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold italic 36px Arial';ctx.lineWidth=4;ctx.strokeStyle='#fff4b9';ctx.fillStyle='#593587';ctx.strokeText(text,400,y);ctx.fillText(text,400,y);ctx.restore();}
function optionChoice(x,y,w,h,label,active){goldButton(x,y,w,h,label,{textColor:active?'#fff':'#23469c',font:'bold 17px Arial'});if(active){ctx.save();rr(x+6,y+6,w-12,h-12,(h-12)/2);ctx.fillStyle='rgba(91,57,151,.58)';ctx.fill();ctx.font='bold 17px Arial';ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x+w/2,y+h/2);ctx.restore();}}
function drawOptions(){
  drawBackdrop();heading(t('options'));parchment(92,92,616,432);
  small(t('size'),142,145,'left','bold 18px Arial','#6a3d78');SIZES.forEach((s,i)=>optionChoice(300+i*86,122,72,42,`${s}×${s}`,settings.size===s));
  small(t('difficulty'),142,218,'left','bold 18px Arial','#6a3d78');DIFFS.forEach((d,i)=>optionChoice(275+i*84,195,76,42,`D${d}`,settings.difficulty===d));small(t('diff')[settings.difficulty],500,253,'center','italic 16px Arial','#743f74');
  small(t('countdown'),142,316,'left','bold 15px Arial','#6a3d78');optionChoice(345,293,80,42,t('on'),settings.countdownOn);optionChoice(434,293,80,42,t('off'),!settings.countdownOn);goldButton(534,293,42,42,'−',{font:'bold 24px Arial'});parchment(583,293,54,42);small(String(settings.countdown),610,314,'center','bold 19px Arial','#5f3480');goldButton(644,293,42,42,'+',{font:'bold 24px Arial'});small(t('seconds'),610,356,'center','14px Arial','#6a3d78');
  small(t('language'),142,415,'left','bold 18px Arial','#6a3d78');optionChoice(300,392,80,42,'EN',settings.lang==='en');optionChoice(389,392,80,42,'IT',settings.lang==='it');
  small(t('sound'),500,415,'left','bold 18px Arial','#6a3d78');optionChoice(582,392,60,42,settings.sound?'🔊':'🔇',settings.sound);
  goldButton(300,462,200,42,t('resetData'),{textColor:'#b53749',font:'bold 16px Arial'});
  goldButton(300,540,200,42,t('back'),{textColor:'#b53749'});
  if(confirmReset)drawConfirmReset();
}
function wrapText(text,x,y,maxWidth,lineHeight){const words=text.split(' ');let line='';for(const word of words){const test=line+word+' ';if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,y);line=word+' ';y+=lineHeight;}else line=test;}ctx.fillText(line,x,y);return y+lineHeight;}
function drawTextScreen(kind){
  drawBackdrop();heading(t(kind));parchment(70,92,660,420);
  const lines=kind==='instructions'?[t('help1'),t('help2'),t('help3'),t('help4'),t('help5')]:[t('credit1'),t('credit2'),t('credit3'),t('credit4'),t('credit5'),t('credit6')];
  ctx.fillStyle='#47325d';ctx.font='17px Arial';ctx.textAlign='left';ctx.textBaseline='top';let y=126;for(const line of lines)y=wrapText(line,108,y,585,25)+13;
  if(kind==='credits'){
    const r=CREDITS_LINK_RECT;
    const hot=hit(hover.x,hover.y,r.x,r.y,r.w,r.h);
    ctx.save();
    ctx.font='bold 17px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=hot?'#1a68c8':'#2458a6';ctx.fillText('Libre Arcade ↗',r.x+r.w/2,r.y+r.h/2-1);
    const tw=ctx.measureText('Libre Arcade ↗').width;
    ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(400-tw/2,r.y+r.h/2+11);ctx.lineTo(400+tw/2,r.y+r.h/2+11);ctx.stroke();
    ctx.restore();
  }
  goldButton(300,540,200,42,t('back'),{textColor:'#b53749'});
}
function drawScores(){
  drawBackdrop();heading(t('topScores'));parchment(74,92,652,420);small(t('scoresNote'),400,121,'center','italic 15px Arial','#6a3d78');
  const x0=230,y0=156,cw=102,rh=53;
  SIZES.forEach((s,i)=>small(`${s}×${s}`,x0+i*cw+cw/2,y0,'center','bold 17px Arial','#4f3280'));
  DIFFS.forEach((d,r)=>{small(`D${d}`,145,y0+37+r*rh,'center','bold 16px Arial','#4f3280');small(t('diff')[d],190,y0+37+r*rh,'right','13px Arial','#684775');for(let c=0;c<SIZES.length;c++){const v=readBest(d,SIZES[c]);const x=x0+c*cw,y=y0+15+r*rh;ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(x+7,y+4,cw-14,34);ctx.strokeStyle='rgba(142,95,31,.5)';ctx.strokeRect(x+7.5,y+4.5,cw-15,33);small(v===null?'—':`${v} s`,x+cw/2,y+21,'center','bold 16px monospace','#713b62');}});
  goldButton(116,540,190,42,t('clearScores'),{textColor:'#b53749'});goldButton(494,540,190,42,t('back'),{textColor:'#24429d'});
  if(confirmClear)drawConfirmClear();
}
function drawConfirmClear(){ctx.fillStyle='rgba(38,18,61,.42)';ctx.fillRect(0,0,W,H);parchment(200,202,400,190);small(t('clearAsk'),400,255,'center','bold 20px Arial','#6a345e');goldButton(245,315,125,44,t('yes'),{textColor:'#b53749'});goldButton(430,315,125,44,t('no'),{textColor:'#24429d'});}
function drawConfirmReset(){ctx.fillStyle='rgba(38,18,61,.48)';ctx.fillRect(0,0,W,H);parchment(175,185,450,230);small(t('resetAsk'),400,238,'center','bold 20px Arial','#6a345e');ctx.font='15px Arial';ctx.fillStyle='#684775';ctx.textAlign='center';ctx.textBaseline='top';wrapText(t('resetNote'),400,270,360,21);goldButton(245,338,125,44,t('yes'),{textColor:'#b53749'});goldButton(430,338,125,44,t('no'),{textColor:'#24429d'});}
function drawWin(){
  drawGame(false);ctx.fillStyle='rgba(50,27,75,.38)';ctx.fillRect(0,0,W,H);parchment(200,190,400,220);small(t('winner'),400,238,'center','bold 27px Arial','#7c3a8f');small(t('win2'),400,278,'center','18px Arial','#55326e');small(`${t('time')}: ${finishSeconds} s`,400,320,'center','bold 19px Arial','#3a4d86');small(`${t('best')}: ${bestSeconds} s`,400,350,'center','bold 18px Arial','#3a4d86');goldButton(235,375,140,42,t('newBtn'),{textColor:'#238e4d'});goldButton(425,375,140,42,t('menuBtn'),{textColor:'#b53749'});
}
function render(now){
  if(screen==='preview'&&settings.countdownOn&&secondsFromMs(now-previewStarted)>=settings.countdown)startPlay();
  if(screen==='play'&&penalty&&now>=penaltyUntil){player=emptyBoard();penalty=null;penaltyUntil=0;}
  if(screen==='menu')drawMenu();else if(screen==='options')drawOptions();else if(screen==='instructions'||screen==='credits')drawTextScreen(screen);else if(screen==='scores')drawScores();else if(screen==='preview')drawGame(true);else if(screen==='play')drawGame(false);else if(screen==='win')drawWin();
  requestAnimationFrame(render);
}

function pointerPos(e){const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*W/r.width,y:(e.clientY-r.top)*H/r.height};}
function cellAt(x,y){if(!hit(x,y,GRID_X,GRID_Y,512,512))return null;return{x:Math.floor((x-GRID_X)/CELL),y:Math.floor((y-GRID_Y)/CELL)};}
canvas.addEventListener('pointermove',e=>{hover=pointerPos(e);canvas.style.cursor=(screen==='credits'&&hit(hover.x,hover.y,CREDITS_LINK_RECT.x,CREDITS_LINK_RECT.y,CREDITS_LINK_RECT.w,CREDITS_LINK_RECT.h))?'pointer':'default';if(dragging)e.preventDefault();});
canvas.addEventListener('pointerleave',()=>{hover={x:-1,y:-1};});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();if(screen!=='play'||penalty)return;const p=pointerPos(e),c=cellAt(p.x,p.y);if(c&&target[c.x][c.y]!==null){player[c.x][c.y]=null;tone('click');}});
canvas.addEventListener('pointerdown',e=>{
  const p=pointerPos(e);hover=p;if(e.button!==0)return;
  if(screen==='play'&&!penalty){
    if(hit(p.x,p.y,602,212,64,64)){dragging={tile:selectedFamily*10+selectedSymbol,from:null,start:p};canvas.setPointerCapture(e.pointerId);return;}
    const c=cellAt(p.x,p.y);if(c&&target[c.x][c.y]!==null&&player[c.x][c.y]!==null){dragging={tile:player[c.x][c.y],from:c,start:p};player[c.x][c.y]=null;canvas.setPointerCapture(e.pointerId);return;}
  }
});
canvas.addEventListener('pointerup',e=>{
  const p=pointerPos(e);hover=p;
  if(dragging&&screen==='play'){
    const c=cellAt(p.x,p.y),moved=Math.hypot(p.x-dragging.start.x,p.y-dragging.start.y)>6;
    if(c&&target[c.x][c.y]!==null){player[c.x][c.y]=dragging.tile;afterPlacement(c.x,c.y);tone('click');}else if(dragging.from)player[dragging.from.x][dragging.from.y]=dragging.tile;
    dragging=null;try{canvas.releasePointerCapture(e.pointerId);}catch{}if(moved)return;
  }
  handleClick(p.x,p.y);
});

function handleClick(x,y){
  if(screen==='menu'){
    const m=MENU_LAYOUT;
    const inside=s=>hit(x,y,s.x,s.y,s.w,s.h)||hit(x,y,s.labelX,s.labelY,s.labelW,s.labelH);
    if(inside(m.slots.play)){tone('click');newPattern();}
    else if(inside(m.slots.instructions)){tone('click');screen='instructions';}
    else if(inside(m.slots.options)){tone('click');returnScreen='menu';screen='options';}
    else if(inside(m.slots.credits)){tone('click');screen='credits';}
    else if(hit(x,y,m.utilities.language.x,m.utilities.language.y,m.utilities.buttonW,m.utilities.buttonH)){settings.lang=settings.lang==='en'?'it':'en';saveSettings();tone('click');}
    else if(hit(x,y,m.utilities.audio.x,m.utilities.audio.y,m.utilities.buttonW,m.utilities.buttonH)){settings.sound=!settings.sound;saveSettings();tone('click');}
    else if(hit(x,y,m.utilities.scores.x,m.utilities.scores.y,m.utilities.buttonW,m.utilities.buttonH)){tone('click');screen='scores';}
    else if(hit(x,y,m.utilities.play.x,m.utilities.play.y,m.utilities.buttonW,m.utilities.buttonH)){tone('click');newPattern();}
  } else if(screen==='options'){
    if(confirmReset){if(hit(x,y,245,338,125,44))resetLocalData();else if(hit(x,y,430,338,125,44)){confirmReset=false;tone('click');}return;}
    SIZES.forEach((s,i)=>{if(hit(x,y,300+i*86,122,72,42)){settings.size=s;tone('click');}});
    DIFFS.forEach((d,i)=>{if(hit(x,y,275+i*84,195,76,42)){settings.difficulty=d;tone('click');}});
    if(hit(x,y,345,293,80,42)){settings.countdownOn=true;tone('click');} if(hit(x,y,434,293,80,42)){settings.countdownOn=false;tone('click');}
    if(hit(x,y,534,293,42,42)){settings.countdown--;if(settings.countdown<1)settings.countdown=99;tone('click');}
    if(hit(x,y,644,293,42,42)){settings.countdown++;if(settings.countdown>99)settings.countdown=1;tone('click');}
    if(hit(x,y,300,392,80,42)){settings.lang='en';tone('click');} if(hit(x,y,389,392,80,42)){settings.lang='it';tone('click');}
    if(hit(x,y,582,392,60,42)){settings.sound=!settings.sound;tone('click');}
    if(hit(x,y,300,462,200,42)){confirmReset=true;tone('click');return;}
    if(hit(x,y,300,540,200,42)){saveSettings();tone('click');if(returnScreen==='preview')newPattern();else screen='menu';}
    saveSettings();
  } else if(screen==='instructions'||screen==='credits'){
    if(screen==='credits'&&hit(x,y,CREDITS_LINK_RECT.x,CREDITS_LINK_RECT.y,CREDITS_LINK_RECT.w,CREDITS_LINK_RECT.h)){
      tone('click');
      if(typeof window.open==='function') window.open(LIBRE_ARCADE_URL,'_blank','noopener,noreferrer');
      return;
    }
    if(hit(x,y,300,540,200,42)){tone('click');screen='menu';}
  } else if(screen==='scores'){
    if(confirmClear){if(hit(x,y,245,315,125,44))clearRecords();else if(hit(x,y,430,315,125,44)){confirmClear=false;tone('click');}return;}
    if(hit(x,y,116,540,190,42)){confirmClear=true;tone('click');}else if(hit(x,y,494,540,190,42)){tone('click');screen='menu';}
  } else if(screen==='preview'){
    if(hit(x,y,590,344,176,41))startPlay();
    else if(hit(x,y,590,401,176,41)){tone('click');newPattern();}
    else if(hit(x,y,590,458,176,41)){tone('click');returnScreen='preview';screen='options';}
    else if(hit(x,y,590,515,176,41)){tone('click');screen='menu';}
  } else if(screen==='play'&&!penalty){
    for(let f=0;f<5;f++)if(hit(x,y,716,124+49*f,60,41)){selectedFamily=f;tone('click');return;}
    if(hit(x,y,580,144,106,41)){selectedSymbol=(selectedSymbol+9)%10;tone('click');return;}
    if(hit(x,y,580,301,106,41)){selectedSymbol=(selectedSymbol+1)%10;tone('click');return;}
    if(hit(x,y,590,458,176,41)){tone('click');newPattern();return;}
    if(hit(x,y,590,515,176,41)){tone('click');screen='menu';return;}
    const c=cellAt(x,y);if(c&&target[c.x][c.y]!==null&&player[c.x][c.y]===null){player[c.x][c.y]=selectedFamily*10+selectedSymbol;afterPlacement(c.x,c.y);tone('click');}
  } else if(screen==='win'){
    if(hit(x,y,235,375,140,42)){tone('click');newPattern();}else if(hit(x,y,425,375,140,42)){tone('click');screen='menu';}
  }
}

requestAnimationFrame(render);
