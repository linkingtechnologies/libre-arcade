/* SPDX-License-Identifier: GPL-3.0-or-later */
import { Simulation } from '../src/simulation.js';
import { makeDay1Stage } from './stage-day1.js';
import { makeDay2Stage } from './stage-day2.js';
import { makeDay3Stage } from './stage-day3.js';
import { makeDay4Stage } from './stage-day4.js';
import { makeDreamStage } from './stage-dream.js';
import { makeDay5Stage } from './stage-day5.js';
import { makeDay6Stage } from './stage-day6.js';
import { makeDay7Stage } from './stage-day7.js';
import { FixedStepClock } from './scheduler.js';
import { ArcadeRenderer } from './renderer.js';
import { AudioEngine } from './audio.js';
import { SOUND_NAMES } from './sounds.js';
import { Rng8 } from '../src/rng.js';
import { BUTTON, PadPoll } from '../src/input.js';
import { Frontend, LEVELS_ALL, stepLevelSelect } from '../src/frontend.js';
import { shouldRepeatRing } from './ringing.js';
import { createHeldDirections, pressDirection, releaseDirection, clearDirections } from './directional-input.js';

const DREAM_STAGE=5;
const DAY5_STAGE=6;
const DAY6_STAGE=7;
const DAY7_STAGE=8;
const ENDING_DAY=9;           // what a card is waiting to start when it is the final screen (the program's level 8)
const RING_REPEAT_TICKS=50;

const I18N={
  en:{
    start1:'Start Day 1',start2:'Start Day 2',start3:'Start Day 3',start4:'Start Day 4',startDream:'Enter the Dream',start5:'Start Day 5',start6:'Start Day 6',start7:'Start Day 7',
    retry1:'Replay Day 1',retry2:'Replay Day 2',retry3:'Replay Day 3',retry4:'Replay Day 4',retryDream:'Replay Dream',retry5:'Replay Day 5',retry6:'Replay Day 6',retry7:'Replay Day 7',
    next2:'Continue to Day 2',next3:'Continue to Day 3',next4:'Continue to Day 4',nextDream:'Enter the Dream',next5:'Continue to Day 5',next6:'Continue to Day 6',next7:'Continue to Day 7',
    pause:'Pause',resume:'Resume',calls:'Calls',misses:'Miss',memory:'Memory',none:'none',any:'any topic',boost:'Boost',allowance:'Miss allowance',
    earth:'Earth',history:'History',books:'Books',space:'Space',ready:'Coffee ready',coffee:'Coffee boost!',ring:'Phone ringing',
    answer:'Answered!',topic:'Topic memorized',chatter:'Chatter changed it',missed:'Missed call',teleport:'The phone moved!',ghost:'The Ghost caught you!',knock:'ManBox knocked you!',wisdom:'Wisdom: any topic works!',
    won1:'Day 1 complete!',won2:'Day 2 complete!',won3:'Day 3 complete!',won4:'Day 4 complete!',won5:'Day 5 complete!',won6:'Day 6 complete!',won7:'Day 7 complete!',dreamWon:'Dream cleared!',dreamCaught:'Dream ended',lost:'Trial failed',
    keys:'Move: arrows / WASD · P or Esc: pause · M: sound',pauseHint:'Press P or Esc to resume.',
    soundTest:'Sound test',soundWord:'Sound',soundHelp:'Up and down: choose · X: play · Enter: leave',soundDone:'Done',
    answerRule:'How to answer: a ringing phone shows a topic symbol. Touch the filing cabinet with the same symbol to memorize it, then touch the phone. There is no Answer button.',
    dreamRule:'Dream exception: no topic is needed. Just reach and touch the ringing phone before the Ghost catches you.',
    wrapRule:'Edge ladders wrap vertically: if a ladder continues off the bottom, keep moving DOWN; if it continues off the top, keep moving UP.',
    intro1:'Answer 10 calls before 3 are missed. Match the ringing phone’s topic, then reach the phone to answer automatically.',
    intro2:'Day 2: answer 15 calls. Three phones are active. The Chief slows you when he gets close; coffee becomes available and gives a temporary speed boost.',
    intro3:'Day 3: answer 20 calls. Books joins Earth and History. The Bouncer is a moving physical obstacle: route around him or let him force your position.',
    intro4:'Day 4: answer 25 calls. Chatter roams the middle floor and can replace the topic you memorized, so re-check your memory before committing to a phone.',
    introDream:'Dream: answer the single phone. You always have wisdom, so no cabinet is needed — but the phone can teleport between six tables and the Ghost is hunting you.',
    intro5:'Day 5: answer 30 calls with all four topics. The Geek blocks your approach when you move toward the side he faces; coffee is available on the lower floor.',
    intro6:'Day 6: answer 35 calls with four phones. ManBox can knock you back, reverse direction and re-enter on a different floor after leaving the screen.',
    intro7:'Day 7: answer 40 calls. Dibrov avoids you, changes floors at the edges, and grants temporary wisdom on contact so any topic can answer a phone.',
    win1:'First day complete. The office gets busier now.',
    win2:'Day 2 complete. A third subject and a physical blocker are next.',
    win3:'Day 3 complete. Chatter joins the office next.',
    win4:'Day 4 complete. Now the office turns into the Dream.',
    win5:'Day 5 complete. ManBox joins the office next.',
    win6:'Day 6 complete. Dibrov is waiting on the final day.',
    win7:'Day 7 complete. Your trial is over.',
    endingTitle:'Trial complete!',endingText:'You made it through all seven days — and one very strange Dream. Nice work.',restart:'Restart from Day 1',
    dreamBonus:'You answered the Dream phone. The Day 5 miss allowance rises from 3 to 5.',
    dreamNoBonus:'The Ghost caught you. The campaign still continues to Day 5, but the miss allowance stays at 3.',
    lose1:'Three calls were missed. Try Day 1 again.',lose2:'Three calls were missed. Try Day 2 again.',lose3:'Three calls were missed. Try Day 3 again.',lose4:'Three calls were missed. Try Day 4 again.',lose5:'The Day 5 miss allowance was exhausted. Try Day 5 again.',lose6:'The Day 6 miss allowance was exhausted. Try Day 6 again.',lose7:'The Day 7 miss allowance was exhausted. Try Day 7 again.',
    titlePress:'PRESS START',titleHint:'Enter / Space or tap',titleRestoration:'LIBRE ARCADE RESTORATION',
    soundOn:'Sound on',soundOff:'Sound off',credits:'Credits',closeCredits:'Close credits',resetPreferences:'Reset preferences',creditsOriginal:'Original 2011 NES game: Shiru — code, gameplay design, sound/music, direction; Alexei “PinWizz” Bespalko — visual design, most graphics and fact messages; Gibson — testing.',creditsRestoration:'Unofficial Libre Arcade version: the program, the drawings and the screens are new. The original authors and the teams of later ports have not endorsed it.',creditsLicense:'New code and drawings: GPL-3.0-or-later. The layouts of the floors and the positions of the objects follow the original game and are shared under its Creative Commons Attribution (CC BY) licence, version not stated. The original ROM, pictures and music are not included.',creditsAudio:'The sounds are made in your browser with Web Audio; no recorded or historical audio is used.',lang:'IT',title:'Zooming Secretary',day1:'Day 1',day2:'Day 2',day3:'Day 3',day4:'Day 4',dream:'Dream',day5:'Day 5',day6:'Day 6',day7:'Day 7',dreamMiss:'—'
  },
  it:{
    start1:'Inizia Giorno 1',start2:'Inizia Giorno 2',start3:'Inizia Giorno 3',start4:'Inizia Giorno 4',startDream:'Entra nel Sogno',start5:'Inizia Giorno 5',start6:'Inizia Giorno 6',start7:'Inizia Giorno 7',
    retry1:'Rigioca Giorno 1',retry2:'Rigioca Giorno 2',retry3:'Rigioca Giorno 3',retry4:'Rigioca Giorno 4',retryDream:'Rigioca Sogno',retry5:'Rigioca Giorno 5',retry6:'Rigioca Giorno 6',retry7:'Rigioca Giorno 7',
    next2:'Continua al Giorno 2',next3:'Continua al Giorno 3',next4:'Continua al Giorno 4',nextDream:'Entra nel Sogno',next5:'Continua al Giorno 5',next6:'Continua al Giorno 6',next7:'Continua al Giorno 7',
    pause:'Pausa',resume:'Riprendi',calls:'Chiamate',misses:'Errori',memory:'Memoria',none:'nessuno',any:'qualsiasi',boost:'Boost',allowance:'Limite errori',
    earth:'Terra',history:'Storia',books:'Libri',space:'Spazio',ready:'Caffè pronto',coffee:'Boost caffè!',ring:'Telefono!',
    answer:'Risposta corretta!',topic:'Argomento memorizzato',chatter:'Chatter lo ha cambiato',missed:'Chiamata persa',teleport:'Il telefono è scappato!',ghost:'Il Fantasma ti ha preso!',knock:'ManBox ti ha colpito!',wisdom:'Wisdom: ora va bene qualsiasi argomento!',
    won1:'Giorno 1 completato!',won2:'Giorno 2 completato!',won3:'Giorno 3 completato!',won4:'Giorno 4 completato!',won5:'Giorno 5 completato!',won6:'Giorno 6 completato!',won7:'Giorno 7 completato!',dreamWon:'Sogno superato!',dreamCaught:'Sogno terminato',lost:'Prova fallita',
    keys:'Muovi: frecce / WASD · P o Esc: pausa · M: audio',pauseHint:'Premi P o Esc per riprendere.',
    soundTest:'Prova dei suoni',soundWord:'Suono',soundHelp:'Su e giù: scegli · X: ascolta · Invio: esci',soundDone:'Fatto',
    answerRule:'Come rispondere: il telefono che squilla mostra il simbolo di un argomento. Tocca lo schedario con lo stesso simbolo per memorizzarlo, poi tocca il telefono. Non esiste un tasto Rispondi.',
    dreamRule:'Eccezione Sogno: non serve alcun argomento. Raggiungi e tocca il telefono che squilla prima che il Fantasma ti prenda.',
    wrapRule:'Le scale ai bordi continuano verticalmente: se escono in basso, continua con GIÙ; se escono in alto, continua con SU.',
    intro1:'Rispondi a 10 chiamate prima di perderne 3. Abbina l’argomento del telefono che squilla, poi raggiungilo: la risposta è automatica.',
    intro2:'Giorno 2: rispondi a 15 chiamate. Ora ci sono tre telefoni. Il Capo ti rallenta quando si avvicina; il caffè diventa disponibile e dà un boost temporaneo.',
    intro3:'Giorno 3: rispondi a 20 chiamate. Ai temi Terra e Storia si aggiungono i Libri. Il Bouncer è un ostacolo fisico mobile: aggiralo o ti sposterà.',
    intro4:'Giorno 4: rispondi a 25 chiamate. Chatter gira sul piano centrale e può sostituire l’argomento che hai memorizzato: controlla la memoria prima di correre al telefono.',
    introDream:'Sogno: devi rispondere a un solo telefono. Hai sempre la wisdom, quindi non servono archivi — ma il telefono può teletrasportarsi tra sei tavoli e il Fantasma ti insegue.',
    intro5:'Giorno 5: rispondi a 30 chiamate con tutti e quattro gli argomenti. Il Geek blocca il tuo avvicinamento quando vai verso il lato che sta guardando; il caffè è sul piano basso.',
    intro6:'Giorno 6: rispondi a 35 chiamate con quattro telefoni. ManBox può colpirti, invertire direzione e rientrare su un piano diverso dopo essere uscito dallo schermo.',
    intro7:'Giorno 7: rispondi a 40 chiamate. Dibrov ti evita, cambia piano ai bordi e al contatto ti concede wisdom temporanea: finché dura, qualsiasi argomento può rispondere a un telefono.',
    win1:'Primo giorno completato. Ora l’ufficio si complica.',
    win2:'Giorno 2 completato. Ora arriva un terzo argomento e un vero ostacolo fisico.',
    win3:'Giorno 3 completato. Ora entra in scena Chatter.',
    win4:'Giorno 4 completato. Adesso l’ufficio diventa il Sogno.',
    win5:'Giorno 5 completato. Ora entra in scena ManBox.',
    win6:'Giorno 6 completato. Dibrov ti aspetta nell’ultimo giorno.',
    win7:'Giorno 7 completato. La prova è finita.',
    endingTitle:'Prova completata!',endingText:'Hai superato tutti e sette i giorni — e un Sogno decisamente strano. Bel lavoro.',restart:'Ricomincia dal Giorno 1',
    dreamBonus:'Hai risposto al telefono del Sogno. Nel Giorno 5 il limite degli errori sale da 3 a 5.',
    dreamNoBonus:'Il Fantasma ti ha preso. La campagna continua comunque al Giorno 5, ma il limite degli errori resta 3.',
    lose1:'Hai perso tre chiamate. Riprova il Giorno 1.',lose2:'Hai perso tre chiamate. Riprova il Giorno 2.',lose3:'Hai perso tre chiamate. Riprova il Giorno 3.',lose4:'Hai perso tre chiamate. Riprova il Giorno 4.',lose5:'Hai esaurito il limite errori del Giorno 5. Riprova il Giorno 5.',lose6:'Hai esaurito il limite errori del Giorno 6. Riprova il Giorno 6.',lose7:'Hai esaurito il limite errori del Giorno 7. Riprova il Giorno 7.',
    titlePress:'PREMI START',titleHint:'Invio / Spazio o tocca',titleRestoration:'RESTAURO LIBRE ARCADE',
    soundOn:'Audio attivo',soundOff:'Audio disattivato',credits:'Crediti',closeCredits:'Chiudi crediti',resetPreferences:'Reimposta preferenze',creditsOriginal:'Gioco NES originale del 2011: Shiru — codice, gameplay, audio/musica, direzione; Alexei “PinWizz” Bespalko — design visivo, gran parte della grafica e messaggi; Gibson — testing.',creditsRestoration:'Versione non ufficiale di Libre Arcade: il programma, i disegni e le schermate sono nuovi. Gli autori originali e i team dei port successivi non l’hanno approvata.',creditsLicense:'Codice e disegni nuovi: GPL-3.0-or-later. La disposizione dei piani e la posizione degli oggetti seguono il gioco originale e sono condivise con la sua licenza Creative Commons Attribuzione (CC BY), versione non indicata. ROM, immagini e musica originali non sono inclusi.',creditsAudio:'I suoni sono prodotti nel tuo browser con Web Audio; non si usa audio registrato o storico.',lang:'EN',title:'Zooming Secretary',day1:'Giorno 1',day2:'Giorno 2',day3:'Giorno 3',day4:'Giorno 4',dream:'Sogno',day5:'Giorno 5',day6:'Giorno 6',day7:'Giorno 7',dreamMiss:'—'
  }
};

const canvas=document.querySelector('#game');
const titleScreen=document.querySelector('#title-screen');
const titleStart=document.querySelector('#title-start');
const titleHint=document.querySelector('#title-hint');
const titleRestoration=document.querySelector('#title-restoration');
const overlay=document.querySelector('#overlay');
const overlayTitle=document.querySelector('#overlay-title');
const overlayText=document.querySelector('#overlay-text');
const overlayRule=document.querySelector('#overlay-rule');
const primary=document.querySelector('#primary');
const pauseBtn=document.querySelector('#pause');
const audioBtn=document.querySelector('#audio');
const creditsBtn=document.querySelector('#credits');
const langBtn=document.querySelector('#lang');
const hint=document.querySelector('#hint');
const creditsDialog=document.querySelector('#credits-dialog');
const creditsClose=document.querySelector('#credits-close');
const resetPreferences=document.querySelector('#reset-preferences');

let lang=localStorage.getItem('zs-lang')==='it'?'it':'en';
let strings=I18N[lang];
let currentDay=1;
let pendingDay=null;
let sim=null;
let screenMode='TITLE';
let titleRng=new Rng8(1);
let frontend=new Frontend({rng:titleRng,effects:SOUND_NAMES.length,tunes:0});
// The program's hidden code (on the title screen) makes it show the number of the level before every stage, and lets the player change it;
// once entered it stays until the page is loaded again. The keys that are not directions: Z and X are the pad's A and B, Shift and Backspace
// SELECT, Enter and Space START (as in the collection's other pad games).
let testMode=false;
const KEY_BUTTON={KeyZ:'A',KeyX:'B',ShiftLeft:'SELECT',ShiftRight:'SELECT',Backspace:'SELECT',Enter:'START',Space:'START'};
const keysDown=new Set();
let startPulse=false;      // a START that came from a click or a tap (or a key that went up before the next step), for the title screen
let latchedPad=0;          // buttons pressed since the last step of a screen, even if they were let go again before it (a busy page can miss a short press)
let startTap=0;            // iterations during which START is held for the game, after the Pause button or a key
let levelPad=null;
let runSeed=1;
// The original never reseeds its random generator between stages (nor after a game over): each stage starts from the byte the stage
// before it ended with, and the first one from the byte the time spent on the title screen made. Stages used to start from 1.
let carriedSeed=1;
let renderer=new ArcadeRenderer(canvas,strings);
let running=false;
let paused=false;
let last=performance.now();
let futureMissLimit=3;
let creditsPausedGame=false;
let soundEnabled=localStorage.getItem('zs-sound')!=='off';
const audio=new AudioEngine({enabled:soundEnabled});
const clock=new FixedStepClock({hz:50});
const titleClock=new FixedStepClock({hz:50});
const levelClock=new FixedStepClock({hz:50});
const held=createHeldDirections();

function syncTouchPressed(){
  for(const button of document.querySelectorAll('[data-dir]')) button.classList.toggle('pressed',!!held[button.dataset.dir]);
}
function clearHeldDirections(){ clearDirections(held); syncTouchPressed(); }
// The pad as the program would read it now: the directions (keys and the touch pad) and the other buttons (keys only).
function padMask(){
  let mask=0;
  for(const dir of ['UP','DOWN','LEFT','RIGHT']) if(held[dir]) mask|=BUTTON[dir];
  for(const code of keysDown) if(KEY_BUTTON[code]) mask|=BUTTON[KEY_BUTTON[code]];
  return mask;
}
// What a screen's step (the title, the sound test, the choice of the level) reads: the pad, and what was pressed since the last step.
function stepMask(){ const mask=padMask()|latchedPad; latchedPad=0; return mask; }
// What the game gets for one iteration: the pad, and START while a tap of it is being held.
function gameInput(){
  let mask=padMask();
  if(startTap>0){ mask|=BUTTON.START; startTap--; }
  return mask;
}
const simPaused=()=>Boolean(sim&&running&&sim.pause>=25);

const STAGE_FACTORY={1:makeDay1Stage,2:makeDay2Stage,3:makeDay3Stage,4:makeDay4Stage,5:makeDreamStage,6:makeDay5Stage,7:makeDay6Stage,8:makeDay7Stage};
const makeStage=day=>day===DAY5_STAGE?makeDay5Stage(lang,futureMissLimit):day===DAY6_STAGE?makeDay6Stage(lang,futureMissLimit):day===DAY7_STAGE?makeDay7Stage(lang,futureMissLimit):(STAGE_FACTORY[day]??makeDay1Stage)(lang);
const dayLabel=day=>day===DREAM_STAGE?strings.dream:day===DAY5_STAGE?strings.day5:day===DAY6_STAGE?strings.day6:day===DAY7_STAGE?strings.day7:(strings[`day${day}`]??strings.day1);
const introFor=day=>day===DREAM_STAGE?strings.introDream:day===DAY5_STAGE?strings.intro5:day===DAY6_STAGE?strings.intro6:day===DAY7_STAGE?strings.intro7:(strings[`intro${day}`]??strings.intro1);
const startFor=day=>day===DREAM_STAGE?strings.startDream:day===DAY5_STAGE?strings.start5:day===DAY6_STAGE?strings.start6:day===DAY7_STAGE?strings.start7:(strings[`start${day}`]??strings.start1);
const retryFor=day=>day===DREAM_STAGE?strings.retryDream:day===DAY5_STAGE?strings.retry5:day===DAY6_STAGE?strings.retry6:day===DAY7_STAGE?strings.retry7:(strings[`retry${day}`]??strings.retry1);
const loseFor=day=>day===DAY5_STAGE?strings.lose5:day===DAY6_STAGE?strings.lose6:day===DAY7_STAGE?strings.lose7:(strings[`lose${day}`]??strings.lose1);

function syncPauseButton(){
  pauseBtn.hidden=paused||!running||simPaused();
  pauseBtn.textContent=strings.pause;
  pauseBtn.setAttribute('aria-label',strings.pause);
}

function updateAudioButton(){
  audioBtn.textContent=soundEnabled?'♪':'×';
  const label=soundEnabled?strings.soundOn:strings.soundOff;
  audioBtn.setAttribute('aria-label',label); audioBtn.title=label;
}

function setLanguage(next){
  lang=next; strings=I18N[lang]; localStorage.setItem('zs-lang',lang);
  renderer.setStrings(strings); document.documentElement.lang=lang; document.title=strings.title;
  document.querySelector('#title').textContent=strings.title; langBtn.textContent=strings.lang;
  syncPauseButton(); hint.textContent=strings.keys;
  creditsBtn.setAttribute('aria-label',strings.credits); creditsBtn.title=strings.credits;
  creditsClose.setAttribute('aria-label',strings.closeCredits);
  document.querySelector('#credits-title').textContent=strings.credits;
  document.querySelector('#credits-original').textContent=strings.creditsOriginal;
  document.querySelector('#credits-restoration').textContent=strings.creditsRestoration;
  document.querySelector('#credits-license').textContent=strings.creditsLicense;
  document.querySelector('#credits-audio').textContent=strings.creditsAudio;
  resetPreferences.textContent=strings.resetPreferences;
  updateAudioButton();
  titleStart.textContent=strings.titlePress;
  titleHint.textContent=strings.titleHint;
  titleRestoration.textContent=strings.titleRestoration;
  if(sim) sim.stage.name=dayLabel(currentDay);
  if(screenMode==='TITLE') showTitle({resetRng:false});
  else if(screenMode==='SOUND_TEST') renderSoundTest();
  else if(running&&(paused||simPaused())) showPauseCard();
  else if(!running && !paused && screenMode==='GAME') showIntro(pendingDay>0&&pendingDay<ENDING_DAY?pendingDay:currentDay);
}


function showTitle({resetRng=true}={}){
  clearHeldDirections(); freshCard(); startPulse=false;
  screenMode='TITLE'; running=false; paused=false; sim=null; pendingDay=null; currentDay=1; futureMissLimit=3;
  if(resetRng){ titleRng=new Rng8(1); frontend=new Frontend({rng:titleRng,testMode,effects:SOUND_NAMES.length,tunes:0}); }
  titleClock.reset(); clock.reset();
  titleScreen.hidden=false; titleScreen.classList.remove('starting');
  titleStart.disabled=false; titleStart.textContent=strings.titlePress; titleHint.textContent=strings.titleHint; titleRestoration.textContent=strings.titleRestoration;
  overlay.hidden=true; setOverlayRule(); syncPauseButton();
}

// START asked for on the title screen (a key, a click, a tap): the front end sees it at its next pass, like a press of the pad.
function startFromTitle(){
  if(screenMode!=='TITLE') return;
  audio.unlock(); startPulse=true;
}

// The front end of the program (title screen, then the sound test if the four buttons were down, then the number of the level), one pass
// at a time: it is the program's own rule for the title's random numbers, the hidden code and the sound test (src/frontend.js).
function frontTick(){
  const mask=stepMask()|(startPulse?BUTTON.START:0); startPulse=false;
  for(const e of frontend.tick(mask)){
    if(e.type==='CODE'){ testMode=true; audio.play('wisdom'); }
    else if(e.type==='START') onTitleStart();
    else if(e.type==='EFFECT') audio.play(SOUND_NAMES[e.number]);
  }
  if(screenMode==='TITLE_TRANSITION'&&frontend.phase!=='transition'){
    if(frontend.phase==='sound') showSoundTest(); else finishTitleTransition();
  }else if(screenMode==='SOUND_TEST'){
    if(frontend.phase==='sound') renderSoundTest(); else finishTitleTransition();
  }
}

function onTitleStart(){
  audio.play('ui');
  runSeed=titleRng.state || 1; carriedSeed=runSeed;
  screenMode='TITLE_TRANSITION';
  titleScreen.classList.add('starting'); titleStart.disabled=true; titleStart.textContent='...';
}

function finishTitleTransition(){
  clearHeldDirections(); freshCard();
  screenMode='GAME'; titleScreen.hidden=true; currentDay=1; pendingDay=1; running=false; paused=false; sim=null;
  showIntro(1); syncPauseButton();
}

function showSoundTest(){
  screenMode='SOUND_TEST'; clearHeldDirections(); freshCard();
  titleScreen.hidden=true; pendingDay=null; overlay.hidden=false;
  renderSoundTest();
}

function renderSoundTest(){
  overlayTitle.textContent=strings.soundTest;
  overlayText.textContent=`${strings.soundWord} ${frontend.sound.effect+1} / ${SOUND_NAMES.length}`;
  setOverlayRule(strings.soundHelp);
  primary.textContent=strings.soundDone;
}

// A card that is waiting to start a stage has its own reading of the pad (for the choice of the level), which begins afresh with each card: what
// is already down when it appears is not a press.
function freshCard(){ levelPad=new PadPoll(padMask()); latchedPad=0; levelClock.reset(); }

function tickRingingAudio(){
  if(!running || paused || !sim || sim.pause>=25) return;
  if(shouldRepeatRing(sim,RING_REPEAT_TICKS)) audio.play('ring');
}

function setOverlayRule(text=''){
  overlayRule.textContent=text;
  overlayRule.hidden=!text;
}

function showIntro(day=currentDay){
  overlay.hidden=false; overlayTitle.textContent=dayLabel(day);
  overlayText.textContent=(day===DAY5_STAGE||day===DAY6_STAGE||day===DAY7_STAGE)?`${introFor(day)} ${strings.allowance}: ${futureMissLimit}.`:introFor(day);
  setOverlayRule(day===DREAM_STAGE?strings.dreamRule:([4,DAY5_STAGE,DAY6_STAGE,DAY7_STAGE].includes(day)?`${strings.answerRule} ${strings.wrapRule}`:strings.answerRule));
  primary.textContent=startFor(day); pendingDay=day;
}

// The code on the title screen makes the program let the player change the level on the screen that shows its number (LEFT and RIGHT, from
// Day 1 to the final screen; START, A or B go on). Here that is any card that is waiting to start a stage.
function chooseLevel(level){
  if(level>=LEVELS_ALL){
    overlay.hidden=false; overlayTitle.textContent=strings.endingTitle; overlayText.textContent=strings.endingText; setOverlayRule();
    primary.textContent=strings.restart; pendingDay=ENDING_DAY;
  }else showIntro(level+1);
}

function levelSelectTick(){
  if(!levelPad) return;
  const trigger=levelPad.poll(stepMask());
  if(!trigger) return;
  const level=Math.min(Math.max((pendingDay??1)-1,0),LEVELS_ALL);
  const step=stepLevelSelect(level,trigger);
  if(step.done) startSelectedDay(pendingDay??currentDay);
  else if(step.level!==level) chooseLevel(step.level);
}

function startDay(day){
  clearHeldDirections(); freshCard();
  audio.unlock(); audio.play('start');
  // The allowance of missed calls is the program's, for every stage: it is 3 at the start and the Dream's reward is added to it.
  const stage=makeStage(day); stage.missLimit=futureMissLimit;
  // a START that is still down from the card that began the stage is not a press
  currentDay=day; pendingDay=null; sim=new Simulation(stage,{seed:carriedSeed,padPolled:padMask()});
  clock.reset(); paused=false; running=true; setOverlayRule(); overlay.hidden=true;
  syncPauseButton(); renderer.flash(dayLabel(day),75); renderer.draw(sim); last=performance.now();
}

// Named starters are used by the campaign/UI routing and keep stage transitions readable.
const startDay3=()=>startDay(3);
const startDay4=()=>startDay(4);
const startDream=()=>startDay(DREAM_STAGE);
const startDay5=()=>startDay(DAY5_STAGE);
const startDay6=()=>startDay(DAY6_STAGE);
const startDay7=()=>startDay(DAY7_STAGE);
const NAMED_STARTERS={3:startDay3,4:startDay4,5:startDream,6:startDay5,7:startDay6,8:startDay7};
function startSelectedDay(day){
  if(day===ENDING_DAY){ futureMissLimit=3; startDay(1); return; }
  (NAMED_STARTERS[day]??(()=>startDay(day)))();
}

function showDreamResult(won){
  if(sim) carriedSeed=sim.rng.state;
  clearHeldDirections(); freshCard();
  running=false; overlay.hidden=false; setOverlayRule(); syncPauseButton();
  if(won){
    futureMissLimit+=2;
    overlayTitle.textContent=strings.dreamWon; overlayText.textContent=strings.dreamBonus;
  }else{
    overlayTitle.textContent=strings.dreamCaught; overlayText.textContent=strings.dreamNoBonus;
  }
  primary.textContent=strings.next5; pendingDay=DAY5_STAGE;
}

function showEnd(won){
  if(sim) carriedSeed=sim.rng.state;
  clearHeldDirections(); freshCard();
  if(currentDay===DREAM_STAGE){ showDreamResult(won); if(won)audio.play('win'); return; }
  running=false; overlay.hidden=false; setOverlayRule(); syncPauseButton(); audio.play(won?'win':'lose');
  if(won && currentDay<4){
    const next=currentDay+1;
    overlayTitle.textContent=strings[`won${currentDay}`]; overlayText.textContent=strings[`win${currentDay}`];
    primary.textContent=strings[`next${next}`]; pendingDay=next;
  }else if(won && currentDay===4){
    overlayTitle.textContent=strings.won4; overlayText.textContent=strings.win4;
    primary.textContent=strings.nextDream; pendingDay=DREAM_STAGE;
  }else if(won && currentDay===DAY5_STAGE){
    overlayTitle.textContent=strings.won5; overlayText.textContent=strings.win5;
    primary.textContent=strings.next6; pendingDay=DAY6_STAGE;
  }else if(won && currentDay===DAY6_STAGE){
    overlayTitle.textContent=strings.won6; overlayText.textContent=strings.win6;
    primary.textContent=strings.next7; pendingDay=DAY7_STAGE;
  }else if(won && currentDay===DAY7_STAGE){
    overlayTitle.textContent=strings.endingTitle; overlayText.textContent=strings.endingText;
    primary.textContent=strings.restart; pendingDay=1; futureMissLimit=3;
  }else{
    overlayTitle.textContent=strings.lost; overlayText.textContent=loseFor(currentDay);
    primary.textContent=retryFor(currentDay); pendingDay=currentDay;
  }
}

// A hold of the page's own (the window lost focus, the credits are open): the game's clock stops.
function togglePause({silent=false}={}){
  if(!sim||!running)return;
  if(silent&&!paused&&simPaused())return;       // the program's pause already holds the game
  paused=!paused; syncPauseButton();
  clearHeldDirections();
  if(!silent) audio.play(paused?'pause':'resume');
  if(paused){overlay.hidden=false;setOverlayRule();overlayTitle.textContent=strings.pause;overlayText.textContent=strings.pauseHint;primary.textContent=strings.resume;pendingDay=null;}
  else{overlay.hidden=true;clock.reset();last=performance.now();}
}

// The pause that a player asks for is the program's: START, which the game reads itself (Simulation), so it takes a moment to begin and to end.
function askPause(){
  if(!sim||!running)return;
  if(paused) togglePause(); else startTap=Math.max(startTap,3);
}

// What the card of the program's pause shows (the game itself is held by the program, and the clock goes on).
function showPauseCard(){
  overlay.hidden=false; setOverlayRule(); overlayTitle.textContent=strings.pause; overlayText.textContent=strings.pauseHint; primary.textContent=strings.resume; pendingDay=null;
  syncPauseButton(); pauseBtn.hidden=true;
}

function toggleSound(){
  soundEnabled=!soundEnabled; localStorage.setItem('zs-sound',soundEnabled?'on':'off');
  audio.setEnabled(soundEnabled); if(soundEnabled){audio.unlock();audio.play('ui');}
  updateAudioButton();
}

function openCredits(){
  creditsPausedGame=Boolean(running&&!paused);
  if(creditsPausedGame) togglePause({silent:true});
  audio.play('ui');
  if(typeof creditsDialog.showModal==='function') creditsDialog.showModal(); else creditsDialog.setAttribute('open','');
}
function closeCredits(){
  if(creditsDialog.open && typeof creditsDialog.close==='function') creditsDialog.close(); else creditsDialog.removeAttribute('open');
  if(creditsPausedGame && paused) togglePause({silent:true});
  creditsPausedGame=false;
}

function topicName(id){return id===0?strings.earth:id===1?strings.history:id===2?strings.books:id===3?strings.space:'?';}

function dispatchEvents(events){
  for(const e of events){
    if(e.type==='RING_START'){renderer.flash(currentDay===DREAM_STAGE?strings.ring:`${strings.ring}: ${topicName(e.topic)}`);audio.play('ring');}
    if(e.type==='ANSWER'){renderer.flash(strings.answer);audio.play('answer');}
    if(e.type==='TOPIC'){renderer.flash(`${strings.topic}: ${topicName(e.topic)}`);audio.play('topic');}
    if(e.type==='CHATTER_TOPIC'){renderer.flash(`${strings.chatter}: ${topicName(e.topic)}`);audio.play('topic');}
    if(e.type==='MISS'){renderer.flash(strings.missed);audio.play('miss');}
    if(e.type==='COFFEE_READY'){renderer.flash(strings.ready);audio.play('coffee-ready');}
    if(e.type==='COFFEE_PICKUP'){renderer.flash(strings.coffee);audio.play('coffee');}
    if(e.type==='PHONE_TELEPORT'){renderer.flash(strings.teleport);audio.play('teleport');}
    if(e.type==='GHOST_CAUGHT'){renderer.flash(strings.ghost);audio.play('ghost');}
    if(e.type==='KNOCK'){renderer.flash(strings.knock);audio.play('knock');}
    if(e.type==='WISDOM'){renderer.flash(strings.wisdom);audio.play('wisdom');}
    if(e.type==='STAGE_WON')showEnd(true);
    if(e.type==='STAGE_LOST')showEnd(false);
    if(e.type==='DREAM_CAUGHT')showDreamResult(false);
    if(e.type==='PAUSE'){audio.play('pause');showPauseCard();}
    if(e.type==='RESUME'){audio.play('resume');overlay.hidden=true;syncPauseButton();}
  }
}

function frame(now){
  const delta=now-last; last=now;
  if(screenMode==='TITLE'||screenMode==='TITLE_TRANSITION'||screenMode==='SOUND_TEST'){
    const {steps}=titleClock.consume(delta);
    for(let i=0;i<steps&&(screenMode==='TITLE'||screenMode==='TITLE_TRANSITION'||screenMode==='SOUND_TEST');i++) frontTick();
  }else if(sim&&running&&!paused){
    const {steps}=clock.consume(delta);
    for(let i=0;i<steps&&running;i++){dispatchEvents(sim.tick(gameInput()));tickRingingAudio();}
    renderer.draw(sim);
  }else{
    if(sim) renderer.draw(sim);
    if(screenMode==='GAME'&&testMode&&!running&&!overlay.hidden&&pendingDay!==null&&!creditsDialog.open){
      const {steps}=levelClock.consume(delta);
      for(let i=0;i<steps&&!running;i++) levelSelectTick();
    }
  }
  requestAnimationFrame(frame);
}

function keyDirection(code){return({ArrowUp:'UP',KeyW:'UP',ArrowDown:'DOWN',KeyS:'DOWN',ArrowLeft:'LEFT',KeyA:'LEFT',ArrowRight:'RIGHT',KeyD:'RIGHT'})[code];}
window.addEventListener('keydown',e=>{
  if(KEY_BUTTON[e.code]&&!creditsDialog.open){ keysDown.add(e.code); latchedPad|=BUTTON[KEY_BUTTON[e.code]]; }
  const dir=keyDirection(e.code); if(dir){if(!e.repeat){pressDirection(held,dir);latchedPad|=BUTTON[dir];syncTouchPressed();}e.preventDefault();}
  if((e.code==='KeyP'||e.code==='Escape')&&!e.repeat&&!creditsDialog.open){askPause();e.preventDefault();}
  if(e.code==='KeyM'&&!e.repeat){toggleSound();e.preventDefault();}
  if((e.code==='Enter'||e.code==='Space')&&!e.repeat&&!creditsDialog.open){
    if(screenMode==='TITLE'){startFromTitle();e.preventDefault();}
    else if(screenMode==='SOUND_TEST') e.preventDefault();       // START leaves it, at the next pass
    else if(screenMode==='GAME'){
      if(running){ askPause(); e.preventDefault(); }
      else if(!overlay.hidden){ startSelectedDay(pendingDay??currentDay); e.preventDefault(); }
    }
  }
});
window.addEventListener('keyup',e=>{keysDown.delete(e.code);const dir=keyDirection(e.code);if(dir){releaseDirection(held,dir);syncTouchPressed();e.preventDefault();}});
window.addEventListener('blur',()=>{clearHeldDirections();keysDown.clear();if(running&&!paused)togglePause({silent:true});});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearHeldDirections();keysDown.clear();if(running&&!paused)togglePause({silent:true});}});
primary.addEventListener('click',()=>{
  audio.unlock();
  if(screenMode==='SOUND_TEST'){ startPulse=true; return; }
  if(running){ askPause(); return; }
  startSelectedDay(pendingDay??currentDay);
});
titleStart.addEventListener('click',startFromTitle);
titleScreen.addEventListener('pointerdown',e=>{if(!e.target.closest('button'))startFromTitle();});
pauseBtn.addEventListener('click',askPause);
audioBtn.addEventListener('click',toggleSound);
creditsBtn.addEventListener('click',openCredits);
creditsClose.addEventListener('click',closeCredits);
creditsDialog.addEventListener('cancel',e=>{e.preventDefault();closeCredits();});
creditsDialog.addEventListener('click',e=>{if(e.target===creditsDialog)closeCredits();});
langBtn.addEventListener('click',()=>setLanguage(lang==='en'?'it':'en'));
resetPreferences.addEventListener('click',()=>{
  localStorage.removeItem('zs-lang'); localStorage.removeItem('zs-sound');
  soundEnabled=true; audio.setEnabled(true); updateAudioButton(); setLanguage('en'); localStorage.removeItem('zs-lang'); localStorage.removeItem('zs-sound'); audio.play('ui');
});
for(const button of document.querySelectorAll('[data-dir]')){
  const dir=button.dataset.dir;
  const set=v=>{v?pressDirection(held,dir):releaseDirection(held,dir);syncTouchPressed();};
  button.addEventListener('pointerdown',e=>{button.setPointerCapture(e.pointerId);set(true);latchedPad|=BUTTON[dir];audio.unlock();e.preventDefault();});
  button.addEventListener('pointerup',e=>{set(false);e.preventDefault();});
  button.addEventListener('pointercancel',()=>set(false)); button.addEventListener('lostpointercapture',()=>set(false));
}

setLanguage(lang); showTitle({resetRng:true}); requestAnimationFrame(frame);
