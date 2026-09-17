import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const main=await readFile(new URL('../public/src/main.js',import.meta.url),'utf8');
const dbg=await readFile(new URL('../public/src/state-debug.js',import.meta.url),'utf8');
const physics=await readFile(new URL('../public/src/physics/docdonkeys-parity.js',import.meta.url),'utf8');

assert.match(html,/id="stateDebugger"[^>]*hidden/,'debug panel must be hidden by default');
for(const action of ['top0','top3','topLeft0','topLeft3','thirdRamp','middle0','middle1','rampFinishLeft','rampFinishRight','peg0','peg1','peg2','down0','down1','tunnelLeft','tunnelRight','drain','tapLeft','tapRight','launcherDown','launcherUp'])
  assert.match(html,new RegExp(`data-debug-action="${action}"`),`missing debug action ${action}`);
assert.match(main,/params\.get\('debug'\)==='states'/,'debug mode must require ?debug=states');
assert.match(main,/root\.hidden=false/,'debug query must reveal panel');
assert.match(main,/physics\.debugInject\(action,hooks\)/,'UI must inject through physics diagnostic API');
assert.match(physics,/debugInject\(action,hooks=\{\}\)/,'physics diagnostic API missing');
assert.match(dbg,/RAMP KEY/);assert.match(dbg,/RAMP EVENT/);assert.match(dbg,/TUNNEL/);assert.match(dbg,/FLIPPERS/);
console.log('State diagnostic UI: PASS');
