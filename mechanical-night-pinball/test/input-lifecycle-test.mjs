import assert from 'node:assert/strict';
import { InputController } from '../public/src/input.js';

class FakeDocument extends EventTarget { constructor(){ super(); this.visibilityState='visible'; } }
const win = new EventTarget();
const doc = new FakeDocument();
const input = new InputController();
input.attachLifecycle(win, doc);
input.set('left', true);
input.set('launch', true);
// Pending fixed-tick transitions must also be cleared on focus loss.
assert.equal(input.physicsEdges.left.length,1);
win.dispatchEvent(new Event('blur'));
assert.equal(input.down.left,false);
assert.equal(input.down.launch,false);
assert.equal(input.beginPhysicsTick().down.left,false);
assert.equal(input.physicsEdges.left.length,0);
assert.equal(input.consumeReleased('left'),true);
input.set('right',true);
doc.visibilityState='hidden';
doc.dispatchEvent(new Event('visibilitychange'));
assert.equal(input.down.right,false);
assert.equal(input.consumeReleased('right'),true);
input.destroy();
console.log('Input lifecycle reset: PASS');
