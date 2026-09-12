import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AudioSystem, HISTORICAL_SOUND_FILES } from '../public/src/audio/audio.js';
import { Game } from '../public/src/core/game.js';
import { LevelSet } from '../public/src/core/level.js';
import { Shot } from '../public/src/core/shot.js';
import { SHOT_TYPE } from '../public/src/core/constants.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const loadedBy0978 = ['tiro.wav','mata.wav','pierde.wav','tecla1.wav','tecla2.wav','tic.wav','gancho.wav','toc.wav','romper.wav','alarma.wav','item.wav','boom.wav'];
const levels = new LevelSet(fs.readFileSync(path.join(root,'public/assets/levels/base.map')));
const none = Object.freeze({left:false,right:false,up:false,down:false,shot:false,sweep:false});
function toPlaying(game) { while (game.state === 'level-intro') game.update(none); game.drainEvents(); }

test('active historical WAV set matches the 12 files loaded by audio.cc', () => {
  assert.deepEqual([...HISTORICAL_SOUND_FILES].sort(), [...loadedBy0978].sort());
  for (const file of loadedBy0978) {
    const active = fs.readFileSync(path.join(root,'public/assets/audio',file));
    const original = fs.readFileSync(path.join(root,'reference/ceferino-0.97.8/data/sounds',file));
    assert.deepEqual(active, original, file);
  }
  assert.equal(fs.existsSync(path.join(root,'public/assets/audio/explo.wav')), false, 'unused explo.wav stays out of runtime assets');
});

test('active sound-directory license notice is byte-identical to the historical notice', () => {
  assert.deepEqual(
    fs.readFileSync(path.join(root,'public/assets/audio/LICENSE-KIND.FILES')),
    fs.readFileSync(path.join(root,'reference/ceferino-0.97.8/data/sounds/LICENSE-KIND.FILES'))
  );
});

test('historical XM music remains outside runtime assets', () => {
  assert.equal(fs.existsSync(path.join(root,'public/assets/music/menu.xm')), false);
  assert.equal(fs.existsSync(path.join(root,'quarantine/music/menu.xm')), true);
});

test('browser sound player reproduces SDL_mixer single-channel interruption', async () => {
  const previousAudio = globalThis.Audio;
  class FakeAudio {
    constructor(src) { this.src=src; this.currentTime=0; this.paused=0; this.played=0; }
    load() {}
    pause() { this.paused++; }
    play() { this.played++; return Promise.resolve(); }
  }
  globalThis.Audio = FakeAudio;
  try {
    const audio = new AudioSystem();
    audio.preload();
    audio.play('shot');
    const shot = audio.sounds.get('shot');
    const hit = audio.sounds.get('ballHit');
    audio.play('ballHit');
    assert.equal(shot.played, 1);
    assert.equal(shot.paused, 1, 'second sound interrupts previous channel');
    assert.equal(hit.played, 1);
    audio.setEnabled(false);
    assert.equal(hit.paused, 1, 'muting stops the current sound');
  } finally {
    if (previousAudio === undefined) delete globalThis.Audio;
    else globalThis.Audio = previousAudio;
  }
});

test('game core emits shot/player-hit sounds without inventing a timeout loss sound', () => {
  const game = new Game(levels);
  toPlaying(game);
  game.update({...none, shot:true});
  assert.deepEqual(game.drainEvents(), [{type:'sound',name:'shot'}]);
  game.loseLife();
  assert.deepEqual(game.drainEvents(), [], 'juego::restar_vidas itself has no sound call');

  const hitGame = new Game(levels);
  toPlaying(hitGame);
  hitGame.player.hitBall();
  assert.deepEqual(hitGame.drainEvents(), [{type:'sound',name:'lose'}], 'gaucho collision owns pierde.wav');
});

test('shot ceiling event distinguishes normal rope and trident hook', () => {
  const ceiling = { distanceToCeiling: () => 0 };
  const normal = new Shot({x:10,y:100,type:SHOT_TYPE.SIMPLE});
  const trident = new Shot({x:10,y:100,type:SHOT_TYPE.TRIDENT});
  assert.equal(normal.update(ceiling), 'ceiling');
  assert.equal(trident.update(ceiling), 'hook');
});
