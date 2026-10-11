import { Position } from './position.js';

export class MoveStack {
  static MAX_NUMBER_OF_STORED_MOVES = 100;
  constructor() { this.moves = new Array(100); this.currentPos=0; this.startPos=0; this.endPos=0; }
  addMove(row,col,oldValue,newValue,pencilMode){
    this.moves[this.currentPos]={row,col,oldValue,newValue,pencilMode:Boolean(pencilMode)};
    this.currentPos=(this.currentPos+1)%this.moves.length;
    this.endPos=this.currentPos;
    if(this.endPos===this.startPos) this.startPos=(this.endPos+1)%this.moves.length;
  }
  canUndo(){return this.currentPos!==this.startPos;}
  canRedo(){return this.currentPos!==this.endPos;}
  getNextUndoPosition(){
    if(this.currentPos===this.startPos) return null;
    let p=this.currentPos-1; if(p<0)p=this.moves.length-1;
    const m=this.moves[p]; return new Position(m.row,m.col);
  }
  stepBack(grid){
    if(this.currentPos===this.startPos) return null;
    this.currentPos--; if(this.currentPos<0)this.currentPos=this.moves.length-1;
    const pos=this.getNextUndoPosition(); // preserves original 1.8 return-value quirk
    const m=this.moves[this.currentPos], s=grid.getSlot(m.row,m.col);
    if(m.pencilMode) s.setPencilMark(m.oldValue-1,!s.isPencilMark(m.oldValue-1));
    else s.setShown(m.oldValue);
    return pos;
  }
  stepForward(grid){
    if(this.currentPos===this.endPos) return null;
    const m=this.moves[this.currentPos], s=grid.getSlot(m.row,m.col);
    if(m.pencilMode) s.setPencilMark(m.newValue-1,!s.isPencilMark(m.newValue-1));
    else s.setShown(m.newValue);
    this.currentPos=(this.currentPos+1)%this.moves.length;
    return this.getNextUndoPosition();
  }
  resetStack(){this.currentPos=0;this.startPos=0;this.endPos=0;}
}
