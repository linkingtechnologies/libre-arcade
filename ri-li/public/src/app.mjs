/* Ri-li 2.0.1 browser restoration shell. SPDX-License-Identifier: GPL-3.0-only */
import { LevelSet } from './levels.mjs';
import { GlibcRand } from './rng.mjs';
import { GameSession,STATE_PLAYING,STATE_DEATH_PAUSE,STATE_WIN_PAUSE,STATE_QUIZ,STATE_QUIZ_RESULT,STATE_GAME_OVER,STATE_HIGH_SCORE } from './session.mjs';
import { D_UP,D_DOWN,D_LEFT,D_RIGHT } from './core.mjs';
import { Renderer } from './renderer.mjs';
import { PreferenceStore } from './preferences.mjs';
import { AudioManager } from './audio.mjs';
import { LANGUAGES } from './languages.mjs';

// main() seeds the generator once, from the clock (srand(SDL_GetTicks())), and every game goes on from there; globalThis.__RILI_SEED__ is for the tests that need the same numbers as the original
const rng=new GlibcRand(globalThis.__RILI_SEED__??(globalThis.crypto?.getRandomValues?.(new Uint32Array(1))[0]??Date.now()));
const STEP=16,canvas=document.getElementById('game'),renderer=new Renderer(canvas),status=document.getElementById('status');
const store=new PreferenceStore(),audio=new AudioManager();
const infoPanel=document.getElementById('info-panel'),infoTitle=document.getElementById('info-title'),infoBody=document.getElementById('info-body');
const resetArea=document.getElementById('reset-area'),resetData=document.getElementById('reset-data'),resetNote=document.getElementById('reset-note');
let prefs=store.value,levels=null,session=null,snap=null,paused=true,pendingDirection=null,last=0,acc=0;
let screen='menu',menuSel=0,levelSel=prefs.maxUnlocked,diffSel=1,optionsSel=4,ingameSel=0,optionsReturn='menu',langSel=0,nameEdit='',transitionCursor=0,infoMode=null,resetArmed=false,resetTimer=null;
const difficultyNames=['easy','normal','hard'];
renderer.setLanguage(prefs.language);renderer.help=prefs.help;audio.setVolumes(prefs.sfxVolume,prefs.musicVolume);audio.menuMusic();

// The texts of the page's own (the bar, the guide, the credits, the status line) are in Italian and in English; with any other language the pictures of the game are in that language and these are in English.
const langText=(it,en)=>renderer.language==='it'?it:en;
const shellLanguage=()=>renderer.language==='it'?'it':'en';
document.documentElement.lang=shellLanguage();
function updateChromeText(){
  document.getElementById('pause').textContent=langText('Pausa','Pause');
  document.getElementById('help').textContent=langText('Freccia','Arrow');
  document.getElementById('restart').textContent=langText('Menu','Menu');
  document.getElementById('instructions').textContent=langText('Guida','Guide');
  document.getElementById('credits').textContent=langText('Crediti','Credits');
  const lang=document.getElementById('lang');lang.textContent=renderer.language.toUpperCase();lang.setAttribute('aria-label',langText('Cambia lingua','Change language'));lang.title=langText('Lingua','Language');
  document.getElementById('keys-help').textContent=langText('← ↑ ↓ → percorso · Invio/Spazio conferma · P pausa · H freccia · Esc menu','← ↑ ↓ → route · Enter/Space confirm · P pause · H arrow · Esc menu');
  document.querySelector('.touchpad')?.setAttribute('aria-label',langText('Controlli direzionali','Directional controls'));
}
function infoMarkup(kind){
  const it=renderer.language==='it';
  if(kind==='credits')return it?{title:'Crediti',html:`<p><strong>Ri-li 2.0.1</strong> è stato ideato, programmato e disegnato da Dominique Roux-Serret.</p><p>Le musiche originali sono di Maf464 / Charcosset B. Il restauro conserva grafica, livelli, logica e audio della release storica, con adattamenti tecnici per il browser.</p><p>Software distribuito secondo i termini GPL inclusi nel pacchetto. Progetto: <a href="https://linkingtechnologies.github.io/libre-arcade/" target="_blank" rel="noopener noreferrer">Libre Arcade</a>.</p>`}:{title:'Credits',html:`<p><strong>Ri-li 2.0.1</strong> was designed, programmed and illustrated by Dominique Roux-Serret.</p><p>The original music is by Maf464 / Charcosset B. This restoration preserves the graphics, levels, game logic and audio of the historical release, with technical adaptations for the browser.</p><p>Software is distributed under the GPL terms included in this package. Project: <a href="https://linkingtechnologies.github.io/libre-arcade/" target="_blank" rel="noopener noreferrer">Libre Arcade</a>.</p>`};
  return it?{title:'Come si gioca',html:`<p>Guida il trenino lungo i binari e raccogli tutti i vagoni. Il treno diventa sempre più lungo: evita di urtare la tua stessa coda.</p><ul><li><strong>Frecce / D-pad:</strong> scegli la direzione preferita al prossimo incrocio.</li><li><strong>Tap sul gioco:</strong> cicla la prossima svolta disponibile.</li><li><strong>P:</strong> pausa. <strong>H:</strong> mostra o nasconde la freccia di aiuto. <strong>Esc:</strong> il menu del gioco (Continua, Opzioni, Esci dal gioco).</li><li>Dopo ogni livello rispondi al quiz sui Diritti Umani per ottenere 50 punti bonus.</li></ul><p>I simboli sui binari possono modificare velocità o distanza fra i vagoni, oppure assegnare una vita extra.</p>`}:{title:'How to play',html:`<p>Guide the train along the tracks and collect every wagon. The train keeps growing, so avoid colliding with your own tail.</p><ul><li><strong>Arrow keys / D-pad:</strong> choose the preferred direction at the next junction.</li><li><strong>Tap the game:</strong> cycle the next available turn.</li><li><strong>P:</strong> pause. <strong>H:</strong> show or hide the route arrow. <strong>Esc:</strong> the menu of the game (Continue, Options, Exit game).</li><li>After each level, answer the Human Rights quiz for a 50-point bonus.</li></ul><p>Track symbols can change speed or wagon spacing, or grant an extra life.</p>`};
}
function openInfo(kind){
  infoMode=kind;resetArmed=false;clearTimeout(resetTimer);
  if(screen==='game'&&!paused&&session?.state===STATE_PLAYING){paused=true;audio.pause(true);}
  const m=infoMarkup(kind);infoTitle.textContent=m.title;infoBody.innerHTML=m.html;
  resetArea.hidden=kind!=='instructions';resetData.textContent=langText('Resetta progressi e punteggi','Reset progress and scores');resetNote.textContent='';
  infoPanel.hidden=false;document.getElementById('info-close').focus();
}
function closeInfo(){infoPanel.hidden=true;infoMode=null;resetArmed=false;clearTimeout(resetTimer);canvas.focus({preventScroll:true});}
updateChromeText();
function persist(patch={}){prefs=store.update({...patch,language:renderer.language,help:renderer.help});audio.setVolumes(prefs.sfxVolume,prefs.musicVolume);}
async function userGesture(){await audio.unlock();}
function menuMusic(){audio.menuMusic();}
function setScreen(next){screen=next;document.body.dataset.screen=next;acc=0;if(next!=='game')paused=true;if(['menu','level','difficulty','options','language','scores','quit'].includes(next))menuMusic();draw();}
function click(){audio.play('click',performance.now());}

const TEST_HOOKS=Boolean(globalThis.__RILI_ENABLE_TEST_HOOKS__)||(typeof location!=='undefined'&&new URLSearchParams(location.search).has('test'));
async function load(){const [buf]=await Promise.all([fetch('data/levels.dat').then(r=>r.arrayBuffer()),renderer.load(prefs.language)]);levels=new LevelSet(buf);last=performance.now();requestAnimationFrame(loop);if(TEST_HOOKS)window.__RILI_READY__=true;draw();}
function createGame(startLevel,difficulty){heldKey=0;maskK=0;session=new GameSession(levels,{startLevel,difficulty,rng,keys:session?.oracle?.keys??null,highScores:prefs.highScores});session.oracle.renderFrame();snap=session.snapshot();paused=true;pendingDirection=null;acc=0;transitionCursor=session.transitions.length;screen='game';document.body.dataset.screen='game';audio.startGameMusic();publish();draw();}
function finishToNameOrMenu(){if(!session)return;persist({maxUnlocked:Math.max(prefs.maxUnlocked,session.maxUnlocked,session.levelNumber),highScores:session.highScores});if(session.highScoreSlot!==null){nameEdit=session.highScores[session.highScoreSlot].name||'';screen='name_entry';menuMusic();draw();}else setScreen('menu');}
function syncProgress(){if(!session)return;const unlocked=Math.max(prefs.maxUnlocked,session.maxUnlocked,session.levelNumber);if(unlocked!==prefs.maxUnlocked)persist({maxUnlocked:unlocked});}
function processAudio(beforeState,s){
  for(const ev of s.frame_events||[]){const map={wagon:'wagon',stretch:'stretch',shrink:'shrink',speed:'speed',life:'life'};if(map[ev.object])audio.play(map[ev.object],s.clock_ms);}
  for(;transitionCursor<session.transitions.length;transitionCursor++){
    const t=session.transitions[transitionCursor];
    if(t.event==='crash')audio.play('crash',t.at_clock_ms);
    else if(t.event==='last_wagon')audio.play('end',t.at_clock_ms);
    else if(t.event==='quiz_answer')audio.play(t.correct?'end':'lose',t.at_clock_ms);
    else if(t.event==='load_level')audio.nextGameMusic();
  }
  if((session.state===STATE_GAME_OVER||session.state===STATE_HIGH_SCORE)&&beforeState!==session.state)finishToNameOrMenu();
}
function publish(){document.body.dataset.screen=screen;if(TEST_HOOKS)window.__RILI_STATE__={screen,state:session?.state??null,level:session?.levelNumber??null,max_unlocked:prefs.maxUnlocked,score:session?.score??null,lives:session?.lives??null,paused,language:renderer.language,difficulty:session?.difficulty??difficultyNames[diffSel],sfx_volume:prefs.sfxVolume,music_volume:prefs.musicVolume,high_scores:prefs.highScores,info:infoMode,audio:audio.diagnostics()};}
function draw(){
  updateChromeText();document.body.dataset.screen=screen;
  if(!levels){status.textContent=langText('Caricamento…','Loading…');return;}
  if(screen==='menu'){renderer.drawMainMenu(menuSel,performance.now());status.textContent=langText('Gioca · Punteggi · Opzioni','Play · Scores · Options');}
  else if(screen==='level'){renderer.drawLevelMenu(menuSel,levelSel,prefs.maxUnlocked,performance.now());status.textContent=langText(`Livello sbloccato massimo: ${prefs.maxUnlocked}`,`Highest unlocked level: ${prefs.maxUnlocked}`);}
  else if(screen==='difficulty'){renderer.drawDifficulty(diffSel,performance.now());status.textContent=langText('Scegli la difficoltà','Choose difficulty');}
  else if(screen==='options'){renderer.drawOptions(optionsSel,prefs,performance.now(),Boolean(document.fullscreenElement));status.textContent=langText('←/→ modifica · Invio seleziona · Esc torna','←/→ change · Enter select · Esc back');}
  else if(screen==='language'){renderer.drawLanguage(langSel,LANGUAGES,performance.now());status.textContent=langText('Scegli la lingua','Choose the language');}
  else if(screen==='ingame'){renderer.drawInGameMenu(levels.get(session.levelNumber),snap,session.oracle,ingameSel,performance.now(),paused&&session.state===STATE_PLAYING,optionsBehind?()=>renderer.drawOptions(optionsBehind.sel,prefs,optionsBehind.clock,optionsBehind.fullscreen):gameBehind?()=>renderer.draw(levels.get(session.levelNumber),gameBehind.snap,gameBehind.oracle,{paused:gameBehind.paused}):null);status.textContent=langText('Continua · Opzioni · Esci dal gioco','Continue · Options · Exit game');}
  else if(screen==='scores'){const fake={highScores:prefs.highScores,highScoreSlot:null,state:'scores'};renderer.drawScores(fake,performance.now());status.textContent=langText('Premi un tasto per tornare al menu','Press any key to return to menu');}
  else if(screen==='name_entry'){renderer.drawNameEntry(session,performance.now(),nameEdit);status.textContent=langText('Scrivi il nome · Backspace cancella · Invio conferma','Type name · Backspace deletes · Enter confirms');}
  else if(screen==='quit'){renderer.menuBase({panel:true,title:true,copyright:true});renderer.uiSprite('T_exit_game',400,310);renderer.uiSprite('T_press_any_key',400,430);status.textContent=langText('Sessione terminata','Session ended');}
  else if(screen==='game')drawGame();
  publish();
}
function drawGame(){const it=renderer.language==='it';if(!session)return;
  if(session.state===STATE_GAME_OVER||session.state===STATE_HIGH_SCORE){renderer.drawScores(session,session.clockMs,{gameOver:session.state===STATE_GAME_OVER});return;}
  const level=levels.get(session.levelNumber);
  if(session.state===STATE_QUIZ||session.state===STATE_QUIZ_RESULT)renderer.drawQuiz(level,snap,session.oracle,session.quiz,session.clockMs);else renderer.draw(level,snap,session.oracle,{paused:paused&&session.state===STATE_PLAYING});
  if(session.state===STATE_QUIZ)status.textContent=it?'Diritti umani: scegli e conferma.':'Human Rights: choose and confirm.';
  else if(session.state===STATE_QUIZ_RESULT)status.textContent=session.quiz.correct?(it?'Corretto: +50 punti.':'Correct: +50 points.'):(it?'Risposta errata.':'Wrong answer.');
  else if(session.state===STATE_WIN_PAUSE)status.textContent=it?'Livello completato…':'Level complete…';
  else if(session.state===STATE_DEATH_PAUSE)status.textContent=it?'Collisione…':'Collision…';
  else if(paused)status.textContent=`${it?'Livello':'Level'} ${session.levelNumber}/50 — ${it?'premi un tasto per iniziare':'press any key to start'}`;
  else status.textContent=`${it?'Livello':'Level'} ${session.levelNumber}/50 · ${it?'Vagoni':'Wagons'} ${snap.wagons-2}/${snap.wagons-2+snap.remaining} · ${it?'Punti':'Score'} ${snap.score}`;
}
// What the last picture but one of the game showed: the menu of the game copies the screen when it opens, and the screen is the back of two buffers (see openInGameMenu)
let prevView=null,gameBehind=null;
function tick(){if(screen!=='game'||!session)return;if(snap){const o=session.oracle;prevView={snap,paused:paused&&session.state===STATE_PLAYING,oracle:{pInter:o.pInter,pEntree:o.pEntree,keys:[...o.keys],baseSpeed:o.baseSpeed}};}applyHeldKey();const beforeState=session.state,beforeLevel=session.levelNumber;if(paused&&session.state===STATE_PLAYING){session.oracle.renderFrame();snap=session.snapshot();return;}if(session.state===STATE_GAME_OVER||session.state===STATE_HIGH_SCORE)return;session.oracle.keyMask=maskK!==0;snap=session.step(STEP,session.state===STATE_PLAYING?pendingDirection:null,true);pendingDirection=null;processAudio(beforeState,snap);syncProgress();if(screen!=='game')return;if(session.state===STATE_PLAYING&&((beforeState===STATE_DEATH_PAUSE)||(beforeState===STATE_QUIZ_RESULT)||session.levelNumber!==beforeLevel)){paused=true;heldKey=0;maskK=0;session.oracle.renderFrame();snap=session.snapshot();}}
function loop(now){let delta=Math.min(100,now-last);last=now;acc+=delta;let guard=0;while(acc>=STEP&&guard++<8){tick();acc-=STEP;}draw();requestAnimationFrame(loop);}
function startFromPause(){if(screen==='game'&&paused&&session.state===STATE_PLAYING){paused=false;acc=0;audio.pause(false);return true;}return false;}
function backToMenu(){setScreen('menu');menuSel=0;}
function confirmMenu(){click();if(menuSel===0){if(prefs.maxUnlocked<=1){screen='difficulty';diffSel=1;}else{screen='level';menuSel=0;levelSel=prefs.maxUnlocked;}}else if(menuSel===1)setScreen('scores');else if(menuSel===2){screen='options';optionsSel=4;optionsReturn='menu';}else{screen='quit';audio.stopMusic();}draw();}
function confirmLevel(){click();if(menuSel===0){levelSel=1;screen='difficulty';diffSel=1;}else if(menuSel===1){screen='difficulty';diffSel=1;}else backToMenu();draw();}
function confirmDifficulty(){click();createGame(levelSel,difficultyNames[diffSel]);}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.querySelector('.shell').requestFullscreen();persist({fullscreen:Boolean(document.fullscreenElement)});}catch{}draw();}
function changeVolume(which,delta){const key=which==='sfx'?'sfxVolume':'musicVolume';persist({[key]:Math.round(Math.max(0,Math.min(1,prefs[key]+delta*.1))*10)/10});if(which==='sfx')audio.play('life');}
// The menu of the game copies the screen into its background when it starts (Menu::Affiche_InGame), and after Options the screen holds the options picture of
// the frame before the last one (the original draws on the back of two buffers): that picture stays behind the panel.
let optionsBehind=null;
function leaveOptions(){if(optionsReturn==='ingame'){optionsBehind={sel:optionsSel,clock:performance.now()-STEP,fullscreen:Boolean(document.fullscreenElement)};screen='ingame';ingameSel=1;draw();}else backToMenu();}
// the language menu comes from the options screen (Menu::SDLMain_Options) and goes back to it; the button of the bar opens it from the other screens and goes back to them
let languageReturn='options';
function openLanguage(from='options'){languageReturn=from;langSel=Math.max(0,LANGUAGES.indexOf(renderer.language));screen='language';draw();}
function leaveLanguage(){const back=languageReturn;languageReturn='options';screen=back;if(back==='options')optionsSel=3;draw();}
// Menu::SDLMain_Langue, on Enter: the language file of the chosen language is loaded if it is not the one in use
async function chooseLanguage(code){
  if(code!==renderer.language){await renderer.loadLanguage(code);renderer.setLanguage(code);document.documentElement.lang=shellLanguage();persist();}
  leaveLanguage();
}
// Menu::SDLMain_Options: every key is a click; left and right change the volumes or the way the picture is shown, up and down move, Enter acts on the chosen button
function optionsKey(key){
  click();
  if(key==='Escape'){leaveOptions();return;}
  if(key==='ArrowUp')optionsSel=(optionsSel+4)%5;
  else if(key==='ArrowDown')optionsSel=(optionsSel+1)%5;
  else if(key==='ArrowLeft'||key==='ArrowRight'){
    const d=key==='ArrowLeft'?-1:1;
    if(optionsSel===0)changeVolume('sfx',d);else if(optionsSel===1)changeVolume('music',d);
    else if(optionsSel===2&&Boolean(document.fullscreenElement)!==(d<0))toggleFullscreen();
  }
  else if(key==='Enter'||key===' '){if(optionsSel===2)toggleFullscreen();else if(optionsSel===3)openLanguage();else if(optionsSel===4)leaveOptions();}
  draw();
}
// Menu::SDLMain_Langue: the labels stand in columns of NL; up and down go through them, left and right from a column to the next
function languageKey(key){
  click();
  const n=LANGUAGES.length,nl=n%3===0?n/3:Math.trunc(n/3)+1;
  if(key==='ArrowUp')langSel=(langSel+n-1)%n;
  else if(key==='ArrowDown')langSel=(langSel+1)%n;
  else if(key==='ArrowLeft'){if(langSel-nl>=0)langSel-=nl;}
  else if(key==='ArrowRight'){if(langSel+nl<n)langSel+=nl;}
  else if(key==='Enter'||key===' ')return chooseLanguage(LANGUAGES[langSel]);
  else if(key==='Escape'){leaveLanguage();return;}
  draw();
}
// Menu::SDLMain_InGame: Escape opens it in the middle of a game; Continue and Escape go back to the game, which waits for a key
function openInGameMenu(){ingameSel=0;optionsBehind=null;gameBehind=prevView;screen='ingame';draw();}
function ingameKey(key){
  click();
  if(key==='Escape'){screen='game';paused=true;draw();return;}
  if(key==='ArrowUp')ingameSel=(ingameSel+2)%3;
  else if(key==='ArrowDown')ingameSel=(ingameSel+1)%3;
  else if(key==='Enter'||key===' '){
    if(ingameSel===0){screen='game';paused=true;}
    else if(ingameSel===1){screen='options';optionsSel=4;optionsReturn='ingame';}
    else{session.exitGame();finishToNameOrMenu();return;}
  }
  draw();
}
function skipQuiz(){click();const before=session.state;session.skipQuiz();processAudio(before,{});if(screen!=='game')return;paused=true;heldKey=0;maskK=0;session.oracle.renderFrame();snap=session.snapshot();draw();}

function nameAllowed(c){return /^[A-Za-z0-9 .,!_?*+<>%$()&;[\]|-]$/.test(c);}
function finishName(){if(!session||session.highScoreSlot==null)return;session.highScores[session.highScoreSlot].name=nameEdit;persist({highScores:session.highScores,maxUnlocked:Math.max(prefs.maxUnlocked,session.maxUnlocked)});click();backToMenu();}

// Jeux::SDLMain keeps the last key pressed (Key) and which arrows are down (MasqueK: up 1, down 2, left 4, right 8). A key down is acted on by PrendTouche in every frame
// in which the train is not in a pause, and while an arrow is down the arrow on the screen keeps the player's direction instead of the train's (Loco::DoFleche).
let heldKey=0,maskK=0;
const SDL_SYM={ArrowUp:273,ArrowDown:274,ArrowRight:275,ArrowLeft:276,Enter:13,' ':32,Shift:304,Control:306};
const ARROW_BIT={273:1,274:2,276:4,275:8};
function keySym(key){return SDL_SYM[key]??(key.length===1?key.toLowerCase().charCodeAt(0):0);}
function gameKeyDown(e){if(e.repeat)return;const sym=keySym(e.key);if(!sym)return;heldKey=sym;maskK|=ARROW_BIT[sym]||0;}
function gameKeyUp(e){if(screen!=='game'||!session||session.state===STATE_QUIZ||session.state===STATE_QUIZ_RESULT)return;const sym=keySym(e.key);maskK&=~(ARROW_BIT[sym]||0);if(!maskK)heldKey=0;}
window.addEventListener('keyup',gameKeyUp);
window.addEventListener('blur',()=>{heldKey=0;maskK=0;});
function applyHeldKey(){
  if(!heldKey||session.state!==STATE_PLAYING)return;
  let k=heldKey;
  if(paused&&(k===13||k>=32)&&k<307&&(k<293||k>296))k=32;   // press any key
  if(k===273)pendingDirection=D_UP;else if(k===274)pendingDirection=D_DOWN;else if(k===276)pendingDirection=D_LEFT;else if(k===275)pendingDirection=D_RIGHT;
  else if(k===112){if(!paused){paused=true;audio.pause(true);}}
  else if(k===32){if(paused){paused=false;audio.pause(false);}}   // not startFromPause(): it clears the time to run, which tick()'s caller is about to take a step from
  else if(k===104){renderer.help=!renderer.help;persist();}
}
window.addEventListener('keydown',async e=>{await userGesture();if(!infoPanel.hidden){if(e.key==='Escape'||e.key==='Enter'||e.key===' '){e.preventDefault();closeInfo();}return;}const nav=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Enter','Escape','Backspace'];if(nav.includes(e.key)||['p','P','h','H','r','R'].includes(e.key))e.preventDefault();
  if(screen==='quit'){screen='menu';menuSel=0;menuMusic();draw();return;}
  if(screen==='language'){await languageKey(e.key);return;}
  if(screen==='ingame'){ingameKey(e.key);return;}
  if(screen==='name_entry'){click();if(e.key==='Enter'||e.key==='Escape'){finishName();return;}if(e.key==='Backspace'){nameEdit=nameEdit.slice(0,-1);draw();return;}if(e.key.length===1&&nameAllowed(e.key)&&nameEdit.length<79&&renderer.textWidth(nameEdit+e.key)<460){nameEdit+=e.key;draw();}return;}
  if(screen==='scores'){click();backToMenu();return;}
  if(screen==='menu'){if(e.key==='ArrowUp'){menuSel=(menuSel+3)%4;click();}else if(e.key==='ArrowDown'){menuSel=(menuSel+1)%4;click();}else if(e.key==='Enter'||e.key===' ')confirmMenu();else if(e.key==='Escape'){click();screen='quit';audio.stopMusic();}draw();return;}
  if(screen==='level'){if(e.key==='Escape'){backToMenu();return;}if(e.key==='ArrowUp'){menuSel=(menuSel+2)%3;click();}else if(e.key==='ArrowDown'){menuSel=(menuSel+1)%3;click();}else if(e.key==='ArrowLeft'){levelSel=Math.max(1,levelSel-1);menuSel=1;click();}else if(e.key==='ArrowRight'){levelSel=Math.min(prefs.maxUnlocked,levelSel+1);menuSel=1;click();}else if(e.key==='Enter'||e.key===' ')confirmLevel();draw();return;}
  if(screen==='difficulty'){if(e.key==='Escape'){backToMenu();return;}if(e.key==='ArrowUp'){diffSel=(diffSel+2)%3;click();}else if(e.key==='ArrowDown'){diffSel=(diffSel+1)%3;click();}else if(e.key==='Enter'||e.key===' ')confirmDifficulty();draw();return;}
  if(screen==='options'){optionsKey(e.key);return;}
  if(screen!=='game'||!session)return;
  if(e.key==='r'||e.key==='R'){createGame(session.levelNumber,session.difficulty);return;}
  if(e.key==='Escape'){if(session.state===STATE_QUIZ){skipQuiz();return;}if(session.state===STATE_QUIZ_RESULT)return;openInGameMenu();return;}
  if(session.state===STATE_QUIZ){click();if(e.key==='ArrowLeft')session.selectQuizLeft();else if(e.key==='ArrowRight')session.selectQuizRight();else if(e.key==='ArrowUp'||e.key==='ArrowDown')session.toggleQuizSelection();else if(e.key===' '||e.key==='Enter'){const before=session.transitions.length;session.answerQuizSelected();for(let i=before;i<session.transitions.length;i++){const t=session.transitions[i];if(t.event==='quiz_answer')audio.play(t.correct?'end':'lose',t.at_clock_ms);}transitionCursor=session.transitions.length;}draw();return;}
  if(session.state===STATE_QUIZ_RESULT)return;
  gameKeyDown(e);
});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&screen==='game'&&session?.state===STATE_PLAYING){paused=true;audio.pause(true);draw();}});
function rotateArrow(){if(session.state!==STATE_PLAYING||paused)return;const o=session.oracle;if(o.pInter<0)return;let d=o.keys[0],found=false,x=o.pInter%17,y=Math.trunc(o.pInter/17),b=o.board;do{if(d===D_UP){d=D_RIGHT;found=o.pEntree!==D_RIGHT&&x+1<17&&b[o.pInter+1]!==0;}else if(d===D_RIGHT){d=D_DOWN;found=o.pEntree!==D_DOWN&&y+1<15&&b[o.pInter+17]!==0;}else if(d===D_DOWN){d=D_LEFT;found=o.pEntree!==D_LEFT&&x>0&&b[o.pInter-1]!==0;}else{d=D_UP;found=o.pEntree!==D_UP&&y>0&&b[o.pInter-17]!==0;}}while(!found);o.bufferKey(d);click();draw();}
canvas.addEventListener('pointerdown',async e=>{await userGesture();const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*800/r.width,y=(e.clientY-r.top)*600/r.height;
  if(screen==='menu'){const ys=[229,306,384,461],i=ys.findIndex(v=>Math.abs(y-v)<40);if(i>=0){menuSel=i;confirmMenu();}return;}
  if(screen==='difficulty'){const ys=[225,340,455],i=ys.findIndex(v=>Math.abs(y-v)<55);if(i>=0){diffSel=i;confirmDifficulty();}return;}
  if(screen==='level'){if(Math.abs(y-225)<45){menuSel=0;confirmLevel();}else if(Math.abs(y-320)<45){menuSel=1;confirmLevel();}else if(Math.abs(y-455)<45){menuSel=2;confirmLevel();}else if(Math.abs(y-380)<45&&x<400){levelSel=Math.max(1,levelSel-1);menuSel=1;click();draw();}else if(Math.abs(y-380)<45){levelSel=Math.min(prefs.maxUnlocked,levelSel+1);menuSel=1;click();draw();}return;}
  if(screen==='options'){const ys=[110,200,300,400,490],i=ys.findIndex(v=>Math.abs(y-v)<45);if(i>=0){optionsSel=i;click();if(i<2)changeVolume(i===0?'sfx':'music',x<476?-1:1);else if(i===2)toggleFullscreen();else if(i===3)openLanguage();else leaveOptions();}draw();return;}
  if(screen==='ingame'){const ys=[185,300,415],i=ys.findIndex(v=>Math.abs(y-v)<50);if(i>=0){ingameSel=i;ingameKey('Enter');}return;}
  if(screen==='language'){const n=LANGUAGES.length,nl=n%3===0?n/3:Math.trunc(n/3)+1,gap=Math.trunc(600/(nl+1));for(let i=0;i<n;i++){const cx=Math.trunc(i/nl)*Math.trunc(800/3)+Math.trunc(800/6),cy=(i%nl)*gap+gap;if(Math.abs(x-cx)<110&&Math.abs(y-cy)<50){langSel=i;await languageKey('Enter');break;}}return;}
  if(screen==='scores'){backToMenu();return;}if(screen==='quit'){screen='menu';menuSel=0;menuMusic();draw();return;}
  if(screen!=='game'||!session)return;if(session.state===STATE_QUIZ){if(y>445&&y<540){if(x<340)session.selectQuizLeft();else session.selectQuizRight();const before=session.transitions.length;session.answerQuizSelected();for(let i=before;i<session.transitions.length;i++){const t=session.transitions[i];if(t.event==='quiz_answer')audio.play(t.correct?'end':'lose',t.at_clock_ms);}transitionCursor=session.transitions.length;draw();}return;}rotateArrow();
});

document.getElementById('restart').onclick=async()=>{await userGesture();if(screen==='game'){persist({highScores:session.highScores,maxUnlocked:Math.max(prefs.maxUnlocked,session.maxUnlocked)});backToMenu();}else backToMenu();};
document.getElementById('pause').onclick=async()=>{await userGesture();if(screen!=='game'||session.state!==STATE_PLAYING)return;if(paused)startFromPause();else{paused=true;audio.pause(true);}draw();};
document.getElementById('help').onclick=()=>{renderer.help=!renderer.help;persist();draw();};
document.getElementById('lang').onclick=async()=>{
  await userGesture();
  if(screen==='language'||screen==='name_entry')return;
  if(screen==='game'&&!paused&&session?.state===STATE_PLAYING){paused=true;audio.pause(true);}
  openLanguage(screen);
};


// Guide/credits, local-data reset and touch D-pad.
document.getElementById('instructions').onclick=async()=>{await userGesture();openInfo('instructions');};
document.getElementById('credits').onclick=async()=>{await userGesture();openInfo('credits');};
document.getElementById('info-close').onclick=()=>closeInfo();
infoPanel.addEventListener('pointerdown',e=>{if(e.target===infoPanel)closeInfo();});
resetData.onclick=async()=>{
  if(!resetArmed){resetArmed=true;resetData.textContent=langText('Conferma reset','Confirm reset');resetNote.textContent=langText('Premi di nuovo per cancellare progressi e punteggi.','Press again to clear progress and scores.');resetTimer=setTimeout(()=>{resetArmed=false;resetData.textContent=langText('Resetta progressi e punteggi','Reset progress and scores');resetNote.textContent='';},5000);return;}
  clearTimeout(resetTimer);prefs=store.reset();await renderer.loadLanguage(prefs.language);renderer.setLanguage(prefs.language);renderer.help=prefs.help;document.documentElement.lang=shellLanguage();audio.setVolumes(prefs.sfxVolume,prefs.musicVolume);levelSel=1;menuSel=0;diffSel=1;optionsSel=4;session=null;snap=null;pendingDirection=null;paused=true;closeInfo();setScreen('menu');
};
const touchDirections={up:D_UP,down:D_DOWN,left:D_LEFT,right:D_RIGHT};
for(const b of document.querySelectorAll('#touchpad [data-dir]'))b.addEventListener('pointerdown',async e=>{e.preventDefault();e.stopPropagation();await userGesture();if(screen!=='game'||!session||session.state!==STATE_PLAYING)return;const d=touchDirections[b.dataset.dir];if(paused){startFromPause();draw();return;}pendingDirection=d;click();draw();});
if(TEST_HOOKS)window.__RILI_TEST__={prefs:()=>structuredClone(prefs),start:(level=1,d='normal')=>createGame(level,d),screen:()=>screen,menu:()=>setScreen('menu'),options:()=>setScreen('options'),openInfo,closeInfo,audio:()=>audio.diagnostics()};
load().catch(err=>{console.error(err);status.textContent='Ri-li: '+err.message;});
