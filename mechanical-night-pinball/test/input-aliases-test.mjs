import assert from 'node:assert/strict';
import { InputController } from '../public/src/input.js';

function keyEvent(type, code) {
  const event = new Event(type, { cancelable:true });
  Object.defineProperty(event, 'code', { value:code });
  return event;
}
function down(target, code) { target.dispatchEvent(keyEvent('keydown', code)); }
function up(target, code) { target.dispatchEvent(keyEvent('keyup', code)); }

const target = new EventTarget();
const input = new InputController();
input.attachKeyboard(target);

// Every left alias must produce the same logical action.
for (const code of ['ArrowLeft','KeyZ','KeyA']) {
  down(target, code);
  assert.equal(input.down.left, true, `${code} must hold left flipper`);
  up(target, code);
  assert.equal(input.down.left, false, `${code} must release left flipper`);
  input.releaseAll();
}
// Every right alias must produce the same logical action.
for (const code of ['ArrowRight','KeyM','KeyL']) {
  down(target, code);
  assert.equal(input.down.right, true, `${code} must hold right flipper`);
  up(target, code);
  assert.equal(input.down.right, false, `${code} must release right flipper`);
  input.releaseAll();
}

// Overlapping aliases must aggregate: releasing one source must not release the action.
down(target, 'KeyA');
down(target, 'ArrowLeft');
assert.equal(input.down.left, true);
assert.deepEqual(input.physicsEdges.left, [true], 'second left alias must not queue a duplicate KEY_DOWN');
up(target, 'KeyA');
assert.equal(input.down.left, true, 'left stays held while ArrowLeft remains down');
assert.deepEqual(input.physicsEdges.left, [true], 'partial alias release must not queue KEY_UP');
up(target, 'ArrowLeft');
assert.equal(input.down.left, false);
assert.deepEqual(input.physicsEdges.left, [true,false], 'final alias release queues one KEY_UP');
input.releaseAll();

down(target, 'KeyM');
down(target, 'KeyL');
assert.equal(input.down.right, true);
up(target, 'KeyM');
assert.equal(input.down.right, true, 'right stays held while KeyL remains down');
up(target, 'KeyL');
assert.equal(input.down.right, false);

input.destroy();
console.log('Multi-alias flipper keyboard mappings: PASS');
