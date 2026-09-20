(() => {
'use strict';

const i18n=window.CometI18n;
if(!i18n)throw new Error('Load js/i18n.js before js/comet.js');
const t=key=>i18n.t(key);
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d');
const overlay=document.getElementById('overlay');
const scoreText=document.getElementById('scoreText');
const ballText=document.getElementById('ballText');
const launchHint=document.getElementById('launchHint');
const stuckHint=document.getElementById('stuckHint');
const impact=document.getElementById('impact');
const turnToast=document.getElementById('turnToast');
const viewBtn=document.getElementById('viewBtn');
const languageBtn=document.getElementById('languageBtn');
const pauseBtn=document.getElementById('pauseBtn');
const pf=window.COMET_PLAYFIELD;
const P=window.CometPhysics;
const C=P.constants;
const engine=new P.Engine(pf);
const camera=window.CometCamera.create(C.W,C.H);
const audio=window.CometAudio.create(null,document.getElementById('musicTrack'));
const visuals=window.CometVisuals;
const flashParticles=[];
const ballPositions=[];
const soundBtn=document.getElementById('soundBtn');
const musicBtn=document.getElementById('musicBtn');
const musicVolume=document.getElementById('musicVolume');
const musicVolumeText=document.getElementById('musicVolumeText');
const input={left:false,right:false,plunge:false};
// Every physical key and pointer is tracked separately. Releasing one alias may
// not release a flipper still held by another key, finger, or input device.
const bindings={
  left:new Set(['tab','arrowleft','a','z']),
  right:new Set(['enter','arrowright','d','l','m']),
  plunge:new Set([' ','space','arrowdown'])
};
const heldKeys={left:new Set(),right:new Set(),plunge:new Set()};
const heldPointers={left:new Set(),right:new Set(),plunge:new Set()};
function syncInput(){for(const action of Object.keys(input))input[action]=heldKeys[action].size>0||heldPointers[action].size>0;}
function releaseControls(){for(const action of Object.keys(input)){heldKeys[action].clear();heldPointers[action].clear();input[action]=false;}}
function setKeyInput(action,key,down){
  const was=input[action];
  if(down)heldKeys[action].add(key);else heldKeys[action].delete(key);
  syncInput();
  return down&&!was&&input[action];
}
function setPointerInput(action,pointerId,down){
  const was=input[action];
  if(down)heldPointers[action].add(pointerId);else heldPointers[action].delete(pointerId);
  syncInput();
  return down&&!was&&input[action];
}
let queuedPlunge=false,plungeDidHappen=false,upperCornerStillSeconds=0;
let state='menu',score=0,ballsPlayed=0,ballPlunged=false,ballDown=false;
let sessionScores=[],scoreStoragePersistent=true;
let lastTime=performance.now(),impactUntil=0,toastUntil=0,turnAdvanceAt=0,view=camera.transform(canvas.width,canvas.height);
const {width:W,height:H}=canvas;
let cameraPreference='auto';
let overlayRefresh=null;
let turnToastKind=null;
let nameDraft='';
function prefersDesktopOverview(){
  if(typeof window.matchMedia==='function'){
    return window.matchMedia('(min-width: 960px) and (hover:hover) and (pointer:fine)').matches;
  }
  const width=Number(window.innerWidth||document.documentElement?.clientWidth||0);
  return width>=960;
}
function updateViewButton(){
  viewBtn.textContent=camera.following?t('follow'):t('overview');
  viewBtn.title=t('viewTitle');
  viewBtn.setAttribute('aria-pressed',String(camera.following));
}
function applyResponsiveCamera(force=false){
  if(cameraPreference!=='auto'&&!force)return;
  camera.setFollowing(!prefersDesktopOverview(),engine.ball);
  updateViewButton();
}

function showTurnToast(html,duration=1600){turnToast.innerHTML=html;turnToast.hidden=false;toastUntil=performance.now()+duration;}
function hideTurnToast(){turnToast.hidden=true;turnToast.innerHTML='';toastUntil=0;turnToastKind=null;}
function scheduleNextBall(delayMs=950){turnAdvanceAt=performance.now()+delayMs;}

function fireScore(id){
  const points=pf.scores[id]||0;
  if(points){score+=points;impact.textContent=`+${points}`;impactUntil=performance.now()+650;
    const bumper=pf.bumpers.find(b=>b.id===id);
    const sling=pf.slingshots.find(b=>b.id===id);
    if(bumper||sling){const obj=bumper||sling;flashParticles.push({id,x:obj.x,y:obj.y,at:performance.now()});}
    audio.play(bumper?'bumper':'sling');
  }
}
function onPlunge(){audio.play('plunge');ballPositions.length=0;plungeDidHappen=true;queuedPlunge=false;ballPlunged=true;ballDown=false;launchHint.hidden=true;}
function onDrain(voluntary=false){
  if(ballDown)return;
  audio.play('drain');ballPositions.length=0;ballDown=true;upperCornerStillSeconds=0;pauseBtn.textContent=t('pause');
  if(ballPlunged||voluntary)ballsPlayed++;
  ballPlunged=false;queuedPlunge=false;
  releaseControls();hideOverlay();
  if(ballsPlayed>=3){hideTurnToast();turnAdvanceAt=0;state='name';showName();}
  else {
    turnToastKind=voluntary?'ballEnded':'ballLost';
    showTurnToast(`${t(turnToastKind)} · <strong>${t('nextBall')} ${ballsPlayed+1} / 3</strong>`);
    scheduleNextBall();
  }
}
function resetBall(){ballPositions.length=0;upperCornerStillSeconds=0;pauseBtn.textContent=t('pause');engine.reset();state='game';ballDown=false;ballPlunged=false;queuedPlunge=false;turnAdvanceAt=0;releaseControls();lastTime=performance.now();hideOverlay();camera.snap(engine.ball);applyResponsiveCamera();audio.updateMusic(true);canvas.focus();}
function newGame(){
  audio.unlock();audio.play('menu');audio.updateMusic(true);ballPositions.length=0;flashParticles.length=0;
  upperCornerStillSeconds=0;pauseBtn.textContent=t('pause');score=0;ballsPlayed=0;ballPlunged=false;ballDown=false;queuedPlunge=false;turnAdvanceAt=0;releaseControls();
  engine.resetAll();state='game';lastTime=performance.now();hideOverlay();hideTurnToast();camera.snap(engine.ball);applyResponsiveCamera();canvas.focus();
}
function resetOrContinue(){if(state==='game'&&ballDown){if(ballsPlayed>=3){state='name';showName();}else resetBall();}}
function returnToGame(){
  if(state==='paused'){restorePauseMenu();return;}
  releaseControls();queuedPlunge=false;
  lastTime=performance.now();hideOverlay();audio.updateMusic(true);canvas.focus();
}
function restorePauseMenu(){state='game';hideOverlay();pauseGame();}
function offerNewGame(){
  if((state==='game'&&!ballDown)||state==='paused'){
    releaseControls();queuedPlunge=false;
    showOverlay(`<div class="hero">↻</div><h1>${t('newGameQuestion')}</h1><p>${t('newGameBody')}</p><button id="yesRestart" class="primary">${t('newGameButton')}</button><button id="cancelRestart">${t('backToGame')}</button>`,offerNewGame);
    document.getElementById('yesRestart').onclick=newGame;
    document.getElementById('cancelRestart').onclick=returnToGame;
  }else newGame();
}
function offerMenu(){
  if((state==='game'&&!ballDown)||state==='paused'){
    releaseControls();queuedPlunge=false;
    showOverlay(`<div class="hero">☄</div><h1>${t('leaveQuestion')}</h1><p>${t('leaveBody')}</p><button id="yesMenu" class="primary">${t('leaveYes')}</button><button id="cancelMenu">${t('backToGame')}</button>`,offerMenu);
    document.getElementById('yesMenu').onclick=showMenu;
    document.getElementById('cancelMenu').onclick=returnToGame;
  }else showMenu();
}
function showPauseScreen(){
  showOverlay(`<div class="hero">Ⅱ</div><h1>${t('pausedHeading')}</h1><p>${t('pausedBody')}</p><button id="resumeGame" class="primary">${t('resume')}</button><button id="forfeitBall">${t('stuckPause')}</button><button id="pauseMenu">${t('backMenu')}</button>`,showPauseScreen);
  document.getElementById('resumeGame').onclick=resumeGame;
  document.getElementById('forfeitBall').onclick=confirmForfeit;
  document.getElementById('pauseMenu').onclick=showMenu;
}
function pauseGame(){
  if(state!=='game'||ballDown||overlay.classList.contains('show'))return;
  state='paused';pauseBtn.textContent=t('resume');releaseControls();queuedPlunge=false;
  showPauseScreen();
}
function resumeGame(){
  if(state!=='paused')return;
  state='game';pauseBtn.textContent=t('pause');lastTime=performance.now();releaseControls();
  hideOverlay();audio.updateMusic(true);canvas.focus();
}
function confirmForfeit(){
  if(state!=='paused'||ballDown)return;
  showOverlay(`<div class="hero">?</div><h1>${t('forfeitQuestion')}</h1><p>${t('forfeitBody')}</p><button id="confirmForfeit" class="primary">${t('forfeitYes')}</button><button id="cancelForfeit">${t('backPause')}</button>`,confirmForfeit);
  document.getElementById('confirmForfeit').onclick=()=>{if(state==='paused'&&!ballDown){state='game';onDrain(true);}};
  document.getElementById('cancelForfeit').onclick=restorePauseMenu;
}
function sx(x){return view.sx(x);}
function sy(y){return view.sy(y);}
function polygonPath(points){
  if(!points.length)return;
  ctx.beginPath();ctx.moveTo(sx(points[0].x),sy(points[0].y));
  for(let i=1;i<points.length;i++)ctx.lineTo(sx(points[i].x),sy(points[i].y));
  ctx.closePath();
}
function drawPolygon(points,fill,stroke,lineWidth=1){
  polygonPath(points);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}
}
function disk(x,y,r,fill,stroke=null,lineWidth=1){
  ctx.beginPath();ctx.arc(sx(x),sy(y),r*view.scaleX,0,Math.PI*2);
  if(fill){ctx.fillStyle=fill;ctx.fill();}
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();}
}
function tableBackground(){
  // Still historically dark, but with a little more separation so fixtures are readable.
  const field=ctx.createLinearGradient(0,0,0,H);
  field.addColorStop(0,'#030706');field.addColorStop(.62,'#04100b');field.addColorStop(1,'#07142a');
  ctx.fillStyle=field;ctx.fillRect(0,0,W,H);
  ctx.save();
  const topGlow=ctx.createRadialGradient(sx(.38),sy(1.13),1,sx(.38),sy(1.13),Math.max(60,view.scaleX*.20));
  topGlow.addColorStop(0,'#7dffd21f');topGlow.addColorStop(.45,'#2e755300');topGlow.addColorStop(1,'#00000000');
  ctx.fillStyle=topGlow;ctx.fillRect(0,0,W,H);
  const bottomGlow=ctx.createRadialGradient(sx(.37),sy(.12),1,sx(.37),sy(.12),Math.max(90,view.scaleX*.26));
  bottomGlow.addColorStop(0,'#66aef520');bottomGlow.addColorStop(.55,'#315d9006');bottomGlow.addColorStop(1,'#00000000');
  ctx.fillStyle=bottomGlow;ctx.fillRect(0,0,W,H);
  // A narrow visual strip distinguishes the original right launch lane.
  const laneLeft=sx(.72),laneRight=sx(.75);
  const laneTop=sy(1.10),laneBottom=sy(.015);
  ctx.fillStyle='#09140f';ctx.fillRect(laneLeft,laneTop,laneRight-laneLeft,laneBottom-laneTop);
  ctx.strokeStyle='#6bebb0';ctx.lineWidth=1.05;ctx.globalAlpha=.85;
  ctx.beginPath();ctx.moveTo(laneLeft,sy(.03));ctx.lineTo(laneLeft,sy(1.09));ctx.stroke();
  ctx.beginPath();ctx.moveTo(laneRight,sy(.03));ctx.lineTo(laneRight,sy(1.09));ctx.stroke();
  ctx.restore();
}
function drawFixtures(){
  ctx.lineJoin='round';ctx.lineCap='round';
  for(const p of engine.geometry.polygons){
    const hot=p.kind==='sling-reactive'&&flashParticles.some(f=>f.id===p.id&&performance.now()-f.at<240);
    let stroke=hot?'#ffe8a0':'#7cf6a8';
    let fill='#030806',width=1.28;
    if(p.kind==='bottom-left'||p.kind==='bottom-right'||p.kind.endsWith('flipper-corner')){
      fill='#0a1730';stroke='#85c9ff';width=1.35;
    }else if(p.kind==='obstacle'){
      fill='#07150d';stroke='#92ffc1';width=1.34;
    }else if(p.kind==='sling-side'||p.kind==='sling-reactive'){
      fill='#071007';width=hot?1.95:1.34;
    }else if(p.kind==='plunger-tube'){
      fill='#08140f';stroke='#74edb0';
    }
    ctx.save();
    if(hot){ctx.shadowColor='#ffd08a';ctx.shadowBlur=15;}
    else if(/wall|ground|ceiling|curve|sling|obstacle|plunger/.test(p.kind)){ctx.shadowColor='#3ae48d33';ctx.shadowBlur=4;}
    drawPolygon(p.points,fill,stroke,width);
    ctx.restore();
  }
  for(const c of engine.geometry.circles){
    if(c.kind==='bumper'){
      visuals.lamp(ctx,view,c.x,c.y,c.r*.96,
        flashParticles.some(f=>f.id===c.id&&performance.now()-f.at<240));
    }else if(c.kind==='sling-corner'){
      disk(c.x,c.y,c.r,'#0b1730','#8dd9ff',1.1);
    }
  }
}
function drawFlipper(f){
  const sh=P.flipperWorldShape(f);
  // The historic flippers are light bodies with reddish pivot discs.
  // Only paint: neither their shape nor their commanded motor speed changes.
  ctx.save();
  ctx.shadowColor='#ffffff66';ctx.shadowBlur=7;
  const enamel=ctx.createLinearGradient(sx(sh.pivot.x),sy(sh.pivot.y),sx(sh.tip.x),sy(sh.tip.y));
  enamel.addColorStop(0,'#e7b8bf');enamel.addColorStop(.15,'#fffef8');
  enamel.addColorStop(.58,'#f5f0e8');enamel.addColorStop(1,'#b9b7b2');
  drawPolygon(sh.poly,enamel,'#ffffff',1.45);
  ctx.restore();
  disk(sh.pivot.x,sh.pivot.y,sh.pivot.r,'#7b1826','#d88b95',1.5);
  disk(sh.tip.x,sh.tip.y,sh.tip.r,'#f0eeea','#ffffff',1.05);
}
function drawBall(ball){
  if(!ball)return;
  const r=C.BALL_R*view.scaleX,x=sx(ball.x),y=sy(ball.y);
  if(!Number.isFinite(x)||!Number.isFinite(y))return;
  ctx.save();ctx.shadowColor='#d7fbff';ctx.shadowBlur=r*1.45;
  const glow=ctx.createRadialGradient(x-r*.35,y-r*.45,.4,x,y,r);
  glow.addColorStop(0,'#ffffff');glow.addColorStop(.24,'#fcfeff');glow.addColorStop(.70,'#bfd5ec');glow.addColorStop(1,'#56708f');
  ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;ctx.strokeStyle='#ffffffcc';ctx.lineWidth=1.1;ctx.stroke();ctx.restore();
}
function inLauncher(){const b=engine.ball;return !!b&&b.x>.70&&b.y<.05&&!ballDown;}
function draw(){
  ctx.fillStyle='#060e25';ctx.fillRect(0,0,W,H);
  view=camera.transform(W,H);
  tableBackground();visuals.drawArt(ctx,view,C.W,C.H);drawFixtures();
  visuals.sparks(ctx,view,flashParticles,performance.now());
  drawFlipper(engine.flippers.left);drawFlipper(engine.flippers.right);
  visuals.ballTrail(ctx,view,ballPositions);drawBall(engine.ball);
  const canLaunch=state==='game'&&inLauncher();
  launchHint.hidden=!canLaunch||overlay.classList.contains('show');
  stuckHint.hidden=!(state==='game'&&!ballDown&&ballPlunged&&upperCornerStillSeconds>=5)||overlay.classList.contains('show');
  scoreText.textContent=String(score).padStart(6,'0');
  ballText.textContent=`${Math.min(3,ballsPlayed+1)} / 3`;
  const lastFlash=flashParticles[flashParticles.length-1];
  if(lastFlash){
    impact.style.left=`${Math.max(7,Math.min(93,100*sx(lastFlash.x)/W))}%`;
    impact.style.top=`${Math.max(8,Math.min(92,100*sy(lastFlash.y)/H))}%`;
  }
  impact.classList.toggle('show',performance.now()<impactUntil&&state==='game');
  if(!turnToast.hidden && performance.now()>=toastUntil && state!=='name')hideTurnToast();
}

function showOverlay(html,refresh=null){
  overlayRefresh=refresh;
  overlay.classList.remove('credits-visible');overlay.innerHTML=`<div class="panel">${html}</div>`;
  overlay.classList.add('show');launchHint.hidden=true;
}
function hideOverlay(){
  overlayRefresh=null;overlay.classList.remove('show');overlay.classList.remove('credits-visible');overlay.innerHTML='';
}
function showMenu(){
  pauseBtn.textContent=t('pause');state='menu';releaseControls();queuedPlunge=false;ballDown=false;turnAdvanceAt=0;hideTurnToast();applyResponsiveCamera();
  showOverlay(`<div class="hero">☄</div><h1>COMET <b>PINBALL</b></h1><p>${t('intro')}</p><button id="startGame" class="primary">${t('play')}</button><button id="showScores">${t('highScores')}</button><button id="showCredits">${t('creditsButton')}</button><p class="tip">${t('menuTip')}</p>`,showMenu);
  document.getElementById('startGame').onclick=newGame;
  document.getElementById('showScores').onclick=showScores;
  document.getElementById('showCredits').onclick=showCredits;
}
function showCredits(){
  // Attribution only: this screen never advances the physical simulation.
  state='credits';releaseControls();queuedPlunge=false;hideTurnToast();
  showOverlay(`<div class="hero" aria-hidden="true">✦</div><h1>${t('creditsTitle')}</h1><div class="credits-content"><p><strong>${t('original')}</strong><br>${t('authors')}</p><p><strong>${t('restoration')}</strong><br>${t('libreProject')}<br><a href="https://linkingtechnologies.github.io/libre-arcade/" target="_blank" rel="noopener noreferrer">${t('visitLibre')}</a></p><p><strong>${t('musicCredit')}</strong><br>Mechanical Night loop · CC0 1.0</p><p class="credits-license">${t('webLicense')}</p><p><a href="https://github.com/boskoop/comet-pinball" target="_blank" rel="noopener noreferrer">${t('originalSource')}</a></p></div><button id="backCredits" class="primary">${t('backCredits')}</button>`,showCredits);
  overlay.classList.add('credits-visible');
  document.getElementById('backCredits').onclick=showMenu;
}
function cleanScores(value){
  if(!Array.isArray(value))return [];
  return value.filter(r=>r&&typeof r.name==='string'&&typeof r.score==='number'&&Number.isSafeInteger(r.score)&&r.score>=0)
    .map(r=>({name:r.name.trim().slice(0,24)||t('playerFallback'),score:r.score}))
    .sort((a,b)=>b.score-a.score).slice(0,10);
}
function getScores(){
  if(!scoreStoragePersistent)return cleanScores(sessionScores);
  try{const stored=localStorage.getItem('comet-pinball-scores');return cleanScores(stored===null?sessionScores:JSON.parse(stored));}
  catch{scoreStoragePersistent=false;return cleanScores(sessionScores);}
}
function saveScore(name){
  const rows=getScores();rows.push({name:String(name||'').trim().slice(0,24)||t('playerFallback'),score});
  sessionScores=cleanScores(rows);
  try{localStorage.setItem('comet-pinball-scores',JSON.stringify(sessionScores));scoreStoragePersistent=true;}
  catch{scoreStoragePersistent=false;}
}

function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function showScores(){
  state='highscore';hideTurnToast();const rows=getScores();
  const locale=i18n.getLanguage()==='it'?'it-IT':'en-US';
  const body=rows.length?rows.map((r,i)=>`<div class="score-row"><span>${i+1}. ${escapeHtml(r.name)}</span><strong>${r.score.toLocaleString(locale)}</strong></div>`).join(''):`<p>${t('emptyScores')}</p>`;
  const storageNote=scoreStoragePersistent?'':`<p class="tip">${t('storageNote')}</p>`;
  showOverlay(`<div class="hero">🏆</div><h1>${t('highScores').replace('🏆 ','').toUpperCase()}</h1>${body}${storageNote}<button id="backMenu" class="primary">${t('backMenu')}</button>`,showScores);
  document.getElementById('backMenu').onclick=showMenu;
}
function showName(){
  const existing=document.getElementById('playerName');
  if(overlay.classList.contains('show')&&existing&&typeof existing.value==='string')nameDraft=existing.value;
  hideTurnToast();
  const locale=i18n.getLanguage()==='it'?'it-IT':'en-US';
  showOverlay(`<div class="hero">🏆</div><h1>${t('gameOver')}</h1><p>${t('totalPrefix')} <strong>${score.toLocaleString(locale)} ${t('points')}</strong>!</p><input id="playerName" maxlength="24" placeholder="${t('playerPlaceholder')}" aria-label="${t('playerAria')}"><button id="saveName" class="primary">${t('saveRecord')}</button><button id="againGame">${t('playAgain')}</button>`,showName);
  const el=document.getElementById('playerName');el.value=nameDraft;
  document.getElementById('saveName').onclick=()=>{saveScore(el.value);nameDraft='';showScores();};
  document.getElementById('againGame').onclick=()=>{nameDraft='';newGame();};
  el.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();document.getElementById('saveName').click();}};
}
function toggleView(){cameraPreference='manual';camera.setFollowing(!camera.following,engine.ball);updateViewButton();}
function keyChange(e,down){
  const k=String(e.key||'').toLowerCase();
  const inText=e.target&&(/input|textarea/i).test(e.target.tagName||'');
  if(inText)return;
  if(e.target===languageBtn||e.target===viewBtn)return;
  if(down&&(k==='p'||k==='escape')){
    if(!e.repeat){
      if(state==='paused')resumeGame();
      else if(state==='game'&&!ballDown)pauseGame();
      else if(state==='highscore'||state==='credits')showMenu();
    }
    e.preventDefault();return;
  }
  if(down&&k==='v'){if(!e.repeat)toggleView();e.preventDefault();return;}
  if(down&&k==='r'&&state==='game'&&ballDown){if(!e.repeat)resetOrContinue();e.preventDefault();return;}
  const action=Object.keys(bindings).find(a=>bindings[a].has(k)||(a==='plunge'&&e.code==='Space'));
  if(!action)return;
  e.preventDefault(); // No page scroll, focus change (Tab), or button activation (Enter).
  if(state!=='game'||ballDown||overlay.classList.contains('show')){
    if(!down)setKeyInput(action,k,false);
    return;
  }
  const started=setKeyInput(action,k,down);
  if(started){
    audio.unlock();
    if(action==='plunge'){if(inLauncher())queuedPlunge=true;}
    else audio.play('flipper');
  }
}
window.addEventListener('keydown',e=>keyChange(e,true));
window.addEventListener('keyup',e=>keyChange(e,false));
window.addEventListener('blur',()=>{releaseControls();pauseGame();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseControls();pauseGame();}});
function bindHold(id,action){
  const el=document.getElementById(id);
  function release(e){setPointerInput(action,e.pointerId,false);}
  el.addEventListener('pointerdown',e=>{
    e.preventDefault();
    if(state!=='game'||ballDown||overlay.classList.contains('show'))return;
    if(el.setPointerCapture)el.setPointerCapture(e.pointerId);
    const started=setPointerInput(action,e.pointerId,true);
    if(started){audio.unlock();if(action!=='plunge')audio.play('flipper');}
    if(action==='plunge'&&inLauncher())queuedPlunge=true;
    canvas.focus();
  });
  el.addEventListener('pointerup',release);
  el.addEventListener('pointercancel',release);
  el.addEventListener('lostpointercapture',release);
}
bindHold('leftBtn','left');bindHold('rightBtn','right');bindHold('plungeBtn','plunge');
// The upper-left stable resting point is also present in the untouched native JAR.
// This is an optional player decision, NOT an automatic drain or a physics fix.
stuckHint.onclick=()=>{if(state==='game'&&!ballDown&&ballPlunged&&upperCornerStillSeconds>=5){pauseGame();confirmForfeit();}};
launchHint.onclick=()=>{if(state==='game'&&!ballDown&&!overlay.classList.contains('show')&&inLauncher())queuedPlunge=true;canvas.focus();};
viewBtn.onclick=toggleView;
window.addEventListener('resize',()=>applyResponsiveCamera());
function updateAudioButtons(){soundBtn.textContent=audio.muted?t('sfxOff'):t('sfxOn');
  soundBtn.setAttribute('aria-pressed',String(!audio.muted));
  musicBtn.textContent=audio.music?t('musicOn'):t('musicOff');
  musicBtn.setAttribute('aria-pressed',String(audio.music));}
soundBtn.onclick=()=>{audio.unlock();audio.setMuted(!audio.muted);updateAudioButtons();if(!audio.muted)audio.play('menu');};
musicBtn.onclick=()=>{audio.unlock();audio.setMusic(!audio.music);audio.updateMusic(state==='game'&&!ballDown&&!overlay.classList.contains('show'));updateAudioButtons();if(audio.music)audio.play('menu');};
musicVolume.oninput=()=>{const amount=Number(musicVolume.value);audio.setMusicVolume(amount/100);musicVolumeText.textContent=`${amount}%`;};
function updateLocalizedStaticUi(){
  const put=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value;};
  const title=(id,value)=>{const el=document.getElementById(id);if(el)el.title=value;};
  const aria=(id,value)=>{const el=document.getElementById(id);if(el)el.setAttribute('aria-label',value);};
  if(document.documentElement)document.documentElement.lang=i18n.getLanguage();
  document.title=t('pageTitle');
  put('tagline',t('tagline'));put('scoreLabel',t('score'));put('ballLabel',t('ball'));
  title('viewBtn',t('viewTitle'));aria('game',t('canvasLabel'));
  aria('languageBtn',t('languageButton'));title('languageBtn',t('languageTitle'));
  languageBtn.textContent=i18n.getLanguage()==='en'?'EN / IT':'IT / EN';
  languageBtn.setAttribute('aria-pressed',String(i18n.getLanguage()==='it'));
  const field=document.querySelector?.('.game-wrap');if(field)field.setAttribute('aria-label',t('boardLabel'));
  const mobile=document.querySelector?.('.mobile-controls');if(mobile)mobile.setAttribute('aria-label',t('controls'));
  const help=document.querySelector?.('.desktop-help');if(help)help.innerHTML=`← / A / Z: ${t('left')} &nbsp;·&nbsp; → / D / L / M: ${t('right')} &nbsp;·&nbsp; ${t('space')} / ↓: ${t('launchWord')} &nbsp;·&nbsp; P: ${t('pauseWord')}`;
  const touchHelp=document.querySelector?.('.touch-help');if(touchHelp)touchHelp.textContent=t('touchHelp');
  launchHint.innerHTML=`${t('launch')} <span>${t('space')}</span>`;
  stuckHint.innerHTML=`${t('stuck')} <strong>${t('stuckAction')}</strong>`;
  put('plungeBtn',t('launch'));put('pauseBtn',state==='paused'?t('resume'):t('pause'));
  put('resetBtn',t('restart'));put('menuBtn',t('menu'));
  const volumeLabel=document.querySelector?.('.music-volume');
  if(volumeLabel){for(const node of volumeLabel.childNodes||[]){if(node.nodeType===3){node.textContent=t('volume')+' ';break;}}}
  aria('musicVolume',t('volume'));title('soundBtn',t('sfxTitle'));title('musicBtn',t('musicTitle'));
  updateViewButton();updateAudioButtons();
  if(turnToastKind&&!turnToast.hidden){const remaining=Math.max(0,toastUntil-performance.now());showTurnToast(`${t(turnToastKind)} · <strong>${t('nextBall')} ${ballsPlayed+1} / 3</strong>`,remaining);}
  if(overlay.classList.contains('show')&&overlayRefresh)overlayRefresh();
}
languageBtn.onclick=()=>{i18n.setLanguage(i18n.getLanguage()==='en'?'it':'en');updateLocalizedStaticUi();};
updateLocalizedStaticUi();
document.getElementById('resetBtn').onclick=()=>{if(state==='game'&&ballDown)resetOrContinue();else if(state==='game')offerNewGame();else if(state==='paused')offerNewGame();};
document.getElementById('pauseBtn').onclick=()=>{if(state==='game')pauseGame();else if(state==='paused')resumeGame();};
document.getElementById('menuBtn').onclick=offerMenu;
function frame(now){
  let dt=(now-lastTime)/1000;lastTime=now;dt=Math.max(0,Math.min(dt,.05));
  if(state==='game'&&ballDown&&turnAdvanceAt&&now>=turnAdvanceAt){resetBall();}
  if(state==='game'&&!ballDown&&!overlay.classList.contains('show')){
    const cmd=queuedPlunge?{...input,plunge:true}:input;
    plungeDidHappen=false;
    const bx=engine.ball.x,by=engine.ball.y;
    engine.step(dt,now,cmd,{onHit:fireScore,onPlunge,onDrain,
      onContactEvent:e=>{if(e.event==='CONTACT_BEGIN'&&e.label&&
        (/flipper/.test(e.label)||/wall|ground|ceiling|obstacle/.test(e.label)))audio.play('wall');}});
    const nb=engine.ball;
    if(Number.isFinite(nb.x)&&Number.isFinite(nb.y)){
      ballPositions.push({x:nb.x,y:nb.y});if(ballPositions.length>9)ballPositions.shift();
    }
    for(let i=flashParticles.length-1;i>=0;i--)if(performance.now()-flashParticles[i].at>660)flashParticles.splice(i,1);
    // Require five seconds of *simulated* physical stillness in the oracle-verified
    // upper-left resting pocket. This never changes the ball or ends a turn.
    const b=engine.ball;
    if(ballPlunged&&!ballDown&&b.x<.04&&b.y>1.20&&
       Math.hypot(b.vx,b.vy)<1e-4&&Math.hypot(b.x-bx,b.y-by)<1e-6)
      upperCornerStillSeconds+=dt;
    else upperCornerStillSeconds=0;
    // A fresh ball begins a few millimetres above the plunger sensor.
    // Keep a short button tap queued until it settles into the original launch zone.
    if(plungeDidHappen||!inLauncher())queuedPlunge=false;
  }
  audio.updateMusic(state==='game'&&!ballDown&&!overlay.classList.contains('show'));
  camera.update(engine.ball,state==='game'&&!ballDown?dt:0);
  draw();requestAnimationFrame(frame);
}
engine.reset();applyResponsiveCamera(true);camera.snap(engine.ball);applyResponsiveCamera(true);showMenu();requestAnimationFrame(frame);
})();
