import { PAIR_ASSETS } from './assets.js';
import { createRng, generatePair, clickCard, resolvePending, isSolved, secondsFromMs } from './model.js';
// eslint-disable-next-line no-unused-vars -- DEFAULT_SETTINGS kept imported alongside the rest of storage.js's exports; not read in this file
import { loadSettings, saveSettings as persistSettings, readBest, writeBest, clearScores, clearAllLocalData, DEFAULT_SETTINGS } from './storage.js';
import { MENU_LAYOUT } from './menu_layout.js';

const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const W=800,H=600,GRID_X=44,GRID_Y=44,CELL=64;
const LIBRE_ARCADE_URL='https://linkingtechnologies.github.io/libre-arcade/';
const CREDIT_LINK={x:270,y:489,w:260,h:32};
const UI_ASSETS={mainmenu:'../assets/ui/original/mainmenu.jpg',pairPreview:'../assets/ui/original/pair-preview.png',menuFrame:'../assets/ui/original/mode-hover-frame.png',start:'../assets/ui/original/start.jpg',startDigits:'../assets/ui/original/start2.jpg',countdownLabel:'../assets/ui/original/start3.jpg',game:'../assets/ui/original/game.jpg',gamePanel:'../assets/ui/original/game2.png',box:'../assets/ui/original/box.jpg',blank:'../assets/ui/original/blank-cell.png'};

const STR={
 en:{title:'MEMONIX',mode:'PAIR',newGame:'New Game',options:'Options',instructions:'Instructions',scores:'Top Scores',credits:'Credits',back:'Back',
 size:'Board size',difficulty:'Difficulty',countdown:'Preview countdown',seconds:'seconds',on:'On',off:'Off',sound:'Sound',language:'Language',
 diff:['Easy','Normal','Hard'],start:'START',reset:'RESET',menu:'MENU',time:'Time',best:'Best',preview:'Memorize the cards',play:'Find all matching pairs',
 win1:'Congratulations!',win2:'You found all the pairs!',newBtn:'New',menuBtn:'Menu',clearScores:'Clear scores',resetData:'Reset local data',yes:'Yes',no:'No',
 clearAsk:'Clear all Pair records?',resetAsk:'Reset settings and all scores?',scoresNote:'Best completion time in seconds. Lower is better.',
 help1:'Memorize the face-up cards during the preview.',help2:'When play begins, select two cards. Matching cards disappear after about half a second.',
 help3:'Easy uses four copies of each symbol on boards larger than 2×2. Normal uses ordinary pairs.',
 help4:'Hard is the historical challenge mode: one mismatch restores the entire original board, including pairs already completed.',
 help5:'The timer starts only when the preview ends or you press Start. There is no move counter in the original game.',
 credit1:'Original game: Memonix 1.6 — Pair mode',credit2:'Michael Kurinnoy / Viewizard Games (2003–2006)',
 credit3:'Original source code and recovered artwork: GNU GPL v3 option under Viewizard dual licensing.',credit4:'Faithful HTML5 restoration and preservation for Libre Arcade.',
 credit5:'The standalone title screen preserves the original Memonix artwork and Pair preview in its historical slot. Standalone navigation, bilingual labels and replacement sounds are documented adaptations.'},
 it:{title:'MEMONIX',mode:'PAIR',newGame:'Nuova partita',options:'Opzioni',instructions:'Istruzioni',scores:'Record',credits:'Crediti',back:'Indietro',
 size:'Dimensione',difficulty:'Difficoltà',countdown:'Tempo di memorizzazione',seconds:'secondi',on:'Attivo',off:'Disattivo',sound:'Audio',language:'Lingua',
 diff:['Facile','Normale','Difficile'],start:'INIZIA',reset:'RESET',menu:'MENU',time:'Tempo',best:'Record',preview:'Memorizza le carte',play:'Trova tutte le coppie',
 win1:'Complimenti!',win2:'Hai trovato tutte le coppie!',newBtn:'Nuova',menuBtn:'Menu',clearScores:'Azzera record',resetData:'Azzera dati locali',yes:'Sì',no:'No',
 clearAsk:'Azzerare tutti i record di Pair?',resetAsk:'Azzerare impostazioni e record?',scoresNote:'Miglior tempo in secondi. Più basso è meglio.',
 help1:'Memorizza le carte scoperte durante l’anteprima.',help2:'Quando inizia la partita, scegli due carte. Le coppie corrette scompaiono dopo circa mezzo secondo.',
 help3:'Facile usa quattro copie di ogni simbolo nelle griglie superiori a 2×2. Normale usa coppie ordinarie.',
 help4:'Difficile conserva la regola storica: un solo errore ripristina l’intero tabellone originale, comprese le coppie già completate.',
 help5:'Il timer parte solo alla fine dell’anteprima o premendo Inizia. Nell’originale non esiste un contatore delle mosse.',
 credit1:'Gioco originale: Memonix 1.6 — modalità Pair',credit2:'Michael Kurinnoy / Viewizard Games (2003–2006)',
 credit3:'Codice sorgente e grafica recuperata: opzione GNU GPL v3 nel dual licensing Viewizard.',credit4:'Restauro HTML5 fedele e preservazione per Libre Arcade.',
 credit5:'La schermata titolo standalone conserva la grafica originale Memonix e il preview Pair nella sua posizione storica. Navigazione standalone, etichette bilingui e suoni sostitutivi sono adattamenti documentati.'}
};

let settings=loadSettings(localStorage);
let screen='menu',returnScreen='menu';
let game=null,previewStarted=0,playStarted=0,finishSeconds=0,bestSeconds=null;
let hover={x:-1,y:-1},seedCounter=(Date.now()^0x50414952)>>>0;
let audioCtx=null,confirmClear=false,confirmReset=false;

const images=new Map();
function imageFor(key){
 if(!key||typeof Image==='undefined')return null;
 if(images.has(key))return images.get(key);
 const meta=PAIR_ASSETS[key];if(!meta)return null;
 const img=new Image();img.decoding='async';img.src=new URL(`../${meta.path}`,import.meta.url).href;images.set(key,img);return img;
}
for(const k of Object.keys(PAIR_ASSETS))imageFor(k);
function imageReady(img){return !!(img&&img.complete&&img.naturalWidth>0);}
const uiImages=new Map();
function uiImage(key){if(!key||typeof Image==='undefined')return null;if(uiImages.has(key))return uiImages.get(key);const rel=UI_ASSETS[key];if(!rel)return null;const img=new Image();img.decoding='async';img.src=new URL(rel,import.meta.url).href;uiImages.set(key,img);return img;}
for(const k of Object.keys(UI_ASSETS))uiImage(k);
function drawUI(key,dx,dy,dw,dh,sx=null,sy=null,sw=null,sh=null){const img=uiImage(key);if(!imageReady(img))return false;if(sx===null)ctx.drawImage(img,dx,dy,dw,dh);else ctx.drawImage(img,sx,sy,sw,sh,dx,dy,dw,dh);return true;}
function t(k){return STR[settings.lang][k];}
function syncLang(){document.documentElement.lang=settings.lang;}
function save(){syncLang();persistSettings(localStorage,settings);}
syncLang();
function nextSeed(){seedCounter=(seedCounter+0x9e3779b9)>>>0;return seedCounter;}
function rect(x,y,w,h){return{x,y,w,h};}
function hit(a,b,c){let x,y,r;if(typeof a==='object'){x=a.x;y=a.y;r=b;}else{x=a;y=b;r=c;}return !!r&&x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;}
function rr(x,y,w,h,r=12){ctx.beginPath();ctx.roundRect(x,y,w,h,r);}
function text(s,x,y,size=18,color='#17376f',align='left',weight='normal'){ctx.fillStyle=color;ctx.font=`${weight} ${size}px Arial`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(s,x,y);}
function wrap(s,x,y,maxWidth,lineHeight,size=18,color='#17376f'){const words=s.split(/\s+/);let line='';for(const w of words){const test=line?line+' '+w:w;if(ctx.measureText(test).width>maxWidth&&line){text(line,x,y,size,color);y+=lineHeight;line=w;}else line=test;}if(line)text(line,x,y,size,color);return y;}

function tone(kind='click'){
 if(!settings.sound)return;
 try{audioCtx||=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume();const now=audioCtx.currentTime,o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=kind==='error'?'square':'sine';o.frequency.setValueAtTime(kind==='win'?523:kind==='error'?145:360,now);if(kind==='win')o.frequency.linearRampToValueAtTime(784,now+.28);g.gain.setValueAtTime(kind==='error'?.12:.09,now);g.gain.exponentialRampToValueAtTime(.001,now+(kind==='win'?.35:.15));o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(now+(kind==='win'?.36:.17));}catch{}
}
function goldButton(x,y,w,h,label,opts={}){const hot=opts.enabled!==false&&hit(hover,{x,y,w,h});ctx.save();const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,hot?'#fff8a8':'#fff17a');g.addColorStop(.52,'#ffd22b');g.addColorStop(1,'#ed9703');rr(x,y,w,h,h/2);ctx.fillStyle=g;ctx.fill();ctx.strokeStyle=opts.enabled===false?'#9c8b6d':'#b86a00';ctx.lineWidth=3;ctx.stroke();rr(x+4,y+4,w-8,h-8,(h-8)/2);ctx.strokeStyle='#ffffffb5';ctx.lineWidth=2;ctx.stroke();text(label,x+w/2,y+h/2+1,opts.size||20,opts.color||'#183d9e','center','bold');ctx.restore();return hot;}
function panel(x,y,w,h){ctx.save();rr(x,y,w,h,18);ctx.fillStyle='#ffffffeb';ctx.fill();ctx.strokeStyle='#6d45a4';ctx.lineWidth=4;ctx.stroke();ctx.restore();}
function drawBackdrop(){const g=ctx.createLinearGradient(0,0,W,0);g.addColorStop(0,'#4b2d84');g.addColorStop(.45,'#4da8e8');g.addColorStop(1,'#b5ecff');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='#66c85e';ctx.fillRect(0,560,W,40);for(let x=0;x<W;x+=8){ctx.strokeStyle='#299d42';ctx.beginPath();ctx.moveTo(x,600);ctx.lineTo(x+(x%5)-2,576-(x%15));ctx.stroke();}}
function drawTitle(){text(t('title'),400,128,68,'#f5c33b','center','bold');ctx.strokeStyle='#7c5316';ctx.lineWidth=4;ctx.strokeText(t('title'),400,128);text(t('mode'),400,182,36,'#fff','center','bold');ctx.strokeStyle='#713a94';ctx.lineWidth=5;ctx.strokeText(t('mode'),400,182);}
function drawCard(face,x,y,size=64){const img=imageFor(face);if(imageReady(img)){ctx.drawImage(img,x,y,size,size);return;}ctx.fillStyle='#fff';ctx.fillRect(x,y,size,size);ctx.strokeStyle='#3f3f72';ctx.lineWidth=2;ctx.strokeRect(x+1,y+1,size-2,size-2);text(face==='back'?'?':'…',x+size/2,y+size/2,26,'#7763a8','center','bold');}
function drawBlankCell(x,y){if(drawUI('blank',x,y,CELL,CELL,0,0,CELL,CELL))return;ctx.fillStyle='#eeeef5';ctx.fillRect(x,y,CELL,CELL);ctx.strokeStyle='#aaa';ctx.strokeRect(x+.5,y+.5,CELL-1,CELL-1);}
function drawGrid(preview=false){if(!game)return;for(let x=0;x<8;x++)for(let y=0;y<8;y++){const px=GRID_X+x*CELL,py=GRID_Y+y*CELL,face=game.board[x][y];if(!face){drawBlankCell(px,py);continue;}const st=game.status[x][y];if(preview||st==='up')drawCard(face,px,py);else if(st==='hidden')drawCard('back',px,py);else drawBlankCell(px,py);}}
function timerSeconds(now=performance.now()){return screen==='win'?finishSeconds:screen==='play'?secondsFromMs(now-playStarted):0;}
function bestText(){const v=bestSeconds;return v==null?'—':`${v}s`;}

function newGame(){const g=generatePair({size:settings.size,difficulty:settings.difficulty,random:createRng(nextSeed())});game={...g,difficulty:settings.difficulty,first:null,pending:null};previewStarted=performance.now();playStarted=0;finishSeconds=0;bestSeconds=readBest(localStorage,settings.size,settings.difficulty);screen='preview';tone();}
function startPlay(){if(!game)return;for(let x=0;x<8;x++)for(let y=0;y<8;y++)if(game.board[x][y])game.status[x][y]='hidden';game.first=null;game.pending=null;playStarted=performance.now();screen='play';tone();}
function finishGame(){finishSeconds=secondsFromMs(performance.now()-playStarted);writeBest(localStorage,settings.size,settings.difficulty,finishSeconds);bestSeconds=readBest(localStorage,settings.size,settings.difficulty);screen='win';tone('win');}
function resetDefaults(){settings=clearAllLocalData(localStorage);syncLang();confirmClear=confirmReset=false;screen='menu';game=null;}

const MENU_CARD_SETS=Object.freeze({
 instructions:['toys-006','toys-020','toys-036','toys-052'],
 options:['toys-010','toys-029','toys-045','toys-063'],
 credits:['toys-014','toys-032','toys-056','toys-071'],
});
function drawHistoricalMenuBackground(){
 const bg=uiImage('mainmenu');
 if(imageReady(bg))ctx.drawImage(bg,0,0,800,600,0,0,800,600);
 else{drawBackdrop();drawTitle();}
}
function drawMenuSlot(slot,kind){
 const {x,y,w,h,labelX,labelY,labelW,labelH}=slot;
 const hot=hit(hover,rect(x,y,w,h))||hit(hover,rect(labelX,labelY,labelW,labelH));
 ctx.save();ctx.fillStyle='#fff';ctx.fillRect(x,y,w,h);
 if(kind==='play'){
  const preview=uiImage('pairPreview');
  if(imageReady(preview))ctx.drawImage(preview,x,y,w,h);
  else{drawCard('toys-001',x,y,64);drawCard('toys-022',x+64,y,64);drawCard('toys-044',x,y+64,64);drawCard('toys-072',x+64,y+64,64);}
 }else{
  const cards=MENU_CARD_SETS[kind];
  drawCard(cards[0],x,y,64);drawCard(cards[1],x+64,y,64);drawCard(cards[2],x,y+64,64);drawCard(cards[3],x+64,y+64,64);
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
 drawMenuSlot(m.slots.instructions,'instructions');
 drawMenuSlot(m.slots.play,'play');
 drawMenuSlot(m.slots.options,'options');
 drawMenuSlot(m.slots.credits,'credits');
 goldButton(m.utilities.language.x,m.utilities.language.y,m.utilities.buttonW,m.utilities.buttonH,settings.lang==='en'?'EN → IT':'IT → EN',{size:17,color:'#65438f'});
 goldButton(m.utilities.audio.x,m.utilities.audio.y,m.utilities.buttonW,m.utilities.buttonH,`${t('sound')}: ${settings.sound?t('on'):t('off')}`,{size:16,color:'#24429d'});
 goldButton(m.utilities.scores.x,m.utilities.scores.y,m.utilities.buttonW,m.utilities.buttonH,t('scores'),{size:settings.lang==='it'?17:16,color:'#6b49a5'});
 goldButton(m.utilities.play.x,m.utilities.play.y,m.utilities.buttonW,m.utilities.buttonH,t('newGame'),{size:settings.lang==='it'?16:18,color:'#d93430'});
}
function drawOptions(){drawBackdrop();panel(135,55,530,490);text(t('options'),400,90,32,'#6d3691','center','bold');text(t('size'),190,150,18);[2,4,6,8].forEach((s,i)=>goldButton(350+i*75,128,64,40,`${s}×${s}`,{size:16,color:settings.size===s?'#8d2b9d':'#183d9e'}));text(t('difficulty'),190,220,18);t('diff').forEach((d,i)=>goldButton(350+i*105,198,98,40,d,{size:14,color:settings.difficulty===i?'#8d2b9d':'#183d9e'}));text(t('countdown'),190,292,16);goldButton(406,270,74,40,settings.countdownOn?t('on'):t('off'),{size:15});goldButton(494,270,40,40,'−');goldButton(546,270,52,40,`${settings.countdown}s`,{size:14});goldButton(610,270,40,40,'+');text(t('language'),190,362,18);goldButton(350,340,90,40,settings.lang.toUpperCase(),{size:16});text(t('sound'),190,420,18);goldButton(350,398,90,40,settings.sound?t('on'):t('off'),{size:16});goldButton(190,475,150,42,t('resetData'),{size:14});goldButton(460,475,150,42,t('back'),{size:16});if(confirmReset){ctx.fillStyle='#0009';ctx.fillRect(0,0,W,H);panel(200,210,400,175);wrap(t('resetAsk'),240,250,320,27,18);goldButton(260,320,110,42,t('yes'));goldButton(430,320,110,42,t('no'));}}
function drawInstructions(){drawBackdrop();panel(90,45,620,510);text(t('instructions'),400,82,32,'#6d3691','center','bold');let y=135;for(const k of ['help1','help2','help3','help4','help5']){y=wrap(t(k),135,y,530,25,17);y+=25;}goldButton(325,500,150,42,t('back'),{size:16});}
function drawCredits(){drawBackdrop();panel(100,55,600,490);text(t('credits'),400,94,32,'#6d3691','center','bold');let y=160;for(const k of ['credit1','credit2','credit3','credit4','credit5']){y=wrap(t(k),145,y,510,26,16);y+=24;}ctx.save();ctx.strokeStyle='#1a5fb4';ctx.lineWidth=1;text('Libre Arcade ↗',400,505,18,'#1a5fb4','center','bold');ctx.beginPath();ctx.moveTo(335,516);ctx.lineTo(465,516);ctx.stroke();ctx.restore();goldButton(325,535,150,42,t('back'),{size:16});}
function drawScores(){drawBackdrop();panel(95,42,610,520);text(t('scores'),400,78,32,'#6d3691','center','bold');text(t('scoresNote'),400,112,15,'#555','center');const xs=[275,385,495,605];[2,4,6,8].forEach((s,i)=>text(`${s}×${s}`,xs[i],150,16,'#603c8b','center','bold'));t('diff').forEach((d,row)=>{text(d,155,200+row*75,16,'#17376f','left','bold');[2,4,6,8].forEach((s,i)=>{const v=readBest(localStorage,s,row);text(v==null?'—':`${v}s`,xs[i],200+row*75,17,'#333','center');});});goldButton(180,488,170,42,t('clearScores'),{size:14});goldButton(450,488,170,42,t('back'),{size:16});if(confirmClear){ctx.fillStyle='#0009';ctx.fillRect(0,0,W,H);panel(200,210,400,175);wrap(t('clearAsk'),240,250,320,27,18);goldButton(260,320,110,42,t('yes'));goldButton(430,320,110,42,t('no'));}}
function historicalButton(x,y,w,h,label,opts={}){const original=opts.original!==false&&settings.lang==='en';if(!original)return goldButton(x,y,w,h,label,opts);const hot=hit(hover,{x,y,w,h});if(hot){ctx.save();rr(x+2,y+2,w-4,h-4,h/2);ctx.strokeStyle='#fff9';ctx.lineWidth=3;ctx.stroke();ctx.restore();}return hot;}
function drawPreviewCountdown(sec){if(sec===null)return;const labelReady=drawUI('countdownLabel',586,35,181,81);const digits=String(Math.max(0,sec)%1000).padStart(3,'0').split('').map(Number);let digitsReady=true;for(let i=0;i<3;i++){const sx=[3,32,61][i],dx=[632,661,690][i];digitsReady=drawUI('startDigits',dx,112,29,34,sx,2+digits[i]*36,29,34)&&digitsReady;}if(!labelReady||!digitsReady)goldButton(590,34,176,50,`${sec} s`,{size:17,color:'#9c3424'});}
function drawGameTime(secs){const v=Math.max(0,secs)%1000,d=[Math.floor(v/100),Math.floor(v/10)%10,v%10];let ok=true;for(let i=0;i<3;i++){const sx=[3,24,45][i]+69*d[i],dx=688+21*i;ok=drawUI('game',dx,50,21,28,sx,601,21,28)&&ok;}if(!ok)text(String(v).padStart(3,'0'),720,64,24,'#c82929','center','bold');}
function drawPairNoMist(){drawUI('gamePanel',588,391,182,58,0,212,182,58);}
function drawPreview(now){const historical=drawUI('start',0,0,W,H,0,0,W,H);if(!historical)drawBackdrop();drawGrid(true);const sec=settings.countdownOn?Math.max(0,settings.countdown-secondsFromMs(now-previewStarted)):null;drawPreviewCountdown(sec);historicalButton(590,344,176,41,t('start'),{color:'#169d42',original:historical});historicalButton(590,401,176,41,t('reset'),{original:historical});historicalButton(590,458,176,41,t('options'),{color:'#963d9d',original:historical});historicalButton(590,515,176,41,t('menu'),{color:'#c32828',original:historical});}
function drawPlay(now){const historical=drawUI('game',0,0,W,H,0,0,W,H);if(!historical)drawBackdrop();drawGrid(false);drawGameTime(timerSeconds(now));drawPairNoMist();historicalButton(590,458,176,41,t('reset'),{original:historical});historicalButton(590,515,176,41,t('menu'),{color:'#c32828',original:historical});}
function drawWin(){drawPlay(performance.now());const historical=drawUI('box',200,200,400,200,0,0,400,200);if(!historical){ctx.fillStyle='rgba(25,12,45,.68)';ctx.fillRect(0,0,W,H);panel(195,180,410,235);}text(t('win1'),400,240,28,'#7a3a8c','center','bold');text(t('win2'),400,278,18,'#3a4d84','center');text(`${t('time')}: ${finishSeconds}s   ${t('best')}: ${bestText()}`,400,316,16,'#6a506a','center','bold');if(historical){text(t('newBtn'),315,370,17,'#243b8f','center','bold');text(t('menuBtn'),484,370,17,'#243b8f','center','bold');}else{goldButton(245,350,130,44,t('newBtn'),{size:17});goldButton(425,350,130,44,t('menuBtn'),{size:17});}}

function render(now=performance.now()){
 if(screen==='preview'&&settings.countdownOn&&now-previewStarted>=settings.countdown*1000)startPlay();
 if(screen==='play'&&game?.pending){const kind=resolvePending(game,now);if(kind){tone(kind==='mismatch'?'error':'click');if(isSolved(game))finishGame();}}
 ctx.clearRect(0,0,W,H);
 if(screen==='menu')drawMenu();else if(screen==='options')drawOptions();else if(screen==='instructions')drawInstructions();else if(screen==='credits')drawCredits();else if(screen==='scores')drawScores();else if(screen==='preview')drawPreview(now);else if(screen==='play')drawPlay(now);else if(screen==='win')drawWin();
 requestAnimationFrame(render);
}

function canvasPoint(ev){const b=canvas.getBoundingClientRect();return{x:(ev.clientX-b.left)*W/b.width,y:(ev.clientY-b.top)*H/b.height};}
function openService(name){returnScreen=screen==='preview'?'preview':'menu';screen=name;tone();}
function onActivate(p,now=performance.now()){
 if(screen==='menu'){
  const m=MENU_LAYOUT;
  const inside=s=>hit(p,rect(s.x,s.y,s.w,s.h))||hit(p,rect(s.labelX,s.labelY,s.labelW,s.labelH));
  if(inside(m.slots.play)){newGame();return;}
  if(inside(m.slots.instructions)){openService('instructions');return;}
  if(inside(m.slots.options)){openService('options');return;}
  if(inside(m.slots.credits)){openService('credits');return;}
  if(hit(p,rect(m.utilities.language.x,m.utilities.language.y,m.utilities.buttonW,m.utilities.buttonH))){settings.lang=settings.lang==='en'?'it':'en';save();tone();return;}
  if(hit(p,rect(m.utilities.audio.x,m.utilities.audio.y,m.utilities.buttonW,m.utilities.buttonH))){settings.sound=!settings.sound;save();tone();return;}
  if(hit(p,rect(m.utilities.scores.x,m.utilities.scores.y,m.utilities.buttonW,m.utilities.buttonH))){openService('scores');return;}
  if(hit(p,rect(m.utilities.play.x,m.utilities.play.y,m.utilities.buttonW,m.utilities.buttonH))){newGame();return;}
 }else if(screen==='options'){
  if(confirmReset){if(hit(p,rect(260,320,110,42)))resetDefaults();else if(hit(p,rect(430,320,110,42))){confirmReset=false;tone();}return;}
  [2,4,6,8].forEach((s,i)=>{if(hit(p,rect(350+i*75,128,64,40))){settings.size=s;save();tone();}});
  t('diff').forEach((_,i)=>{if(hit(p,rect(350+i*105,198,98,40))){settings.difficulty=i;save();tone();}});
  if(hit(p,rect(406,270,74,40))){settings.countdownOn=!settings.countdownOn;save();tone();}
  else if(hit(p,rect(494,270,40,40))){settings.countdown=settings.countdown<=1?99:settings.countdown-1;save();tone();}
  else if(hit(p,rect(610,270,40,40))){settings.countdown=settings.countdown>=99?1:settings.countdown+1;save();tone();}
  else if(hit(p,rect(350,340,90,40))){settings.lang=settings.lang==='en'?'it':'en';save();tone();}
  else if(hit(p,rect(350,398,90,40))){settings.sound=!settings.sound;save();tone();}
  else if(hit(p,rect(190,475,150,42))){confirmReset=true;tone();}
  else if(hit(p,rect(460,475,150,42))){screen=returnScreen;tone();}
 }else if(screen==='instructions'){if(hit(p,rect(325,500,150,42))){screen=returnScreen;tone();}}
 else if(screen==='credits'){if(hit(p,CREDIT_LINK)){window.open(LIBRE_ARCADE_URL,'_blank','noopener,noreferrer');}else if(hit(p,rect(325,535,150,42))){screen=returnScreen;tone();}}
 else if(screen==='scores'){
  if(confirmClear){if(hit(p,rect(260,320,110,42))){clearScores(localStorage);confirmClear=false;tone();}else if(hit(p,rect(430,320,110,42))){confirmClear=false;tone();}return;}
  if(hit(p,rect(180,488,170,42))){confirmClear=true;tone();}else if(hit(p,rect(450,488,170,42))){screen=returnScreen;tone();}
 }else if(screen==='preview'){
  if(hit(p,rect(590,344,176,41)))startPlay();
  else if(hit(p,rect(590,401,176,41)))newGame();
  else if(hit(p,rect(590,458,176,41)))openService('options');
  else if(hit(p,rect(590,515,176,41))){screen='menu';game=null;tone();}
 }else if(screen==='play'){
  if(hit(p,rect(590,458,176,41)))newGame();
  else if(hit(p,rect(590,515,176,41))){screen='menu';game=null;tone();}
  else if(p.x>=GRID_X&&p.x<GRID_X+512&&p.y>=GRID_Y&&p.y<GRID_Y+512){const x=Math.floor((p.x-GRID_X)/CELL),y=Math.floor((p.y-GRID_Y)/CELL);const r=clickCard(game,x,y,now);if(r.accepted)tone(r.kind==='mismatch'?'error':'click');}
 }else if(screen==='win'){
  if(hit(p,rect(257,355,116,30)))newGame();else if(hit(p,rect(426,355,116,30))){screen='menu';game=null;tone();}
 }
}
canvas.addEventListener('pointermove',ev=>{hover=canvasPoint(ev);});
canvas.addEventListener('pointerleave',()=>{hover={x:-1,y:-1};});
canvas.addEventListener('pointerup',ev=>{onActivate(canvasPoint(ev),performance.now());});
canvas.addEventListener('contextmenu',ev=>ev.preventDefault());
requestAnimationFrame(render);

export const __pairTest={
 getState:()=>({screen,settings,game,previewStarted,playStarted,finishSeconds,bestSeconds}),
 newGame,startPlay,finishGame,onActivate,render,
 setSettings(v){settings={...settings,...v};save();},
 forceNowResolve(now){if(game?.pending){const kind=resolvePending(game,now);if(kind&&isSolved(game))finishGame();return kind;}return null;},
 setSeed(v){seedCounter=v>>>0;}
};
