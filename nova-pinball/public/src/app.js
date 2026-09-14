// SPDX-License-Identifier: GPL-3.0-or-later
import { clamp, circleSegment, circleCircle, circlePair, closestOnSegment, transformedFlipper } from './physics.js';
import { ballCameraTarget, fullTableTransform, lowestBallY } from './camera.js';
import { HistoricalGameplay } from './gameplay.js';
import { CleanAudio } from './audio.js';
import { ModernMusic, MUSIC_TRACKS } from './music.js';
import { drawDotText, dotTextWidth } from './dotfont.js';
import { DEFAULT_SCORES, insertScore, normalizeScores, qualifies } from './scores.js';
import { getStored, setStored } from './storage.js';

const canvas=document.querySelector('#game');
const ctx=canvas.getContext('2d');
const scoreEl=document.querySelector('#score');
const ballsEl=document.querySelector('#balls');
const statusEl=document.querySelector('#status');
const missionEl=document.querySelector('#mission');
const overlayEl=document.querySelector('#overlay');
const safeBadge=document.querySelector('#safeBadge');
const tiltBadge=document.querySelector('#tiltBadge');
const nudgeBtn=document.querySelector('#nudgeBtn');
const fullscreenBtn=document.querySelector('#fullscreenBtn');
const musicBtn=document.querySelector('#musicBtn');

const CFG={
  gravity:12*64,
  radius:15,
  velocityMax:1000,
  wallRestitution:.4,
  gateRestitution:.25,
  kickerRestitution:4,
  fixedDt:1/240,
  maxFrame:.04,
};

let table, walls=[], bumpers=[], kickers=[], triggers=[], gates=[], flippers=[];
let balls=[], running=false, ballsLeft=6, nextBallId=1, pendingBallAdds=0;
let accumulator=0, last=performance.now();
let keys={left:false,right:false};
let nudgeCount=0, nudgeTimer=0, tilt=false;
let cameraMode=getStored('nova-camera-mode')==='table'?'table':'ball';
let missionHints=['led','lights','both','none'].includes(getStored('nova-mission-hints'))?getStored('nova-mission-hints'):'both';
let cameraY=null, cameraShake=0;
let previewActive=false, previewY=0;
let gameOverActive=false, gameOverOffset=0;
let missionLedTimer=0;
const led={queue:[],current:null,height:36};
let aboutIndex=0, aboutNextAt=0;
let lang=getStored('nova-lang')||((navigator.language||'it').toLowerCase().startsWith('it')?'it':'en');
let notice='', noticeUntil=0;
let particles=[],floaters=[];
let uiMode='menu';
let overlayReturn='menu';
let gameSessionActive=false;
let lastFinishedScore=null;
let highlightScoreIndex=-1;
let scores=loadScores();
let sfxEnabled=getStored('nova-sfx')!=='off';
let musicChoice=MUSIC_TRACKS[getStored('nova-music')]?getStored('nova-music'):'none';
let musicVolume=Math.max(0,Math.min(1,Number(getStored('nova-music-volume','0.36'))||0.36));
const audio=new CleanAudio();
audio.setEnabled(sfxEnabled);
const music=new ModernMusic({choice:musicChoice,volume:musicVolume});
const game=new HistoricalGameplay();

function loadScores(){
  try{return normalizeScores(JSON.parse(getStored('nova-scores','null')));}catch{return DEFAULT_SCORES.map(x=>({...x}));}
}
function saveScores(){setStored('nova-scores',JSON.stringify(scores));}

const TXT={
  it:{
    start:'Premi SPAZIO per iniziare',welcome:'Benvenuto in Nova Pinball!',launchPrompt:'Premi SPAZIO per lanciare la pallina',play:'Fai andare la stella in Nova',drain:'Pallina persa — premi SPAZIO',over:'Partita finita — premi SPAZIO',tilt:'TILT',saved:'Pallina salvata — Safe Mode',
    points:'Punti',balls:'Palline',initialsColumn:'Sigla',newGame:'Nuova partita',left:'◀ FLIP',launch:'LANCIA',nudge:'COLPO',right:'FLIP ▶',keys:'Z / M (o frecce): flipper',spaceHelp:'Spazio: avvio / colpo al tavolo · Esc: pausa',cameraBall:'Vista: Pallina',cameraTable:'Vista: Tavolo',soundOn:'Suoni: Sì',soundOff:'Suoni: No',fullscreen:'Schermo intero',exitFullscreen:'Esci fullscreen',fullscreenSetting:'Schermo intero',menu:'Menu',continue:'Continua',playNow:'Gioca',scores:'Classifica',settings:'Impostazioni',about:'Info',back:'Indietro',paused:'PAUSA',resume:'Riprendi',restart:'Nuova partita',cameraSetting:'Vista',soundSetting:'Effetti sonori',hintsSetting:'Suggerimenti missione',musicSetting:'Musica',yes:'Sì',no:'No',hintsLed:'LED',hintsLights:'Luci',hintsBoth:'Entrambi',hintsNone:'Nessuno',musicUnavailable:'Non inclusa',musicVolume:'Volume musica',highScores:'Migliori punteggi',initialsTitle:'Nuovo record',initialsHelp:'Inserisci fino a 3 lettere o numeri.',save:'Salva',finalScore:'Punteggio finale',safe:'SAFE MODE',aboutText:'Fai evolvere la stella completando le missioni del tavolo. Sei palline, tilt, wormhole e multiball.',
    objective:'Obiettivo',nova:'completa NOVA',leftRamp:'rampa sinistra',rightRamp:'rampa destra',leftTargets:'completa i target a sinistra',rightTargets:'completa i target a destra',leftBumper:'colpisci il bumper sinistro',middleBumper:'colpisci il bumper centrale',rightBumper:'colpisci il bumper destro',blackHole:'entra nel Buco Nero',waitFusion:'fusione in corso',waitMatter:'Matter Jettison',scoreMore:'continua a fare punti',
    wordBonus:'NOVA! Bonus parola',redGiant:'Stella evoluta in Gigante Rossa',hydrogen:'Idrogeno rilasciato',fusion1:'Prima fase di fusione completata',fusion2:'Seconda fase di fusione completata',fusionBurn:'Fusione attiva',fusionUnstable:'Fusione instabile',collapse:'Stella in collasso — Buco Nero creato',gravityLock:'Gravity Lock Bonus',wormhole:'Allarme Wormhole!',supergravity:'Supergravity Bonus',matter:'Matter Jettison — conquista un’altra pallina',multiball:'MULTIBALL! Bonus',
    missionRed:'Gigante Rossa',missionHydrogen:'Rilascio Idrogeno',missionFusion1:'Fusione I',missionFusion2:'Fusione II',missionBurn:'Fusione',missionUnstable:'Fusione Instabile',missionCollapse:'Collasso',missionWormhole:'Wormhole',missionReset:'Supergravity',missionMatterNotice:'Matter Jettison',missionMatter:'Pallina Bonus'
  },
  en:{
    start:'Press SPACE to start',welcome:'Welcome to Nova Pinball!',launchPrompt:'Hit SPACE to launch the ball',play:'Make the star go Nova',drain:'Ball drained — press SPACE',over:'Game over — press SPACE',tilt:'TILT',saved:'Ball saved — Safe Mode',
    points:'Score',balls:'Balls',initialsColumn:'Name',newGame:'New game',left:'◀ FLIP',launch:'LAUNCH',nudge:'NUDGE',right:'FLIP ▶',keys:'Z / M (or arrows): flippers',spaceHelp:'Space: start / nudge table · Esc: pause',cameraBall:'View: Ball',cameraTable:'View: Table',soundOn:'Sounds: On',soundOff:'Sounds: Off',fullscreen:'Fullscreen',exitFullscreen:'Exit fullscreen',fullscreenSetting:'Fullscreen',menu:'Menu',continue:'Continue',playNow:'Play',scores:'High scores',settings:'Settings',about:'About',back:'Back',paused:'PAUSED',resume:'Resume',restart:'New game',cameraSetting:'View',soundSetting:'Sound effects',hintsSetting:'Mission Hints',musicSetting:'Music',yes:'On',no:'Off',hintsLed:'LED',hintsLights:'Lights',hintsBoth:'Both',hintsNone:'None',musicUnavailable:'Not included',musicVolume:'Music volume',highScores:'High scores',initialsTitle:'New high score',initialsHelp:'Enter up to 3 letters or numbers.',save:'Save',finalScore:'Final score',safe:'SAFE MODE',aboutText:'Evolve the star by completing the table missions. Six balls, tilt, wormhole and multiball.',
    objective:'Goal',nova:'complete NOVA',leftRamp:'left ramp',rightRamp:'right ramp',leftTargets:'complete left targets',rightTargets:'complete right targets',leftBumper:'hit left bumper',middleBumper:'hit middle bumper',rightBumper:'hit right bumper',blackHole:'enter the Black Hole',waitFusion:'fusion in progress',waitMatter:'Matter Jettison',scoreMore:'keep scoring',
    wordBonus:'NOVA! Word Bonus',redGiant:'Star evolved into a Red Giant',hydrogen:'Hydrogen released',fusion1:'Fusion first stage complete',fusion2:'Fusion second stage complete',fusionBurn:'Fusion burning',fusionUnstable:'Fusion unstable',collapse:'Star collapsing — Black Hole created',gravityLock:'Gravity Lock Bonus',wormhole:'Wormhole Alert!',supergravity:'Supergravity Bonus',matter:'Matter Jettison — score another ball',multiball:'MULTIBALL! Bonus',
    missionRed:'Red Giant',missionHydrogen:'Hydrogen Release',missionFusion1:'Fusion I',missionFusion2:'Fusion II',missionBurn:'Fusion Burn',missionUnstable:'Fusion Unstable',missionCollapse:'Collapse',missionWormhole:'Wormhole',missionReset:'Supergravity',missionMatterNotice:'Matter Jettison',missionMatter:'Bonus Ball'
  }
};
function tx(k){return TXT[lang][k];}
function fmt(n){return n.toLocaleString(lang==='it'?'it-IT':'en-US');}

function ledClear(){led.queue=[];led.current=null;}
function ledAdd(message,{priority=false,sticky=false,long=false}={}){
  if(!message)return;
  if(led.current?.message===message)return;
  const item={message,sticky,long,direction:'up',y:led.height,timer:0};
  if(priority){
    if(led.current?.sticky)led.current.sticky=false;
    led.queue.unshift(item);
  }else led.queue.push(item);
}
function updateLed(dt){
  if(!led.current&&led.queue.length)led.current=led.queue.shift();
  const m=led.current;if(!m)return;
  if(m.direction==='up'){
    m.y-=dt*150;
    if(m.y<=0){m.y=0;m.direction='wait';m.timer=1.5*(m.long?3:1);}
  }else if(m.direction==='wait'&&!m.sticky){
    m.timer-=dt;if(m.timer<=0)m.direction='down';
  }else if(m.direction==='down'){
    m.y+=dt*150;if(m.y>=led.height)led.current=null;
  }
}
function missionHintsUsesLed(){return missionHints==='led'||missionHints==='both';}
function ledHintText(){
  const signal=game.nextSignal;
  if(signal==='wait'){const words=lang==='it'?['Continua così','Ottimo','Non perdere la pallina','Sei nella zona']:['Keep it up','Looking good',"Don't drop that ball",'You are in the Zone'];return words[Math.floor(Math.random()*words.length)];}
  if(signal==='nova word')return lang==='it'?'Completa la parola NOVA':'Complete the NOVA word bonus';
  const label=objectiveText().replace(/^.*?:\s*/, '');
  return lang==='it'?`Mira a: ${label}`:`Shoot for the ${label}`;
}
function missionHintsUsesLights(){return missionHints==='lights'||missionHints==='both';}
function hintLabel(){return {led:tx('hintsLed'),lights:tx('hintsLights'),both:tx('hintsBoth'),none:tx('hintsNone')}[missionHints];}
const MUSIC_CHOICES=['none','dreamy','arcade','wormhole','playlist'];
function musicLabel(){if(musicChoice==='none')return lang==='it'?'Nessuna':'None';if(musicChoice==='playlist')return 'Playlist';return MUSIC_TRACKS[musicChoice]?.label||musicChoice;}
function updateMusicButton(){
  if(!musicBtn)return;
  const label=musicLabel();
  musicBtn.textContent=`♫ ${label}`;
  musicBtn.title=lang==='it'?`Musica: ${label} · clicca per cambiare`:`Music: ${label} · click to change`;
  musicBtn.setAttribute('aria-label',musicBtn.title);
}
function cycleMusic(){musicChoice=MUSIC_CHOICES[(MUSIC_CHOICES.indexOf(musicChoice)+1)%MUSIC_CHOICES.length];setStored('nova-music',musicChoice);music.setChoice(musicChoice);music.unlock();updateMusicButton();renderOverlay();}
function cycleMusicVolume(){const vals=[.2,.36,.5,.7];let i=vals.findIndex(v=>Math.abs(v-musicVolume)<.01);musicVolume=vals[(i+1+vals.length)%vals.length];setStored('nova-music-volume',String(musicVolume));music.setVolume(musicVolume);renderOverlay();}
function cycleMissionHints(){
  const vals=['led','lights','both','none'];missionHints=vals[(vals.indexOf(missionHints)+1)%vals.length];
  setStored('nova-mission-hints',missionHints);renderOverlay();
}
function settingsDetail(action){
  if(action==='camera')return cameraMode==='ball'?(lang==='it'?'Vista ravvicinata che segue la pallina':'Zoomed in and follows the ball'):(lang==='it'?'Tavolo completo visibile':'Zoomed out, full table visible');
  if(action==='hints')return {led:lang==='it'?'Suggerimenti nel display LED':'Hints in the LED display',lights:lang==='it'?'Illumina il prossimo obiettivo':'Lights up the next goal',both:lang==='it'?'Parole e luci':'Words & Lights',none:lang==='it'?'Nessun suggerimento (modalità esperto)':'No Mission Hints (Expert Mode)'}[missionHints];
  if(action==='sound')return lang==='it'?'Attiva o disattiva gli effetti sonori':'Turn sound effects on or off';
  if(action==='fullscreen')return lang==='it'?'Alterna finestra e schermo intero':'Toggle window and fullscreen';
  if(action==='music')return lang==='it'?'Scegli la musica di sottofondo':'Choose the background music';
  if(action==='music-volume')return lang==='it'?'Regola il volume della musica':'Adjust the music volume';
  return '';
}
const ABOUT_LINES={
  it:[['NOVA PINBALL','VERSIONE 0.2.3'],['CREATO DA','Wesley "Keyboard Monkey" Werner'],['OBIETTIVO','Fai andare la stella in Nova'],['CONTROLLI','Z e M: flipper · SPAZIO: lancio e colpo'],['MISSIONI','Segui il display e le luci del tavolo'],['MUSICA','Scegli la tua preferita nelle Impostazioni'],['BUON DIVERTIMENTO','Fai il punteggio più alto!']],
  en:[['NOVA PINBALL','VERSION 0.2.3'],['CREATED BY','Wesley "Keyboard Monkey" Werner'],['GOAL','Make the star go Nova'],['CONTROLS','Z and M: flippers · SPACE: launch and nudge'],['MISSIONS','Follow the display and table lights'],['MUSIC','Choose your favourite in Settings'],['HAVE FUN','Go for the high score!']]
};
function missionTitleText(){
  const key={
    'red giant':'missionRed','hydrogen release':'missionHydrogen','fusion stage 1':'missionFusion1','fusion stage 2':'missionFusion2',
    'fusion burn':'missionBurn','fusion unstable':'missionUnstable','collapse star':'missionCollapse','wormhole':'missionWormhole','reset':'missionReset',
    'bonus ball notice':'missionMatterNotice','bonus ball':'missionMatter'
  }[game.mission?.title];
  return key?tx(key):'Nova';
}
function fullscreenActive(){return !!document.fullscreenElement;}
function objectiveText(){
  const signal=game.nextSignal;
  let text=tx('scoreMore');
  if(signal==='wait'){
    const label=game.mission?.title==='bonus ball notice'?tx('waitMatter'):tx('waitFusion');
    text=`${label}: ${Math.ceil(game.waitSeconds)} s`;
  } else if(signal==='nova word') text=tx('nova');
  else if(signal==='left ramp') text=tx('leftRamp');
  else if(signal==='right ramp') text=tx('rightRamp');
  else if(signal==='left targets') text=tx('leftTargets');
  else if(signal==='right targets') text=tx('rightTargets');
  else if(signal==='left bumper') text=tx('leftBumper');
  else if(signal==='middle bumper') text=tx('middleBumper');
  else if(signal==='right bumper') text=tx('rightBumper');
  else if(signal==='black hole') text=tx('blackHole');
  return `${tx('objective')}: ${text}`;
}
function updateBadges(){
  safeBadge.hidden=!(game.safeMode>0 && gameSessionActive);
  if(!safeBadge.hidden) safeBadge.textContent=`${tx('safe')} ${Math.ceil(game.safeMode)}s`;
  tiltBadge.hidden=!tilt;
}
function refreshHUD(){
  scoreEl.textContent=fmt(game.score);
  ballsEl.textContent=ballsLeft;
  const progress=game.mission?.needs?.length?` · ${Math.min(game.missionProgress.length+1,game.mission.needs.length)}/${game.mission.needs.length}`:'';
  missionEl.textContent=`${missionTitleText()} · ${objectiveText()}${game.nextSignal==='wait'?'':progress}`;
  nudgeBtn.textContent=(running&&balls.length>0)?tx('nudge'):tx('launch');
  updateBadges();
}
function applyLang(){
  document.documentElement.lang=lang;
  document.querySelector('.stats span:nth-child(1) small').textContent=tx('points');
  document.querySelector('.stats span:nth-child(2) small').textContent=tx('balls');
  document.querySelector('#leftBtn').textContent=tx('left');
  nudgeBtn.textContent=(running&&balls.length>0)?tx('nudge'):tx('launch');
  document.querySelector('#rightBtn').textContent=tx('right');
  const hs=document.querySelectorAll('footer span');hs[0].textContent=tx('keys');hs[1].textContent=tx('spaceHelp');
  document.querySelector('#langBtn').textContent=lang==='it'?'EN':'IT';
  document.querySelector('#cameraBtn').textContent=cameraMode==='ball'?tx('cameraBall'):tx('cameraTable');
  document.querySelector('#soundBtn').textContent=sfxEnabled?tx('soundOn'):tx('soundOff');
  updateMusicButton();
  fullscreenBtn.textContent=fullscreenActive()?tx('exitFullscreen'):tx('fullscreen');
  fullscreenBtn.hidden=!document.fullscreenEnabled;
  document.querySelector('#menuBtn').textContent=tx('menu');
  if(uiMode==='play'&&!running&&balls.length===0) statusEl.textContent=ballsLeft<=0?tx('over'):tx('start');
  refreshHUD();
  if(uiMode!=='play') renderOverlay();
}
function scoreRows(){
  return scores.map((entry,i)=>`<tr class="${i===highlightScoreIndex?'new-score':''}"><td>${entry.initials||'---'}</td><td>${fmt(entry.score)}</td><td>${entry.date}</td></tr>`).join('');
}
function scoreTable(){
  return `<table class="score-table retro-scores"><thead><tr><th>${tx('initialsColumn')}</th><th>${tx('points')}</th><th>${lang==='it'?'Data':'Date'}</th></tr></thead><tbody>${scoreRows()}</tbody></table>`;
}
function overlayAction(action){
  audio.play('menu');
  if(action==='play'){startNewGame();return;}
  if(action==='continue'){resumeGame();return;}
  if(action==='scores'){overlayReturn=uiMode==='paused'?'paused':'menu';uiMode='scores';renderOverlay();return;}
  if(action==='settings'){overlayReturn=uiMode==='paused'?'paused':'menu';uiMode='settings';renderOverlay();return;}
  if(action==='about'){overlayReturn=uiMode==='paused'?'paused':'menu';uiMode='about';aboutIndex=0;aboutNextAt=performance.now()+3000;renderOverlay();return;}
  if(action==='about-next'){aboutIndex=(aboutIndex+1)%ABOUT_LINES[lang].length;aboutNextAt=performance.now()+3000;renderOverlay();return;}
  if(action==='menu'){uiMode='menu';releaseControls();renderOverlay();return;}
  if(action==='resume'){resumeGame();return;}
  if(action==='restart'){startNewGame();return;}
  if(action==='camera'){toggleCamera();renderOverlay();return;}
  if(action==='hints'){cycleMissionHints();return;}
  if(action==='sound'){toggleSound();renderOverlay();return;}
  if(action==='music'){cycleMusic();return;}
  if(action==='music-volume'){cycleMusicVolume();return;}
  if(action==='fullscreen'){toggleFullscreen();return;}
  if(action==='back'){uiMode=overlayReturn;renderOverlay();return;}
  if(action==='save-score'){saveInitials();return;}
}
function renderOverlay(){
  if(uiMode==='play'){overlayEl.classList.remove('visible');overlayEl.innerHTML='';return;}
  overlayEl.classList.add('visible');
  let html='';
  if(uiMode==='menu'){
    const first=gameSessionActive?`<button class="primary" data-action="continue">${tx('continue')}</button>`:`<button class="primary" data-action="play">${tx('playNow')}</button>`;
    html=`<div class="panel menu-panel"><div class="retro-menu">${first}<button data-action="scores">${tx('scores')}</button><button data-action="settings">${tx('settings')}</button><button data-action="about">${tx('about')}</button></div></div>`;
  }else if(uiMode==='paused'){
    html=`<div class="panel pause-panel"><h2>${tx('paused')}</h2><p style="text-align:center">${tx('finalScore')}: <strong>${fmt(game.score)}</strong></p><div class="retro-menu"><button class="primary" data-action="resume">${tx('resume')}</button><button data-action="settings">${tx('settings')}</button><button data-action="menu">${tx('menu')}</button><button data-action="restart">${tx('restart')}</button></div></div>`;
  }else if(uiMode==='scores'){
    html=`<div class="panel"><h2>${tx('highScores')}</h2>${scoreTable()}<div class="retro-menu"><button class="primary" data-action="back">${tx('back')}</button></div></div>`;
  }else if(uiMode==='settings'){
    html=`<div class="panel"><h2>${tx('settings')}</h2><div class="retro-menu settings-retro"><button class="primary" data-detail="camera" data-action="camera">${tx('cameraSetting')}: ${cameraMode==='ball'?(lang==='it'?'Pallina':'Ball'):(lang==='it'?'Tavolo':'Table')}</button><button data-detail="hints" data-action="hints">${tx('hintsSetting')}: ${hintLabel()}</button>${document.fullscreenEnabled?`<button data-detail="fullscreen" data-action="fullscreen">${lang==='it'?'Schermo':'Screen'}: ${fullscreenActive()?(lang==='it'?'Intero':'Full Screen'):(lang==='it'?'Finestra':'Window')}</button>`:''}<button data-detail="sound" data-action="sound">${lang==='it'?'Suoni di gioco':'Game Sounds'}: ${sfxEnabled?tx('yes'):tx('no')}</button><button data-detail="music" data-action="music">${tx('musicSetting')}: ${musicLabel()}</button><button data-detail="music-volume" data-action="music-volume">${tx('musicVolume')}: ${Math.round(musicVolume*100)}%</button><button data-action="back">${tx('back')}</button></div><p id="settingDetail" class="retro-detail">${settingsDetail('camera')}</p></div>`;
  }else if(uiMode==='about'){
    const line=ABOUT_LINES[lang][aboutIndex%ABOUT_LINES[lang].length];
    html=`<div class="panel"><div class="about-stage" data-action="about-next"><div class="about-heading">${line[0]}</div><div class="about-detail">${line[1]}</div></div><p class="small-note" style="text-align:center">${lang==='it'?'Spazio/click: avanti · Esc: indietro':'Space/click: next · Esc: back'}</p><div class="retro-menu"><button data-action="back">${tx('back')}</button></div></div>`;
  }else if(uiMode==='initials'){
    html=`<div class="panel"><h2>${tx('initialsTitle')}</h2><p style="text-align:center">${tx('finalScore')}: <strong>${fmt(lastFinishedScore||0)}</strong></p><p style="text-align:center">${tx('initialsHelp')}</p><form id="initialsForm" class="initials-form"><input id="initialsInput" maxlength="3" inputmode="text" autocomplete="off" aria-label="Initials"><button type="submit">${tx('save')}</button></form>${scoreTable()}</div>`;
  }
  overlayEl.innerHTML=html;
  const focusables=[...overlayEl.querySelectorAll('button:not([disabled]),input')];
  if(uiMode!=='initials')focusables[0]?.focus({preventScroll:true});
  overlayEl.querySelectorAll('[data-detail]').forEach(el=>{
    const apply=()=>{const d=document.querySelector('#settingDetail');if(d)d.textContent=settingsDetail(el.dataset.detail);};
    el.addEventListener('focus',apply);el.addEventListener('pointerenter',apply);
  });
  if(uiMode==='initials'){
    const input=document.querySelector('#initialsInput');
    const form=document.querySelector('#initialsForm');
    input?.focus();
    input?.addEventListener('input',()=>{input.value=input.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3);});
    form?.addEventListener('submit',e=>{e.preventDefault();saveInitials();});
  }
}
function releaseControls(){
  keys.left=false;keys.right=false;
  document.querySelector('#leftBtn')?.classList.remove('active');
  document.querySelector('#rightBtn')?.classList.remove('active');
}
function pauseForInterruption(){
  releaseControls();
  // Historical game-over already owns the screen/timing; do not replace it with the pause overlay.
  if(uiMode==='play'&&gameSessionActive&&!gameOverActive)pauseGame();
}
function startNewGame(){
  resetGame();previewActive=true;previewY=0;gameSessionActive=true;overlayReturn='menu';uiMode='play';lastFinishedScore=null;highlightScoreIndex=-1;renderOverlay();applyLang();
}
function pauseGame(){
  if(uiMode!=='play'||!gameSessionActive)return;
  releaseControls();uiMode='paused';renderOverlay();
}
function resumeGame(){
  if(!gameSessionActive)return startNewGame();
  uiMode='play';renderOverlay();last=performance.now();accumulator=0;
  statusEl.textContent=running?tx('play'):tx('start');
}
function beginGameOver(){
  if(gameOverActive)return;
  running=false;releaseControls();previewActive=false;gameOverActive=true;gameOverOffset=-Math.max(0,table.size.height-canvas.height);
  ledClear();ledAdd(lang==='it'?'FINE PARTITA':'GAME OVER',{priority:true,sticky:true});statusEl.textContent=tx('over');
}
function finishGame(){
  gameOverActive=false;running=false;gameSessionActive=false;releaseControls();lastFinishedScore=game.score;statusEl.textContent=tx('over');
  overlayReturn='menu';
  if(qualifies(game.score,scores)){uiMode='initials';highlightScoreIndex=-1;}
  else {uiMode='scores';highlightScoreIndex=-1;}
  renderOverlay();
}
function saveInitials(){
  const input=document.querySelector('#initialsInput');
  const initials=(input?.value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,3)||'---';
  const result=insertScore(scores,lastFinishedScore||0,initials);
  scores=result.scores;highlightScoreIndex=result.index;saveScores();overlayReturn='menu';uiMode='scores';renderOverlay();
}
function toggleCamera(){
  cameraMode=cameraMode==='ball'?'table':'ball';setStored('nova-camera-mode',cameraMode);cameraY=null;applyLang();
}
function toggleSound(){
  sfxEnabled=!sfxEnabled;setStored('nova-sfx',sfxEnabled?'on':'off');audio.setEnabled(sfxEnabled);if(sfxEnabled){audio.play('menu');}applyLang();
}
async function toggleFullscreen(){
  try{
    if(fullscreenActive()) await document.exitFullscreen();
    else if(document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
  }catch(err){console.warn('Fullscreen unavailable',err);}
  applyLang();
}

const flashUntil=new Map();
function localPoly(def, translate=true) {
  const out=[];
  for(let i=0;i<def.vertices.length;i+=2) out.push({x:def.vertices[i]+(translate?def.x:0),y:def.vertices[i+1]+(translate?def.y:0)});
  return out;
}
function segs(poly) { const r=[]; for(let i=0;i<poly.length-1;i++) r.push([poly[i],poly[i+1]]); return r; }
function setup(def) {
  table=def;
  walls=[];bumpers=[];kickers=[];triggers=[];gates=[];flippers=[];
  for(const c of def.components){
    if(c.type==='wall') walls.push({...c,poly:localPoly(c)});
    if(c.type==='bumper') bumpers.push(c);
    if(c.type==='kicker') kickers.push({...c,poly:localPoly(c)});
    if(c.type==='trigger') triggers.push({...c,poly:localPoly(c),contactId:`t-${c.x}-${c.y}-${c.tag||c.action||''}`});
    if(c.type==='gate') gates.push({...c,poly:localPoly(c)});
    if(c.type==='flipper') {
      const rest=c.orientation==='left'?30:-30;
      const active=c.orientation==='left'?-5:5;
      flippers.push({...c,angle:rest*Math.PI/180,omega:0,rest:rest*Math.PI/180,active:active*Math.PI/180});
    }
  }
  resetGame();
  uiMode='menu';renderOverlay();
}
function resetGame(){
  balls=[];running=false;ballsLeft=6;nextBallId=1;pendingBallAdds=0;
  tilt=false;nudgeCount=0;nudgeTimer=0;cameraY=null;cameraShake=0;notice='';noticeUntil=0;previewActive=false;previewY=0;gameOverActive=false;gameOverOffset=0;missionLedTimer=20;
  flashUntil.clear();particles=[];floaters=[];game.reset();releaseControls();
  ledClear();ledAdd(tx('welcome'),{long:true});ledAdd(tx('launchPrompt'),{sticky:true});
  statusEl.textContent=tx('start');
  for(const f of flippers){f.angle=f.rest;f.omega=0;}
  refreshHUD();
}
function createBall({launch=false}={}){
  const b={id:nextBallId++,x:table.ball.x,y:table.ball.y,vx:0,vy:0,r:CFG.radius,cooldown:0,contacts:new Set(),lock:null};
  balls.push(b);running=true;
  if(launch){
    tilt=false;nudgeCount=0;nudgeTimer=0;keys.left=false;keys.right=false;cameraY=null;notice='';noticeUntil=0;previewActive=false;
    ledClear();ledAdd(tx('play'),{priority:true});missionLedTimer=1;
  }
  statusEl.textContent=tx('play');
  if(launch)audio.play('launch');
  refreshHUD();
  return b;
}
function launchBall(){ return createBall({launch:true}); }
function queueBonusBall(){ pendingBallAdds++; }
function flushPendingBalls(){
  while(pendingBallAdds>0){pendingBallAdds--;createBall({launch:false});}
}
function showNotice(text,ms=1800){notice=text;noticeUntil=performance.now()+ms;statusEl.textContent=text;ledAdd(text,{priority:true,long:ms>2400});}
function spawnSparks(x,y,color='#d8dcff',count=8,power=105){
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2,s=power*(.35+Math.random()*.75),life=.28+Math.random()*.3;
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life,max:life,r:1+Math.random()*1.8,color});
  }
  if(particles.length>180)particles.splice(0,particles.length-180);
}
function spawnScore(x,y,points){
  if(!points)return;
  floaters.push({x,y,text:`+${fmt(points)}`,life:1,max:1});
  if(floaters.length>24)floaters.shift();
}
function updateEffects(dt){
  for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.exp(-dt*3.8);p.vy=p.vy*Math.exp(-dt*3.8)+25*dt;}
  particles=particles.filter(p=>p.life>0);
  for(const f of floaters){f.life-=dt;f.y-=34*dt;}
  floaters=floaters.filter(f=>f.life>0);
}
function processEvents(events,eventBall=null){
  for(const e of events){
    if(e.type==='score'&&eventBall)spawnScore(eventBall.x,eventBall.y,e.points);
    if(e.type==='score' && e.reason==='word-bonus'){showNotice(`${tx('wordBonus')} +${fmt(e.points)}`);audio.play('wordbonus');}
    if(e.type==='score' && e.reason==='gravity-lock'){showNotice(`${tx('gravityLock')} +${fmt(e.points)}`,1800);}
    if(e.type==='black-hole-lock' && eventBall){
      const sx=(Math.floor(Math.random()*3)-1)<0?-1:1;
      const sy=(Math.floor(Math.random()*12)-10)<0?-1:1;
      eventBall.lock={remaining:e.seconds||1,vx:(300+Math.random()*600)*sx,vy:(300+Math.random()*600)*sy};
      eventBall.x=310;eventBall.y=430;eventBall.vx=0;eventBall.vy=0;audio.play('blackhole-lock');
    }
    if(e.type==='multiball-release') queueBonusBall();
    if(e.type==='mission-complete'){
      const n={
        'red giant':'redGiant','hydrogen release':'hydrogen','fusion stage 1':'fusion1','fusion stage 2':'fusion2',
        'fusion burn':'fusionBurn','fusion unstable':'fusionUnstable','collapse star':'collapse','wormhole':'wormhole','reset':'supergravity',
        'bonus ball notice':'matter','bonus ball':'multiball'
      }[e.title];
      if(n){
        spawnSparks(eventBall?.x??310,eventBall?.y??430,e.title==='wormhole'?'#b9adff':'#ffd37d',e.title==='bonus ball'?28:18,e.title==='bonus ball'?190:145);
        const bonus=e.points?` +${fmt(e.points)}`:'';
        const long=['collapse star','wormhole','bonus ball notice','bonus ball'].includes(e.title);
        showNotice(`${tx(n)}${bonus}`,long?3000:2400);
        if(['hydrogen release','fusion stage 1','fusion stage 2'].includes(e.title))audio.play('hydrogen-released');
        else if(e.title==='collapse star')audio.play('blackhole');
        else if(e.title==='wormhole'){audio.play('wormhole');audio.play('timewarp');}
        else if(e.title==='reset'){audio.stopLoop('wormhole');audio.play('wormhole-close');audio.play('supergravity-bonus');}
      }
    }
  }
  refreshHUD();
}
function taggedContact(ball,tag,cooldown=.1){
  if(!tag || ball.cooldown>=0) return;
  ball.cooldown=Number.isFinite(Number(cooldown))?Number(cooldown):.1;
  flashUntil.set(tag,performance.now()+100);
  const sparkColor=tag.includes('kicker')?'#ef9cff':tag.includes('bumper')?'#cbd0ff':tag.includes('ramp')?'#ffe0a1':'#9ff6ff';
  spawnSparks(ball.x,ball.y,sparkColor,tag.includes('bumper')?9:5,tag.includes('bumper')?130:90);
  if(tag.includes('bumper')||tag.includes('kicker'))audio.play('bumper');
  else if(tag.includes('ramp'))audio.play('ramp');
  else if(tag==='wall')audio.play('wall');
  else if(['n','o','v','a','dot1','dot2','dot4','dot5'].includes(tag))audio.play('target');
  processEvents(game.hit(tag,tilt),ball);
}
function enterTrigger(ball,t){
  if(t.action==='slingshot'){ball.vx=0;ball.vy=-1000;}
  if(t.tag) taggedContact(ball,t.tag,t.cooldown ?? .1);
}
function applyNudge(countAsInput=true){
  if(tilt || balls.length===0) return;
  for(const b of balls){
    if(b.lock) continue;
    b.vy+=-100+Math.random()*100;
  }
  cameraShake=20;
  if(countAsInput)audio.play('nudge');
  if(countAsInput){
    nudgeCount++;nudgeTimer=5;
    if(nudgeCount>=3){tilt=true;keys.left=false;keys.right=false;statusEl.textContent=tx('tilt');ledAdd(tx('tilt'),{priority:true,sticky:true});updateBadges();}
  }
}
function drainBall(ball){
  const idx=balls.findIndex(b=>b.id===ball.id);
  if(idx<0)return;
  balls.splice(idx,1);
  audio.play('ball-drained');

  if(game.safeMode>0){
    // Historical v0.2.3 calls play.launchBall(false). With no balls left this
    // creates a replacement; during multiball it instead nudges the survivors.
    if(balls.length===0) launchBall();
    else applyNudge(true);
    showNotice(tx('saved'),2200);
    return;
  }

  // A multiball drain does not consume a player's numbered ball until the
  // final ball in play has drained.
  if(balls.length>0) return;

  ballsLeft--;refreshHUD();
  if(ballsLeft<=0){beginGameOver();}
  else {statusEl.textContent=tx('drain');ledAdd(lang==='it'?'Pallina persa':'Ball drained',{priority:true});}
}
function nudge(){
  if(uiMode!=='play'||!gameSessionActive)return;
  if(previewActive){previewActive=false;previewY=0;launchBall();return;}
  if(!running || balls.length===0){if(ballsLeft<=0)return;launchBall();return;}
  applyNudge(true);
}
function setKey(side,value){
  if(uiMode!=='play'){keys[side]=false;return;}
  if(tilt){keys[side]=false;return;}
  if(value&&!keys[side])audio.play('flipper');
  keys[side]=value;
}

function updateFlippers(dt){
  for(const f of flippers){
    const pressed=f.orientation==='left'?keys.left:keys.right;
    const target=pressed?f.active:f.rest;
    const delta=target-f.angle;
    const maxSpeed=13.5;
    const desired=clamp(delta*45,-maxSpeed,maxSpeed);
    f.omega+=(desired-f.omega)*Math.min(1,dt*45);
    const prev=f.angle;f.angle+=f.omega*dt;
    if((target-prev)*(target-f.angle)<=0){f.angle=target;f.omega=0;}
  }
}
function collideChain(ball,poly,restitution,surface={x:0,y:0},gateAction=null){
  let hit=false;
  for(const [a,b] of segs(poly)){
    if(gateAction==='left'&&ball.vx<0)continue;
    if(gateAction==='right'&&ball.vx>0)continue;
    if(circleSegment(ball,a,b,restitution,surface))hit=true;
  }
  return hit;
}
function collideFlipper(ball,f){
  const {pivot,verts}=transformedFlipper(f,f.angle);
  const edges=segs([...verts,verts[0]]);
  for(const [a,b] of edges){
    const q=closestOnSegment(ball.x,ball.y,a.x,a.y,b.x,b.y);
    const rx=q.x-pivot.x,ry=q.y-pivot.y;
    const sv={x:-f.omega*ry,y:f.omega*rx};
    circleSegment(ball,a,b,0.05,sv);
  }
}
function sensorHit(ball,poly){
  for(const [a,b] of segs(poly)){
    const q=closestOnSegment(ball.x,ball.y,a.x,a.y,b.x,b.y);
    if(Math.hypot(ball.x-q.x,ball.y-q.y)<=ball.r)return true;
  }
  return false;
}
function updateBall(ball,dt){
  ball.cooldown-=dt;
  if(ball.lock){
    ball.lock.remaining-=dt;
    ball.x=310;ball.y=430;ball.vx=0;ball.vy=0;
    if(ball.lock.remaining<=0){
      const release=ball.lock;ball.lock=null;ball.vx=release.vx;ball.vy=release.vy;ball.cooldown=.1;audio.play('blackhole-release');
    } else return;
  }

  const gravity=game.wormhole?(-0.2*64):CFG.gravity;
  ball.vy+=gravity*dt;
  if(game.wormhole){
    const damp=Math.exp(-dt);ball.vx*=damp;ball.vy*=damp;
  }
  ball.vx=clamp(ball.vx,-CFG.velocityMax,CFG.velocityMax);
  ball.vy=clamp(ball.vy,-CFG.velocityMax,CFG.velocityMax);
  ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;

  for(const w of walls){
    if(collideChain(ball,w.poly,CFG.wallRestitution)&&w.tag) taggedContact(ball,w.tag,w.cooldown ?? .1);
  }
  for(const g of gates){
    if(collideChain(ball,g.poly,CFG.gateRestitution,{x:0,y:0},g.action)&&g.tag) taggedContact(ball,g.tag,g.cooldown ?? .1);
  }
  for(const b of bumpers){
    if(circleCircle(ball,b.x,b.y,b.r,clamp(b.r/10,1,4))) taggedContact(ball,b.tag,b.cooldown ?? .1);
  }
  for(const k of kickers){
    if(collideChain(ball,k.poly,CFG.kickerRestitution)&&k.tag) taggedContact(ball,k.tag,k.cooldown ?? .1);
  }
  for(const f of flippers) collideFlipper(ball,f);

  const nextContacts=new Set();
  for(const t of triggers){
    if(sensorHit(ball,t.poly)){
      nextContacts.add(t.contactId);
      if(!ball.contacts.has(t.contactId)) enterTrigger(ball,t);
    }
  }
  ball.contacts=nextContacts;
}
function isDrained(ball){
  return ball.y>table.size.y2+200 || ball.x<table.size.x1-100 || ball.x>table.size.x2+100 || ball.y<table.size.y1-100;
}
function step(dt){
  if(uiMode!=='play')return;
  if(nudgeCount>0){nudgeTimer-=dt;if(nudgeTimer<=0){nudgeCount--;nudgeTimer=5;}}
  updateFlippers(dt);
  updateEffects(dt);
  if(running){
    const beforeWait=Math.ceil(game.waitSeconds);
    const missionEvents=game.update(dt);
    if(missionEvents.length) processEvents(missionEvents);
    if(Math.ceil(game.waitSeconds)!==beforeWait) refreshHUD();
  }
  if(!running||balls.length===0){flushPendingBalls();return;}

  const snapshot=[...balls];
  for(const b of snapshot) if(balls.some(x=>x.id===b.id)) updateBall(b,dt);

  // Box2D collides simultaneous balls as equal dynamic circle fixtures.
  for(let i=0;i<balls.length;i++){
    if(balls[i].lock)continue;
    for(let j=i+1;j<balls.length;j++) if(!balls[j].lock) circlePair(balls[i],balls[j],0);
  }

  const drained=balls.filter(isDrained);
  for(const b of drained) drainBall(b);
  flushPendingBalls();
}

function drawPoly(poly,stroke,width=3){ctx.beginPath();ctx.moveTo(poly[0].x,poly[0].y);for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i].x,poly[i].y);ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
function updateCamera(){
  if(previewActive){cameraY=previewY;return;}
  if(cameraMode!=='ball')return;
  const y=lowestBallY(balls);
  if(y!==null){const target=ballCameraTarget(table.size,y,canvas.height);if(cameraY===null)cameraY=target;else cameraY+=(target-cameraY)*0.1;}
  if(cameraY===null)cameraY=0;
  if(cameraShake>0.01)cameraShake*=0.5;else cameraShake=0;
}
function hintFor(tag){
  if(!missionHintsUsesLights())return false;
  const signal=game.nextSignal;
  if(signal==='nova word') return ['n','o','v','a'].includes(tag);
  if(signal==='left targets') return ['dot4','dot5'].includes(tag);
  if(signal==='right targets') return ['dot1','dot2'].includes(tag);
  return signal===tag;
}
function drawTarget(t,label,r=18){
  const on=game.targetOn(t.tag);
  const pulse=hintFor(t.tag) && Math.floor(performance.now()/500)%2===0;
  const outer=r+13;
  ctx.save();
  ctx.shadowColor=pulse?'#8fa3ff':'#4855a5';ctx.shadowBlur=pulse?18:9;
  ctx.beginPath();ctx.arc(t.x,t.y,outer,0,Math.PI*2);ctx.fillStyle='rgba(20,24,62,.72)';ctx.fill();
  ctx.shadowBlur=0;ctx.beginPath();ctx.arc(t.x,t.y,r+5,0,Math.PI*2);ctx.fillStyle=pulse?'#342f5c':'#020205';ctx.fill();
  ctx.strokeStyle=pulse?'#cfd6ff':'#303a8a';ctx.lineWidth=2;ctx.stroke();
  if(on){
    ctx.shadowColor='#8aff00';ctx.shadowBlur=10;ctx.fillStyle='#7deb00';
    drawDotText(ctx,label,t.x,t.y-7,{scale:2,gap:1,color:'#7deb00',align:'center'});
    ctx.shadowBlur=0;
  }
  ctx.restore();
}
function drawDotTarget(t){
  const on=game.targetOn(t.tag),pulse=hintFor(t.tag)&&Math.floor(performance.now()/500)%2===0;
  ctx.save();ctx.translate(t.x,t.y);ctx.scale(.72,1);
  ctx.shadowColor=on?'#88ff00':pulse?'#b9c1ff':'#272f77';ctx.shadowBlur=on?12:pulse?10:5;
  ctx.beginPath();ctx.arc(0,0,15,0,Math.PI*2);ctx.fillStyle=on?'#88ff00':pulse?'#cfd4ff':'#020205';ctx.fill();
  ctx.strokeStyle=on?'#caff8a':'#343d8d';ctx.lineWidth=2;ctx.stroke();ctx.restore();
}
function drawRampLamp(t,right=false){
  const pulse=hintFor(right?'right ramp':'left ramp')&&Math.floor(performance.now()/500)%2===0;
  ctx.save();ctx.translate(t.x,t.y);if(right)ctx.scale(-1,1);
  ctx.strokeStyle=pulse?'#d96a75':'#3d3d49';ctx.lineWidth=5;ctx.lineCap='butt';
  for(let i=-1;i<=1;i++){
    const y=i*26;ctx.beginPath();ctx.moveTo(-7,y-10);ctx.lineTo(5,y);ctx.lineTo(-7,y+10);ctx.stroke();
  }
  ctx.restore();
}
function drawPlayfieldBackground(){
  const x1=table.size.x1-20,y1=table.size.y1-20,w=660,h=1022,cx=310,cy=430;
  ctx.fillStyle='#000';ctx.fillRect(x1,y1,w,h);
  ctx.save();ctx.beginPath();ctx.rect(x1,y1,w,h);ctx.clip();
  ctx.strokeStyle='rgba(38,0,65,.78)';ctx.lineWidth=1;
  for(let i=0;i<164;i++){
    const a=(i/164)*Math.PI*2;const r0=75,r1=760;
    ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0);ctx.lineTo(cx+Math.cos(a)*r1,cy+Math.sin(a)*r1);ctx.stroke();
  }
  // Clean procedural echoes of the original blue decorative ramps/panels.
  ctx.fillStyle='#264472';
  ctx.beginPath();ctx.moveTo(55,90);ctx.bezierCurveTo(90,45,150,40,188,72);ctx.lineTo(188,153);ctx.bezierCurveTo(145,140,92,158,55,225);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(565,90);ctx.bezierCurveTo(530,45,470,40,432,72);ctx.lineTo(432,153);ctx.bezierCurveTo(475,140,528,158,565,225);ctx.closePath();ctx.fill();
  ctx.fillStyle='#3a8890';ctx.fillRect(176,-18,16,78);ctx.fillRect(448,-18,16,78);
  ctx.fillStyle='#264472';
  ctx.beginPath();ctx.moveTo(176,8);ctx.lineTo(150,-2);ctx.lineTo(174,32);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(464,8);ctx.lineTo(490,-2);ctx.lineTo(466,32);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(25,465);ctx.lineTo(25,590);ctx.lineTo(62,555);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(595,465);ctx.lineTo(595,590);ctx.lineTo(558,555);ctx.closePath();ctx.fill();
  ctx.restore();
}
function drawLauncherCover(){
  const x=table.ball.x-27.5,y=table.ball.y-64.5;
  ctx.fillStyle='#00001f';ctx.fillRect(x-3,y-3,61,135);ctx.fillStyle='#264472';ctx.fillRect(x,y,55,129);ctx.strokeStyle='#1a194b';ctx.lineWidth=3;ctx.strokeRect(x+.5,y+.5,54,128);
}
function drawHistoricalHud(W,H){
  const safe=game.safeMode>0&&gameSessionActive;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle=safe?`rgba(0,${Math.round(game.safeMode*(255/30))},0,.61)`:'#000';ctx.fillRect(0,0,W,20);
  drawDotText(ctx,`Score:${fmt(game.score)}`,10,2,{scale:2,gap:1,color:'#fff'});
  drawDotText(ctx,`Balls:${ballsLeft}`,W-10,2,{scale:2,gap:1,color:'#fff',align:'right'});
  if(safe){const c=`rgb(${Math.round(game.safeMode*(255/30))},${Math.round(game.safeMode*(255/30))},0)`;drawDotText(ctx,'BALL SAVER',W-145,2,{scale:2,gap:1,color:c,align:'right'});}
  ctx.fillStyle='#000';ctx.fillRect(0,H-led.height,W,led.height);
  if(led.current){const msg=led.current.message;const scale=dotTextWidth(msg,3,1)>W-20?2:3;drawDotText(ctx,msg,W/2,H-led.height+led.current.y+6,{scale,gap:1,color:'rgb(50,255,50)',align:'center'});}
  ctx.restore();
}
function drawStar(){
  const x=310,y=430,t=performance.now()/1000;
  if(game.wormhole){
    ctx.save();ctx.translate(x,y);ctx.rotate(t*.8);
    for(let i=0;i<5;i++){
      ctx.beginPath();ctx.ellipse(0,0,28+i*12,12+i*6,Math.sin(t+i)*.25,0,Math.PI*2);
      ctx.strokeStyle=`rgba(${120+i*20},${110+i*12},255,${.75-i*.1})`;ctx.lineWidth=4;ctx.stroke();
    }
    ctx.restore();return;
  }
  const red=game.star==='red';
  if(game.unstable){
    ctx.save();ctx.translate(x,y);ctx.rotate(t*.35);ctx.strokeStyle='rgba(255,190,110,.55)';ctx.lineWidth=3;
    for(let i=0;i<12;i++){ctx.rotate(Math.PI/6);ctx.beginPath();ctx.moveTo(32,0);ctx.lineTo(62+Math.sin(t*4+i)*9,0);ctx.stroke();}
    ctx.restore();
  }
  if(game.fusion1||game.fusion2){
    ctx.save();ctx.translate(x,y);
    if(game.fusion1){ctx.rotate(t*.65);ctx.strokeStyle='#ffbc65';ctx.lineWidth=5;ctx.setLineDash([12,8]);ctx.beginPath();ctx.arc(0,0,38,0,Math.PI*2);ctx.stroke();}
    if(game.fusion2){ctx.rotate(-t*.48);ctx.strokeStyle='#e287ff';ctx.lineWidth=4;ctx.setLineDash([8,7]);ctx.beginPath();ctx.arc(0,0,51,0,Math.PI*2);ctx.stroke();}
    ctx.restore();ctx.setLineDash([]);
  }
  if(game.blackHole){
    const acc=ctx.createRadialGradient(x,y,7,x,y,45);acc.addColorStop(0,'#000');acc.addColorStop(.28,'#02030a');acc.addColorStop(.48,'#6f3fbb');acc.addColorStop(.65,'#ff9a54');acc.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=acc;ctx.beginPath();ctx.arc(x,y,48,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fillStyle='#000';ctx.fill();
    if(hintFor('black hole')&&Math.floor(performance.now()/400)%2===0){ctx.beginPath();ctx.arc(x,y,55,0,Math.PI*2);ctx.strokeStyle='#fff1a8';ctx.lineWidth=4;ctx.stroke();}
    return;
  }
  const radius=red?28:23;
  const glow=ctx.createRadialGradient(x,y,2,x,y,radius*2.3);
  glow.addColorStop(0,red?'#fff4db':'#ffffff');glow.addColorStop(.35,red?'#ff704a':'#ffd66b');glow.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,radius*2.3,0,Math.PI*2);ctx.fill();
  ctx.beginPath();ctx.arc(x,y,radius,0,Math.PI*2);ctx.fillStyle=red?'#d73829':'#ffcb45';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle=red?'#ff9d77':'#fff1a5';ctx.stroke();
}
function drawBall(ball,index){
  const shine=ctx.createRadialGradient(ball.x-6,ball.y-7,2,ball.x,ball.y,ball.r);
  shine.addColorStop(0,'#ffffff');shine.addColorStop(.35,'#e5e8f2');shine.addColorStop(1,index===0?'#7d86aa':'#a9b0d2');
  ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fillStyle=shine;ctx.fill();ctx.strokeStyle='#f8f9ff';ctx.lineWidth=1.5;ctx.stroke();
}
function drawEffects(){
  ctx.save();
  for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();}
  ctx.font='800 18px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  for(const f of floaters){ctx.globalAlpha=Math.max(0,f.life/f.max);ctx.fillStyle='#fff4b8';ctx.strokeStyle='rgba(9,11,24,.8)';ctx.lineWidth=4;ctx.strokeText(f.text,f.x,f.y);ctx.fillText(f.text,f.x,f.y);}
  ctx.restore();
}
function draw(){
  const W=canvas.width,H=canvas.height;
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,W,H);updateCamera();
  if(gameOverActive){
    const ox=(W-table.size.width)/2;ctx.setTransform(1,0,0,1,ox,gameOverOffset);
  }else if(previewActive){
    const ox=(W-table.size.width)/2;ctx.setTransform(1,0,0,1,ox,previewY+cameraShake);
  }else if(cameraMode==='ball'){
    const ox=(W-table.size.width)/2;const oy=(cameraY||0)+cameraShake;ctx.setTransform(1,0,0,1,ox,oy);
  }else{
    const view=fullTableTransform(table.size,W,H);ctx.setTransform(view.scale,0,0,view.scale,view.x,view.y);
  }

  drawPlayfieldBackground();
  for(const w of walls)drawPoly(w.poly,'#37358c',6);
  for(const gte of gates)drawPoly(gte.poly,'#37358c',6);

  drawStar();
  const named=Object.fromEntries(triggers.filter(t=>t.tag).map(t=>[t.tag,t]));
  for(const letter of ['n','o','v','a']) if(named[letter]) drawTarget(named[letter],letter.toUpperCase(),19);
  for(const dot of ['dot4','dot5','dot1','dot2']) if(named[dot]) drawDotTarget(named[dot]);
  if(named['left ramp slingshot'])drawRampLamp(named['left ramp slingshot'],false);
  if(named['right ramp slingshot'])drawRampLamp(named['right ramp slingshot'],true);

  for(const b of bumpers){
    const hit=performance.now()<(flashUntil.get(b.tag)||0),scale=hit?1.1:1,pulse=hintFor(b.tag)&&Math.floor(performance.now()/500)%2===0;
    ctx.save();ctx.translate(b.x,b.y);ctx.scale(scale,scale);ctx.shadowColor=pulse?'#ffff66':'#eeee33';ctx.shadowBlur=pulse?20:10;
    const bg=ctx.createRadialGradient(-9,-10,2,0,0,33);bg.addColorStop(0,'#fff');bg.addColorStop(.2,'#ddd');bg.addColorStop(.46,'#777');bg.addColorStop(.72,'#292929');bg.addColorStop(1,'#070707');
    ctx.beginPath();ctx.arc(0,0,31,0,Math.PI*2);ctx.fillStyle=bg;ctx.fill();ctx.shadowBlur=0;ctx.lineWidth=2;ctx.strokeStyle='#e8e86b';ctx.stroke();
    ctx.globalAlpha=.23;ctx.strokeStyle='#fff';for(let i=0;i<7;i++){ctx.beginPath();ctx.arc(0,0,7+i*3,Math.PI*.2,Math.PI*1.05);ctx.stroke();}ctx.restore();
  }
  for(const k of kickers){
    const hit=performance.now()<(flashUntil.get(k.tag)||0);ctx.beginPath();ctx.moveTo(k.poly[0].x,k.poly[0].y);for(let i=1;i<k.poly.length;i++)ctx.lineTo(k.poly[i].x,k.poly[i].y);ctx.closePath();
    ctx.fillStyle=hit?'#ffff8a':'#ebeb00';ctx.fill();ctx.strokeStyle='#260041';ctx.lineWidth=4;ctx.stroke();
  }
  for(const f of flippers){
    const {verts}=transformedFlipper(f,f.angle);ctx.beginPath();ctx.moveTo(verts[0].x,verts[0].y);for(let i=1;i<verts.length;i++)ctx.lineTo(verts[i].x,verts[i].y);ctx.closePath();ctx.fillStyle=tilt?'#777':'#c4c4c4';ctx.fill();ctx.strokeStyle='#bf5660';ctx.lineWidth=3;ctx.stroke();
  }
  balls.forEach(drawBall);
  drawEffects();
  drawLauncherCover();
  ctx.setTransform(1,0,0,1,0,0);
  drawHistoricalHud(W,H);
  if(gameOverActive){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='rgba(255,128,255,.85)';ctx.font='700 42px "Courier New",monospace';ctx.textAlign='center';ctx.textBaseline='middle';drawDotText(ctx,'GAME OVER',W/2,180,{scale:6,gap:2,color:'rgba(255,128,255,.92)',align:'center'});ctx.restore();}
}
function frame(now){
  const dt=Math.min(CFG.maxFrame,(now-last)/1000);last=now;accumulator+=dt;
  let guard=0;while(accumulator>=CFG.fixedDt&&guard++<20){step(CFG.fixedDt);accumulator-=CFG.fixedDt;}
  if(uiMode==='play'){
    updateLed(dt);
    if(previewActive&&table){const minY=-Math.max(0,table.size.height-canvas.height);if(previewY>minY)previewY=Math.max(minY,previewY-dt*50);}
    if(gameOverActive&&table){gameOverOffset+=dt*150;if(gameOverOffset>=table.size.height)finishGame();}
    if(running){missionLedTimer-=dt;if(missionLedTimer<=0){if(missionHintsUsesLed()||game.nextSignal==='wait')ledAdd(ledHintText());missionLedTimer=20;}}
  }
  if(uiMode==='about'&&aboutNextAt&&now>=aboutNextAt){aboutIndex=(aboutIndex+1)%ABOUT_LINES[lang].length;aboutNextAt=now+3000;renderOverlay();}
  if(notice&&now>noticeUntil){notice='';if(running&&balls.length>0&&!tilt)statusEl.textContent=tx('play');}
  updateBadges();draw();requestAnimationFrame(frame);
}
function moveOverlayFocus(delta){
  const items=[...overlayEl.querySelectorAll('button:not([disabled]),input')];if(!items.length)return;
  let i=items.indexOf(document.activeElement);if(i<0)i=0;else i=(i+delta+items.length)%items.length;items[i].focus({preventScroll:true});audio.play('menu');
}
function keyDown(e){
  audio.unlock();music.unlock();
  if(uiMode==='initials')return;
  if(gameOverActive&&(e.code==='Escape'||e.code==='Space')){e.preventDefault();finishGame();return;}
  if(e.code==='Escape'){
    e.preventDefault();
    if(uiMode==='play')pauseGame();
    else if(uiMode==='paused'){uiMode='menu';renderOverlay();}
    else if(uiMode!=='menu'){uiMode=overlayReturn||'menu';renderOverlay();}
    return;
  }
  if(uiMode==='about'&&e.code==='Space'){e.preventDefault();if(!e.repeat)overlayAction('about-next');return;}
  if(uiMode==='paused'&&e.code==='Space'){e.preventDefault();if(!e.repeat)resumeGame();return;}
  if(uiMode!=='play'){
    if(e.code==='ArrowUp'){e.preventDefault();moveOverlayFocus(-1);return;}
    if(e.code==='ArrowDown'){e.preventDefault();moveOverlayFocus(1);return;}
    if((e.code==='Space'||e.code==='Enter')&&document.activeElement?.matches('button:not([disabled])')){e.preventDefault();if(!e.repeat)document.activeElement.click();return;}
    return;
  }
  const key=(e.key||'').toLowerCase();
  if(key==='z'||e.code==='ArrowLeft'){e.preventDefault();setKey('left',true);}
  if(key==='m'||e.code==='ArrowRight'){e.preventDefault();setKey('right',true);}
  if(e.code==='Space'){e.preventDefault();if(!e.repeat)nudge();}
}
function keyUp(e){
  const key=(e.key||'').toLowerCase();
  if(key==='z'||e.code==='ArrowLeft')setKey('left',false);
  if(key==='m'||e.code==='ArrowRight')setKey('right',false);
}
window.addEventListener('keydown',keyDown);window.addEventListener('keyup',keyUp);
window.addEventListener('blur',pauseForInterruption);
document.addEventListener('visibilitychange',()=>{music.setPageActive(!document.hidden);if(document.hidden)pauseForInterruption();});
overlayEl.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b)overlayAction(b.dataset.action);});
function bindHold(id,side){const b=document.querySelector(id);b.addEventListener('pointerdown',e=>{audio.unlock();music.unlock();e.preventDefault();b.classList.add('active');setKey(side,true);});for(const ev of ['pointerup','pointercancel','pointerleave'])b.addEventListener(ev,e=>{e.preventDefault();b.classList.remove('active');setKey(side,false);});}
bindHold('#leftBtn','left');bindHold('#rightBtn','right');
document.querySelector('#nudgeBtn').addEventListener('pointerdown',e=>{audio.unlock();music.unlock();e.preventDefault();nudge();});
document.querySelector('#cameraBtn').addEventListener('click',toggleCamera);
document.querySelector('#soundBtn').addEventListener('click',toggleSound);
musicBtn.addEventListener('click',()=>{audio.unlock();music.unlock();cycleMusic();});
fullscreenBtn.addEventListener('click',toggleFullscreen);
document.addEventListener('fullscreenchange',applyLang);
document.querySelector('#menuBtn').addEventListener('click',()=>{if(uiMode==='play')pauseGame();else{uiMode='menu';renderOverlay();}});
document.querySelector('#langBtn').addEventListener('click',()=>{lang=lang==='it'?'en':'it';setStored('nova-lang',lang);applyLang();});
document.addEventListener('pointerdown',()=>{audio.unlock();music.unlock();},{once:true});

fetch('./data/table.json').then(r=>r.json()).then(d=>{setup(d);applyLang();renderOverlay();requestAnimationFrame(frame);}).catch(err=>{statusEl.textContent='Errore nel caricamento del tavolo';console.error(err);});
