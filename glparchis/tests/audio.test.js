import test from 'node:test';
import assert from 'node:assert/strict';
import { eventSoundKind } from '../public/src/ui/audio.js';

test('game events map to clean-room sound cues without media assets', () => {
  assert.equal(eventSoundKind({type:'roll'}), 'roll');
  assert.equal(eventSoundKind({type:'move'}), 'move');
  assert.equal(eventSoundKind({type:'capture'}), 'capture');
  assert.equal(eventSoundKind({type:'goal'}), 'goal');
  assert.equal(eventSoundKind({type:'three-sixes-home'}), 'penalty');
  assert.equal(eventSoundKind({type:'win'}), 'win');
  assert.equal(eventSoundKind({type:'turn'}), null);
});
