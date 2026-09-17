import { FIXED_DT, RESTORATION } from './config.js';
import { createGameState, addScore, increaseMultiplier, addBall, loseBall, restartGame } from './state.js';
import { InputController } from './input.js';
import { ProceduralAudio } from './audio.js';
import { DocDonkeysParityPhysics } from './physics/docdonkeys-parity.js';
import { Renderer } from './render.js';
import { FeedbackController } from './feedback.js';
import { StateMachineDebugger } from './state-debug.js';

const strings = {
  it: {
    highScore:'Record', score:'Punti', multiplier:'Moltip.', balls:'Palle', gameOver:'Partita finita', restart:'Rigioca', menu:'Menu',
    controlsDesktop:'← / Z / A sinistra · → / M / L destra · ↓ launcher · Spazio rigioca', controlsTouch:'Usa i controlli sul tavolo',
    play:'Gioca', howToPlay:'Come si gioca', howTitle:'Come si gioca', back:'Indietro', menuHint:'Invio per giocare',
    howFlippers:'Palette: ← / Z / A sinistra · → / M / L destra', howLaunch:'Tieni premuto fino alla carica desiderata e rilascia per lanciare',
    howMultiplier:'Completa le quattro luci per aumentare il moltiplicatore',
    howRamps:'Attiva e completa le rampe per bonus ed extra ball',
    howGoal:'Tieni la pallina in gioco, accendi gli inserti e costruisci il punteggio.',
    audioOn:'Effetti: attivi', audioOff:'Effetti: disattivi', musicOn:'Musica: attiva', musicOff:'Musica: disattiva', launchPower:'Carica'
  },
  en: {
    highScore:'Hi-score', score:'Score', multiplier:'Mult.', balls:'Balls', gameOver:'Game over', restart:'Play again', menu:'Menu',
    controlsDesktop:'← / Z / A left · → / M / L right · ↓ launcher · Space restart', controlsTouch:'Use the controls on the table',
    play:'Play', howToPlay:'How to play', howTitle:'How to play', back:'Back', menuHint:'Press Enter to play',
    howFlippers:'Flippers: ← / Z / A left · → / M / L right', howLaunch:'Hold to the desired charge, then release to launch',
    howMultiplier:'Complete the four lights to raise the multiplier',
    howRamps:'Activate and complete ramps for bonuses and an extra ball',
    howGoal:'Keep the ball alive, light the inserts and build your score.',
    audioOn:'SFX: on', audioOff:'SFX: off', musicOn:'Music: on', musicOff:'Music: off', launchPower:'Power'
  },
};

const app=document.querySelector('#app');
const canvas=document.querySelector('#gameCanvas');
const renderer=new Renderer(canvas);const input=new InputController();const audio=new ProceduralAudio();
const params=new URLSearchParams(location.search);
const debugStates=params.get('debug')==='states';
const flipperProfile=params.get('flipper')==='docdonkeys'?'docdonkeys':RESTORATION.defaultFlipperProfile;
const physics=new DocDonkeysParityPhysics({flipperProfile});const state=createGameState();
const feedback=new FeedbackController({toast:document.querySelector('#eventToast'),scoreBurst:document.querySelector('#scoreBurst')});
const ui={
  highScore:document.querySelector('#highScore'),score:document.querySelector('#score'),multiplier:document.querySelector('#multiplier'),balls:document.querySelector('#balls'),
  gameOver:document.querySelector('#gameOver'),restart:document.querySelector('#restartButton'),gameOverMenu:document.querySelector('#gameOverMenuButton'),
  audio:document.querySelector('#audioButton'),music:document.querySelector('#musicButton'),lang:document.querySelector('#langButton'),
  mainMenu:document.querySelector('#mainMenu'),menuHome:document.querySelector('#menuHome'),howPanel:document.querySelector('#howPanel'),
  play:document.querySelector('#playButton'),how:document.querySelector('#howButton'),back:document.querySelector('#menuBackButton'),
  menuAudio:document.querySelector('#menuAudioButton'),menuMusic:document.querySelector('#menuMusicButton'),menuLang:document.querySelector('#menuLangButton'),
  launchMeter:document.querySelector('#launchMeter'),launchMeterFill:document.querySelector('#launchMeterFill'),launchPercent:document.querySelector('#launchPercent')
};
let mode='menu';
let stateDebugger=null;

input.attachKeyboard();input.attachLifecycle();input.attachPointer(document.querySelector('#touchLeft'),'left');input.attachPointer(document.querySelector('#touchRight'),'right');input.attachPointer(document.querySelector('#touchLaunch'),'launch');

function translate(){
  document.documentElement.lang=state.language;
  for(const el of document.querySelectorAll('[data-i18n]'))el.textContent=strings[state.language][el.dataset.i18n];
  ui.lang.textContent=state.language.toUpperCase();ui.menuLang.textContent=state.language.toUpperCase();
  ui.menuAudio.textContent=strings[state.language][state.audioEnabled?'audioOn':'audioOff'];
  ui.menuMusic.textContent=strings[state.language][state.musicEnabled?'musicOn':'musicOff'];
}
function refreshHud(){
  ui.highScore.textContent=state.highScore.toLocaleString(state.language==='it'?'it-IT':'en-US');
  ui.score.textContent=state.score.toLocaleString(state.language==='it'?'it-IT':'en-US');
  ui.multiplier.textContent=`×${state.multiplier}`;ui.balls.textContent=String(state.balls);
  ui.gameOver.hidden=!state.gameOver;ui.audio.textContent=state.audioEnabled?'🔊':'🔇';ui.music.textContent=state.musicEnabled?'♫':'♫×';
  ui.menuAudio.textContent=strings[state.language][state.audioEnabled?'audioOn':'audioOff'];
  ui.menuMusic.textContent=strings[state.language][state.musicEnabled?'musicOn':'musicOff'];
}
function showMenuHome(){ui.menuHome.hidden=false;ui.howPanel.hidden=true;}
function showHow(){ui.menuHome.hidden=true;ui.howPanel.hidden=false;ui.back.focus();}
function setMode(next){
  mode=next;const menu=next==='menu';ui.mainMenu.hidden=!menu;app.classList.toggle('is-menu',menu);
  if(menu){input.releaseAll();feedback.reset();showMenuHome();queueMicrotask(()=>ui.play.focus());}
}
async function startGame(){restartGame(state);physics.restartTable();renderer.resetCamera();feedback.reset();input.releaseAll();setMode('playing');refreshHud();await audio.ensureReady();if(state.musicEnabled)audio.startMusic();}
async function doRestart(){restartGame(state);physics.restartTable();renderer.resetCamera();feedback.reset();input.releaseAll();setMode('playing');refreshHud();await audio.ensureReady();if(state.musicEnabled)audio.startMusic();}
function returnToMenu(){audio.stopMusic();setMode('menu');refreshHud();}
async function toggleAudio(){state.audioEnabled=!state.audioEnabled;await audio.ensureReady();audio.setSfxEnabled(state.audioEnabled);translate();refreshHud();}
async function toggleMusic(){state.musicEnabled=!state.musicEnabled;await audio.ensureReady();audio.setMusicEnabled(state.musicEnabled);if(state.musicEnabled&&mode==='playing')audio.startMusic();translate();refreshHud();}
function toggleLanguage(){state.language=state.language==='it'?'en':'it';translate();refreshHud();}

function updateLaunchMeter(){
  const k=physics.snapshot().kicker;
  const top=801 + (-0.43*50), bottom=801 + (1.0*50);
  const charge=Math.max(0,Math.min(1,(k.y-top)/(bottom-top)));
  const pct=Math.round(charge*100);
  ui.launchMeterFill.style.transform=`scaleY(${Math.max(.02,charge)})`;
  ui.launchPercent.textContent=`${pct}%`;
  ui.launchMeter.classList.toggle('show',mode==='playing'&&input.down.launch);
}

ui.play.addEventListener('click',startGame);ui.how.addEventListener('click',showHow);ui.back.addEventListener('click',()=>{showMenuHome();ui.how.focus();});
ui.restart.addEventListener('click',doRestart);ui.gameOverMenu.addEventListener('click',returnToMenu);
ui.audio.addEventListener('click',toggleAudio);ui.menuAudio.addEventListener('click',toggleAudio);ui.music.addEventListener('click',toggleMusic);ui.menuMusic.addEventListener('click',toggleMusic);
ui.lang.addEventListener('click',toggleLanguage);ui.menuLang.addEventListener('click',toggleLanguage);
window.addEventListener('resize',()=>renderer.resize());
window.addEventListener('keydown',(event)=>{if(mode==='menu'&&ui.menuHome.hidden===false&&event.code==='Enter'){event.preventDefault();startGame();}});
document.addEventListener('pointerdown',()=>audio.ensureReady(),{once:true});

const hooks={
  onScore:(base,source)=>{const awarded=addScore(state,base);feedback.score(awarded,source,state.language);stateDebugger?.recordHook(`SCORE +${awarded} ${source}`);refreshHud();},
  onMultiplier:()=>{increaseMultiplier(state);audio.light();feedback.toastEvent('multiplier',state.language);stateDebugger?.recordHook(`MULTIPLIER x${state.multiplier}`);refreshHud();},
  onAddBall:()=>{addBall(state);audio.extraBall();feedback.toastEvent('extraBall',state.language,1500);stateDebugger?.recordHook(`EXTRA BALL -> ${state.balls}`);refreshHud();},
  onLaunch:()=>audio.launch(),
  onLoseBall:()=>{loseBall(state);audio.lost();feedback.toastEvent(state.gameOver?'gameOver':'ballLost',state.language,1400);stateDebugger?.recordHook(`DRAIN -> ${state.balls} balls`);if(!state.gameOver)physics.resetBall();refreshHud();},
  onSfx:(name)=>audio.event(name),
  onEvent:(name)=>{feedback.toastEvent(name,state.language);stateDebugger?.recordHook(`EVENT ${name}`);},
};

if(debugStates){
  const root=document.querySelector('#stateDebugger');
  root.hidden=false;app.classList.add('debug-states');
  stateDebugger=new StateMachineDebugger({
    root,physics,state,input,
    inject:(action)=>physics.debugInject(action,hooks),
    resetGame:()=>{restartGame(state);physics.restartTable();renderer.resetCamera();feedback.reset();input.releaseAll();setMode('playing');refreshHud();},
  });
}

let accumulator=0,previous=performance.now()/1000;
function frame(nowMs){
  const now=nowMs/1000;
  if(mode!=='playing'){
    previous=now;accumulator=0;renderer.render(physics,input,state);updateLaunchMeter();stateDebugger?.update();input.endFrame();requestAnimationFrame(frame);return;
  }
  accumulator+=Math.min(0.1,now-previous);previous=now;
  if(input.consumePressed('left')||input.consumePressed('right'))audio.flipper('up');
  if(input.consumeReleased('left')||input.consumeReleased('right'))audio.flipper('down');
  if(input.consumeReleased('launch'))audio.event('kickerUsed');
  if(input.consumePressed('restart')&&state.gameOver)doRestart();
  while(accumulator>=FIXED_DT){const physicsInput=input.beginPhysicsTick();physics.update(FIXED_DT,physicsInput,state,hooks);accumulator-=FIXED_DT;}
  renderer.render(physics,input,state);updateLaunchMeter();stateDebugger?.update();input.endFrame();requestAnimationFrame(frame);
}
await renderer.load();translate();refreshHud();setMode('menu');if(debugStates){state.audioEnabled=false;state.musicEnabled=false;audio.setSfxEnabled(false);audio.setMusicEnabled(false);await startGame();stateDebugger?.update(true);}requestAnimationFrame(frame);
