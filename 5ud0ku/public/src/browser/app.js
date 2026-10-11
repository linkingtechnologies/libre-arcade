import {
  GameSession,
  GridStore,
  LocalStorageBackend,
  AUTO_SAVE_FILENAME,
  createBrowserSudokuWorkerClient,
  generatedResultToGrid,
  gridToBytes,
  gridFromBytes,
  customSolutionToGrid,
  emptyCustomGrid,
  editableGrid,
  solutionViewCell,
} from '../core/index.js';

const $ = (id) => document.getElementById(id);
const boardEl = $('board');
const statusEl = $('statusText');
const timerEl = $('timer');
const loadingOverlay = $('loadingOverlay');
const loadingText = $('loadingText');
const difficultyBadge = $('difficultyBadge');
const pencilButton = $('pencilButton');
const beginnerToggle = $('beginnerToggle');
const conflictToggle = $('conflictToggle');
const toolGrid = $('toolGrid');
const customActions = $('customActions');
const newGameButton = $('newGameButton');

function storageGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function storageSet(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } }
function storageRemove(key) { try { localStorage.removeItem(key); return true; } catch { return false; } }
function preferredLanguage() { return navigator.language?.toLowerCase().startsWith('it') ? 'it' : 'en'; }

const I18N = {
  en: {
    pencil:'Pencil', erase:'Erase', undo:'Undo', redo:'Redo', hint:'Hint', check:'Check', newGame:'New game',
    chooseDifficulty:'Choose difficulty', easy:'Easy', normal:'Normal', hard:'Hard', custom:'Custom', customPuzzle:'Custom puzzle',
    cancel:'Cancel', help:'Help', close:'Close', continue:'Continue', menu:'Menu', settings:'Settings', creditsTitle:'Credits', savedGames:'Saved games',
    saveGame:'Save game', loadGame:'Load game', deleteGame:'Delete', filename:'Filename', save:'Save', load:'Load', noSavedGames:'No saved games yet.',
    beginner:'Beginner mode: update pencil marks automatically', immediateConflicts:'Highlight conflicts while entering digits',
    helpText:'Select a cell, then enter a digit; entering the digit that is already there clears the cell. Pencil mode adds candidate marks. Undo, redo, hint and conflict checking follow the original 5ud0ku behaviour.',
    customHelp:'Custom Puzzle lets you enter any Sudoku. “Solve” displays the first solution; “Solve & Play” keeps your givens and starts a playable game. As in the original, a puzzle may have more than one solution.',
    creating:'Creating puzzle…', checking:'Checking puzzle…', ready:'Ready', restored:'Saved game restored', selectCell:'Select a cell first', fixedCell:'That digit is part of the puzzle',
    noConflict:'No conflicts found', conflicts:'Conflicts found', completed:'Puzzle completed!', time:'Time', newEasy:'New Easy game', newNormal:'New Normal game', newHard:'New Hard game',
    error:'Could not create puzzle', pencilOn:'Pencil mode on', pencilOff:'Pencil mode off',
    enterCustom:'Enter your Sudoku, then choose Solve or Solve & Play.', solve:'Solve', solvePlay:'Solve & Play', customCancelled:'Custom puzzle cancelled',
    invalidPuzzle:'The puzzle violates Sudoku rules.', noSolution:'This puzzle has no solution.', uniqueSolution:'Unique solution found.', multipleSolutions:'Multiple solutions found; using the first one, as 5ud0ku did.',
    uniquePlay:'Unique solution found. Game started.', multiplePlay:'Multiple solutions found. Game started with the first solution.',
    saved:'Game saved.', saveFailed:'Could not save the game.', emptyName:'Enter a filename.', loaded:'Game loaded.', loadFailed:'Could not load the game.', deleted:'Saved game deleted.',
    deleteConfirm:'Delete this saved game?', autosaveInfo:'Autosave is always active while playing.', fileNameDefault:'Default',
    originalCredits:'Original 5ud0ku 1.8', portCredits:'HTML5 port for Libre Arcade.', sourceLicense:'Original source: LGPL 2.1 or later',
    originalPage:'Original project page', keyboardHelp:'Keyboard: arrows move, 1–9 enter a digit, Delete clears, P toggles Pencil, Ctrl/Cmd+Z undoes and Ctrl/Cmd+Y redoes, Esc leaves the solution view.',
    changeLanguage:'Switch to Italian', elapsedTime:'Elapsed time', boardLabel:'Sudoku board', controlsLabel:'Game controls', digitsLabel:'Digits', digitLabel:'Digit',
    row:'Row', column:'Column', emptyCell:'empty', fixedA11y:'fixed', editableA11y:'editable', candidates:'candidates',
    resetData:'Reset local data', resetDataHelp:'Deletes autosave, named saves and local preferences from this browser.', resetConfirm:'Delete all saved games, autosave and local settings from this browser?', resetDone:'Local data reset.', resetFailed:'Could not clear all local data.',
    showSolution:'Show solution', showPuzzle:'Show puzzle', resetGame:'Reset game', editPuzzle:'Edit this puzzle',
    solutionShown:'Solution shown. Menu or Esc: back to the puzzle.', puzzleShown:'Back to the puzzle',
    resetGameConfirm:'Clear every digit and note you entered and restart the timer?', gameReset:'Game reset',
    solutionA11y:'solution', digitRightA11y:'your digit is correct', digitWrongA11y:'your digit is wrong',
    workerTimeout:'The operation took too long. Try again.', workerCrash:'The game engine stopped unexpectedly. Try again.', workerBusy:'The game engine is busy.', workerCancelled:'Operation cancelled.', workerError:'The game engine could not complete the operation.',
  },
  it: {
    pencil:'Matita', erase:'Cancella', undo:'Annulla', redo:'Ripeti', hint:'Suggerimento', check:'Controlla', newGame:'Nuova partita',
    chooseDifficulty:'Scegli la difficoltà', easy:'Facile', normal:'Normale', hard:'Difficile', custom:'Personalizzato', customPuzzle:'Sudoku personalizzato',
    cancel:'Annulla', help:'Aiuto', close:'Chiudi', continue:'Continua', menu:'Menu', settings:'Impostazioni', creditsTitle:'Crediti', savedGames:'Partite salvate',
    saveGame:'Salva partita', loadGame:'Carica partita', deleteGame:'Elimina', filename:'Nome', save:'Salva', load:'Carica', noSavedGames:'Nessuna partita salvata.',
    beginner:'Modalità principiante: aggiorna automaticamente i candidati', immediateConflicts:'Evidenzia i conflitti durante l’inserimento',
    helpText:'Seleziona una casella e inserisci una cifra; inserire la cifra già presente svuota la casella. La modalità matita aggiunge i candidati. Annulla, ripeti, suggerimento e controllo conflitti seguono il comportamento originale di 5ud0ku.',
    customHelp:'Sudoku personalizzato permette di inserire qualsiasi schema. “Risolvi” mostra la prima soluzione; “Risolvi e gioca” mantiene i numeri iniziali e avvia una partita. Come nell’originale, un puzzle può avere più di una soluzione.',
    creating:'Creazione del Sudoku…', checking:'Verifica del Sudoku…', ready:'Pronto', restored:'Partita salvata ripristinata', selectCell:'Seleziona prima una casella', fixedCell:'Questa cifra fa parte del Sudoku',
    noConflict:'Nessun conflitto trovato', conflicts:'Conflitti trovati', completed:'Sudoku completato!', time:'Tempo', newEasy:'Nuova partita Facile', newNormal:'Nuova partita Normale', newHard:'Nuova partita Difficile',
    error:'Impossibile creare il Sudoku', pencilOn:'Modalità matita attiva', pencilOff:'Modalità matita disattiva',
    enterCustom:'Inserisci il Sudoku, poi scegli Risolvi oppure Risolvi e gioca.', solve:'Risolvi', solvePlay:'Risolvi e gioca', customCancelled:'Inserimento annullato',
    invalidPuzzle:'Il Sudoku viola le regole.', noSolution:'Questo Sudoku non ha soluzioni.', uniqueSolution:'Trovata una soluzione unica.', multipleSolutions:'Trovate più soluzioni; mostro la prima, come faceva 5ud0ku.',
    uniquePlay:'Trovata una soluzione unica. Partita avviata.', multiplePlay:'Trovate più soluzioni. Partita avviata usando la prima.',
    saved:'Partita salvata.', saveFailed:'Impossibile salvare la partita.', emptyName:'Inserisci un nome.', loaded:'Partita caricata.', loadFailed:'Impossibile caricare la partita.', deleted:'Partita salvata eliminata.',
    deleteConfirm:'Eliminare questa partita salvata?', autosaveInfo:'Il salvataggio automatico è sempre attivo durante la partita.', fileNameDefault:'Default',
    originalCredits:'5ud0ku 1.8 originale', portCredits:'Versione HTML5 per Libre Arcade.', sourceLicense:'Sorgente originale: LGPL 2.1 o successiva',
    originalPage:'Pagina del progetto originale', keyboardHelp:'Tastiera: frecce per muoversi, 1–9 per inserire, Canc per cancellare, P per la matita, Ctrl/Cmd+Z per annullare, Ctrl/Cmd+Y per ripetere, Esc per uscire dalla soluzione.',
    changeLanguage:'Passa all’inglese', elapsedTime:'Tempo trascorso', boardLabel:'Griglia Sudoku', controlsLabel:'Controlli di gioco', digitsLabel:'Cifre', digitLabel:'Cifra',
    row:'Riga', column:'Colonna', emptyCell:'vuota', fixedA11y:'fissa', editableA11y:'modificabile', candidates:'candidati',
    resetData:'Azzera dati locali', resetDataHelp:'Elimina salvataggio automatico, partite salvate e preferenze locali da questo browser.', resetConfirm:'Eliminare tutte le partite salvate, il salvataggio automatico e le impostazioni locali da questo browser?', resetDone:'Dati locali azzerati.', resetFailed:'Impossibile eliminare tutti i dati locali.',
    showSolution:'Mostra soluzione', showPuzzle:'Mostra Sudoku', resetGame:'Ricomincia partita', editPuzzle:'Modifica questo Sudoku',
    solutionShown:'Soluzione mostrata. Menu o Esc: torna al Sudoku.', puzzleShown:'Di nuovo il Sudoku',
    resetGameConfirm:'Cancellare tutte le cifre e le note inserite e far ripartire il tempo?', gameReset:'Partita ricominciata',
    solutionA11y:'soluzione', digitRightA11y:'la tua cifra è giusta', digitWrongA11y:'la tua cifra è sbagliata',
    workerTimeout:'L’operazione ha impiegato troppo tempo. Riprova.', workerCrash:'Il motore di gioco si è interrotto inaspettatamente. Riprova.', workerBusy:'Il motore di gioco è occupato.', workerCancelled:'Operazione annullata.', workerError:'Il motore di gioco non ha completato l’operazione.',
  }
};

let lang = storageGet('5ud0ku:ui-language') || preferredLanguage();
let selected = { row: 0, col: 0 };
let conflictCells = new Set();
let hintedCell = null;
let running = false;
let timerAnchor = performance.now();
let timerBase = 0;
let customMode = false;
let customSnapshot = null;
let showSolution = false;
let isBusy = false;

const store = new GridStore(new LocalStorageBackend('5ud0ku:save:'));
const session = new GameSession(null, {
  beginnerMode: storageGet('5ud0ku:beginner') === '1',
  displayConflicts: storageGet('5ud0ku:conflicts') !== '0',
});
const engine = createBrowserSudokuWorkerClient({ defaultTimeoutMs: 30000 });

function t(key) { return I18N[lang][key] ?? I18N.en[key] ?? key; }
function setStatus(text) { statusEl.textContent = text; }
function setBusy(busy, text=t('creating')) {
  isBusy=Boolean(busy);
  $('app').setAttribute('aria-busy', String(isBusy));
  $('app').inert=isBusy;
  loadingText.textContent = text;
  loadingOverlay.classList.toggle('hidden', !isBusy);
}
function closeDialog(id) { const d=$(id); if (d?.open) d.close(); }
function openDialog(id) { closeDialog('menuDialog'); const d=$(id); if (d && !d.open) d.showModal(); }
function formatTime(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return h > 0 ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}` : `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}
function currentElapsed() { return running ? timerBase + (performance.now() - timerAnchor) : timerBase; }
function syncElapsed() { if (session.grid && !customMode) session.grid.setElapsedTime(Math.floor(currentElapsed())); }
function resetTimerFromGrid() { timerBase = session.grid?.getElapsedTime() ?? 0; timerAnchor = performance.now(); running = Boolean(session.grid && !isFinished(session.grid) && !customMode); updateTimer(); }
function updateTimer() { timerEl.textContent = formatTime(currentElapsed()); }
setInterval(() => { updateTimer(); if (session.grid) syncElapsed(); }, 1000);

function difficultyName(level) {
  if (customMode || level === 'user' || level === 'empty') return t('custom');
  return t(level === 'easy' ? 'easy' : level === 'hard' ? 'hard' : 'normal');
}
function applyLanguage() {
  document.documentElement.lang = lang;
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  $('languageButton').textContent = lang === 'en' ? 'IT' : 'EN';
  for (const button of document.querySelectorAll('.digit-button')) button.setAttribute('aria-label', `${t('digitLabel')} ${button.dataset.digit}`);
  if (session.grid) { difficultyBadge.textContent = difficultyName(session.grid.getType()); render(); }
  renderSavedGames();
}
function workerMessage(error) {
  const code=error?.code;
  if(code==='WORKER_TIMEOUT')return t('workerTimeout');
  if(code==='WORKER_CRASH'||code==='POST_MESSAGE_FAILED'||code==='WORKER_TERMINATED')return t('workerCrash');
  if(code==='WORKER_BUSY')return t('workerBusy');
  if(code==='WORKER_CANCELLED')return t('workerCancelled');
  return t('workerError');
}

function createCells() {
  boardEl.replaceChildren();
  for (let r=0;r<9;r++) for (let c=0;c<9;c++) {
    const cell = document.createElement('button');
    cell.type='button'; cell.className='cell'; cell.dataset.row=r; cell.dataset.col=c; cell.setAttribute('role','gridcell'); cell.setAttribute('aria-rowindex',String(r+1)); cell.setAttribute('aria-colindex',String(c+1)); cell.tabIndex=-1;
    cell.addEventListener('click', () => selectCell(r,c));
    boardEl.appendChild(cell);
  }
}
function createDigits() {
  const pad=$('digits'); pad.replaceChildren();
  for (let d=1;d<=9;d++) {
    const b=document.createElement('button'); b.type='button'; b.className='digit-button'; b.textContent=String(d); b.dataset.digit=d;
    b.setAttribute('aria-label', String(d)); b.addEventListener('click',()=>inputDigit(d)); pad.appendChild(b);
  }
}
// As in the original (SudokuUI.checkSolution): a board is finished when it is full and valid, whatever solution
// the program holds. For a puzzle with one solution that is the stored answer; a puzzle you entered may have several.
function isFinished(grid){return grid.isCompletelyFilled()&&grid.isValidSolution();}
function cellKey(r,c){return `${r},${c}`;}
function isRelated(r,c,sr,sc){return r===sr||c===sc||(Math.floor(r/3)===Math.floor(sr/3)&&Math.floor(c/3)===Math.floor(sc/3));}
function updateModeUi() {
  toolGrid.classList.toggle('hidden', customMode);
  newGameButton.classList.toggle('hidden', customMode);
  customActions.classList.toggle('hidden', !customMode);
  $('saveMenuButton').disabled = customMode || !session.grid;
  $('savedGamesMenuButton').disabled = customMode;
  const solutionButton = $('solutionMenuButton');
  solutionButton.dataset.i18n = showSolution ? 'showPuzzle' : 'showSolution';
  solutionButton.textContent = t(solutionButton.dataset.i18n);
  solutionButton.disabled = customMode || !session.grid;
  $('resetGameMenuButton').disabled = customMode || !session.grid;
  $('editPuzzleMenuButton').disabled = customMode || !session.grid;
  // While the solution is shown the original accepts no input (SudokuUI.keyPressed and pointerPressed).
  for (const button of document.querySelectorAll('.digit-button')) button.disabled = showSolution;
  for (const id of ['pencilButton', 'eraseButton', 'hintButton', 'checkButton']) $(id).disabled = showSolution;
  difficultyBadge.textContent = session.grid ? difficultyName(session.grid.getType()) : t('normal');
}
// What the original draws while the solution is displayed: the answer everywhere, and the player's own digits marked right or wrong.
function renderSolutionCell(cell,slot,r,c){
  const view=solutionViewCell(slot), isFixed=slot.isOriginalDigit();
  if(isFixed) cell.classList.add('fixed');
  if(view.mark==='correct') cell.classList.add('solution-correct');
  if(view.mark==='wrong') cell.classList.add('solution-wrong');
  cell.tabIndex=-1;
  cell.setAttribute('aria-selected','false'); cell.setAttribute('aria-readonly','true'); cell.setAttribute('aria-invalid','false');
  const note=view.mark==='correct'?`, ${t('digitRightA11y')}`:view.mark==='wrong'?`, ${t('digitWrongA11y')}`:'';
  cell.setAttribute('aria-label',`${t('row')} ${r+1}, ${t('column')} ${c+1}, ${view.digit}, ${isFixed?t('fixedA11y'):t('solutionA11y')}${note}`);
  cell.replaceChildren();
  cell.textContent=String(view.digit);
}
function render() {
  if (!session.grid) return;
  const selSlot=session.grid.getSlot(selected.row,selected.col); const selDigit=selSlot.getShown();
  for (const cell of boardEl.children) {
    const r=Number(cell.dataset.row), c=Number(cell.dataset.col), slot=session.grid.getSlot(r,c), shown=slot.getShown();
    cell.className='cell';
    cell.disabled=showSolution;
    if(showSolution){ renderSolutionCell(cell,slot,r,c); continue; }
    if(slot.isOriginalDigit() && !customMode) cell.classList.add('fixed');
    if(isRelated(r,c,selected.row,selected.col)) cell.classList.add('related');
    if(r===selected.row&&c===selected.col) cell.classList.add('selected');
    if(selDigit>0&&shown===selDigit) cell.classList.add('same-digit');
    if(conflictCells.has(cellKey(r,c))) cell.classList.add('conflict');
    if(hintedCell===cellKey(r,c)) cell.classList.add('hinted');
    const isSelected=r===selected.row&&c===selected.col;
    const isFixed=slot.isOriginalDigit()&&!customMode;
    cell.setAttribute('aria-selected', String(isSelected));
    cell.setAttribute('aria-readonly', String(isFixed));
    cell.setAttribute('aria-invalid', String(conflictCells.has(cellKey(r,c))));
    cell.tabIndex=isSelected?0:-1;
    const marks=[]; if(!shown&&!customMode&&slot.getPencilMarks())for(let d=1;d<=9;d++)if(slot.isPencilMark(d-1))marks.push(d);
    const valueText=shown?String(shown):t('emptyCell');
    const candidateText=marks.length?`, ${t('candidates')} ${marks.join(' ')}`:'';
    cell.setAttribute('aria-label', `${t('row')} ${r+1}, ${t('column')} ${c+1}, ${valueText}, ${isFixed?t('fixedA11y'):t('editableA11y')}${candidateText}`);
    cell.replaceChildren();
    if(shown>0) cell.textContent=String(shown);
    else if(!customMode && slot.getPencilMarks()) {
      const pencils=document.createElement('span'); pencils.className='pencils';
      for(let d=1;d<=9;d++){const s=document.createElement('span');s.textContent=slot.isPencilMark(d-1)?String(d):'·';if(!slot.isPencilMark(d-1))s.className='pencil-empty';pencils.appendChild(s);}
      cell.appendChild(pencils);
    }
  }
  pencilButton.setAttribute('aria-pressed', String(session.pencilMode));
  beginnerToggle.checked=session.beginnerMode;
  conflictToggle.checked=session.displayConflicts;
  $('undoButton').disabled=customMode||showSolution||!session.moves.canUndo();
  $('redoButton').disabled=customMode||showSolution||!session.moves.canRedo();
  updateModeUi();
}
function selectCell(row,col){ if(showSolution)return; selected={row,col}; conflictCells.clear(); hintedCell=null; render(); boardEl.children[row*9+col]?.focus({preventScroll:true}); }
function selectedEditable(){
  if(!session.grid)return null;
  const s=session.grid.getSlot(selected.row,selected.col);
  if(!customMode && s.isOriginalDigit()){setStatus(t('fixedCell'));return null;}
  return s;
}
function updateImmediateConflicts(row,col) {
  conflictCells.clear();
  if (!session.displayConflicts || !session.grid) return;
  const digit=session.grid.getSlot(row,col).getShown();
  if (!digit) return;
  const list=session.grid.getConflictPositions(row,col,digit);
  if(list?.length){conflictCells.add(cellKey(row,col));for(const p of list) conflictCells.add(cellKey(p.row,p.col));}
}
function inputDigit(digit){
  const slot=selectedEditable(); if(!slot)return;
  conflictCells.clear(); hintedCell=null;
  if(customMode){slot.setShown(digit);slot.setAnswer(0);slot.setOriginalDigit(false);slot.setPencilMarks(0);updateImmediateConflicts(selected.row,selected.col);render();setStatus(t('enterCustom'));return;}
  session.inputDigit(selected.row,selected.col,digit); updateImmediateConflicts(selected.row,selected.col); afterMove();
}
function erase(){
  const slot=selectedEditable(); if(!slot)return; conflictCells.clear(); hintedCell=null;
  if(customMode){slot.setShown(0);slot.setAnswer(0);slot.setOriginalDigit(false);slot.setPencilMarks(0);render();setStatus(t('enterCustom'));return;}
  if(session.pencilMode)slot.setPencilMarks(0);else session.inputDigit(selected.row,selected.col,0); afterMove();
}
function afterMove(){
  if(customMode){render();return;}
  syncElapsed();render();
  if(isFinished(session.grid)){
    const elapsed=currentElapsed();timerBase=elapsed;running=false;session.grid.setElapsedTime(Math.floor(elapsed));store.autosaveGrid(session.grid);updateTimer();
    $('winTime').textContent=`${t('time')}: ${formatTime(elapsed)}`;$('winDialog').showModal();
  } else setStatus(conflictCells.size?t('conflicts'):t('ready'));
}
function doUndo(){if(customMode)return;const p=session.undo();if(p){selected={row:p.row,col:p.col};conflictCells.clear();hintedCell=null;render();}}
function doRedo(){if(customMode)return;const p=session.redo();if(p){selected={row:p.row,col:p.col};conflictCells.clear();hintedCell=null;render();}}
function doHint(){if(customMode||!selectedEditable())return;session.displayDigit(selected.row,selected.col);hintedCell=cellKey(selected.row,selected.col);afterMove();setTimeout(()=>{hintedCell=null;render();},750);}
function doCheck(){
  conflictCells.clear();
  for(let r=0;r<9;r++)for(let c=0;c<9;c++){
    const d=session.grid.getSlot(r,c).getShown(); if(!d)continue;
    const list=session.grid.getConflictPositions(r,c,d); if(list?.length){conflictCells.add(cellKey(r,c));for(const p of list)conflictCells.add(cellKey(p.row,p.col));}
  }
  render(); setStatus(conflictCells.size?t('conflicts'):t('noConflict'));
}
function random48(){const a=new Uint32Array(2);crypto.getRandomValues(a);return ((BigInt(a[0])<<32n)|BigInt(a[1]))&((1n<<48n)-1n);}
async function newGame(level='normal'){
  const previous={running,elapsed:currentElapsed(),customMode,customSnapshot};
  customMode=false; customSnapshot=null; showSolution=false; setBusy(true,t('creating')); running=false; conflictCells.clear(); hintedCell=null;
  try{
    const creatorSeed=random48(), digitSeed=random48();
    const result=await engine.generate(level,{creatorSeed,digitSeed,timeoutMs:level==='hard'?25000:12000});
    const grid=generatedResultToGrid(result); grid.setType(level); grid.setElapsedTime(0); session.setNewGrid(grid);
    selected={row:0,col:0}; timerBase=0; timerAnchor=performance.now(); running=true;
    store.autosaveGrid(grid); setStatus(t(level==='easy'?'newEasy':level==='hard'?'newHard':'newNormal')); render();
  }catch(error){
    console.error(error); customMode=previous.customMode; customSnapshot=previous.customSnapshot; timerBase=previous.elapsed; timerAnchor=performance.now(); running=previous.running; render(); setStatus(workerMessage(error));
  }
  finally{setBusy(false);}
}
function restoreOrCreate(){
  const saved=store.getAutoSaveGrid();
  if(saved){session.loadGrid(saved);selected={row:0,col:0};resetTimerFromGrid();setStatus(t('restored'));render();setBusy(false);return;}
  newGame('normal');
}
function autosave(){if(customMode||!session.grid)return;syncElapsed();store.autosaveGrid(session.grid);}

// fromCurrent: "edit current game" (SudokuMidlet.editCurrentGame) starts from the given numbers of the game on the board.
function startCustomPuzzle({fromCurrent=false}={}){
  closeDialog('newGameDialog');
  autosave();
  const base=fromCurrent&&session.grid?editableGrid(session.grid):emptyCustomGrid('user');
  showSolution=false;
  customSnapshot = session.grid ? { bytes:gridToBytes(session.grid), running, selected:{...selected} } : null;
  customMode=true; running=false; timerBase=0; timerAnchor=performance.now(); conflictCells.clear(); hintedCell=null;
  session.setNewGrid(base); session.setPencilMode(false); selected={row:0,col:0};
  setStatus(t('enterCustom')); render();
}
function cancelCustomPuzzle(){
  if(customSnapshot){session.loadGrid(gridFromBytes(customSnapshot.bytes));selected={...customSnapshot.selected};customMode=false;timerBase=session.grid.getElapsedTime();timerAnchor=performance.now();running=customSnapshot.running&&!isFinished(session.grid);}
  else {customMode=false; const saved=store.getAutoSaveGrid(); if(saved){session.loadGrid(saved);selected={row:0,col:0};resetTimerFromGrid();}}
  customSnapshot=null; conflictCells.clear();setStatus(t('customCancelled'));render();
}
async function solveCustom(play){
  if(!customMode||!session.grid)return;
  const puzzle=session.grid.shownString();
  setBusy(true,t('checking'));
  try{
    const result=await engine.solvePuzzle(puzzle,{name:'custom',findFirst:false,timeoutMs:30000});
    if(!result.rules){setStatus(t('invalidPuzzle'));doCheck();return;}
    if(result.solutions===0){setStatus(t('noSolution'));return;}
    const grid=customSolutionToGrid(puzzle,result.solution1,{play,type:'user'});
    session.setNewGrid(grid); customMode=false; customSnapshot=null; selected={row:0,col:0}; conflictCells.clear(); hintedCell=null;
    timerBase=0;timerAnchor=performance.now();running=play;store.autosaveGrid(grid);
    if(play)setStatus(t(result.solutions>1?'multiplePlay':'uniquePlay'));else setStatus(t(result.solutions>1?'multipleSolutions':'uniqueSolution'));
    render();
  }catch(error){console.error(error);setStatus(workerMessage(error));}
  finally{setBusy(false);}
}

function manualSaveNames(){return store.getStoredGridFilenames().filter(name=>name!==AUTO_SAVE_FILENAME).sort((a,b)=>a.localeCompare(b));}
function renderSavedGames(){
  const host=$('savedGamesList'); if(!host)return; host.replaceChildren();
  const names=manualSaveNames();
  if(!names.length){const p=document.createElement('p');p.className='empty-list';p.textContent=t('noSavedGames');host.appendChild(p);return;}
  for(const name of names){
    const row=document.createElement('div');row.className='save-row';
    const label=document.createElement('span');label.className='save-name';label.textContent=name;row.appendChild(label);
    const load=document.createElement('button');load.type='button';load.className='small-button';load.textContent=t('load');load.addEventListener('click',()=>loadSavedGame(name));row.appendChild(load);
    const del=document.createElement('button');del.type='button';del.className='small-button danger-button';del.textContent=t('deleteGame');del.addEventListener('click',()=>deleteSavedGame(name));row.appendChild(del);
    host.appendChild(row);
  }
}
function openSaveDialog(){
  if(customMode||!session.grid)return;
  syncElapsed(); const input=$('saveName'); if(!input.value)input.value=t('fileNameDefault'); openDialog('saveDialog'); setTimeout(()=>{input.focus();input.select();},0);
}
function saveNamedGame(){
  if(customMode||!session.grid)return;
  const name=$('saveName').value.trim().slice(0,32); if(!name){setStatus(t('emptyName'));return;}
  syncElapsed();
  if(store.saveGrid(session.grid,name)){setStatus(t('saved'));closeDialog('saveDialog');renderSavedGames();}
  else setStatus(t('saveFailed'));
}
function loadSavedGame(name){
  const grid=store.loadGrid(name); if(!grid){setStatus(t('loadFailed'));return;}
  customMode=false;customSnapshot=null;showSolution=false;session.loadGrid(grid);selected={row:0,col:0};conflictCells.clear();hintedCell=null;resetTimerFromGrid();setStatus(t('loaded'));closeDialog('savedGamesDialog');render();
}
function deleteSavedGame(name){
  if(!window.confirm(t('deleteConfirm')))return;
  if(store.deleteGrid(name)){setStatus(t('deleted'));renderSavedGames();}
}
async function resetLocalData(){
  if(!window.confirm(t('resetConfirm')))return;
  const savesCleared=store.clearAll();
  const prefsCleared=['5ud0ku:ui-language','5ud0ku:beginner','5ud0ku:conflicts'].map(storageRemove).every(Boolean);
  if(!savesCleared||!prefsCleared){setStatus(t('resetFailed'));return;}
  lang=preferredLanguage(); session.setBeginnerMode(false); session.displayConflicts=true; conflictCells.clear(); hintedCell=null; customMode=false; customSnapshot=null;
  closeDialog('settingsDialog'); applyLanguage(); renderSavedGames();
  await newGame('normal'); setStatus(t('resetDone'));
}

function setSolutionView(on){
  if(!session.grid||customMode)return;
  showSolution=Boolean(on); conflictCells.clear(); hintedCell=null;
  render(); setStatus(t(showSolution?'solutionShown':'puzzleShown'));
  if(!showSolution) boardEl.children[selected.row*9+selected.col]?.focus({preventScroll:true});
}
// "Reset Game": SudokuStateControl.resetGrid, then the timer starts again from zero (commandAction). The original asks nothing; a confirmation is added here.
function resetGame(){
  if(!session.grid||customMode||!window.confirm(t('resetGameConfirm')))return;
  showSolution=false; session.reset(); conflictCells.clear(); hintedCell=null; selected={row:0,col:0};
  timerBase=0; timerAnchor=performance.now(); running=true; if(session.beginnerMode)session.grid.setupPossibleDigits();
  store.autosaveGrid(session.grid);
  updateTimer(); render(); setStatus(t('gameReset'));
}
$('solutionMenuButton').addEventListener('click',()=>{closeDialog('menuDialog');setSolutionView(!showSolution);});
$('resetGameMenuButton').addEventListener('click',()=>{closeDialog('menuDialog');resetGame();});
$('editPuzzleMenuButton').addEventListener('click',()=>{closeDialog('menuDialog');if(session.grid&&!customMode)startCustomPuzzle({fromCurrent:true});});
pencilButton.addEventListener('click',()=>{if(customMode)return;session.togglePencilMode();render();setStatus(t(session.pencilMode?'pencilOn':'pencilOff'));});
$('eraseButton').addEventListener('click',erase);
$('undoButton').addEventListener('click',doUndo);
$('redoButton').addEventListener('click',doRedo);
$('hintButton').addEventListener('click',doHint);
$('checkButton').addEventListener('click',doCheck);
newGameButton.addEventListener('click',()=>$('newGameDialog').showModal());
$('menuButton').addEventListener('click',()=>{renderSavedGames();$('menuDialog').showModal();});
$('languageButton').addEventListener('click',()=>{lang=lang==='en'?'it':'en';storageSet('5ud0ku:ui-language',lang);applyLanguage();setStatus(t('ready'));});
$('saveMenuButton').addEventListener('click',openSaveDialog);
$('savedGamesMenuButton').addEventListener('click',()=>{renderSavedGames();openDialog('savedGamesDialog');});
$('settingsMenuButton').addEventListener('click',()=>openDialog('settingsDialog'));
$('helpMenuButton').addEventListener('click',()=>openDialog('helpDialog'));
$('creditsMenuButton').addEventListener('click',()=>openDialog('creditsDialog'));
$('resetDataButton').addEventListener('click',resetLocalData);
$('saveConfirmButton').addEventListener('click',saveNamedGame);
$('customSolveButton').addEventListener('click',()=>solveCustom(false));
$('customPlayButton').addEventListener('click',()=>solveCustom(true));
$('customCancelButton').addEventListener('click',cancelCustomPuzzle);
beginnerToggle.addEventListener('change',()=>{session.setBeginnerMode(beginnerToggle.checked);storageSet('5ud0ku:beginner',beginnerToggle.checked?'1':'0');render();});
conflictToggle.addEventListener('change',()=>{session.displayConflicts=conflictToggle.checked;storageSet('5ud0ku:conflicts',conflictToggle.checked?'1':'0');if(!conflictToggle.checked)conflictCells.clear();render();});
$('newGameDialog').addEventListener('click',(e)=>{const b=e.target.closest('[data-level]');if(b){e.preventDefault();$('newGameDialog').close();newGame(b.dataset.level);return;}const custom=e.target.closest('[data-custom]');if(custom){e.preventDefault();startCustomPuzzle();}});
$('saveName').addEventListener('keydown',(e)=>{if(e.key==='Enter'){e.preventDefault();saveNamedGame();}});

window.addEventListener('keydown',(e)=>{
  if(isBusy||document.querySelector('dialog[open]'))return;
  if(showSolution){if(e.key==='Escape'){e.preventDefault();setSolutionView(false);}return;}
  if(e.key>='1'&&e.key<='9'){e.preventDefault();inputDigit(Number(e.key));return;}
  if(e.key==='Backspace'||e.key==='Delete'||e.key==='0'){e.preventDefault();erase();return;}
  if(!customMode&&e.key.toLowerCase()==='p'){e.preventDefault();session.togglePencilMode();render();return;}
  if(!customMode&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?doRedo():doUndo();return;}
  if(!customMode&&(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();doRedo();return;}
  if(customMode&&e.key==='Escape'){e.preventDefault();cancelCustomPuzzle();return;}
  const delta={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]}[e.key];
  if(delta){e.preventDefault();selectCell((selected.row+delta[0]+9)%9,(selected.col+delta[1]+9)%9);}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)autosave();});
window.addEventListener('pagehide',autosave);

createCells();createDigits();applyLanguage();renderSavedGames();
window.__5ud0kuApp={
  session,store,engine,newGame,render,startCustomPuzzle,solveCustom,cancelCustomPuzzle,loadSavedGame,resetLocalData,
  getState:()=>({selected:{...selected},pencilMode:session.pencilMode,beginnerMode:session.beginnerMode,customMode,puzzle:session.grid?.shownString()??'',answer:session.grid?.answerString()??'',elapsed:currentElapsed()})
};
restoreOrCreate();
