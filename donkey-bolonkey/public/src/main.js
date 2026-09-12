import { FPS } from './core/constants.js';
import { AppFlow,SCREEN } from './core/flow.js';
import { CanvasRenderer } from './render/canvas.js';
import { STRINGS } from './ui/i18n.js';
import { AudioReplacement } from './audio.js';

const $=s=>document.querySelector(s);
const canvas=$('#game'),stage=$('.stage'),renderer=new CanvasRenderer(canvas),flow=new AppFlow(),audio=new AudioReplacement();
let lang=localStorage.getItem('dkbk.lang')||(navigator.language?.toLowerCase().startsWith('it')?'it':'en');
let last=performance.now(),acc=0,lastAnnounced='',lastUiSignature='',wasNameEntryVisible=false;
const STEP=1000/FPS,t=()=>STRINGS[lang];

function fitCanvas(){
  renderer.setPixelRatio(globalThis.devicePixelRatio||1);
  const box=stage.getBoundingClientRect();
  if(box.width<=0||box.height<=0)return;
  const width=Math.max(1,Math.min(box.width,box.height*4/3));
  const height=width*3/4;
  canvas.style.width=`${Math.floor(width)}px`;
  canvas.style.height=`${Math.floor(height)}px`;
}


function announce(text){
  if(!text||text===lastAnnounced)return;
  lastAnnounced=text;
  $('#screen-status').textContent=text;
}

function screenAnnouncement(s){
  if(flow.screen===SCREEN.GAME){
    if(flow.game.gameOver)return flow.game.final?s.statusCompleted:s.statusGameOver;
    if(flow.game.paused)return s.statusPaused;
    return `${s.statusGame} ${s.level} ${Math.min(flow.game.levelNumber,6)}.`;
  }
  return s.status[flow.screen]||'';
}

function uiSignature(){return [lang,audio.enabled,flow.screen,flow.game.gameOver,flow.game.final,flow.game.paused,flow.game.levelNumber,flow.highscores.editingIndex].join('|');}

function apply(){
  const s=t(),g=flow.game,inGame=flow.screen===SCREEN.GAME,activeGame=inGame&&!g.gameOver;
  lastUiSignature=uiSignature();
  document.documentElement.lang=lang;
  document.title=s.pageTitle;
  document.querySelector('meta[name="description"]')?.setAttribute('content',s.pageDescription);
  $('.menu').setAttribute('aria-label',s.menuLabel);
  $('.stage').setAttribute('aria-label',s.stageLabel);
  $('#touch-controls').setAttribute('aria-label',s.touchControlsLabel);
  $('#title').textContent=s.title;$('#subtitle').textContent=s.subtitle;
  $('#new-game').textContent=s.play;
  $('#pause').disabled=!inGame;
  $('#pause').textContent=inGame&&g.gameOver?(g.final?s.continueBtn:s.scoresBtn):(g.paused?s.resumeBtn:s.pauseBtn);
  $('#pause').setAttribute('aria-pressed',String(inGame&&g.paused));
  $('#instructions-open').textContent=s.instructions;
  $('#language').textContent=s.language;
  $('#sound').textContent=audio.enabled?s.soundOn:s.soundOff;
  $('#sound').setAttribute('aria-pressed',String(audio.enabled));
  $('#about-open').textContent=s.info;
  $('#swap').textContent=s.swap;$('#prev').ariaLabel=s.previous;$('#next').ariaLabel=s.next;
  $('#touch-controls').hidden=!activeGame;
  $('#swap').disabled=!activeGame;$('#prev').disabled=!activeGame;$('#next').disabled=!activeGame;

  const editingName=flow.screen===SCREEN.HISCORE&&flow.highscores.editingIndex>=0;
  const nameEntry=$('#name-entry'),playerName=$('#player-name');
  nameEntry.hidden=!editingName;
  $('#name-label').textContent=s.nameLabel;$('#name-save').textContent=s.saveName;
  if(editingName){
    const entry=flow.highscores.entries[flow.highscores.editingIndex];
    if(playerName.value!==entry.name)playerName.value=entry.name;
    if(!wasNameEntryVisible)requestAnimationFrame(()=>{playerName.focus({preventScroll:true});playerName.select();});
  }else playerName.value='';
  wasNameEntryVisible=editingName;

  $('#instructions-title').textContent=s.instructionsTitle;
  $('#instructions-goal').textContent=s.instructionsGoal;
  $('#instructions-controls-title').textContent=s.controlsHeading;
  const list=$('#instructions-list');list.replaceChildren(...s.instructionsList.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
  $('#instructions-tip').textContent=s.instructionsTip;
  $('#instructions-close').textContent=s.close;

  $('#about-title').textContent=s.aboutTitle;$('#about-body').textContent=s.aboutBody;$('#about-credit').textContent=s.aboutCredit;$('#about-close').textContent=s.close;
  $('#game').setAttribute('aria-label',s.gameCanvasLabel);
  $('#game-help').textContent=s.gameHelp;
  announce(screenAnnouncement(s));
}

function wakeAudio(){void audio.unlock().then(()=>audio.sync(flow)).catch(()=>{});}
function newGame(){wakeAudio();flow.newGame();apply();audio.sync(flow);canvas.focus({preventScroll:true});}
function pauseOrContinue(){
  if(flow.screen!==SCREEN.GAME)return;
  if(flow.game.gameOver){flow.finishRun();apply();audio.sync(flow);return;}
  flow.game.paused=!flow.game.paused;apply();
}
function advanceCanvasFlow(){
  wakeAudio();
  if(flow.screen===SCREEN.TITLE)flow.enter();
  else if(flow.screen===SCREEN.WARNING||flow.screen===SCREEN.CONTROLS||flow.screen===SCREEN.CREDITS||(flow.screen===SCREEN.HISCORE&&flow.highscores.editingIndex<0))flow.anyKey();
  else return;
  apply();audio.sync(flow);
}

$('#new-game').onclick=newGame;
$('#pause').onclick=pauseOrContinue;
$('#language').onclick=()=>{lang=lang==='it'?'en':'it';localStorage.setItem('dkbk.lang',lang);apply();};
$('#sound').onclick=()=>{const enabled=audio.toggle();if(enabled)wakeAudio();apply();audio.sync(flow);};
$('#swap').onclick=()=>{wakeAudio();flow.game.swapBubble();audio.sync(flow);};
$('#prev').onclick=()=>flow.game.previousBubble();
$('#next').onclick=()=>flow.game.nextBubble();

const instructions=$('#instructions'),about=$('#about');
$('#instructions-open').onclick=()=>instructions.showModal();
$('#instructions-close').onclick=()=>instructions.close();
$('#about-open').onclick=()=>about.showModal();
$('#about-close').onclick=()=>about.close();
$('#player-name').addEventListener('input',e=>flow.highscores.setEditingName(e.currentTarget.value));
$('#name-entry').addEventListener('submit',e=>{e.preventDefault();flow.highscores.finishEntry();apply();canvas.focus({preventScroll:true});});
canvas.addEventListener('pointerup',advanceCanvasFlow);

addEventListener('keydown',e=>{
  if(instructions.open||about.open)return;
  if(e.target instanceof HTMLInputElement)return;
  wakeAudio();
  if(e.repeat&&['Space','Tab','Enter','Escape'].includes(e.code))return;

  if(e.code==='Enter'){e.preventDefault();flow.enter();apply();audio.sync(flow);return;}
  if(e.code==='Escape'){e.preventDefault();flow.escape();apply();audio.sync(flow);return;}
  if(e.code==='Backspace'&&flow.screen===SCREEN.HISCORE){e.preventDefault();flow.backspace();return;}
  if(flow.screen===SCREEN.HISCORE&&flow.highscores.editingIndex>=0&&e.key?.length===1){flow.printable(e.key);return;}

  if(flow.screen!==SCREEN.GAME){
    if(!e.ctrlKey&&!e.metaKey&&!e.altKey){flow.anyKey();apply();audio.sync(flow);}
    return;
  }

  switch(e.code){
    case'Space':e.preventDefault();flow.game.swapBubble();audio.sync(flow);break;
    case'Tab':e.preventDefault();flow.game.nextBubble();break;
    case'ArrowLeft':e.preventDefault();flow.game.previousBubble();break;
    case'ArrowRight':e.preventDefault();flow.game.nextBubble();break;
    case'KeyP':if(!flow.game.gameOver){flow.game.paused=!flow.game.paused;apply();}break;
  }
});

function frame(now){
  const elapsed=Math.min(250,now-last);last=now;acc+=elapsed;
  while(acc>=STEP){flow.update();audio.sync(flow);acc-=STEP;}
  if(uiSignature()!==lastUiSignature)apply();
  renderer.drawFlow(flow,t());
  requestAnimationFrame(frame);
}

new ResizeObserver(fitCanvas).observe(stage);
addEventListener('resize',fitCanvas,{passive:true});
fitCanvas();apply();audio.sync(flow);requestAnimationFrame(frame);
