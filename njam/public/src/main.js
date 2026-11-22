/*
 * Njam 1.21 Web Archaeology Port — browser presentation/adapters.
 * Gameplay reference: AmigaOS4 Njam 1.21 source shipped in /reference.
 */
import { NjamGame, TILE, MODE, MAPW, MAPH, MAXDELAY, FRAME_MS } from './game.js';
import { HighScores } from './highscores.js';
import { NjamEditor } from './editor.js';
import { MENU_SCRIPT } from './menu-script.js';
import { I18N, MENU_INFO_IT } from './i18n.js';

const $=s=>document.querySelector(s);
const menuCanvas=$('#menuCanvas'),mctx=menuCanvas.getContext('2d');
const canvas=$('#game'),ctx=canvas.getContext('2d');
const ec=$('#editorCanvas'),ex=ec.getContext('2d');
for(const c of [mctx,ctx,ex])c.imageSmoothingEnabled=false;

const seedParam=new URLSearchParams(location.search).get('seed');
const game=new NjamGame({seed:seedParam===null?null:Number(seedParam)});
const highscores=new HighScores();

function image(src){const im=new Image();im.src=src;return im;}
const sprites=image('assets/sprites.png');
const skins=[0,1,2,3].map(i=>image(`assets/skins/Back00${i}.png`));
const fontYellow=image('assets/font-yellow.png'),fontBlue=image('assets/font-blue.png');
const mainMenuImage=image('assets/mainmenu.jpg'),optionsImage=image('assets/options.jpg');
const statsImage=image('assets/stats.jpg'),gameOverImage=image('assets/gameover.jpg'),winAllImage=image('assets/winall.jpg'),hiscoreImage=image('assets/hiscore.jpg');
const duelWin=[0,1,2,3].map(i=>image(`assets/win${i+1}.jpg`));
const FONTMAP='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!@*()%/';

function bitmapText(c,font,cw,ch,x,y,text){
  text=String(text).toUpperCase();
  for(let i=0;i<text.length;i++){
    const chv=text[i];if(chv===' '||chv==='\n'||chv==='\r')continue;
    const n=FONTMAP.indexOf(chv);if(n<0)continue;
    c.drawImage(font,n*cw,0,cw,ch,x+i*cw,y,cw,ch);
  }
}
const yellow=(c,x,y,t)=>bitmapText(c,fontYellow,10,15,x,y,t);
const blue=(c,x,y,t)=>bitmapText(c,fontBlue,6,9,x,y,t);
function yellowCentered(c,y,text){yellow(c,Math.floor((800-(String(text).length+1)*10)/2),y,text);}
function blueCentered(c,y,text){blue(c,Math.floor((800-(String(text).length+1)*6)/2),y,text);}

// ---------------------------------------------------------------------------
// Persistent Njam options: browser localStorage replaces njam.conf.
const SETTINGS_KEY='njam-1.21-options-v2';
function loadSettings(){
  const d={music:true,sound:true,skin:-1,lang:(navigator.language||'en').toLowerCase().startsWith('it')?'it':'en'};
  try{
    const v=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'null');
    if(v&&typeof v==='object'){
      if(typeof v.music==='boolean')d.music=v.music;
      if(typeof v.sound==='boolean')d.sound=v.sound;
      if(Number.isInteger(v.skin)&&v.skin>=-1&&v.skin<=3)d.skin=v.skin;
      if(v.lang==='it'||v.lang==='en')d.lang=v.lang;
    }
  }catch{}
  return d;
}
const settings=loadSettings();
const t=k=>I18N[settings.lang]?.[k]??I18N.en[k]??k;
function saveSettings(){try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}game.setSkin(settings.skin);game.setSoundEnabled(settings.sound);}
function applyLanguage(){
  const d=I18N[settings.lang]||I18N.en;document.documentElement.lang=settings.lang;
  $('#helpBtn').textContent=d.helpBtn;$('#fullscreenBtn').textContent=d.fullscreen;$('#pause').textContent=game.paused?d.resume:d.pause;$('#restart').textContent=d.restart;$('#menuBtn').textContent=d.gameMenu;
  $('#helpTitle').textContent=d.helpTitle;$('#helpBody').innerHTML=d.helpHtml.map(x=>`<p>${x}</p>`).join('');$('#closeHelp').textContent=d.close;
  $('#menu').setAttribute('aria-label',settings.lang==='it'?'Menu di Njam 1.21':'Njam 1.21 menu');$('#hud').setAttribute('aria-label',settings.lang==='it'?'Controlli di gioco':'Game controls');
  document.querySelector('#editorDialog .editorHead h2').textContent=d.editorTitle;$('#editorClose').textContent=d.close;$('#editorLoad').textContent=d.load;$('#editorSave').textContent=d.save;$('#editorSaveAs').textContent=d.saveAs;
  if($('#editorDialog').open)renderEditor();
}
saveSettings();

// ---------------------------------------------------------------------------
// Audio.
const sfx={
  death:['dead.wav','dead2.wav','dead3.wav'],kill:['kill.wav','kill2.wav','kill3.wav'],trapDeath:['killply.wav'],playerKill:['killply.wav'],
  juice:['juice.wav'],teleport:['teleport.wav'],invisible:['invisible.wav'],trap:['trapdoor.wav'],freeze:['freeze.wav'],points:['50pts.wav'],
  bonusExpired:['tripleding.wav'],tripleDing:['tripleding.wav'],raceReopened:['mapend2.wav'],mapend:['mapend.wav'],mapend2:['mapend2.wav'],bonus:['bonus.wav']
};
function playSfx(key,variant=0){
  if(!settings.sound||!sfx[key])return;
  const list=sfx[key],file=list[Math.max(0,Math.min(list.length-1,variant|0))];
  const a=new Audio(`assets/sfx/${file}`);a.volume=.48;a.play().catch(()=>{});
}
game.addEventListener('deathSound',e=>playSfx('death',e.detail.variant));
game.addEventListener('kill',e=>playSfx('kill',e.detail.variant));
game.addEventListener('playerKill',()=>playSfx('playerKill'));
for(const k of ['juice','teleport','invisible','trap','freeze','points','trapDeath','bonusExpired','tripleDing','raceReopened'])game.addEventListener(k,()=>playSfx(k));
game.addEventListener('bonuslife',()=>playSfx('bonus'));

let music=null,audioArmed=false;
function stopMusic(){if(music){music.pause();music.currentTime=0;music=null;}}
function playMusicFile(name,{restart=true}={}){
  if(!settings.music||!audioArmed)return;
  if(music&&music.dataset.name===name){if(restart)music.currentTime=0;music.play().catch(()=>{});return;}
  stopMusic();music=new Audio(`assets/music/${name}.ogg`);music.dataset.name=name;music.loop=true;music.volume=.38;music.play().catch(()=>{});
}
function playMenuMusic(){if(game.status==='menu')playMusicFile('satisfy',{restart:false});}
function playLevelMusic(){if(settings.music)playMusicFile(game.currentMusic);}
function armAudio(){if(audioArmed)return;audioArmed=true;if(game.status==='menu')playMenuMusic();}
window.addEventListener('pointerdown',armAudio,{once:true});window.addEventListener('keydown',armAudio,{once:true});
function applyMusicOption(){saveSettings();if(!settings.music)stopMusic();else if(game.status==='menu')playMenuMusic();else if(['ready','playing','life-lost'].includes(game.status))playLevelMusic();}

// ---------------------------------------------------------------------------
// Original 1.21 main menu presentation.
const MENU_INFO_EN=MENU_SCRIPT.filter(part=>part.lines?.[0]!=='CONTACT INFORMATION');
let menuState='main',mainSelected=0,optionSelected=0,menuEpoch=performance.now();
let levelSelectMode=MODE.ONE,levelSelectItems=[],levelSelected=0;
let menuMessageText='',menuMessageReturn='main';
let exited=false;

function resetMenuAnimation(){menuEpoch=performance.now();}
function drawOptionsOverlay(){
  const d=I18N[settings.lang]||I18N.en;mctx.drawImage(optionsImage,50,120);
  mctx.save();mctx.fillStyle='rgba(8,3,0,.94)';mctx.fillRect(50,120,305,190);mctx.strokeStyle='rgba(255,139,45,.45)';mctx.strokeRect(50.5,120.5,304,189);
  mctx.font='700 18px "Trebuchet MS",Arial,sans-serif';mctx.textBaseline='middle';mctx.shadowColor='#000';mctx.shadowBlur=2;mctx.shadowOffsetX=1;mctx.shadowOffsetY=1;
  const vals=[settings.music?d.on:d.off,settings.sound?d.on:d.off,settings.skin<0?d.random:`${d.style} ${settings.skin+1}`,d.language,''];
  d.options.forEach((label,i)=>{mctx.fillStyle='#ff603e';mctx.fillText(label,62,142+35*i);if(vals[i]){mctx.fillStyle='#ffe762';mctx.fillText(vals[i],205,142+35*i);}});mctx.restore();
}
function drawMenuScript(now){
  const info=settings.lang==='it'?MENU_INFO_IT:MENU_INFO_EN;const elapsed=now-menuEpoch;if(elapsed<10500||!info.length)return;
  const index=Math.floor((elapsed-10500)/12000)%info.length,part=info[index];
  if(part.image){
    const kind=part.image[0],n=Number(part.image[1]);
    if(kind==='G')mctx.drawImage(sprites,n*25,0,25,25,440,120,25,25);
    else if(kind==='P')for(let j=0;j<skins.length;j++)mctx.drawImage(skins[j],(n+2)*25,0,25,25,440+j*30,120,25,25);
  }
  let y=170;for(const line of part.lines){blue(mctx,440,y,line);y+=10;}
}
function drawTop10(){
  blue(mctx,714,470,t('topColumns'));
  highscores.rows.forEach((r,i)=>{
    if(i===highscores.last){mctx.fillStyle='rgb(0,0,100)';mctx.fillRect(658,479+i*10,124,11);}
    const name=String(r.name||'').padEnd(11,' ').slice(0,11),level=String(r.level|0).padStart(2,' '),points=String(r.points|0).padStart(5,' ');
    blue(mctx,660,480+i*10,`${name} ${level} ${points}`);
  });
}
function drawScroll(now){
  const cycle=66300,elapsed=(now-menuEpoch)%cycle,offset=810-elapsed/15;
  yellow(mctx,Math.round(offset),10,t('scroll'));
}
function drawSelector(index){mctx.drawImage(sprites,100,0,25,25,22,130+35*index,25,25);}
function drawCleanMainMenu(){
  const labels=t('menu');
  mctx.save();
  mctx.fillStyle='rgba(8,3,0,.96)';mctx.fillRect(43,116,320,292);
  mctx.strokeStyle='rgba(255,139,45,.45)';mctx.lineWidth=1;mctx.strokeRect(43.5,116.5,319,291);
  mctx.font='700 23px "Trebuchet MS",Arial,sans-serif';mctx.textBaseline='middle';mctx.fillStyle='#ff603e';
  mctx.shadowColor='#000';mctx.shadowBlur=2;mctx.shadowOffsetX=1;mctx.shadowOffsetY=1;
  labels.forEach((label,i)=>mctx.fillText(label,56,142+35*i));
  mctx.restore();
}
function drawLevelSelector(){
  mctx.fillStyle='#000';mctx.fillRect(240,175,320,250);mctx.fillStyle='rgb(230,200,100)';mctx.fillRect(241,176,318,248);
  mctx.fillStyle='rgb(100,0,0)';mctx.fillRect(249,184,302,22);yellow(mctx,340,187,t('selectLevels'));
  mctx.fillStyle='rgb(80,50,0)';mctx.fillRect(249,214,302,202);
  levelSelectItems.slice(0,10).forEach((d,i)=>{
    if(i===levelSelected){mctx.fillStyle='rgb(120,80,0)';mctx.fillRect(250,215+20*i,300,20);}
    yellow(mctx,252,216+20*i,String(d.id||d.filename||'LEVELS').replace(/\.(COOP|DUEL)$/i,''));
  });
}
function drawMenuMessage(text){
  const t=String(text).toUpperCase(),w=t.length*10+50,x=(800-w)/2;
  mctx.fillStyle='#000';mctx.fillRect(x,275,w,55);mctx.fillStyle='rgb(0,120,0)';mctx.fillRect(x+10,285,w-20,35);yellow(mctx,x+25,295,t);
}
function drawMenu(now=performance.now()){
  mctx.imageSmoothingEnabled=false;mctx.fillStyle='#000';mctx.fillRect(0,0,800,600);
  if(exited){blueCentered(mctx,280,t('exited'));blueCentered(mctx,300,t('returnEnter'));requestAnimationFrame(drawMenu);return;}
  mctx.drawImage(mainMenuImage,0,0);
  if(menuState==='options')drawOptionsOverlay();else drawCleanMainMenu();
  drawSelector(menuState==='options'?optionSelected:mainSelected);
  drawMenuScript(now);drawScroll(now);drawTop10();blue(mctx,92,85,'VERSION 1.21');
  if(menuState==='levelset')drawLevelSelector();
  if(menuState==='message')drawMenuMessage(menuMessageText);
  requestAnimationFrame(drawMenu);
}
requestAnimationFrame(drawMenu);

function showMenu(){
  cancelPresentation();game.running=false;game.status='menu';game.paused=false;$('#pause').textContent=t('pause');
  $('#menu').classList.remove('hidden');$('#play').classList.add('hidden');$('#hud').classList.add('hidden');$('#touchWrap').classList.add('hidden');
  menuState='main';mainSelected=0;exited=false;resetMenuAnimation();playMenuMusic();
}
function beginLevelSelect(mode){levelSelectMode=mode;levelSelectItems=game.levelsetsForMode(mode);levelSelected=0;menuState='levelset';}
function startSelectedGame(){
  armAudio();game.mode=levelSelectMode;game.levelsets=game.levelsetsForMode(levelSelectMode);game.selectLevelSet(levelSelected);game.setSkin(settings.skin);game.setSoundEnabled(settings.sound);
  showPlay();stopMusic();game.start(levelSelectMode);
}
function showMenuMessage(text,returnState='main'){menuMessageText=text;menuMessageReturn=returnState;menuState='message';}
function activateMainMenuItem(){
  switch(mainSelected){
    case 0:beginLevelSelect(MODE.ONE);break;
    case 1:beginLevelSelect(MODE.TWO);break;
    case 2:beginLevelSelect(MODE.DUEL);break;
    case 3:menuState='options';optionSelected=0;break;
    case 4:openEditor();break;
    case 5:exited=true;stopMusic();try{window.close();}catch{}break;
  }
}
function activateOption(){
  if(optionSelected===0){settings.music=!settings.music;applyMusicOption();}
  else if(optionSelected===1){settings.sound=!settings.sound;saveSettings();}
  else if(optionSelected===2){settings.skin++;if(settings.skin>3)settings.skin=-1;saveSettings();}
  else if(optionSelected===3){settings.lang=settings.lang==='it'?'en':'it';saveSettings();applyLanguage();resetMenuAnimation();}
  else {menuState='main';mainSelected=0;}
}

function menuCoords(e){const r=menuCanvas.getBoundingClientRect();return{x:(e.clientX-r.left)*800/r.width,y:(e.clientY-r.top)*600/r.height};}
menuCanvas.addEventListener('pointerdown',e=>{
  armAudio();const p=menuCoords(e);
  if(menuState==='main'||menuState==='options'){
    const max=menuState==='main'?5:4,idx=Math.floor((p.y-118)/35);
    if(idx>=0&&idx<=max){if(menuState==='main')mainSelected=idx;else optionSelected=idx;}
  }else if(menuState==='levelset'){
    const idx=Math.floor((p.y-215)/20);if(idx>=0&&idx<levelSelectItems.length)levelSelected=idx;
  }
});
menuCanvas.addEventListener('click',()=>{
  // Browser convenience: direct mouse/touch activation. Keyboard navigation remains source-faithful.
  if(menuState==='message'){menuState=menuMessageReturn;return;}
  if(menuState==='main')activateMainMenuItem();else if(menuState==='options')activateOption();else if(menuState==='levelset')startSelectedGame();
});

// ---------------------------------------------------------------------------
// Gameplay presentation and historical interstitial timing.
let readyText='',readyToken=0,bonusToken=0,postGameTimer=0,postGameUnlockAt=0,hiscoreActive=false,pendingHiscore=-1,hiscoreName='';
function cancelPresentation(){readyToken++;bonusToken++;readyText='';clearTimeout(postGameTimer);postGameTimer=0;postGameUnlockAt=0;hiscoreActive=false;pendingHiscore=-1;hiscoreName='';}
function readySequence(){
  const token=++readyToken,seq=t('ready');readyText=seq[0];
  setTimeout(()=>{if(token===readyToken&&game.status==='ready')readyText=seq[1];},1000);
  setTimeout(()=>{if(token===readyToken&&game.status==='ready')readyText=seq[2];},2000);
  setTimeout(()=>{if(token===readyToken&&game.status==='ready'){readyText='';game.beginPlaying();}},3000);
}
function showPlay(){$('#menu').classList.add('hidden');$('#play').classList.remove('hidden');$('#hud').classList.remove('hidden');$('#touchWrap').classList.remove('hidden');$('#touch2').classList.toggle('hidden',game.mode===MODE.ONE);}
function requestHiscore(){
  if(game.mode!==MODE.ONE)return false;const idx=highscores.insert(game.score,game.currentMap+1);if(idx<0)return false;
  pendingHiscore=idx;hiscoreName='';hiscoreActive=true;return true;
}
function commitHiscore(){if(pendingHiscore<0||!highscores.commitName(pendingHiscore,hiscoreName))return;hiscoreActive=false;pendingHiscore=-1;showMenu();}

$('#pause').onclick=()=>{if(game.status!=='playing')return;game.paused=!game.paused;$('#pause').textContent=game.paused?t('resume'):t('pause');};
$('#restart').onclick=()=>{cancelPresentation();stopMusic();game.start(game.mode);};
$('#menuBtn').onclick=showMenu;
$('#helpBtn').onclick=()=>$('#help').showModal();$('#closeHelp').onclick=()=>$('#help').close();
const fullscreenBtn=$('#fullscreenBtn');
if(!document.fullscreenEnabled||typeof document.documentElement.requestFullscreen!=='function')fullscreenBtn.hidden=true;
else fullscreenBtn.onclick=async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{}};

game.addEventListener('level',()=>{if(game.running)playLevelMusic();});
game.addEventListener('ready',()=>readySequence());
game.addEventListener('playing',()=>{if(music?.paused&&settings.music)music.play().catch(()=>{});});
game.addEventListener('death',()=>{if(music)music.pause();});game.addEventListener('forfeit',()=>{if(music)music.pause();});
game.addEventListener('bonuslife',()=>{stopMusic();const token=++bonusToken;setTimeout(()=>{if(token===bonusToken&&game.status==='bonus-life')game.finishBonusLife();},2000);});
game.addEventListener('mapresult',e=>{stopMusic();playSfx(e.detail.endSfx===1?'mapend2':'mapend');});
game.addEventListener('gameover',()=>{
  stopMusic();playSfx('death',0);postGameUnlockAt=performance.now()+700;
  postGameTimer=setTimeout(()=>{if(game.status!=='gameover')return;if(requestHiscore())return;postGameTimer=setTimeout(()=>{if(game.status==='gameover'&&!hiscoreActive)showMenu();},1300);},700);
});
game.addEventListener('won',()=>{stopMusic();playSfx('bonus');postGameUnlockAt=performance.now()+1300;});
game.addEventListener('duelwon',()=>{stopMusic();playSfx('bonus');postGameUnlockAt=performance.now()+4000;postGameTimer=setTimeout(()=>{if(game.status==='duel-won')showMenu();},4000);});
game.addEventListener('editortestdone',()=>{
  cancelPresentation();stopMusic();$('#play').classList.add('hidden');$('#hud').classList.add('hidden');$('#touchWrap').classList.add('hidden');game.status='menu';
  if(!$('#editorDialog').open)$('#editorDialog').showModal();renderEditor();
});

function continueState(){
  if(game.paused&&game.status==='playing'){$('#pause').click();return true;}
  if(game.status==='life-lost'){game.continueAfterDeath();return true;}
  if(game.status==='map-result'){game.continueMapResult();return true;}
  return ['gameover','won','duel-won'].includes(game.status);
}
const p0dirs={ArrowRight:0,ArrowDown:1,ArrowLeft:2,ArrowUp:3},p1dirs={g:0,f:1,d:2,r:3,G:0,F:1,D:2,R:3},wasd={d:0,s:1,a:2,w:3,D:0,S:1,A:2,W:3};
const HISCORE_ALLOWED='0123456789abcdefghijklmnopqrstuvwxyz. :)(!*';
window.addEventListener('keydown',e=>{
  armAudio();
  if($('#help').open)return;
  if($('#editorDialog').open){handleEditorKey(e);return;}

  if(!$('#menu').classList.contains('hidden')){
    e.preventDefault();
    if(exited){if(e.key==='Enter'){exited=false;menuState='main';mainSelected=0;playMenuMusic();}return;}
    if(menuState==='message'){menuState=menuMessageReturn;return;}
    if(menuState==='levelset'){
      if(e.key==='ArrowUp'&&levelSelected>0)levelSelected--;else if(e.key==='ArrowDown'&&levelSelected<levelSelectItems.length-1)levelSelected++;
      else if(e.key==='Enter')startSelectedGame();else if(e.key==='Escape')menuState='main';return;
    }
    if(menuState==='options'){
      if(e.key==='ArrowUp'&&optionSelected>0)optionSelected--;else if(e.key==='ArrowDown'&&optionSelected<4)optionSelected++;
      else if(e.key==='Enter')activateOption();else if(e.key==='Escape'){menuState='main';mainSelected=0;}return;
    }
    if(e.key==='ArrowUp'&&mainSelected>0)mainSelected--;else if(e.key==='ArrowDown'&&mainSelected<5)mainSelected++;
    else if(e.key==='Enter')activateMainMenuItem();else if(e.key==='Escape'){mainSelected=5;activateMainMenuItem();}return;
  }

  if(hiscoreActive){
    e.preventDefault();
    if(e.key==='Backspace'){hiscoreName=hiscoreName.slice(0,-1);return;}
    if(e.key==='Enter'){if(hiscoreName)commitHiscore();return;}
    const low=e.key.toLowerCase();if(e.key.length===1&&HISCORE_ALLOWED.includes(low)&&hiscoreName.length<9)hiscoreName+=low.toUpperCase();return;
  }

  if(game.status==='won'){
    e.preventDefault();if(performance.now()<postGameUnlockAt)return;if(!requestHiscore())showMenu();return;
  }
  if(game.status==='gameover'||game.status==='duel-won'){e.preventDefault();return;}
  if(e.key===' '&&continueState()){e.preventDefault();return;}
  if(e.key==='Escape'&&game.status!=='menu'){
    e.preventDefault();if(game.status==='playing'&&!game.paused){game.forfeitLife();return;}if(game.status==='life-lost'){game.abandonFromLifeLost();return;}if(game.status==='map-result'){showMenu();return;}return;
  }
  if((e.key==='p'||e.key==='P')&&game.status!=='menu'){e.preventDefault();$('#pause').click();return;}
  if(game.status==='playing'&&!game.paused){
    if(e.key in p0dirs){e.preventDefault();game.input(p0dirs[e.key],0);return;}
    if(game.mode!==MODE.ONE&&e.key in p1dirs){e.preventDefault();game.input(p1dirs[e.key],1);return;}
    if(game.mode===MODE.ONE&&e.key in wasd){e.preventDefault();game.input(wasd[e.key],0);}
  }
});

document.querySelectorAll('.dpad [data-dir]').forEach(b=>b.addEventListener('pointerdown',e=>{
  e.preventDefault();if(game.status!=='playing'||game.paused)return;const pi=+b.closest('.dpad').dataset.player;game.input(+b.dataset.dir,pi);
}));
canvas.addEventListener('pointerup',()=>{if(['life-lost','map-result'].includes(game.status))continueState();});

function drawMap(){const skin=skins[game.activeSkin()]||skins[0];for(let y=0;y<MAPH;y++)for(let x=0;x<MAPW;x++)ctx.drawImage(skin,game.tile(x,y)*25,0,25,25,x*25,y*25,25,25);}
function drawActors(){
  for(const p of game.players){
    if(!p.playing)continue;const px=p.x*25+p.xo*5,py=p.y*25+p.yo*5;
    if(!p.delay&&(p.juice||p.invisible))ctx.drawImage(sprites,0,p.juice?50:75,25,25,px,py,25,25);
    if(!p.delay)ctx.drawImage(sprites,75+p.index*25,p.rotate*150+p.frame*25,25,25,px,py,25,25);
    if(p.freeze&&!p.delay){const top=Math.min(MAXDELAY/2,p.freeze),alpha=(150+105*top/MAXDELAY)/255;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(sprites,35,50,28,31,px-1,py-2,28,31);ctx.restore();}
    if(p.juice&&p.juice<60)yellow(ctx,px-10,py-10,String(Math.floor(p.juice/20)));
  }
  const gh=game.ghostHouse();
  for(const g of game.ghosts){
    const gx=g.x*25+g.xo*5,gy=g.y*25+g.yo*5;
    if(g.delay>MAXDELAY/2&&(g.delay%2)===1&&(g.x!==gh.x||g.y!==gh.y)){ctx.drawImage(sprites,0,25,25,25,gx,gy,25,25);continue;}
    if(g.delay>0)continue;ctx.drawImage(sprites,g.type*25,0,25,25,gx,gy,25,25);
    if(game.freeze){const top=Math.min(MAXDELAY,game.freeze),alpha=(150+105*top/MAXDELAY)/255;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(sprites,35,50,28,31,gx-1,gy-2,28,31);ctx.restore();}
  }
}
function drawSide(){
  ctx.fillStyle='#000';ctx.fillRect(700,0,100,600);const colors=['rgb(255,255,25)','rgb(25,255,25)','rgb(255,25,25)','rgb(25,155,155)'];
  if(game.mode===MODE.DUEL){for(const p of game.players)if(p.playing)yellow(ctx,705+25*p.index,0,String(p.gamePoints));}
  else{const lives=Math.max(0,game.lives);if(lives){const d=Math.min(25,Math.floor(100/lives));for(let i=0;i<lives;i++)ctx.drawImage(sprites,75,75,25,25,700+d*i,0,25,25);}}
  let maxp=0;for(const p of game.players)if(p.playing)maxp=Math.max(maxp,p.mapPoints);
  for(const p of game.players){
    if(!p.playing)continue;ctx.fillStyle=colors[p.index];ctx.fillRect(702+p.index*25,25,20,Math.max(0,p.mapPoints));
    if(game.mode===MODE.DUEL&&maxp!==p.mapPoints){ctx.fillStyle=(p.mapPoints+game.cookies<maxp)?'#fff':'rgb(150,180,200)';ctx.fillRect(710+p.index*25,26+p.mapPoints,4,Math.max(0,game.cookies));}
  }
  if(game.mode!==MODE.DUEL)yellow(ctx,705,562,`${t('level')}: ${String(game.currentMap+1).padStart(2,'0')}`);
  if(game.mode===MODE.ONE)yellow(ctx,705,543,`${t('points')}: ${String(game.score).padStart(4,' ')}`);
  if(game.bonus){const h=Math.floor(game.bonus/10),minus=game.mode===MODE.ONE?19:0;if(h>0){const sy=125+209-h,dy=559-h-minus;ctx.fillStyle='#000';ctx.fillRect(774,dy-1,22,h+1);ctx.drawImage(sprites,0,sy,20,h,775,dy,20,h);}}
}
function drawReady(){if(!readyText)return;const w=Math.max(77,readyText.trim().length*10+28),x=(800-w)/2;ctx.fillStyle='rgb(255,255,200)';ctx.fillRect(x,284,w,27);ctx.fillStyle='#000';ctx.fillRect(x+1,285,w-2,25);yellowCentered(ctx,289,readyText);}
function drawLifeBox(awarded=false){
  ctx.fillStyle='#000';ctx.fillRect(300,260,250,81);ctx.fillStyle='rgb(25,155,25)';ctx.fillRect(310,270,230,60);yellow(ctx,320,280,awarded?t('bonusLife'):t('livesLeft'));
  for(let i=0;i<Math.max(0,game.lives);i++){const x=game.lives>8?320+i*10:320+i*25;ctx.drawImage(sprites,75,75,25,25,x,300,25,25);}
  if(!awarded)blueCentered(ctx,331,t('continueQuit'));
}
function drawStats(){
  ctx.drawImage(statsImage,42,60);ctx.fillStyle='rgba(0,0,0,.78)';ctx.fillRect(48,66,190,38);ctx.fillRect(48,475,575,58);yellow(ctx,60,76,t('stats'));yellowCentered(ctx,495,t('statsContinue'));
  for(const p of game.players){if(!p.playing)continue;ctx.drawImage(sprites,75+p.index*25,25,25,25,90,220+30*p.index,25,25);const points=game.mode===MODE.DUEL?`${p.gamePoints} (${String(p.mapPoints).padStart(3,' ')})`:`  (${String(p.mapPoints).padStart(3,' ')})`;yellow(ctx,130,225+30*p.index,points);const vals=[p.stats.cookies,p.stats.juices,p.stats.kills,p.stats.playerKills,p.stats.deaths,p.stats.invisibles];vals.forEach((v,j)=>yellow(ctx,220+75*j,225+30*p.index,String(v).padStart(4,' ')));}
  if(game.mode===MODE.ONE)yellow(ctx,90,260,`${t('points')}: ${game.score}`);
}
function drawGameOver(){ctx.fillStyle='#000';ctx.fillRect(0,0,800,600);ctx.drawImage(gameOverImage,175,130);yellowCentered(ctx,500,t('gameOver'));}
function drawWon(){ctx.fillStyle='#000';ctx.fillRect(0,0,800,600);ctx.drawImage(winAllImage,80,60);yellowCentered(ctx,550,t('won'));blueCentered(ctx,570,t('anyKey'));}
function drawDuelWon(){ctx.fillStyle='#000';ctx.fillRect(0,0,800,600);const w=Math.max(0,game.roundWinner|0);ctx.drawImage(duelWin[w],175,130);yellowCentered(ctx,500,t('winner'));}
function drawHiscoreEntry(){
  ctx.fillStyle='rgba(25,28,35,.96)';ctx.fillRect(245,195,310,215);ctx.strokeStyle='#777';ctx.strokeRect(245.5,195.5,309,214);yellow(ctx,270,220,t('hiscoreTitle'));blue(ctx,270,245,t('hiscoreSub'));blue(ctx,270,280,t('hiscoreName'));ctx.fillStyle='#9aa38a';ctx.fillRect(270,298,260,31);yellow(ctx,277,306,hiscoreName);blue(ctx,270,360,t('hiscoreDone'));
  if(Math.floor(performance.now()/400)%2===0){ctx.fillStyle='#fff';ctx.fillRect(279+10*hiscoreName.length,306,10,15);}
}
const pauseCanvas=document.createElement('canvas');pauseCanvas.width=700;pauseCanvas.height=600;const pauseCtx=pauseCanvas.getContext('2d');
function drawPause(){pauseCtx.clearRect(0,0,700,600);pauseCtx.drawImage(canvas,0,0,700,600,0,0,700,600);ctx.save();ctx.filter='grayscale(1)';ctx.drawImage(pauseCanvas,0,0);ctx.restore();ctx.fillStyle='rgb(255,255,200)';ctx.fillRect(359,284,82,27);ctx.fillStyle='#000';ctx.fillRect(360,285,80,25);yellowCentered(ctx,290,t('paused'));}
function draw(){
  ctx.imageSmoothingEnabled=false;ctx.fillStyle='#000';ctx.fillRect(0,0,800,600);
  if(game.map&&!['gameover','won','duel-won'].includes(game.status)){
    drawMap();drawActors();drawSide();if(game.status==='ready')drawReady();else if(game.status==='life-lost')drawLifeBox(false);else if(game.status==='bonus-life')drawLifeBox(true);else if(game.status==='map-result')drawStats();if(game.paused&&game.status==='playing')drawPause();
  }else if(game.status==='gameover')drawGameOver();else if(game.status==='won')drawWon();else if(game.status==='duel-won')drawDuelWon();
  if(hiscoreActive)drawHiscoreEntry();requestAnimationFrame(draw);
}
requestAnimationFrame(draw);setInterval(()=>game.tick(),FRAME_MS);

function localizeEditorMessage(message=''){
  const m=String(message);
  if(m.includes('NOT MARKED AS PLAYABLE'))return t('errPlayable');
  const n=(m.match(/LEVEL\s+(\d+)/i)||[])[1];
  if(m.includes('EXACTLY ONE DOOR'))return `${t('errDoor')}${n?` - ${t('level')} ${n}`:''}`;
  if(m.includes('EXACTLY ONE PENTAGRAM'))return `${t('errPentagram')}${n?` - ${t('level')} ${n}`:''}`;
  if(/^Expected \d+ bytes/i.test(m))return t('invalidLevels');
  return t('editorError');
}

// ---------------------------------------------------------------------------
// Njam 1.21 level editor. The canvas mirrors RenderEditor(); browser file APIs
// replace direct directory/filesystem access only where the sandbox requires it.
let editor=new NjamEditor(),exCursor={x:2,y:1},editorBrush=0,editorFileHandle=null,editorLoadedKind='COOP',editorOverlay=null,editorPicker=null;
function newEditor(){editor=new NjamEditor();exCursor={x:2,y:1};editorBrush=0;editorFileHandle=null;editorLoadedKind='COOP';editorOverlay=null;editorPicker=null;}
function editorMessage(text,after=null){editorOverlay={type:'message',text:String(text).toUpperCase(),after};renderEditor();}
function editorQuery(text,yes,no=null){editorOverlay={type:'query',text:String(text).toUpperCase(),yes,no};renderEditor();}
function drawEditorOverlay(){if(!editorOverlay)return;const t=editorOverlay.text,w=t.length*10+50,x=(800-w)/2;ex.fillStyle='#000';ex.fillRect(x,275,w,55);ex.fillStyle='rgb(0,120,0)';ex.fillRect(x+10,285,w-20,35);yellow(ex,x+25,295,t);}
function editorAllSets(){return [...game.coopLevelsets.map(d=>({d,kind:'COOP'})),...game.duelLevelsets.map(d=>({d,kind:'DUEL'})),{d:null,kind:'FILE'}];}
function openEditorPicker(){editorPicker={items:editorAllSets(),selected:0};renderEditor();}
function drawEditorPicker(){
  if(!editorPicker)return;const items=editorPicker.items;ex.fillStyle='#000';ex.fillRect(240,155,320,290);ex.fillStyle='rgb(230,200,100)';ex.fillRect(241,156,318,288);ex.fillStyle='rgb(100,0,0)';ex.fillRect(249,164,302,22);yellow(ex,325,167,t('chooseSet'));ex.fillStyle='rgb(80,50,0)';ex.fillRect(249,194,302,242);
  items.slice(0,11).forEach((it,i)=>{if(i===editorPicker.selected){ex.fillStyle='rgb(120,80,0)';ex.fillRect(250,195+20*i,300,20);}yellow(ex,252,196+20*i,it.kind==='FILE'?t('openFile'):String(it.d.id||it.d.filename).replace(/\.(COOP|DUEL)$/i,''));});
}
function renderEditor(){
  const skin=skins[0];ex.imageSmoothingEnabled=false;ex.fillStyle='#000';ex.fillRect(0,0,800,600);
  for(let y=0;y<MAPH;y++)for(let x=0;x<MAPW;x++)ex.drawImage(skin,editor.tile(x,y)*25,0,25,25,x*25,y*25,25,25);
  ex.fillStyle='rgb(255,255,127)';ex.fillRect(exCursor.x*25-1,exCursor.y*25-1,27,27);ex.drawImage(skin,editor.tile(exCursor.x,exCursor.y)*25+1,1,23,23,exCursor.x*25+1,exCursor.y*25+1,23,23);
  ex.fillStyle='#000';ex.fillRect(700,0,100,600);
  const side=t('editorSide').slice();side[6]=`${side[6]}: ${String(editor.current+1).padStart(2,'0')}`;side.forEach((txt,i)=>yellow(ex,700,i*15,txt));
  if(editor.swapLevel!==-1)yellow(ex,760,11*15,`:${String(editor.swapLevel+1).padStart(2,'0')}`);
  if(editor.kind==='COOP')blue(ex,710,250,t('cooperative'));else blue(ex,725,250,t('duel'));
  if(editor.changed)blue(ex,705,270,t('unsaved'));
  if(!editor.isPlayable()){blue(ex,715,222,t('disabled'));}
  for(let i=0;i<10;i++){yellow(ex,720,297+i*30,String(i));ex.drawImage(skin,i*25,0,25,25,750,292+i*30,25,25);}
  ex.fillStyle='rgb(170,170,210)';ex.fillRect(227,583,244,13);ex.fillStyle='#000';ex.fillRect(228,584,242,11);blue(ex,310,585,t('editorFooter'));
  $('#editorLevel').textContent=`${editor.filename||t('newLevels')} · ${editor.kind==='COOP'?t('cooperative'):t('duel')} · ${t('level').toLowerCase()} ${editor.current+1}/20 · ${t('item')} ${editorBrush}`;
  if(editorPicker)drawEditorPicker();if(editorOverlay)drawEditorOverlay();
}
function validCursor(x,y){if(x<1||x>MAPW-2||y<1||y>MAPH-2)return false;if((x===1||x===MAPW-2)&&(y===1||y===MAPH-2))return false;return true;}
function openEditor(){newEditor();$('#editorDialog').showModal();renderEditor();}
function closeEditor(){editorOverlay=null;editorPicker=null;$('#editorDialog').close();menuState='main';}

async function loadLocalEditorFile(){
  if('showOpenFilePicker' in window){
    try{
      const [h]=await window.showOpenFilePicker({multiple:false,types:[{description:t('fileDescription'),accept:{'application/octet-stream':['.COOP','.DUEL']}}]});
      const f=await h.getFile();await importEditorFile(f,h);return;
    }catch(e){if(e?.name==='AbortError')return;}
  }
  $('#editorFile').click();
}
async function importEditorFile(file,handle=null){
  try{
    const bytes=new Uint8Array(await file.arrayBuffer()),kind=file.name.toUpperCase().endsWith('.DUEL')?'DUEL':'COOP';
    editor.loadBytes(bytes,kind,file.name.replace(/\.(COOP|DUEL)$/i,''));editorLoadedKind=kind;editorFileHandle=handle;exCursor={x:2,y:1};renderEditor();
  }catch(err){editorMessage(localizeEditorMessage(err.message)||t('loadFailed'));}
}
function loadBundledEditorSet(item){editor.loadDef(item.d,item.kind);editorLoadedKind=item.kind;editorFileHandle=null;exCursor={x:2,y:1};editorPicker=null;renderEditor();}
function editorValidateAnd(action){const v=editor.validateForSave();if(!v.ok){editorMessage(localizeEditorMessage(v.message));return;}editorQuery(t('confirm'),action);}
async function saveBytesToHandle(handle,bytes){const w=await handle.createWritable();await w.write(bytes);await w.close();editor.changed=false;editorLoadedKind=editor.kind;editorFileHandle=handle;renderEditor();}
async function saveEditorAs(){
  const bytes=editor.exportBytes(),base=(editor.filename||'NJAMLEVELS').replace(/[^A-Za-z0-9 _-]/g,'').slice(0,23)||'NJAMLEVELS',suggested=`${base}.${editor.kind}`;
  if('showSaveFilePicker' in window){
    try{const h=await window.showSaveFilePicker({suggestedName:suggested,types:[{description:t('fileDescription'),accept:{'application/octet-stream':[`.${editor.kind}`]}}]});await saveBytesToHandle(h,bytes);editor.filename=base;return;}catch(e){if(e?.name==='AbortError')return;}
  }
  const blob=new Blob([bytes],{type:'application/octet-stream'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=suggested;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);editor.changed=false;editorLoadedKind=editor.kind;editor.filename=base;renderEditor();
}
async function saveEditor(){
  if(editorFileHandle&&editor.kind===editorLoadedKind){try{await saveBytesToHandle(editorFileHandle,editor.exportBytes());return;}catch{}}
  await saveEditorAs();
}
function startEditorTest(){
  const v=editor.validateCurrent();if(!v.ok){editorMessage(localizeEditorMessage(v.message)+(v.message.includes('PLAYABLE')?t('pressP'):''));return;}
  const def=editor.toLevelSetDef('EDITORTEST');$('#editorDialog').close();game.setSkin(settings.skin);game.setSoundEnabled(settings.sound);showPlay();stopMusic();game.startEditorTest(def,editor.current,editor.kind);
}
function editorToggleKind(){editor.kind=editor.kind==='COOP'?'DUEL':'COOP';editor.changed=true;renderEditor();}

$('#editorClose').onclick=()=>{if(editor.changed)editorQuery(t('confirmExit'),closeEditor);else closeEditor();};
$('#editorDialog').addEventListener('cancel',e=>{e.preventDefault();$('#editorClose').click();});
$('#editorLoad').onclick=openEditorPicker;$('#editorSave').onclick=()=>editorValidateAnd(saveEditor);$('#editorSaveAs').onclick=()=>editorValidateAnd(saveEditorAs);
$('#editorFile').onchange=async e=>{const f=e.target.files[0];if(f)await importEditorFile(f,null);e.target.value='';};
ec.addEventListener('pointerdown',e=>{
  if(editorOverlay||editorPicker)return;const r=ec.getBoundingClientRect(),px=(e.clientX-r.left)*800/r.width,py=(e.clientY-r.top)*600/r.height,x=Math.floor(px/25),y=Math.floor(py/25);
  if(x===30&&py>=292&&py<592){editorBrush=Math.max(0,Math.min(9,Math.floor((py-292)/30)));renderEditor();return;}
  if(validCursor(x,y)){exCursor={x,y};editor.setTile(x,y,editorBrush);renderEditor();}
});

function handleEditorKey(e){
  const k=e.key;e.preventDefault();
  if(editorOverlay){
    if(editorOverlay.type==='message'){const a=editorOverlay.after;editorOverlay=null;renderEditor();if(a)a();return;}
    if(editorOverlay.type==='query'){
      if(k.toLowerCase()==='y'||(settings.lang==='it'&&k.toLowerCase()==='s')){const fn=editorOverlay.yes;editorOverlay=null;renderEditor();if(fn)fn();}
      else if(k.toLowerCase()==='n'||k==='Escape'){const fn=editorOverlay.no;editorOverlay=null;renderEditor();if(fn)fn();}
      return;
    }
  }
  if(editorPicker){
    if(k==='ArrowUp'&&editorPicker.selected>0)editorPicker.selected--;else if(k==='ArrowDown'&&editorPicker.selected<editorPicker.items.length-1)editorPicker.selected++;
    else if(k==='Escape')editorPicker=null;else if(k==='Enter'){const item=editorPicker.items[editorPicker.selected];if(item.kind==='FILE'){editorPicker=null;loadLocalEditorFile();}else loadBundledEditorSet(item);}renderEditor();return;
  }
  if(k==='Escape'){if(editor.changed)editorQuery(t('confirmExit'),closeEditor);else closeEditor();return;}
  if(k==='ArrowUp'&&validCursor(exCursor.x,exCursor.y-1))exCursor.y--;
  else if(k==='ArrowDown'&&validCursor(exCursor.x,exCursor.y+1))exCursor.y++;
  else if(k==='ArrowLeft'&&validCursor(exCursor.x-1,exCursor.y))exCursor.x--;
  else if(k==='ArrowRight'&&validCursor(exCursor.x+1,exCursor.y))exCursor.x++;
  else if(/^[0-9]$/.test(k)){editorBrush=+k;editor.setTile(exCursor.x,exCursor.y,editorBrush);}
  else if(k.toLowerCase()==='k')editorToggleKind();
  else if(k.toLowerCase()==='p')editor.togglePlayable();
  else if(k.toLowerCase()==='c')editor.clear();
  else if(k.toLowerCase()==='u')editor.undo();
  else if(k.toLowerCase()==='l'){openEditorPicker();return;}
  else if(k.toLowerCase()==='s'){editorValidateAnd(saveEditor);return;}
  else if(k.toLowerCase()==='a'){editorValidateAnd(saveEditorAs);return;}
  else if(k.toLowerCase()==='z')editor.previous();
  else if(k.toLowerCase()==='x')editor.next();
  else if(k.toLowerCase()==='t'){startEditorTest();return;}
  else if(k.toLowerCase()==='w'){const r=editor.swap();if(r==='swapped')editorMessage(t('swapped'));}
  renderEditor();
}

// Initial menu state.
applyLanguage();
showMenu();
