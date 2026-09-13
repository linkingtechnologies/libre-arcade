// SPDX-License-Identifier: GPL-3.0-only
import { GlParchisGame } from '../core/game.js';
import { BOARD_DATA } from '../core/board-data.js';
import { GameAudio, eventSoundKind } from './audio.js';
import { fittedBoardSize } from './layout.js';

const SAVE_KEY = 'glparchis-restoration-save-v1';
const SOUND_KEY = 'glparchis-sound-v1';
function storageGet(key){ try { return localStorage.getItem(key); } catch { return null; } }
function storageSet(key,value){ try { localStorage.setItem(key,value); return true; } catch { return false; } }
const audio = new GameAudio(storageGet(SOUND_KEY) !== '0');
const DICE = ['–','⚀','⚁','⚂','⚃','⚄','⚅'];
const COLOR_NAMES = {
  it: ['Giallo','Blu','Rosso','Verde','Grigio','Rosa','Arancione','Ciano'],
  en: ['Yellow','Blue','Red','Green','Gray','Pink','Orange','Cyan'],
};
const TXT = {
  it: {
    subtitle:'Il classico Parchís', language:'Lingua', newGame:'Nuova partita', setupTitle:'Configura la partita', setupIntro:'Scegli il tabellone e chi partecipa.', board:'Tabellone', difficulty:'Difficoltà computer', start:'Inizia partita', resume:'Continua partita', save:'Salva', turn:'Turno', roll:'Tira il dado', players:'Giocatori', log:'Cronologia', auto:'Muovi automaticamente se c’è una sola scelta', human:'Umano', cpu:'Computer', plays:'Gioca', name:'Nome', home:'casa', goal:'arrivo', pawn:'Pedina', square:'casella', squares:'caselle', winner:'ha vinto!', saved:'Partita salvata.', needPlayers:'Seleziona almeno due giocatori.', waitingRoll:'deve tirare il dado', waitingMove:'deve scegliere una pedina', cpuThinking:'sta giocando', finished:'Partita terminata', noSave:'Non c’è una partita salvata.', starter:'inizia la partita', rolled:'ha tirato', captured:'ha catturato una pedina', reached:'ha portato una pedina all’arrivo', threeSixes:'tre 6: l’ultima pedina torna a casa', threeSixesRamp:'tre 6: la pedina sulla rampa finale resta al suo posto', bonus20:'20 caselle extra', bonus10:'10 caselle extra', boardPlayers:'giocatori', difficultyLabels:['Molto facile','Facile','Normale','Difficile','Molto difficile'], sound:'Suoni', boardAria:'Tabellone di glParchis'
  },
  en: {
    subtitle:'Classic Parchís', language:'Language', newGame:'New game', setupTitle:'Set up game', setupIntro:'Choose the board and who is playing.', board:'Board', difficulty:'Computer difficulty', start:'Start game', resume:'Continue game', save:'Save', turn:'Turn', roll:'Roll dice', players:'Players', log:'History', auto:'Move automatically when there is only one choice', human:'Human', cpu:'Computer', plays:'Play', name:'Name', home:'home', goal:'goal', pawn:'Pawn', square:'square', squares:'squares', winner:'wins!', saved:'Game saved.', needPlayers:'Select at least two players.', waitingRoll:'must roll the dice', waitingMove:'must choose a pawn', cpuThinking:'is playing', finished:'Game finished', noSave:'There is no saved game.', starter:'starts the game', rolled:'rolled', captured:'captured a pawn', reached:'moved a pawn home', threeSixes:'three sixes: the last moved pawn returns home', threeSixesRamp:'three sixes: the pawn on the final stretch stays in place', bonus20:'20 extra squares', bonus10:'10 extra squares', boardPlayers:'players', difficultyLabels:['Very easy','Easy','Normal','Hard','Very hard'], sound:'Sound', boardAria:'glParchis board'
  }
};

const $ = id => document.getElementById(id);
let lang = 'it';
let game = null;
let actionToken = 0;
let pawnHitboxes = [];
let eventCursor = 0;
let lastDrivenPlayerId = null;

function t(key){ return TXT[lang][key] ?? key; }
function freshSeed(){
  if (globalThis.crypto?.getRandomValues) {
    const value = new Uint32Array(1); globalThis.crypto.getRandomValues(value); return value[0] || 1;
  }
  return (Date.now() ^ Math.floor(Math.random()*0xffffffff)) >>> 0 || 1;
}
function cssColor(c, alpha=1){ return `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${alpha})`; }
function contrastText(rgb){ const lum=(0.299*rgb[0]+0.587*rgb[1]+0.114*rgb[2])/255; return lum>0.6 ? '#20201c' : '#fff'; }

function applyLanguage(){
  document.documentElement.lang = lang;
  $('subtitle').textContent=t('subtitle'); $('languageLabel').textContent=t('language'); $('newGame').textContent=t('newGame');
  $('setupTitle').textContent=t('setupTitle'); $('setupIntro').textContent=t('setupIntro'); $('boardLabel').textContent=t('board');
  $('difficultyLabel').textContent=t('difficulty'); $('startGame').textContent=t('start'); $('resumeGame').textContent=t('resume');
  $('saveGame').textContent=t('save'); $('turnTitle').textContent=t('turn'); $('roll').textContent=t('roll'); $('playersTitle').textContent=t('players'); $('logTitle').textContent=t('log');
  $('autoUniqueLabel').textContent=t('auto'); $('soundLabel').textContent=t('sound'); $('board').setAttribute('aria-label',t('boardAria'));
  [...$('maxPlayers').options].forEach(option=>{ option.textContent=`${option.value} ${t('boardPlayers')}`; });
  const difficultyLabels=t('difficultyLabels'); [...$('difficulty').options].forEach((option,i)=>{ option.textContent=difficultyLabels[i]; });
  renderPlayerSetup();
  renderAll();
}

function renderPlayerSetup(){
  if (!$('setup') || $('setup').classList.contains('hidden')) return;
  const n=Number($('maxPlayers').value); const data=BOARD_DATA[n];
  const previous=[...$('playersSetup').querySelectorAll('.player-setup')].map(row=>({
    plays:row.querySelector('[data-plays]')?.checked,
    ai:row.querySelector('[data-kind]')?.value==='ai',
    name:row.querySelector('[data-name]')?.value,
  }));
  $('playersSetup').innerHTML='';
  data.colors.forEach((c,i)=>{
    const p=previous[i] ?? {plays:true,ai:i>0,name:COLOR_NAMES[lang][i]};
    const row=document.createElement('div'); row.className='player-setup';
    row.innerHTML=`<div class="plays"><input data-plays type="checkbox" ${p.plays!==false?'checked':''} aria-label="${t('plays')}"></div>
      <div><span class="swatch" style="display:inline-block;vertical-align:middle;background:${cssColor(c)}"></span> <strong>${COLOR_NAMES[lang][i]}</strong></div>
      <select data-kind aria-label="${t('human')} / ${t('cpu')}"><option value="human" ${p.ai?'':'selected'}>${t('human')}</option><option value="ai" ${p.ai?'selected':''}>${t('cpu')}</option></select>
      <input data-name type="text" value="${escapeHtml(p.name || COLOR_NAMES[lang][i])}" aria-label="${t('name')}">`;
    $('playersSetup').append(row);
  });
}

function getSetupPlayers(){
  return [...$('playersSetup').querySelectorAll('.player-setup')].map(row=>({
    plays:row.querySelector('[data-plays]').checked,
    ai:row.querySelector('[data-kind]').value==='ai',
    name:row.querySelector('[data-name]').value.trim() || 'Player',
  }));
}

function startNewGame(){
  const players=getSetupPlayers();
  if(players.filter(p=>p.plays).length<2){ $('setupError').textContent=t('needPlayers'); return; }
  $('setupError').textContent='';
  actionToken++;
  lastDrivenPlayerId=null;
  game=new GlParchisGame({maxPlayers:Number($('maxPlayers').value),difficulty:Number($('difficulty').value),seed:freshSeed(),players});
  eventCursor=game.events.length;
  audio.unlock();
  $('setup').classList.add('hidden'); $('game').classList.remove('hidden');
  renderAll(); driveTurn();
}

function resetToSetup(){ actionToken++; game=null; $('game').classList.add('hidden'); $('setup').classList.remove('hidden'); $('setupError').textContent=''; renderPlayerSetup(); updateResume(); }

function saveGame(){ if(!game)return; storageSet(SAVE_KEY,JSON.stringify(game.snapshot())); flashLog(t('saved')); updateResume(); }
function resumeGame(){
  audio.unlock();
  const raw=storageGet(SAVE_KEY); if(!raw){$('setupError').textContent=t('noSave');return;}
  try { game=GlParchisGame.fromSnapshot(JSON.parse(raw)); actionToken++; lastDrivenPlayerId=null; eventCursor=game.events.length; $('setup').classList.add('hidden'); $('game').classList.remove('hidden'); renderAll(); driveTurn(); }
  catch(err){ $('setupError').textContent=String(err.message||err); }
}
function updateResume(){ $('resumeGame').disabled=!storageGet(SAVE_KEY); }

function doRoll(){ audio.unlock(); if(!game || game.state!=='await-roll' || game.player().ai)return; game.roll(); renderAll(); maybeAutoUnique(); driveTurn(); }
function doMove(id){ audio.unlock(); if(!game || game.state!=='await-move' || game.player().ai)return; const info=game.moveInfo(id); if(!info.ok)return; game.movePawn(id); renderAll(); maybeAutoUnique(); driveTurn(); }

function maybeAutoUnique(){
  if(!game || game.state!=='await-move' || game.player().ai || !$('autoUnique').checked)return;
  const legal=game.legalMoves(); if(legal.length!==1)return;
  const token=actionToken; setTimeout(()=>{ if(token!==actionToken||!game||game.state!=='await-move'||game.player().ai)return; const now=game.legalMoves(); if(now.length===1){game.movePawn(now[0].pawn.id);renderAll();driveTurn();}},180);
}

const AI_STEP_DELAY = 850;
const AI_TURN_CHANGE_DELAY = 1300;

function driveTurn(){
  if(!game || game.state==='finished')return;
  if(!game.player().ai){ lastDrivenPlayerId=game.currentPlayerId; maybeAutoUnique(); return; }
  const isNewTurn = game.currentPlayerId!==lastDrivenPlayerId;
  lastDrivenPlayerId=game.currentPlayerId;
  const token=actionToken;
  setTimeout(()=>{
    if(token!==actionToken||!game||game.state==='finished'||!game.player().ai)return;
    game.aiStep(); renderAll(); driveTurn();
  },isNewTurn ? AI_TURN_CHANGE_DELAY : AI_STEP_DELAY);
}

function renderAll(){
  if(!game)return;
  renderStatus();
  fitBoardToViewport();
  renderBoard();
  renderPlayers();
  renderLog();
  playNewSounds();
}

function fitBoardToViewport(){
  const wrap=$('canvasWrap');
  if(!wrap) return;
  if(window.matchMedia('(max-width: 900px)').matches){
    wrap.style.removeProperty('width');
    wrap.style.removeProperty('height');
    return;
  }
  const panel=wrap.closest('.board-panel');
  if(!panel) return;
  const style=getComputedStyle(panel);
  const availableWidth=panel.clientWidth-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0);
  const viewportHeight=window.visualViewport?.height || window.innerHeight;
  const wrapTop=wrap.getBoundingClientRect().top;
  const mainStyle=getComputedStyle(document.querySelector('main'));
  const bottomGap=Math.max(12,parseFloat(mainStyle.paddingBottom)||0);
  const size=fittedBoardSize({availableWidth,wrapTop,viewportHeight,bottomGap});
  if(size>0){
    wrap.style.width=`${size}px`;
    wrap.style.height=`${size}px`;
  }
}


function playNewSounds(){
  if(!game){ eventCursor=0; return; }
  const events=game.events.slice(eventCursor);
  eventCursor=game.events.length;
  if(!$('sound')?.checked)return;
  for(const event of events){
    const kind=eventSoundKind(event);
    if(kind) audio.play(kind);
  }
}

function renderStatus(){
  const p=game.player();
  $('activeColor').style.background=cssColor(p.color);
  $('activeColor').style.color=contrastText(p.color.rgb);
  $('activeColorName').textContent=p.name;
  $('activeColorKind').textContent=p.ai ? t('cpu') : t('human');
  $('activeColor').classList.toggle('your-turn', game.state!=='finished' && !p.ai);
  const last=game.lastRoll(); $('die').textContent=DICE[last??0];
  let detail='';
  if(game.state==='finished') detail=`${game.player(game.winnerId).name} ${t('winner')}`;
  else if(p.ai) detail=`${p.name} ${t('cpuThinking')}`;
  else if(game.state==='await-roll') detail=`${p.name} ${t('waitingRoll')}`;
  else detail=`${p.name} ${t('waitingMove')}`;
  if(p.accumulated===20) detail+=` · ${t('bonus20')}`; if(p.accumulated===10) detail+=` · ${t('bonus10')}`;
  $('turnDetail').textContent=detail;
  $('roll').disabled=game.state!=='await-roll'||p.ai||game.state==='finished';
  const choices=$('moveChoices'); choices.innerHTML='';
  if(game.state==='await-move'&&!p.ai){
    game.legalMoves().forEach(({pawn,movement})=>{ const b=document.createElement('button'); b.type='button'; const unit=movement===1?t('square'):t('squares'); b.textContent=`${t('pawn')} ${pawn.number+1} — ${movement} ${unit}`; b.onclick=()=>doMove(pawn.id); choices.append(b); });
  }
}

function renderPlayers(){
  const box=$('playersStatus'); box.innerHTML='';
  game.activePlayers().forEach(p=>{
    const pawns=game.pawnsOf(p.id); const home=pawns.filter(x=>game.isHome(x)).length; const goal=pawns.filter(x=>game.isGoal(x)).length;
    const isCurrent=p.id===game.currentPlayerId;
    const card=document.createElement('div'); card.className='player-card'+(isCurrent?' current':'');
    if(isCurrent){ card.style.background=cssColor(p.color,.14); card.style.borderColor=cssColor(p.color,.7); }
    card.innerHTML=`<div class="player-color" style="background:${cssColor(p.color)}"></div><div><strong>${escapeHtml(p.name)}</strong><small>${p.ai?t('cpu'):t('human')} · ${t('home')}: ${home} · ${t('goal')}: ${goal}</small></div>`;
    box.append(card);
  });
}

function eventText(e){
  const p=game.players[e.playerId] ?? game.players[e.starterId] ?? {name:''};
  switch(e.type){
    case 'starter': return `${game.player(e.starterId).name} ${t('starter')}.`;
    case 'roll': return `${p.name} ${t('rolled')} ${e.value}.`;
    case 'capture': return `${p.name} ${t('captured')}.`;
    case 'goal': return `${p.name} ${t('reached')}.`;
    case 'three-sixes-home': return `${p.name}: ${t('threeSixes')}.`;
    case 'three-sixes-ramp-exempt': return `${p.name}: ${t('threeSixesRamp')}.`;
    case 'win': return `${game.player(e.winnerId).name} ${t('winner')}`;
    default: return null;
  }
}

function renderLog(){
  const log=$('log'); log.innerHTML='';
  game.events.slice(-20).map(eventText).filter(Boolean).slice(-12).forEach(text=>{const li=document.createElement('li');li.textContent=text;log.append(li);});
  log.scrollTop=log.scrollHeight;
}

function renderBoard(){
  const canvas=$('board'), rect=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
  const w=Math.max(320,Math.round(rect.width*dpr)), h=Math.max(320,Math.round(rect.height*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  const ctx=canvas.getContext('2d'); ctx.clearRect(0,0,w,h); ctx.save(); ctx.scale(dpr,dpr);
  const W=w/dpr,H=h/dpr,data=game.board,squares=data.squares.filter(s=>s&&s.id!==0);
  const xs=squares.map(s=>s.x), ys=squares.map(s=>s.y); const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const pad=28, scale=Math.min((W-pad*2)/(maxX-minX||1),(H-pad*2)/(maxY-minY||1));
  const ox=(W-(maxX-minX)*scale)/2-minX*scale, oy=(H-(maxY-minY)*scale)/2+maxY*scale;
  const rawPos=s=>({x:ox+s.x*scale,y:oy-s.y*scale});
  const groups=new Map(); squares.forEach(s=>{const k=`${s.x.toFixed(4)}:${s.y.toFixed(4)}`; if(!groups.has(k))groups.set(k,[]);groups.get(k).push(s.id);});
  const visualPos=s=>{const p=rawPos(s),g=groups.get(`${s.x.toFixed(4)}:${s.y.toFixed(4)}`); if(g.length===1)return p; const idx=g.indexOf(s.id),a=(idx/g.length)*Math.PI*2, r=Math.max(2,scale*.75); return {x:p.x+Math.cos(a)*r,y:p.y+Math.sin(a)*r};};
  const posById=new Map(squares.map(s=>[s.id,visualPos(s)]));

  // Public track and colored final ramps.
  ctx.lineCap='round'; ctx.lineJoin='round'; ctx.lineWidth=Math.max(1.2,scale*.22); ctx.strokeStyle='rgba(70,65,55,.20)'; ctx.beginPath();
  for(let id=1;id<=data.publicCircle;id++){const p=posById.get(id); if(!p)continue; if(id===1)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);} const p1=posById.get(1);if(p1)ctx.lineTo(p1.x,p1.y);ctx.stroke();
  data.routes.forEach((route,playerId)=>{const rampIds=route.slice(-8);ctx.strokeStyle=cssColor(data.colors[playerId],.35);ctx.lineWidth=Math.max(2,scale*.6);ctx.beginPath();rampIds.forEach((id,i)=>{const p=posById.get(id);if(!p)return;i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);});ctx.stroke();});

  const cellR=Math.max(4,Math.min(10,scale*1.05));
  squares.forEach(s=>{const p=posById.get(s.id); let r=cellR; if(s.kind==='home')r=cellR*2.25; else if(s.kind==='goal')r=cellR*1.55;
    ctx.beginPath();ctx.arc(p.x,p.y,r,0,Math.PI*2);
    const col=s.color>=0?data.colors[s.color]:null; ctx.fillStyle=col?cssColor(col,s.kind==='track'?.48:.72):'#fffdf8';ctx.fill();ctx.lineWidth=1.1;ctx.strokeStyle='rgba(35,35,30,.40)';ctx.stroke();
    if(s.safe&&s.kind==='track'){ctx.fillStyle='rgba(35,35,30,.62)';ctx.font=`${Math.max(7,cellR*1.05)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('★',p.x,p.y+.5);}
  });

  pawnHitboxes=[]; const legalIds=new Set(game.state==='await-move'&&!game.player().ai?game.legalMoves().map(m=>m.pawn.id):[]);
  for(const sq of squares){const occ=game.occupants(sq.id); if(!occ.length)continue; const c=posById.get(sq.id); const pawnR=Math.max(5,cellR*.72); const offsets=occ.length===1?[[0,0]]:occ.length===2?[[-pawnR*.62,0],[pawnR*.62,0]]:[[-pawnR*.65,-pawnR*.65],[pawnR*.65,-pawnR*.65],[-pawnR*.65,pawnR*.65],[pawnR*.65,pawnR*.65]];
    occ.forEach((pawn,i)=>{const off=offsets[i]??[0,0],x=c.x+off[0],y=c.y+off[1]; if(legalIds.has(pawn.id)){ctx.beginPath();ctx.arc(x,y,pawnR+3,0,Math.PI*2);ctx.fillStyle='rgba(255,255,255,.95)';ctx.fill();ctx.lineWidth=2;ctx.strokeStyle='#111';ctx.stroke();}
      ctx.beginPath();ctx.arc(x,y,pawnR,0,Math.PI*2);ctx.fillStyle=cssColor(data.colors[pawn.playerId]);ctx.fill();ctx.lineWidth=1.4;ctx.strokeStyle='rgba(0,0,0,.62)';ctx.stroke();ctx.fillStyle=pawn.playerId===4?'white':'rgba(0,0,0,.72)';ctx.font=`700 ${Math.max(7,pawnR*.95)}px system-ui`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(pawn.number+1),x,y+.3); pawnHitboxes.push({id:pawn.id,x,y,r:pawnR+8,legal:legalIds.has(pawn.id)});});
  }
  ctx.restore();
}

function boardClick(ev){ if(!game||game.state!=='await-move'||game.player().ai)return; const rect=$('board').getBoundingClientRect(),x=ev.clientX-rect.left,y=ev.clientY-rect.top; const hits=pawnHitboxes.filter(h=>h.legal).sort((a,b)=>Math.hypot(x-a.x,y-a.y)-Math.hypot(x-b.x,y-b.y)); if(hits[0]&&Math.hypot(x-hits[0].x,y-hits[0].y)<=hits[0].r)doMove(hits[0].id); }
function flashLog(text){ const li=document.createElement('li');li.textContent=text;$('log').append(li); }
function escapeHtml(s){ return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

$('language').addEventListener('change',e=>{lang=e.target.value;applyLanguage();});
$('sound').checked=audio.enabled;
$('sound').addEventListener('change',e=>{ audio.setEnabled(e.target.checked); storageSet(SOUND_KEY,e.target.checked?'1':'0'); if(e.target.checked) audio.unlock(); });
$('maxPlayers').addEventListener('change',renderPlayerSetup); $('startGame').addEventListener('click',startNewGame); $('newGame').addEventListener('click',resetToSetup); $('roll').addEventListener('click',doRoll); $('saveGame').addEventListener('click',saveGame); $('resumeGame').addEventListener('click',resumeGame); $('board').addEventListener('click',boardClick); function refreshBoardLayout(){ if(game){ fitBoardToViewport(); renderBoard(); } }
window.addEventListener('resize',refreshBoardLayout);
window.visualViewport?.addEventListener('resize',refreshBoardLayout);
renderPlayerSetup(); updateResume(); applyLanguage();
