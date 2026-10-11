import { MoveStack } from './move-stack.js';
export class GameSession {
  constructor(grid=null,{beginnerMode=false,pencilMode=false,displayConflicts=true}={}){this.grid=grid;this.moves=new MoveStack();this.beginnerMode=beginnerMode;this.pencilMode=pencilMode;this.displayConflicts=displayConflicts;}
  setNewGrid(grid){this.grid=grid;this.moves.resetStack();this.pencilMode=false;}
  loadGrid(grid){this.setNewGrid(grid);}
  setBeginnerMode(v){this.beginnerMode=Boolean(v);if(this.beginnerMode&&this.grid)this.grid.setupPossibleDigits();}
  setPencilMode(v){this.pencilMode=Boolean(v);} togglePencilMode(){this.pencilMode=!this.pencilMode;return this.pencilMode;}
  inputDigit(row,col,digit){const s=this.grid.getSlot(row,col);if(s.isOriginalDigit())return false;
    // As in SudokuUI.numberPressed: a cell that already shows a digit switches pencil mode off, and in pen mode
    // entering the digit that is already there clears the cell.
    if(this.pencilMode&&s.getShown()!==0)this.pencilMode=false;
    if(!this.pencilMode&&s.getShown()===digit)digit=0;
    this.moves.addMove(row,col,this.pencilMode?digit:s.getShown(),digit,this.pencilMode);
    if(this.pencilMode)s.setPencilMark(digit-1,!s.isPencilMark(digit-1)); else s.setShown(digit);
    if(this.beginnerMode&&!this.pencilMode)this.grid.setupPossibleDigits(); return true;
  }
  displayDigit(row,col){const s=this.grid.getSlot(row,col);this.moves.addMove(row,col,s.getShown(),s.getAnswer(),false);this.grid.promote(row,col);if(this.beginnerMode)this.grid.setupPossibleDigits();return s.getAnswer();}
  undo(){const next=this.moves.getNextUndoPosition();const pos=this.moves.stepBack(this.grid);if(this.beginnerMode)this.grid.setupPossibleDigits();return pos??next;}
  redo(){const next=this.moves.getNextUndoPosition();const pos=this.moves.stepForward(this.grid);if(this.beginnerMode)this.grid.setupPossibleDigits();return pos??next;}
  reset(){this.grid.clearDigits();this.grid.clearPencilMarks();this.grid.setElapsedTime(0);this.moves.resetStack();}
  recalculatePencilMarks(){return this.grid.setupPossibleDigits();} clearPencilMarks(){this.grid.clearPencilMarks();}
  conflicts(row,col,digit){return this.displayConflicts?this.grid.getConflictPositions(row,col,digit):null;}
}
