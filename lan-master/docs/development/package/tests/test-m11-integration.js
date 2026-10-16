const fs=require('fs'),path=require('path'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'..');
function ok(v,m){if(!v)throw new Error(m)}
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const app=fs.readFileSync(path.join(ROOT,'src/app.js'),'utf8');
const tr=fs.readFileSync(path.join(ROOT,'src/transitions.js'),'utf8');
ok(html.includes('src/transitions.js'),'index includes transitions.js');
ok(html.indexOf('nes-gfx.js')<html.indexOf('transitions.js')&&html.indexOf('transitions.js')<html.indexOf('audio-data.js'),'transition script order');
for(const token of ['menuFadeIn','menuStartFlash','menuFadeOut','gameFadeIn','reveal','restart','clearAnim','clearTableIn','clearTableOut','hide','timeoutTableIn','gameFadeOut','endingFadeIn'])ok(app.includes(token),`state ${token}`);
ok(app.includes('TR.showLevelBatches'),'showLevel state machine used');
ok(app.includes('TR.restartFrames'),'restart state machine used');
ok(app.includes('TR.tickEnding'),'wellDone state machine used');
ok(app.includes('state.clearAnimTick>=50'),'50-frame level-clear glow');
ok(app.includes('state.tableRowIndex<8'),'8-row table transitions');
ok(tr.includes('WELL_DONE_BG'),'wellDone scrolling bitmap');
ok(tr.includes('WELL_DONE_TEXT'),'wellDone typewriter data');
ok(tr.includes('PAL_BRIGHT'),'original palette brightness table');
console.log('M11 integration regression: PASS');
