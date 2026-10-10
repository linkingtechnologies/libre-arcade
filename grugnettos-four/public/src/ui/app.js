import {createGame,playMove,findWinningLine,P1,P2} from '../core/game.js';
import {createRng} from '../core/rng.js';
import {snapshot} from '../core/game.js';
import {normalizeDecision} from '../core/player-contract.js';
import {players,getPlayer,provenanceLabels} from '../players/registry.js';
import {runRoundRobin} from '../../arena/runner.js';
import {strengthLevels,getStrengthLevel,selectStrengthMember} from '../strength/levels.js';
import {strengthSnapshot} from '../strength/strength-snapshot.js';

const $=id=>document.getElementById(id);
const text={
  en:{menu:'Menu',welcomeText:'Challenge a different intelligence every game.',play:'Play',laboratory:'Laboratory',arena:'Arena',technicalArea:'Advanced',technicalIntro:'Explore individual opponents or compare them in automatic tournaments.',guide:'How to play',credits:'Credits',strength:'Opponent skill',collection:'Collection',allPlayers:'All players',historicalPlayers:'Historical / source-based',derivedPlayers:'Project-derived',controlPlayers:'Control',opponent:'Opponent',profile:'Profile',first:'First player',you:'You',newGame:'New game',turn:'Your turn',choose:'Choose a column',thinking:'Opponent is thinking…',win:'You win!',loss:'Your opponent wins',draw:'Draw',moves:'moves',opponents:'possible opponents',arenaIntro:'Compare the intelligences in reproducible matches.',calibratedRanking:'Calibrated ranking · 3 seeds / 1,518 games',player:'Player',type:'Type',show:'Show',run:'Run tournament',replayData:'Replay data (JSON)',rules:'Drop a disc into a column. Align four horizontally, vertically or diagonally before your opponent.',levelRule:'Each level draws one of the similarly skilled intelligences. The exact opponent remains hidden during normal play.',creditText:'Grugnetto’s Four brings together historical game-playing intelligences preserved by Libre Arcade.',sourceLink:'Source code, authors and licenses',licenseText:'Details about authors, sources and licenses are included with the game.',poweredBy:'A game by',levelAlgorithms:'About difficulty levels',levelAlgorithmsText:'Each level includes several opponents of similar skill. A different one is chosen for every game.'},
  it:{menu:'Menu',welcomeText:'Sfida un’intelligenza diversa a ogni partita.',play:'Gioca',laboratory:'Laboratorio',arena:'Arena',technicalArea:'Area tecnica',technicalIntro:'Esplora i singoli avversari o confrontali in tornei automatici.',guide:'Come si gioca',credits:'Crediti',strength:'Bravura avversario',collection:'Collezione',allPlayers:'Tutte',historicalPlayers:'Storiche / basate sui sorgenti',derivedPlayers:'Derivate dal progetto',controlPlayers:'Controllo',opponent:'Avversario',profile:'Profilo',first:'Chi comincia',you:'Tu',newGame:'Nuova partita',turn:'Tocca a te',choose:'Scegli una colonna',thinking:'L’avversario sta pensando…',win:'Hai vinto!',loss:'Vince l’avversario',draw:'Pareggio',moves:'mosse',opponents:'possibili avversari',arenaIntro:'Confronta le intelligenze in partite riproducibili.',calibratedRanking:'Classifica calibrata · 3 seed / 1.518 partite',player:'Giocatore',type:'Tipo',show:'Mostra',run:'Avvia torneo',replayData:'Dati replay (JSON)',rules:'Lascia cadere una pedina in una colonna. Allineane quattro in orizzontale, verticale o diagonale prima dell’avversario.',levelRule:'Ogni livello estrae una delle intelligenze di bravura simile. L’avversario esatto resta nascosto durante la partita normale.',creditText:'Grugnetto’s Four riunisce intelligenze di gioco storiche preservate da Libre Arcade.',sourceLink:'Codice sorgente, autori e licenze',licenseText:'I dettagli su autori, sorgenti e licenze sono inclusi nel gioco.',poweredBy:'Un gioco di',levelAlgorithms:'Informazioni sui livelli',levelAlgorithmsText:'Ogni livello comprende più avversari di bravura simile. A ogni partita ne viene scelto uno diverso.'}
};
Object.assign(text.en,{rematch:'Rematch',changeLevel:'Change level'});
Object.assign(text.it,{rematch:'Rivincita',changeLevel:'Cambia livello'});

const levelPresentation={beginner:{icon:'🙂',stars:'★☆☆☆☆'},easy:{icon:'🌱',stars:'★★☆☆☆'},medium:{icon:'🎯',stars:'★★★☆☆'},hard:{icon:'🔥',stars:'★★★★☆'},expert:{icon:'🧠',stars:'★★★★☆'},champion:{icon:'👑',stars:'★★★★★'}};

let lang='en',mode='menu',game,cpu,rng,human=P1,busy=false,audio=true,lastArena=null,lastDrop=null,resultPending=false,gameOverTimer=null;
const lastOpponentByLevel=new Map();
const arenaIds=['arenaA','arenaB','arenaC','arenaD','arenaE','arenaF','arenaG','arenaH','arenaI','arenaJ','arenaK','arenaL','arenaM','arenaN','arenaO','arenaP','arenaQ','arenaR','arenaS','arenaT','arenaU','arenaV','arenaW'];
const publicPlayerName=player=>player.name.replace(/^ConnectLab\s+/,'');
const playerLabel=player=>`${player.provenance==='control'?'[CONTROL] ':''}${publicPlayerName(player)}`;
const freshSeed=()=>crypto.getRandomValues(new Uint32Array(1))[0];

function populatePlayers(filter='all'){
  const previous=$('ai').value;$('ai').replaceChildren();
  for(const player of players)if(filter==='all'||player.provenance===filter)$('ai').add(new Option(playerLabel(player),player.id));
  if([...$('ai').options].some(option=>option.value===previous))$('ai').value=previous;
}
function populateStrength(){
  const previous=$('strength').value||'medium';$('strength').replaceChildren();
  for(const level of strengthLevels){const view=levelPresentation[level.id];$('strength').add(new Option(`${view.icon} ${view.stars} · ${level.name[lang]}`,level.id));}
  $('strength').value=previous;
}
function populateSettings(){
  const player=getPlayer($('ai').value);$('level').replaceChildren();
  const values=player.settings.values??Array.from({length:player.settings.max-player.settings.min+1},(_,i)=>player.settings.min+i);
  for(const value of values)$('level').add(new Option(`${player.settings.label} ${player.settings.names?.[value]??value}`,String(value)));
  $('level').value=String(player.settings.default);
}
function createSelected(definition,value){return definition.create({[definition.settings.key]:Number(value)});}
function parseArena(value){const[id,setting]=value.split('|'),definition=getPlayer(id);return{definition,setting,instance:createSelected(definition,setting)};}

function fillArena(){
  for(const player of players){
    const prefix=player.provenance==='control'?'[CONTROL] ':'';
    const settings=player.settings.values??Array.from({length:player.settings.max-player.settings.min+1},(_,i)=>player.settings.min+i);
    for(const value of settings){
      const label=`${prefix}${player.name} · ${player.settings.label} ${player.settings.names?.[value]??value}`;
      for(const id of arenaIds)$(id).add(new Option(label,`${player.id}|${value}`));
    }
  }
  const defaults=strengthSnapshot.ratings.map(row=>`${row[0]}|${row[1]}`);
  arenaIds.forEach((id,index)=>$(id).value=defaults[index]);
}

let audioContext=null;
function tone(freq=300){
  if(!audio)return;
  try{
    audioContext||=new AudioContext();
    if(audioContext.state==='suspended')audioContext.resume();
    const now=audioContext.currentTime,oscillator=audioContext.createOscillator(),gain=audioContext.createGain();
    oscillator.frequency.value=freq;gain.gain.setValueAtTime(.09,now);gain.gain.exponentialRampToValueAtTime(.001,now+.15);
    oscillator.connect(gain).connect(audioContext.destination);oscillator.start(now);oscillator.stop(now+.16);
  }catch{}
}
function closeGameOver(){if(gameOverTimer){clearTimeout(gameOverTimer);gameOverTimer=null;}resultPending=false;if($('gameOver').open)$('gameOver').close();}
function resultTone(outcome){if(outcome==='win'){tone(520);setTimeout(()=>tone(700),120);setTimeout(()=>tone(880),240);}else if(outcome==='loss'){tone(260);setTimeout(()=>tone(190),150);}else{tone(390);setTimeout(()=>tone(390),150);}}
function queueGameOver(){
  if(resultPending||$('gameOver').open)return;resultPending=true;
  gameOverTimer=setTimeout(()=>{if(!game?.over||!['play','laboratory'].includes(mode)){resultPending=false;return;}const outcome=game.draw?'draw':game.winner===human?'win':'loss';$('resultIcon').textContent=outcome==='win'?'🎉':outcome==='loss'?'🤖':'🤝';$('resultTitle').textContent=text[lang][outcome];const detail=mode==='play'?getStrengthLevel($('strength').value).name[lang]:publicPlayerName(getPlayer($('ai').value));$('resultMeta').textContent=`${detail} · ${game.moves.length} ${text[lang].moves}`;resultTone(outcome);$('gameOver').showModal();gameOverTimer=null;},620);
}
function render(){
  if(!$('board').children.length)for(let y=0;y<6;y+=1)for(let x=0;x<7;x+=1){const cell=document.createElement('button');cell.className='cell';cell.dataset.column=x;cell.setAttribute('aria-label',`Column ${x+1}`);$('board').append(cell);}
  const winning=new Set(game.winner?findWinningLine(game.board,game.winner).map(({column,row})=>`${column}:${row}`):[]);
  [...$('board').children].forEach((cell,index)=>{const x=index%7,y=Math.floor(index/7),value=game.board[x][y],dropping=lastDrop&&lastDrop.column===x&&lastDrop.row===y,winner=winning.has(`${x}:${y}`);cell.className=`cell${value?` p${value}`:''}${dropping?' chip-drop':''}${winner?' winner':''}`;if(dropping){cell.style.setProperty('--drop-distance',`${(y+1)*110}%`);cell.style.setProperty('--drop-duration',`${250+y*45}ms`);}else{cell.style.removeProperty('--drop-distance');cell.style.removeProperty('--drop-duration');}cell.disabled=busy||game.over||game.player!==human;});
  if(game.over){$('status').textContent=game.draw?text[lang].draw:game.winner===human?text[lang].win:text[lang].loss;$('substatus').textContent=`${game.moves.length} ${text[lang].moves}`;queueGameOver();}
  else if(game.player===human){$('status').textContent=text[lang].turn;$('substatus').textContent=text[lang].choose;}
  else{$('status').textContent=text[lang].thinking;$('substatus').textContent=mode==='play'?'':publicPlayerName(getPlayer($('ai').value));}
  lastDrop=null;
}
async function cpuTurn(){
  if(game.over||game.player===human)return;busy=true;await new Promise(resolve=>setTimeout(resolve,520));
  try{const decision=normalizeDecision(cpu.chooseMove(snapshot(game),{rng}));lastDrop=playMove(game,decision.column);tone(230);}
  catch(error){$('status').textContent=error.message;game.over=true;}
  busy=false;render();
}
function chooseClusterOpponent(){
  const levelId=$('strength').value,seed=Number($('seed').value),previous=lastOpponentByLevel.get(levelId)??'';
  const member=selectStrengthMember(levelId,seed,previous);lastOpponentByLevel.set(levelId,member.playerId);
  $('aiFilter').value='all';populatePlayers();$('ai').value=member.playerId;populateSettings();$('level').value=String(member.setting);
  return member;
}
function startGame({newOpponent=false}={}){
  closeGameOver();
  if(mode==='play'&&newOpponent){$('seed').value=String(freshSeed());chooseClusterOpponent();}
  human=$('first').value==='human'?P1:P2;game=createGame(P1);rng=createRng(Number($('seed').value));lastDrop=null;
  const definition=getPlayer($('ai').value);cpu=createSelected(definition,$('level').value);busy=false;
  if(mode==='play'){const level=getStrengthLevel($('strength').value),view=levelPresentation[level.id];$('levelBadge').textContent=`${view.icon} ${view.stars} · ${level.name[lang]}`;$('aiNote').textContent=level.description[lang];}
  else $('aiNote').textContent=publicPlayerName(definition);
  render();cpuTurn();
}
function showScreen(next){
  closeGameOver();
  mode=next;document.body.dataset.screen=next;$('menuPanel').classList.toggle('hidden',next!=='menu');$('playPanel').classList.toggle('hidden',!['play','laboratory'].includes(next));$('arenaPanel').classList.toggle('hidden',next!=='arena');
  if(next==='play'||next==='laboratory'){
    const lab=next==='laboratory';$('playTitle').textContent=text[lang][lab?'laboratory':'play'];$('labControls').classList.toggle('hidden',!lab);$('levelBadge').classList.toggle('hidden',lab);
    if(lab)startGame();else startGame({newOpponent:true});
  }
}

function applyLanguage(){
  document.documentElement.lang=lang;$('langBtn').textContent=lang==='en'?'IT':'EN';
  document.querySelectorAll('[data-i18n]').forEach(element=>{const value=text[lang][element.dataset.i18n];if(value)element.textContent=value;});
  populateStrength();
  renderDifficultyInfo();
  if(mode==='play'||mode==='laboratory')startGame();
  if(lastArena)renderStandings();
}

$('menuBtn').onclick=()=>showScreen('menu');$('quickPlay').onclick=()=>showScreen('play');$('technicalBtn').onclick=()=>$('technicalMenu').showModal();$('laboratoryBtn').onclick=()=>{$('technicalMenu').close();showScreen('laboratory');};$('arenaBtn').onclick=()=>{$('technicalMenu').close();showScreen('arena');};
$('guideBtn').onclick=()=>$('help').showModal();$('creditsBtn').onclick=()=>$('credits').showModal();
$('difficultyInfoBtn').onclick=()=>$('difficultyInfo').showModal();
document.querySelectorAll('.close-dialog').forEach(button=>button.onclick=()=>button.closest('dialog').close());
$('langBtn').onclick=()=>{lang=lang==='en'?'it':'en';applyLanguage();};
$('soundBtn').onclick=()=>{audio=!audio;$('soundBtn').textContent=audio?'♪':'×';};
$('strength').onchange=()=>startGame({newOpponent:true});
$('aiFilter').onchange=()=>{populatePlayers($('aiFilter').value);populateSettings();startGame();};
$('ai').onchange=()=>{populateSettings();startGame();};$('level').onchange=()=>startGame();
$('first').onchange=()=>startGame();
$('newGame').onclick=()=>startGame({newOpponent:mode==='play'});
$('rematch').onclick=()=>{$('first').value=$('first').value==='human'?'cpu':'human';if(mode==='laboratory')$('seed').value=String(freshSeed());startGame({newOpponent:mode==='play'});};
$('changeLevel').onclick=()=>showScreen('menu');
$('newSeed').onclick=()=>{$('seed').value=String(freshSeed());startGame();};
$('board').addEventListener('click',event=>{const column=Number(event.target.dataset.column);if(!Number.isInteger(column)||busy||game.over||game.player!==human)return;try{lastDrop=playMove(game,column);tone(420);render();cpuTurn();}catch{}});

const provenanceText=key=>lang==='it'?{historical:'Storica / sorgente',derived:'Derivata ConnectLab',control:'Controllo'}[key]:provenanceLabels[key];
function renderStrengthRanking(){
  const body=$('strengthBody');body.replaceChildren();
  strengthSnapshot.ratings.forEach((row,index)=>{const[id,setting,rating,low,high,wins,draws,losses]=row,player=getPlayer(id),tr=document.createElement('tr');
    [index+1,playerLabel(player),rating,`${low}–${high}`,wins,draws,losses].forEach(value=>{const td=document.createElement('td');td.textContent=String(value);tr.append(td);});
    tr.title=`${player.settings.label}: ${player.settings.names?.[setting]??setting}`;body.append(tr);
  });
}
function renderStandings(){
  if(!lastArena)return;const filter=$('standingFilter').value,body=$('standingBody');body.replaceChildren();
  lastArena.result.standings.forEach((row,index)=>{const meta=lastArena.meta.get(row.player),kind=meta?.provenance??'derived';if(filter!=='all'&&kind!==filter)return;
    const tr=document.createElement('tr'),values=[index+1,meta?.name?.replace(/^ConnectLab\s+/,'')??row.player,provenanceText(kind),row.played,row.wins,row.draws,row.losses,row.points];
    values.forEach((value,column)=>{const td=document.createElement('td');if(column===2){const badge=document.createElement('span');badge.className=`badge ${kind}`;badge.textContent=value;td.append(badge);}else td.textContent=String(value);tr.append(td);});body.append(tr);
  });
  const seconds=(lastArena.elapsedMs/1000).toFixed(2),nodes=lastArena.result.matches.reduce((sum,match)=>sum+match.nodes,0).toLocaleString();
  $('arenaMeta').textContent=lang==='it'?`${lastArena.result.matches.length} partite · ${seconds} s · ${nodes} nodi`:`${lastArena.result.matches.length} games · ${seconds} s · ${nodes} nodes`;
  $('arenaOutput').classList.remove('hidden');
}
$('standingFilter').onchange=renderStandings;
$('runArena').onclick=async()=>{
  const seed=Number($('seed').value),selected=arenaIds.map(id=>parseArena($(id).value)),button=$('runArena');button.disabled=true;button.textContent=lang==='it'?'Torneo in corso…':'Tournament running…';await new Promise(resolve=>setTimeout(resolve,30));
  try{const before=performance.now(),result=runRoundRobin(selected.map(item=>({id:item.instance.id,factory:()=>createSelected(item.definition,item.setting)})),seed),elapsedMs=performance.now()-before,meta=new Map(selected.map(item=>[item.instance.id,{name:publicPlayerName(item.definition),provenance:item.definition.provenance}]));lastArena={result,elapsedMs,meta};$('arenaResult').textContent=JSON.stringify({...result,matches:result.matches.map(match=>({...match,moves:match.moves.map(x=>x+1)}))},null,2);renderStandings();}
  catch(error){$('arenaOutput').classList.remove('hidden');$('arenaResult').textContent=error.message;}
  finally{button.disabled=false;button.textContent=text[lang].run;}
};

function renderDifficultyInfo(){const body=$('difficultyBody');body.replaceChildren();for(const level of strengthLevels){const section=document.createElement('section'),heading=document.createElement('h3'),description=document.createElement('p'),view=levelPresentation[level.id];heading.textContent=`${view.icon} ${view.stars} · ${level.name[lang]}`;description.textContent=`${level.description[lang]} · ${level.members.length} ${text[lang].opponents}`;section.append(heading,description);body.append(section);}}

populatePlayers();populateSettings();populateStrength();fillArena();$('seed').value=String(freshSeed());renderStrengthRanking();renderDifficultyInfo();applyLanguage();showScreen('menu');
