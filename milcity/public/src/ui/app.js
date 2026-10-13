// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-only

import {Game} from '../core/game.js';
import {CONFIG} from '../core/config.js';
import {M5Controller,CITY_ACTIONS,MIL_ACTIONS} from './m5-model.js';
import {drawCity,drawRadar as drawHistoricalRadar,drawHud,resetVisualTimers,getVisualState,restoreVisualState} from './m6-renderer.js';

const phone=document.querySelector('#phoneInner'), frame=document.querySelector('#phone'), stage=document.querySelector('.stage');
const gamePanel=document.querySelector('#gamePanel'), statusRow=document.querySelector('#statusRow'), modeTabs=document.querySelector('#modeTabs'), actionGrid=document.querySelector('#actionGrid'), actionCard=document.querySelector('#actionCard'), feedback=document.querySelector('#feedback'), quickStart=document.querySelector('#quickStart'), endgamePanel=document.querySelector('#endgamePanel'), gameButtons=document.querySelector('#gameButtons'), primaryAction=document.querySelector('#primaryAction'), exitGame=document.querySelector('#exitGame'), cursorHelp=document.querySelector('#cursorHelp');
const helpOverlay=document.querySelector('#helpOverlay'), helpOverlayTitle=document.querySelector('#helpOverlayTitle'), helpOverlayBody=document.querySelector('#helpOverlayBody'), helpClose=document.querySelector('#helpClose');
const LOGICAL_W=240, LOGICAL_H=320, RENDER_SCALE=2, MAX_DISPLAY_SCALE=1.8, MIN_DISPLAY_SCALE=0.55;
function updatePhoneScale(){
  const r=stage.getBoundingClientRect(); if(!r.width||!r.height)return;
  const shortLandscape=window.innerWidth>=window.innerHeight&&window.innerHeight<=420;
  const narrow=window.innerWidth<=720&&!shortLandscape;
  const maxW=narrow?Math.min(r.width-12,430):Math.min(430,Math.max(280,r.width*.44));
  const playing=!gamePanel.classList.contains('hidden');
  const maxH=narrow&&playing?Math.max(176,r.height*.47):r.height-12;
  const scale=Math.max(MIN_DISPLAY_SCALE,Math.min(MAX_DISPLAY_SCALE,maxW/LOGICAL_W,maxH/LOGICAL_H));
  frame.style.width=`${Math.round(LOGICAL_W*scale)}px`;frame.style.height=`${Math.round(LOGICAL_H*scale)}px`;phone.style.transform=`scale(${scale})`;
}
window.addEventListener('resize',()=>requestAnimationFrame(updatePhoneScale));
if('ResizeObserver' in window)new ResizeObserver(()=>requestAnimationFrame(updatePhoneScale)).observe(stage);

let game=null,ui=null,canvas=null,ctx=null,simTimer=null,renderTimer=null,running=false,lang='en',lastFeedback=null,helpWasRunning=false,formOpen=false;
// The options of the original's menu (it keeps them in the phone's record store), kept in the browser's local storage. Each is
// checked against the steps the menu moves it by, so that a value that was edited or damaged falls back to its default.
const OPTIONS_KEY='milcity.options.v1';
function loadOptions(){
  const d={water:50,maxScore:1000,money:100,vibration:true};
  try{
    const o=JSON.parse(localStorage.getItem(OPTIONS_KEY)||'{}');
    const stepped=(v,min,max,step)=>Number.isInteger(v)&&v>=min&&v<=max&&(v-min)%step===0;
    if(stepped(o.water,5,95,5))d.water=o.water;
    if(stepped(o.maxScore,500,10000,500))d.maxScore=o.maxScore;
    if(stepped(o.money,50,1000,50))d.money=o.money;
    if(typeof o.vibration==='boolean')d.vibration=o.vibration;
  }catch(_){}
  return d;
}
const settings=loadOptions();
function saveOptions(){try{localStorage.setItem(OPTIONS_KEY,JSON.stringify({water:settings.water,maxScore:settings.maxScore,money:settings.money,vibration:settings.vibration}));}catch(_){}}
// Game.vibrate(): the handset vibrates, for as long as the original says, if the person has not turned it off and the browser can.
function vibrate(ms){if(settings.vibration&&typeof navigator.vibrate==='function'){try{navigator.vibrate(ms);}catch(_){}}}
const SAVE_KEY='milcity.m13.autosave.v1';
let lastAutosaveGameTime=-Infinity;
const T={
 en:{mainTitle:'MilCity - Blue Edition',continueGame:'Resume Game',main:['New Game','Options','Instructions','Credits'],soloTitle:'MilCity :: Solo Game',solo:['Easy Mode','Medium Mode','Hard Mode','Madness Mode','Training Mode'],optionsTitle:'MilCity :: Options',back:'Back',select:'Select',instructions:'Instructions',credits:'Credits',how:`GOAL\nBuild a city, generate money and energy, manufacture weapons and reach the score limit or eliminate the opponent.\n\nQUICK START\n1. Build a Power Plant on empty land.\n2. Build a Commercial building to earn money.\n3. Build a Missile Silo and wait for ammunition.\n4. Open MILITARY, select Missile and attack the enemy grid.\n\nCITY\nChoose a building from the panel, then click an empty land cell. Green outline = valid placement; red = invalid.\n\nMILITARY\nChoose a weapon, then click the enemy grid. Blue = known water, black = unknown, grey = miss, red = hit, green = destroyed, yellow = Spy reveal.\n\nKEYBOARD\nArrow keys: move cursor\nQ / E: previous / next action\nZ / X: City / Military\nEnter / Space: build or fire\nEsc: leave the current game\n\nSAVE\nThe current game is autosaved locally. After a reload, choose Resume Game from the main menu.`,creditsText:`MilCity - Blue Edition\nHistorical version: 1.0.5 (2011)\nOriginal developer: Jérémy Walther\nOriginal project: SourceForge / milcity\nLicense: GNU GPL version 3\n\nBrowser version for Libre Arcade.\nhttps://linkingtechnologies.github.io/libre-arcade/\n\nThe rules, the economy, the four computer levels, the maps and the timing follow the original's code. The pictures are drawn by this page: the original's own pictures are not used.`,city:'CITY',military:'MILITARY',energy:'Energy',money:'Money',score:'Score',warning:'WARNING',win:'YOU WIN',lose:'GAME OVER',buildNow:'Build here',useNow:'Use here',leaveGame:'Leave game',ready:'Ready',notReady:'Not ready',quick:'Start here',quickText:'1. Power Plant → energy\n2. Commercial → money\n3. Missile Silo → missiles\n4. MILITARY → attack',clickHelp:'Select an action, then click a cell on the map. Green outline = valid; red = not valid.',trainingNoEnemy:'Training mode has no enemy grid.',playAgain:'Play again',mainMenu:'Main menu',finalScore:'Final score',elapsed:'Time',victoryText:'City secured. The match is complete.',defeatText:'Your city has fallen. The match is complete.'},
 it:{mainTitle:'MilCity - Blue Edition',continueGame:'Riprendi partita',main:['Nuova partita','Opzioni','Istruzioni','Crediti'],soloTitle:'MilCity :: Giocatore singolo',solo:['Facile','Medio','Difficile','Follia','Allenamento'],optionsTitle:'MilCity :: Opzioni',back:'Indietro',select:'Seleziona',instructions:'Istruzioni',credits:'Crediti',how:`SCOPO\nCostruisci una città, produci denaro ed energia, realizza armi e raggiungi il punteggio limite oppure elimina l'avversario.\n\nPARTENZA RAPIDA\n1. Costruisci una Centrale su terreno libero.\n2. Costruisci un Commerciale per guadagnare denaro.\n3. Costruisci un Silo missili e attendi le munizioni.\n4. Apri MILITARE, scegli Missile e attacca la griglia avversaria.\n\nCITTÀ\nScegli un edificio dal pannello, poi clicca una cella di terreno libero. Contorno verde = posizione valida; rosso = non valida.\n\nMILITARE\nScegli un'arma, poi clicca la griglia avversaria. Blu = acqua nota, nero = ignoto, grigio = mancato, rosso = colpito, verde = distrutto, giallo = rivelato dallo Spy.\n\nTASTIERA\nFrecce: muovi il cursore\nQ / E: azione precedente / successiva\nZ / X: Città / Militare\nInvio / Spazio: costruisci o spara\nEsc: esci dalla partita\n\nSALVATAGGIO\nLa partita in corso viene salvata automaticamente nel browser. Dopo un ricaricamento, scegli Riprendi partita dal menu principale.`,creditsText:`MilCity - Blue Edition\nVersione storica: 1.0.5 (2011)\nSviluppatore originale: Jérémy Walther\nProgetto originale: SourceForge / milcity\nLicenza: GNU GPL versione 3\n\nVersione per browser per Libre Arcade.\nhttps://linkingtechnologies.github.io/libre-arcade/\n\nLe regole, l'economia, i quattro livelli del computer, le mappe e i tempi seguono il codice dell'originale. Le immagini sono disegnate da questa pagina: quelle dell'originale non sono usate.`,city:'CITTÀ',military:'MILITARE',energy:'Energia',money:'Denaro',score:'Punti',warning:'ATTENZIONE',win:'HAI VINTO',lose:'PARTITA FINITA',buildNow:'Costruisci qui',useNow:'Usa qui',leaveGame:'Esci dalla partita',ready:'Pronto',notReady:'Non disponibile',quick:'Da dove parto?',quickText:'1. Centrale → energia\n2. Commerciale → denaro\n3. Silo missili → missili\n4. MILITARE → attacca',clickHelp:'Scegli un’azione, poi clicca una cella sulla mappa. Contorno verde = valido; rosso = non valido.',trainingNoEnemy:'La modalità Allenamento non ha una griglia avversaria.',playAgain:'Gioca ancora',mainMenu:'Menu principale',finalScore:'Punteggio finale',elapsed:'Tempo',victoryText:'Città conquistata. La partita è conclusa.',defeatText:'La tua città è caduta. La partita è conclusa.'}
};
const ACTION_TEXT={
 en:{powerPlant:['Power Plant','Cost $20 · +10 energy · 2×1','Produces the energy needed by the rest of the city. Build this first.'],commercial:['Commercial','Cost $50 · uses 1 energy · 1×1','Produces $1 per second while your city has energy.'],house:['House','Cost $100 · uses 1 energy · 1×1','Speeds up construction and ammunition production.'],missileSilo:['Missile Silo','Cost $10 · uses 1 energy · 1×1','Produces Missiles. Simple 1×1 attacks.'],factory:['Factory','Cost $40 · uses 1 energy · 2×2','Produces Mortars. Attacks a 2×2 area.'],airField:['Air Field','Cost $60 · uses 1 energy · 1×3','Produces Aircraft attacks covering 2×3 cells.'],laboratory:['Laboratory','Cost $90 · uses 1 energy · 2×1','Produces Spy charges to reveal enemy cells.'],shieldGenerator:['Shield Generator','Cost $40 · uses 1 energy · 1×1','Produces Shield charges. A Shield protects a 2×2 area for 60 seconds.'],nukeSilo:['Nuke Silo','Cost $160 · uses 5 energy · 3×3','Produces Nukes. Attacks a 4×4 area.'],shield:['Shield','Uses 1 Shield charge · protects 2×2','Place it over your city to hide protected cells from attacks for 60 seconds.'],missile:['Missile','Uses 1 Missile · area 1×1','Attack one enemy cell.'],mortar:['Mortar','Uses 1 Mortar · area 2×2','Attack a 2×2 enemy area.'],aircraft:['Aircraft','Uses 1 Aircraft · area 2×3','Attack a 2×3 enemy area.'],nuke:['Nuke','Uses 1 Nuke · area 4×4','Attack a large 4×4 enemy area.'],spy:['Spy','Uses 1 Spy · reveal 3×3','Reveal buildings and shielded cells in a 3×3 enemy area.']},
 it:{powerPlant:['Centrale','Costo $20 · +10 energia · 2×1','Produce l’energia necessaria al resto della città. È il miglior primo edificio.'],commercial:['Commerciale','Costo $50 · consuma 1 energia · 1×1','Produce $1 al secondo finché la città dispone di energia.'],house:['Casa','Costo $100 · consuma 1 energia · 1×1','Accelera costruzioni e produzione di munizioni.'],missileSilo:['Silo missili','Costo $10 · consuma 1 energia · 1×1','Produce Missili. Attacco semplice su 1×1 cella.'],factory:['Fabbrica','Costo $40 · consuma 1 energia · 2×2','Produce Mortai. Attacca un’area 2×2.'],airField:['Campo aereo','Costo $60 · consuma 1 energia · 1×3','Produce attacchi aerei che coprono 2×3 celle.'],laboratory:['Laboratorio','Costo $90 · consuma 1 energia · 2×1','Produce Spy per rivelare celle avversarie.'],shieldGenerator:['Generatore scudo','Costo $40 · consuma 1 energia · 1×1','Produce cariche Shield. Uno Shield protegge 2×2 celle per 60 secondi.'],nukeSilo:['Silo nucleare','Costo $160 · consuma 5 energia · 3×3','Produce Nuke. Attacca una grande area 4×4.'],shield:['Shield','Usa 1 carica Shield · protegge 2×2','Posizionalo sulla tua città: le celle protette risultano mancate per 60 secondi.'],missile:['Missile','Usa 1 Missile · area 1×1','Attacca una singola cella avversaria.'],mortar:['Mortaio','Usa 1 Mortaio · area 2×2','Attacca un’area avversaria 2×2.'],aircraft:['Attacco aereo','Usa 1 Aircraft · area 2×3','Attacca un’area avversaria 2×3.'],nuke:['Nuke','Usa 1 Nuke · area 4×4','Attacca una grande area avversaria 4×4.'],spy:['Spy','Usa 1 Spy · rivela 3×3','Rivela edifici e celle protette in un’area avversaria 3×3.']}
};
const ACTION_LABEL={en:{powerPlant:'Power Plant',commercial:'Commercial',house:'House',missileSilo:'Missile Silo',factory:'Factory',airField:'Air Field',laboratory:'Laboratory',shieldGenerator:'Shield Generator',nukeSilo:'Nuke Silo',shield:'Shield',missile:'Missile',mortar:'Mortar',aircraft:'Aircraft',nuke:'Nuke',spy:'Spy'},it:{powerPlant:'Centrale',commercial:'Commerciale',house:'Casa',missileSilo:'Silo missili',factory:'Fabbrica',airField:'Campo aereo',laboratory:'Laboratorio',shieldGenerator:'Generatore scudo',nukeSilo:'Silo nucleare',shield:'Shield',missile:'Missile',mortar:'Mortaio',aircraft:'Attacco aereo',nuke:'Nuke',spy:'Spy'}};
const tr=()=>T[lang];
let menuStack=[];
function readAutosave(){
  try{
    const raw=localStorage.getItem(SAVE_KEY);if(!raw)return null;
    const data=JSON.parse(raw);
    if(!data||data.format!==1||!data.game||data.game.ended||!data.ui)return null;
    return data;
  }catch(_){return null;}
}
function hasAutosave(){return !!readAutosave();}
function clearAutosave(){try{localStorage.removeItem(SAVE_KEY);}catch(_){}lastAutosaveGameTime=-Infinity;}
function saveAutosave(force=false){
  if(!game||!ui||game.ended||game.players[0]?.won||game.players[0]?.lost)return false;
  if(!force&&game.time-lastAutosaveGameTime<5000)return false;
  try{
    const data={format:1,savedAt:Date.now(),lang,settings:{...settings},game:game.saveState(),visual:getVisualState(),ui:{mode:ui.mode,cityAction:ui.cityAction,militaryAction:ui.militaryAction,x:ui.x,y:ui.y}};
    localStorage.setItem(SAVE_KEY,JSON.stringify(data));lastAutosaveGameTime=game.time;return true;
  }catch(_){return false;}
}
function pauseTimers(){if(simTimer){clearInterval(simTimer);simTimer=null;}if(renderTimer){clearInterval(renderTimer);renderTimer=null;}running=false;}
// The game's own clock follows the real one while the game runs (a pause, a hidden page, a closed dialog all stop it: the original's
// timers kept counting through a pause, because they read the phone's clock; the page's do not, and PROVENANCE.md says so). The
// picture is drawn ten times a second, as the original's engine does, and only those pictures advance the explosions and the radar.
function startTimers(){
  if(!game||game.ended||running)return;
  running=true;let last=performance.now(),pictures=0;
  simTimer=setInterval(()=>{
    if(!running)return;
    const t=performance.now(),dt=Math.min(250,Math.round(t-last));last=t;
    game.advance(dt);
    if(game.ended){clearAutosave();pauseTimers();render();return;}
    saveAutosave(false);
  },50);
  renderTimer=setInterval(()=>{if(running){pictures++;render(pictures%10===0,true);}},100);
}
function stop(){pauseTimers();closeHelp(false);}
function hideGamePanel(){gamePanel.classList.add('hidden')}
function setFooter(){document.querySelector('#langToggle').textContent=lang==='en'?'IT':'EN';}
function openHelp(){
  if(!helpOverlay)return;
  helpWasRunning=running;
  if(helpWasRunning)pauseTimers();
  helpOverlayTitle.textContent=tr().instructions;
  helpOverlayBody.textContent=tr().how;
  helpClose.textContent=tr().back;
  helpOverlay.classList.remove('hidden');
  helpClose.focus();
}
function closeHelp(resume=true){
  if(!helpOverlay||helpOverlay.classList.contains('hidden'))return;
  helpOverlay.classList.add('hidden');
  if(resume&&helpWasRunning&&game&&!game.ended&&!gamePanel.classList.contains('hidden'))startTimers();
  helpWasRunning=false;
}
helpClose.onclick=()=>closeHelp(true);
helpOverlay.addEventListener('click',e=>{if(e.target===helpOverlay)closeHelp(true);});
function optionsItems(){return lang==='it'?[`Acqua : ${settings.water}%`,`Punteggio limite : ${settings.maxScore}`,`Denaro iniziale : ${settings.money}`,`Vibrazione : ${settings.vibration?'Sì':'No'}`]:[`Water : ${settings.water}%`,`Maximum score : ${settings.maxScore}`,`Starting money : ${settings.money}`,`Vibration : ${settings.vibration?'Yes':'No'}`];}
function menuData(id){const t=tr();const mainItems=hasAutosave()?[t.continueGame,...t.main]:t.main;return {main:{title:t.mainTitle,items:mainItems},solo:{title:t.soloTitle,items:t.solo},options:{title:t.optionsTitle,items:optionsItems()}}[id];}
function showList(id){formOpen=false;stop();hideGamePanel();const d=menuData(id);const canBack=id!=='main';phone.innerHTML=`<div class="screen"><div class="titlebar">${d.title}</div><ul class="list">${d.items.map((x,i)=>`<li data-i="${i}">${x}</li>`).join('')}</ul><div class="softkeys"><button type="button" id="backMenu" class="softkeyButton" ${canBack?'':'disabled'}>${canBack?tr().back:''}</button><span>${tr().select}</span></div></div>`;[...phone.querySelectorAll('li')].forEach(li=>li.onclick=()=>choose(id,Number(li.dataset.i)));const b=phone.querySelector('#backMenu');if(canBack)b.onclick=back;requestAnimationFrame(updatePhoneScale);}
function push(id){menuStack.push(id);showList(id)}function back(){menuStack.pop();showList(menuStack.at(-1)||'main')}
function linkify(text){return text.replace('https://linkingtechnologies.github.io/libre-arcade/','<a href="https://linkingtechnologies.github.io/libre-arcade/" target="_blank" rel="noopener">https://linkingtechnologies.github.io/libre-arcade/</a>')}
function form(title,text){formOpen=true;stop();hideGamePanel();phone.innerHTML=`<div class="screen"><div class="titlebar">${title}</div><div class="form">${linkify(text)}</div><div class="softkeys"><button type="button" id="backForm" class="softkeyButton">${tr().back}</button><span></span></div></div>`;phone.querySelector('#backForm').onclick=back;requestAnimationFrame(updatePhoneScale);}
function choose(id,i){const t=tr();if(id==='main'){if(hasAutosave()){if(i===0){resumeGame();return;}i--;}if(i===0)push('solo');else if(i===1)push('options');else if(i===2)form(t.instructions,t.how);else if(i===3)form(t.credits,t.creditsText);return;}if(id==='solo'){startGame(i);return;}if(id==='options'){if(i===0){settings.water+=5;if(settings.water>95)settings.water=5;}if(i===1){settings.maxScore+=500;if(settings.maxScore>10000)settings.maxScore=500;}if(i===2){settings.money+=50;if(settings.money>1000)settings.money=50;}if(i===3)settings.vibration=!settings.vibration;saveOptions();showList('options');}}

function actionLabel(k){return ACTION_LABEL[lang][k]||k}
function actionInfo(k){return ACTION_TEXT[lang][k]||[k,'','']}
function ammoFor(k,p){return p.ammo[k]??0}
function resourceAvailable(k,p){if(ui.mode<0){if(k==='shield')return p.ammo.shield>0;return p.money>=CONFIG.buildings[k].cost;}return p.ammo[k]>0;}
function findValidPlacement(key=ui?.actionKey()){
  if(!ui||ui.mode>=0||key==='shield')return false;
  const d=CONFIG.buildings[key],p=ui.human();if(!d)return false;
  for(let y=0;y<=30-d.h;y++)for(let x=0;x<=30-d.w;x++)if(p.grid.freeGrass(x,y,d.w,d.h)){ui.setCursor(x,y);return true;}
  return false;
}
function buildingState(p,key){
  const list=p.grid.buildings.filter(b=>b.key===key&&!b.destroyed);return list.at(-1)||null;
}
function actionRuntimeState(p,k){
  if(ui.mode>=0)return p.ammo[k]>0?(lang==='it'?`Munizioni pronte: ${p.ammo[k]}`:`Ammo ready: ${p.ammo[k]}`):'';
  if(k==='shield')return p.ammo.shield>0?(lang==='it'?`Cariche pronte: ${p.ammo.shield}`:`Charges ready: ${p.ammo.shield}`):'';
  const b=buildingState(p,k);if(!b)return '';
  if(b.state==='operational')return lang==='it'?'Edificio operativo.':'Building operational.';
  const left=Math.max(0,Math.ceil((p.constructionMs(b)-(game.time-b.createdAt))/1000));
  return lang==='it'?`In costruzione: circa ${left}s.`:`Under construction: about ${left}s.`;
}
function coachState(){
  const p=ui.human(),hasEnemy=game.players.length>1;const has=k=>!!buildingState(p,k);const op=k=>buildingState(p,k)?.state==='operational';
  const steps=[
    [has('powerPlant'),lang==='it'?'Centrale':'Power Plant'],
    [has('commercial'),lang==='it'?'Commerciale':'Commercial'],
    [has('missileSilo'),lang==='it'?'Silo missili':'Missile Silo'],
    [p.ammo.missile>0,lang==='it'?'Primo missile':'First missile']
  ];
  if(hasEnemy)steps.push([p.cannotFireBefore>0,lang==='it'?'Primo attacco':'First attack']);
  let rec={kind:'done',text:lang==='it'?(hasEnemy?'Avvio completato. Ora espandi la città e prova nuove armi.':'Allenamento iniziale completato. Ora prova gli altri edifici e le altre armi.'):(hasEnemy?'Opening complete. Expand the city and try the other weapons.':'Training opening complete. Try the other buildings and weapons.')};
  if(!has('powerPlant'))rec={kind:'select',mode:-1,key:'powerPlant',text:lang==='it'?'1. Seleziona Centrale e costruiscila sulla posizione verde.':'1. Select Power Plant and build it on the green position.'};
  else if(!op('powerPlant'))rec={kind:'wait',text:lang==='it'?'Attendi che la Centrale termini la costruzione.':'Wait for the Power Plant to finish construction.'};
  else if(!has('commercial'))rec={kind:'select',mode:-1,key:'commercial',text:lang==='it'?'2. Costruisci un Commerciale: inizierà a produrre denaro.':'2. Build a Commercial building: it will start producing money.'};
  else if(!has('missileSilo'))rec={kind:'select',mode:-1,key:'missileSilo',text:lang==='it'?'3. Costruisci un Silo missili.':'3. Build a Missile Silo.'};
  else if(p.ammo.missile<=0)rec={kind:'wait',text:lang==='it'?'Attendi la produzione del primo missile.':'Wait for your first missile to be produced.'};
  else if(hasEnemy&&ui.mode<0)rec={kind:'select',mode:1,key:'missile',text:lang==='it'?'4. Passa a MILITARE e prepara il primo attacco.':'4. Switch to MILITARY and prepare your first attack.'};
  else if(hasEnemy&&p.cannotFireBefore<=0)rec={kind:'select',mode:1,key:'missile',text:lang==='it'?'Clicca una cella della griglia avversaria per lanciare il missile.':'Click an enemy-grid cell to launch the missile.'};
  return {steps,rec,hasEnemy};
}
function validity(){
  if(!ui||!game)return {ok:false,text:''};const p=ui.human(),k=ui.actionKey();
  if(game.ended||p.won||p.lost)return {ok:false,text:lang==='it'?'La partita è terminata. Avvia una nuova partita dal menu.':'The game is over. Start a new game from the menu.'};
  if(ui.mode<0){
    if(k==='shield'){if(p.ammo.shield<=0)return {ok:false,text:lang==='it'?'Nessuna carica Shield. Costruisci un Generatore scudo e attendi la produzione.':'No Shield charge. Build a Shield Generator and wait for production.'};return {ok:true,text:lang==='it'?'Pronto: clicca una zona della tua città da proteggere.':'Ready: click an area of your city to protect.'};}
    const d=CONFIG.buildings[k];
    if(p.money<d.cost)return {ok:false,text:lang==='it'?`Servono $${d.cost}; al momento hai $${p.money}.`:`Needs $${d.cost}; you currently have $${p.money}.`};
    if(!p.grid.inBounds(ui.x,ui.y,d.w,d.h))return {ok:false,text:lang==='it'?'Sposta il cursore dentro la mappa.':'Move the cursor inside the map.'};
    if(!p.grid.freeGrass(ui.x,ui.y,d.w,d.h))return {ok:false,text:lang==='it'?'Scegli terreno marrone libero: niente acqua, edifici, cantieri o crateri.':'Choose empty brown land: no water, buildings, construction sites or craters.'};
    return {ok:true,text:lang==='it'?'Posizione valida. Clicca la mappa o premi “Costruisci qui”.':'Valid position. Click the map or press “Build here”.'};
  }
  if(p.ammo[k]<=0){const maker={missile:'Missile Silo',mortar:'Factory',aircraft:'Air Field',nuke:'Nuke Silo',spy:'Laboratory'}[k];return {ok:false,text:lang==='it'?`Nessuna munizione disponibile. Costruisci ${actionLabel({missile:'missileSilo',mortar:'factory',aircraft:'airField',nuke:'nukeSilo',spy:'laboratory'}[k])} e attendi la produzione.`:`No ammunition. Build a ${maker} and wait for production.`};}
  if(game.time<p.cannotFireBefore){const sec=Math.ceil((p.cannotFireBefore-game.time)/1000);return {ok:false,text:lang==='it'?`Arma in ricarica: ${sec}s.`:`Weapon cooling down: ${sec}s.`};}
  return {ok:true,text:lang==='it'?'Pronto: clicca la griglia avversaria o premi “Usa qui”.':'Ready: click the enemy grid or press “Use here”.'};
}

function formatDuration(ms){const total=Math.max(0,Math.floor(ms/1000)),m=Math.floor(total/60),sec=total%60;return `${m}:${String(sec).padStart(2,'0')}`;}
function inferredGameMode(){if(!game||game.players.length<=1)return 4;const ai=game.ais.find(a=>a.player.index===1);return ai?.level??0;}
function setEndgameUI(ended){
  for(const el of [modeTabs,actionGrid,actionCard,feedback,quickStart,gameButtons,cursorHelp])el.classList.toggle('hidden',ended);
  endgamePanel.classList.toggle('hidden',!ended);
}
function refreshEndgame(p){
  const t=tr(),opp=game.players[1],mode=inferredGameMode();clearAutosave();
  const signature=`${lang}|${p.won?'win':'lose'}|${p.score}|${opp?.score??0}|${game.time}|${mode}`;
  if(endgamePanel.dataset.signature===signature)return;
  endgamePanel.dataset.signature=signature;
  const scoreLine=opp?`${t.finalScore}: ${p.score} — ${opp.score}`:`${t.finalScore}: ${p.score}`;
  endgamePanel.innerHTML=`<div class="endgameTitle">${p.won?t.win:t.lose}</div><div class="endgameSummary">${p.won?t.victoryText:t.defeatText}<br>${scoreLine}<br>${t.elapsed}: ${formatDuration(game.time)}</div><div class="endgameActions"><button type="button" id="playAgain" class="endgameReplay">${t.playAgain}</button><button type="button" id="endMainMenu" class="endgameMenu">${t.mainMenu}</button></div>`;
  endgamePanel.querySelector('#playAgain').onclick=()=>startGame(mode);
  endgamePanel.querySelector('#endMainMenu').onclick=()=>{stop();showList('main');};
}

function refreshPanel(){
  if(!ui||!game)return;const p=ui.human(),t=tr(),k=ui.actionKey(),v=validity(),info=actionInfo(k);
  const ended=game.ended||p.won||p.lost;setEndgameUI(ended);
  statusRow.innerHTML=`<div class="stat"><strong>${t.money}</strong><span>$${p.money}</span></div><div class="stat"><strong>${t.energy}</strong><span>${p.energy}</span></div><div class="stat"><strong>${t.score}</strong><span>${p.score}/${p.scoreToWin}</span></div>`;
  if(ended){refreshEndgame(p);return;}
  const hasEnemy=game.players.length>1;
  // Keep interactive controls stable. M12 rebuilt these buttons on every 10 FPS
  // render, so a button could disappear between pointer-down and click.
  const modeSignature=`${lang}|${hasEnemy?'enemy':'training'}`;
  if(modeTabs.dataset.signature!==modeSignature){
    modeTabs.dataset.signature=modeSignature;
    modeTabs.innerHTML=`<button type="button" data-mode="city">${t.city}</button><button type="button" data-mode="military" ${hasEnemy?'':'disabled'}>${t.military}</button>`;
    modeTabs.querySelector('[data-mode="city"]').onclick=()=>{ui.setMode(-1);findValidPlacement();lastFeedback=null;render();saveAutosave(true);};
    const mil=modeTabs.querySelector('[data-mode="military"]');if(hasEnemy)mil.onclick=()=>{ui.setMode(1);lastFeedback=null;render();saveAutosave(true);};
  }
  modeTabs.querySelector('[data-mode="city"]').classList.toggle('active',ui.mode<0);
  const mil=modeTabs.querySelector('[data-mode="military"]');if(mil)mil.classList.toggle('active',ui.mode>=0);
  const actions=ui.mode<0?CITY_ACTIONS:MIL_ACTIONS;
  const actionSignature=`${lang}|${ui.mode<0?'city':'military'}`;
  if(actionGrid.dataset.signature!==actionSignature){
    actionGrid.dataset.signature=actionSignature;
    actionGrid.innerHTML=actions.map(a=>`<button type="button" data-action="${a}">${actionLabel(a)}</button>`).join('');
    actionGrid.querySelectorAll('button').forEach(b=>b.onclick=()=>{ui.setAction(b.dataset.action);if(ui.mode<0)findValidPlacement(b.dataset.action);lastFeedback=null;render();saveAutosave(true);});
  }
  actionGrid.querySelectorAll('button').forEach(b=>{const a=b.dataset.action;b.classList.toggle('active',a===k);b.classList.toggle('unavailable',!resourceAvailable(a,p));b.setAttribute('aria-pressed',a===k?'true':'false');});
  let extra='';
  if(ui.mode>=0)extra=lang==='it'?`Munizioni disponibili: <strong>${ammoFor(k,p)}</strong>`:`Available ammo: <strong>${ammoFor(k,p)}</strong>`;
  else if(k==='shield')extra=lang==='it'?`Cariche disponibili: <strong>${p.ammo.shield}</strong>`:`Available charges: <strong>${p.ammo.shield}</strong>`;
  const runtime=actionRuntimeState(p,k);actionCard.innerHTML=`<div class="actionTitle">${info[0]}</div><div class="actionMeta">${info[1]}${extra?` · ${extra}`:''}</div><div class="actionHelp">${info[2]}</div>${runtime?`<div class="actionState ${runtime.includes('costruzione')||runtime.includes('construction')?'wait':'ok'}">${runtime}</div>`:''}`;
  const msg=lastFeedback||v;feedback.classList.toggle('bad',!msg.ok);feedback.textContent=`${msg.ok?'✓':'!'} ${msg.text}`;
  const coach=coachState();const coachSignature=`${lang}|${coach.steps.map(x=>x[0]?'1':'0').join('')}|${coach.rec.kind}|${coach.rec.mode??''}|${coach.rec.key??''}|${coach.rec.text}`;
  if(quickStart.dataset.signature!==coachSignature){
    quickStart.dataset.signature=coachSignature;
    quickStart.innerHTML=`<strong>${t.quick}</strong><div class="coachSteps">${coach.steps.map(([done,label])=>`<span class="coachStep ${done?'done':'todo'}">${done?'✓':'○'} ${label}</span>`).join('')}</div><div class="${coach.rec.kind==='done'?'coachDone':''}">${coach.rec.text}</div>${coach.rec.kind==='select'?`<button type="button" id="coachAction" class="coachButton">${lang==='it'?'Portami al prossimo passo':'Take me to the next step'}</button>`:''}`;
    const cb=quickStart.querySelector('#coachAction');if(cb)cb.onclick=()=>{if(!ui||!game||game.ended)return;ui.setMode(coach.rec.mode);ui.setAction(coach.rec.key);if(coach.rec.mode<0)findValidPlacement(coach.rec.key);lastFeedback=null;render();saveAutosave(true);};
  }
  primaryAction.textContent=ui.mode<0?t.buildNow:t.useNow;primaryAction.disabled=!v.ok;exitGame.textContent=t.leaveGame;cursorHelp.textContent=t.clickHelp;
}
function doAction(){if(!game||!ui||game.ended||ui.human().won||ui.human().lost){lastFeedback={ok:false,text:lang==='it'?'La partita è terminata.':'The game is over.'};render();return false;}const before=validity();if(!before.ok){lastFeedback=before;render();return false;}const modeBefore=ui.mode,keyBefore=ui.actionKey(),p=ui.human();const ok=ui.perform();if(ok&&modeBefore<0&&keyBefore!=='shield'){const b=buildingState(p,keyBefore);const sec=b?Math.ceil(p.constructionMs(b)/1000):0;lastFeedback={ok:true,text:lang==='it'?`${actionLabel(keyBefore)} avviato${sec?` · circa ${sec}s`:''}.`:`${actionLabel(keyBefore)} started${sec?` · about ${sec}s`:''}.`};findValidPlacement(keyBefore);}else lastFeedback=ok?{ok:true,text:lang==='it'?(modeBefore<0?'Azione eseguita.':'Attacco eseguito.'):(modeBefore<0?'Action completed.':'Attack launched.')}:{ok:false,text:lang==='it'?'Azione non riuscita in questa posizione.':'Action could not be completed at this position.'};render();if(ok)saveAutosave(true);return ok;}
function mountGameView(){
  endgamePanel.dataset.signature='';setEndgameUI(false);
  phone.innerHTML=`<canvas id="game" class="gameCanvas" width="${LOGICAL_W*RENDER_SCALE}" height="${LOGICAL_H*RENDER_SCALE}"></canvas><div id="hud" class="hud" aria-hidden="true"></div><div id="hudBanner" class="hudBanner" aria-hidden="true"></div>`;canvas=phone.querySelector('#game');ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;gamePanel.classList.remove('hidden');
  canvas.onclick=e=>{const r=canvas.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)*240/r.width/8),y=Math.floor((e.clientY-r.top)*320/r.height/8);if(y<30){ui.setCursor(x,y);doAction();}};
  primaryAction.onclick=doAction;exitGame.onclick=leaveGameToMenu;requestAnimationFrame(updatePhoneScale);render();
}
function leaveGameToMenu(){if(game&&!game.ended)saveAutosave(true);stop();showList('main');}
function startGame(mode){
  menuStack=['main'];clearAutosave();const levels=mode===4?[null]:[null,mode];game=new Game({levels,moneyAtStart:settings.money,scoreToWin:settings.maxScore,waterPercent:settings.water});game.onVibrate=vibrate;ui=new M5Controller(game);resetVisualTimers();lastFeedback=null;findValidPlacement('powerPlant');lastAutosaveGameTime=-Infinity;
  mountGameView();saveAutosave(true);startTimers();
}
function resumeGame(){
  const data=readAutosave();if(!data){showList('main');return;}
  try{
    game=Game.fromState(data.game);game.onVibrate=vibrate;ui=new M5Controller(game);
    ui.mode=data.ui.mode;ui.cityAction=data.ui.cityAction;ui.militaryAction=data.ui.militaryAction;ui.x=data.ui.x;ui.y=data.ui.y;ui.clampCursor();
    Object.assign(settings,data.settings||{});if(data.lang==='en'||data.lang==='it')lang=data.lang;setFooter();menuStack=['main'];restoreVisualState(data.visual);lastFeedback={ok:true,text:lang==='it'?'Partita ripristinata dal salvataggio locale.':'Game restored from local save.'};lastAutosaveGameTime=game.time;
    mountGameView();startTimers();
  }catch(_){clearAutosave();showList('main');}
}

// The status text under the map is HTML laid over the canvas, not drawn in it: the canvas is shown with nearest-neighbour scaling at a
// ratio that is not a whole number, which drops rows of pixels and cuts letters, and text does not survive that.
function setHud(lines){
  const hud=phone.querySelector('#hud');if(!hud)return;
  while(hud.children.length<lines.length)hud.appendChild(document.createElement('div'));
  lines.forEach((text,i)=>{const el=hud.children[i];if(el.textContent===text)return;el.textContent=text;let size=10;el.style.fontSize=`${size}px`;while(size>8&&el.scrollWidth>el.clientWidth){size-=0.5;el.style.fontSize=`${size}px`;}});
}
function setBanner(text){const el=phone.querySelector('#hudBanner');if(!el)return;el.style.display=text?'block':'none';if(el.textContent!==text)el.textContent=text;}
function render(refreshControls=true,step=false){
  if(!ctx||!ui||!game)return;const t=tr();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.setTransform(RENDER_SCALE,0,0,RENDER_SCALE,0,0);ctx.imageSmoothingEnabled=false;const p=game.players[0];if(ui.mode<0)drawCity(ctx,p,game.time,8,step);else drawHistoricalRadar(ctx,p,8,step);
  const f=ui.footprint(),can=validity().ok;ctx.fillStyle=can?'#00ff0030':'#ff000028';ctx.fillRect(ui.x*8+1,ui.y*8+1,f.w*8-2,f.h*8-2);ctx.strokeStyle=can?'#00e000':'#ff2020';ctx.lineWidth=2;ctx.strokeRect(ui.x*8+1,ui.y*8+1,f.w*8-2,f.h*8-2);
  const k=ui.actionKey();const info=actionInfo(k);const warn=p.energy<=0&&p.constructedBuildings>0?(lang==='it'?`Blackout: ${Math.max(0,Math.ceil((p.belowZeroSince+120000-game.time)/1000))}s`:`Blackout: ${Math.max(0,Math.ceil((p.belowZeroSince+120000-game.time)/1000))}s`):'';
  drawHud(ctx,[]);setHud([`${t.money}: $${p.money}   ${t.energy}: ${p.energy}`,`${t.score}: ${p.score}/${p.scoreToWin}`,`${ui.mode<0?t.city:t.military}: ${info[0]}`,warn|| (lang==='it'?'Scegli dal pannello → clicca la mappa':'Choose in panel → click the map')]);
  setBanner(p.won?t.win:p.lost?t.lose:'');
  if(refreshControls)refreshPanel();
}
function keyAction(k){if(!ui)return;if(k==='fire'){doAction();return;}if(k==='up')ui.move(0,-1);if(k==='down')ui.move(0,1);if(k==='left')ui.move(-1,0);if(k==='right')ui.move(1,0);if(k==='prevAction'){ui.cycleAction(-1);if(ui.mode<0)findValidPlacement();}if(k==='nextAction'){ui.cycleAction(1);if(ui.mode<0)findValidPlacement();}if(k==='prevMode'){ui.cycleMode(-1);if(ui.mode<0)findValidPlacement();}if(k==='nextMode'){ui.cycleMode(1);if(ui.mode<0)findValidPlacement();}lastFeedback=null;render();saveAutosave(true);}
addEventListener('keydown',e=>{if(!helpOverlay.classList.contains('hidden')){if(e.key==='Escape'){e.preventDefault();closeHelp(true);}return;}if(!ui||gamePanel.classList.contains('hidden')){if(e.key==='Escape'&&formOpen){e.preventDefault();back();return;}if(e.key==='Escape'&&menuStack.length>1)back();return;}const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',q:'prevAction',Q:'prevAction',e:'nextAction',E:'nextAction',z:'prevMode',Z:'prevMode',x:'nextMode',X:'nextMode',Enter:'fire',' ':'fire'};if(e.key==='Escape'){e.preventDefault();leaveGameToMenu();return;}if(map[e.key]){e.preventDefault();keyAction(map[e.key]);}});
document.querySelector('#langToggle').onclick=()=>{lang=lang==='en'?'it':'en';setFooter();if(!helpOverlay.classList.contains('hidden')){helpOverlayTitle.textContent=tr().instructions;helpOverlayBody.textContent=tr().how;helpClose.textContent=tr().back;}if(game&&canvas&&!gamePanel.classList.contains('hidden')){render();saveAutosave(true);}else showList(menuStack.at(-1)||'main');};
document.querySelector('#infoButton').onclick=openHelp;
// A page that is hidden does not run the game (the browser slows its timers anyway); it picks up again when it is shown.
let hiddenPaused=false;
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='hidden'){saveAutosave(true);if(running){hiddenPaused=true;pauseTimers();}}
  else if(hiddenPaused){hiddenPaused=false;if(game&&!game.ended&&helpOverlay.classList.contains('hidden')&&!gamePanel.classList.contains('hidden'))startTimers();}
});
// The original's hidden key combination (previous building, previous mode and next mode held together: A, C and D on the handset, Q, Z
// and X here) makes every building free, for the computer too, until the program is closed. It is not in the instructions, as in the original.
const heldKeys=new Set();
function freeBuildings(){for(const def of Object.values(CONFIG.buildings))def.cost=0;}
addEventListener('keydown',e=>{heldKeys.add(e.key.toLowerCase());if(heldKeys.has('q')&&heldKeys.has('z')&&heldKeys.has('x')&&ui&&game&&!game.ended)freeBuildings();});
addEventListener('keyup',e=>heldKeys.delete(e.key.toLowerCase()));
addEventListener('blur',()=>heldKeys.clear());
window.addEventListener('beforeunload',()=>saveAutosave(true));
function showSplash(){stop();hideGamePanel();phone.innerHTML=`<div class="splashScreen" id="splashScreen" role="button" aria-label="MilCity splash"><div class="kanji">攻<br>城</div><div class="splashLogo">milcity<br><span>blue</span></div></div>`;let done=false;const finish=()=>{if(done)return;done=true;menuStack=['main'];showList('main');};phone.querySelector('#splashScreen').onclick=finish;setTimeout(finish,3000);}
setFooter();showSplash();requestAnimationFrame(updatePhoneScale);
