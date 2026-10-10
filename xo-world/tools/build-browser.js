'use strict';
// Wraps the two CommonJS sources (src/xoworld-engine.js, src/game-model.js)
// into one browser script, public/xoworld-bundle.js. The sources themselves are
// not touched: test/bundle.test.js checks that the committed bundle is exactly
// what this tool produces from them.
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');

function buildBundle(){
  const engine=fs.readFileSync(path.join(root,'src','xoworld-engine.js'),'utf8');
  const model=fs.readFileSync(path.join(root,'src','game-model.js'),'utf8');
  return `/* Generated from the unchanged M3 headless sources. Do not edit directly. */\n(function(global){\n'use strict';\nconst engineModule=(function(){\n  const module={exports:{}}; const exports=module.exports;\n${engine}\n  return module.exports;\n})();\nconst modelModule=(function(){\n  const module={exports:{}}; const exports=module.exports;\n  function require(name){ if(name==='./xoworld-engine') return engineModule; throw new Error('Unknown module '+name); }\n${model}\n  return module.exports;\n})();\nglobal.XOWorldEngine=engineModule.XOWorldEngine;\nglobal.XOWorldGame=modelModule.XOWorldGame;\n})(window);\n`;
}

module.exports={buildBundle};

if(require.main===module){
  fs.writeFileSync(path.join(root,'public','xoworld-bundle.js'),buildBundle());
  console.log('Built public/xoworld-bundle.js from the headless sources');
}
