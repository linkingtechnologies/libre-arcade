import { Grid, MoveStack, GridStore, MemoryStorageBackend, BruteForceSolver, gridToBytes, GameSession } from '../public/src/core/index.js';
let pass=0,fail=0; const ok=(n,v)=>{console.log(`${v?'PASS':'FAIL'} | ${n}`);v?pass++:fail++;};
const SOL='534678912672195348198342567859761423426853791713924856961537284287419635345286179';
const PUZ='530070000600195000098000060800060003400803001700020006060000280000419005000080079';
function grid(puzzle=PUZ,solution=SOL,type='easy'){const g=new Grid(type);for(let i=0;i<81;i++){const s=g.getSlot(Math.trunc(i/9),i%9),a=+solution[i],sh=+puzzle[i];s.setAnswer(a);s.setShown(sh);s.setOriginalDigit(sh!==0);}return g;}
const pmCount=s=>{let n=0;for(let i=0;i<9;i++)if(s.isPencilMark(i))n++;return n;};
{
 const g=grid();const complexity=g.setupPossibleDigits(),s=g.getSlot(0,2);ok('auto pencil candidates at r1c3 include 1,2,4',s.isPencilMark(0)&&s.isPencilMark(1)&&s.isPencilMark(3)&&pmCount(s)===3);const before=s.getPencilMarks();s.setPencilMark(8,true);ok('manual pencil mark can be added',s.isPencilMark(8));s.setPencilMark(8,false);ok('manual pencil mark can be removed',!s.isPencilMark(8)&&s.getPencilMarks()===before);ok('setupPossibleDigits returns positive complexity',complexity>0);
}
{
 const g=grid(),m=new MoveStack(),s=g.getSlot(0,2);m.addMove(0,2,s.getShown(),s.getAnswer(),false);g.promote(0,2);ok('Display Digit promotes answer',s.getShown()===4);m.stepBack(g);ok('hint is undoable',s.getShown()===0);m.stepForward(g);ok('hint is redoable',s.getShown()===4);
}
{
 const g=grid(),m=new MoveStack(),s=g.getSlot(0,2);m.addMove(0,2,0,4,false);s.setShown(4);m.stepBack(g);ok('pen undo restores previous value',s.getShown()===0);ok('pen redo restores new value',m.stepForward(g)!==null&&s.getShown()===4);s.setShown(0);m.resetStack();m.addMove(0,2,2,2,true);s.setPencilMark(1,true);m.stepBack(g);ok('pencil undo toggles mark off',!s.isPencilMark(1));m.stepForward(g);ok('pencil redo toggles mark on',s.isPencilMark(1));m.resetStack();s.setShown(0);m.addMove(0,2,0,4,false);s.setShown(4);m.stepBack(g);m.addMove(0,2,0,2,false);s.setShown(2);ok('new move after undo invalidates redo',m.stepForward(g)===null&&s.getShown()===2);
}
{
 const g=grid();const v=g.getConflictPositions(0,2,5);ok('local conflict checker finds row duplicate',v&&v.length>=1);ok('clearing a cell reports no conflicts',g.getConflictPositions(0,2,0)===null);
}
{
 const backend=new MemoryStorageBackend(),store=new GridStore(backend),g=grid(PUZ,SOL,'normal');g.setElapsedTime(1234567);g.setupPossibleDigits();g.getSlot(0,2).setPencilMark(8,true);const orig=gridToBytes(g);ok('manual save succeeds',store.saveGrid(g,'slot-A'));const l=store.loadGrid('slot-A');ok('manual load returns grid',l!==null);ok('save/load roundtrip byte-identical',Buffer.from(orig).equals(Buffer.from(gridToBytes(l))));ok('elapsed time persists',l.getElapsedTime()===1234567);ok('game type persists',l.getType()==='normal');ok('pencil marks persist',l.getSlot(0,2).isPencilMark(8));ok('autosave succeeds',store.autosaveGrid(g));const a=store.getAutoSaveGrid();ok('autosave load byte-identical',Buffer.from(orig).equals(Buffer.from(gridToBytes(a))));ok('missing load returns null',store.loadGrid('missing-empty')===null);ok('reserved SETTINGS filename rejected',!store.saveGrid(g,'SETTINGS'));ok('reserved PREF_LANG filename rejected',!store.saveGrid(g,'PREF_LANG'));
}
{
 const unique=grid(PUZ,SOL,'user');ok('custom unique puzzle passes basic rules',unique.checkForRules());ok('custom unique puzzle -> one solution',new BruteForceSolver(null,false).searchSolutions(unique).length===1);const empty='0'.repeat(81),mg=grid(empty,SOL,'user');ok('empty custom puzzle passes basic rule precheck',mg.checkForRules());ok('multi-solution custom puzzle stops at two',new BruteForceSolver(null,false).searchSolutions(mg).length===2);const impossible='130070000600195000098000060800060003400803001700020006060000280000419005000080079',ig=grid(impossible,SOL,'user');ok('impossible custom puzzle passes basic rule precheck',ig.checkForRules());ok('impossible custom puzzle -> zero solutions',new BruteForceSolver(null,false).searchSolutions(ig).length===0);const bad='550000000'+'0'.repeat(72),cg=grid(bad,SOL,'user');ok('contradictory custom puzzle fails basic rule precheck',!cg.checkForRules());
}
{
 const g=grid();g.setupPossibleDigits();const peer=g.getSlot(0,5);ok('beginner candidates initially allow 4 in row peer',peer.isPencilMark(3));g.getSlot(0,2).setShown(4);g.setupPossibleDigits();ok('beginner recalculation removes newly used digit from peer',!peer.isPencilMark(3));
}
{
 const g=grid(),m=new MoveStack(),s=g.getSlot(0,2);for(let i=0;i<100;i++){const old=s.getShown(),nv=(i%9)+1;m.addMove(0,2,old,nv,false);s.setShown(nv);}let n=0;while(m.getNextUndoPosition()!=null){m.stepBack(g);if(++n>120)break;}ok('100-entry ring exposes 99 undoable moves (historical sentinel behavior)',n===99);
}
{
 const g=grid();g.setupPossibleDigits();const b=gridToBytes(g);ok('serialized grid stays compact (<400 bytes)',b.length<400);console.log(`INFO | serialized_bytes=${b.length}`);
}
// Session-level checks introduced by M7.
{
 const g=grid(),session=new GameSession(g,{beginnerMode:true});session.displayDigit(0,2);ok('session Display Digit promotes answer',g.getSlot(0,2).getShown()===4);session.undo();ok('session hint undo works',g.getSlot(0,2).getShown()===0);session.redo();ok('session hint redo works',g.getSlot(0,2).getShown()===4);session.setBeginnerMode(false);session.setPencilMode(true);g.getSlot(0,3).setShown(0);g.getSlot(0,3).setPencilMark(8,false);session.inputDigit(0,3,9);ok('session pencil input toggles mark',g.getSlot(0,3).isPencilMark(8));session.setNewGrid(grid());ok('new grid resets pencil mode and move history',session.pencilMode===false&&session.moves.getNextUndoPosition()===null);
}
console.log(`SUMMARY | pass=${pass} fail=${fail}`);if(fail)process.exit(1);
