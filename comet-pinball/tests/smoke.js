const fs=require('fs'),vm=require('vm');
const code=fs.readFileSync(__dirname+'/../public/data/playfield.js','utf8');
const sandbox={window:{}};vm.createContext(sandbox);vm.runInContext(code,sandbox);
const p=sandbox.window.COMET_PLAYFIELD;
if(p.bumpers.length!==3)throw new Error('expected 3 bumpers');
if(p.slingshots.length!==4)throw new Error('expected 4 slingshots');
if(p.obstacles.length!==3)throw new Error('expected 3 obstacles');
if(p.scores[1]!==20||p.scores[4]!==5||p.scores[9])throw new Error('score map mismatch');
console.log('playfield smoke tests passed');
