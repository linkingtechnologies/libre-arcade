import {Grid,GameSession,GridStore,MemoryStorageBackend,AppLifecycle} from '../public/src/core/index.js';
let p=0,f=0;const ok=(n,v)=>{console.log(`${v?'PASS':'FAIL'} | ${n}`);v?p++:f++;};
function g(type='easy',shown=0){const x=new Grid(type);for(let r=0;r<9;r++)for(let c=0;c<9;c++){const s=x.getSlot(r,c);s.setAnswer(((r*3+Math.trunc(r/3)+c)%9)+1);s.setShown(shown? s.getAnswer():0);s.setOriginalDigit(Boolean(shown));}return x;}
const backend=new MemoryStorageBackend(),store=new GridStore(backend),session=new GameSession(),life=new AppLifecycle(session,store,()=>g('new'));
let result=life.startup();ok('startup creates new game when AUTO_SAVE absent',!result.restored&&session.grid.getType()==='new');
session.grid.setType('saved');session.grid.setElapsedTime(77);ok('pause autosaves current game',life.pause());session.setNewGrid(g('other'));result=life.startup();ok('startup restores AUTO_SAVE before creating new game',result.restored&&session.grid.getType()==='saved'&&session.grid.getElapsedTime()===77);
life.setUserCreatingPuzzle(true);const before=backend.get('AUTO_SAVE');session.grid.setType('edit-mutated');ok('edit/custom-entry mode is excluded from autosave',life.pause()===false&&Buffer.from(before).equals(Buffer.from(backend.get('AUTO_SAVE'))));life.setUserCreatingPuzzle(false);ok('destroy autosaves current game',life.destroy()&&store.getAutoSaveGrid().getType()==='edit-mutated');
session.grid.setType('quick');ok('quick-save writes AUTO_SAVE',life.quickSave()&&store.getAutoSaveGrid().getType()==='quick');
session.setPencilMode(true);session.inputDigit(0,0,2);store.saveGrid(g('slot'), 'slot');life.load('slot');ok('loading a game resets move history',session.moves.getNextUndoPosition()===null);ok('loading/new grid resets pencil mode',session.pencilMode===false);
console.log(`SUMMARY | pass=${p} fail=${f}`);if(f)process.exit(1);
