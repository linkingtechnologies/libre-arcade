export class AppLifecycle {
  constructor(session, store, createNewGame) {
    this.session=session; this.store=store; this.createNewGame=createNewGame; this.userCreatingPuzzle=false;
  }
  startup(){const saved=this.store.getAutoSaveGrid(); if(saved){this.session.loadGrid(saved);return {restored:true,grid:saved};} const g=this.createNewGame();this.session.setNewGrid(g);return {restored:false,grid:g};}
  setUserCreatingPuzzle(v){this.userCreatingPuzzle=Boolean(v);}
  autosave(){if(this.userCreatingPuzzle||!this.session.grid)return false;return this.store.autosaveGrid(this.session.grid);}
  pause(){return this.autosave();}
  destroy(){return this.autosave();}
  quickSave(){if(!this.session.grid)return false;return this.store.autosaveGrid(this.session.grid);}
  load(filename){const g=this.store.loadGrid(filename);if(!g)return null;this.session.loadGrid(g);return g;}
}
