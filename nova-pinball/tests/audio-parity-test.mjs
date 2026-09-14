import fs from 'node:fs';

const app=fs.readFileSync(new URL('../public/src/app.js', import.meta.url),'utf8');
const audio=fs.readFileSync(new URL('../public/src/audio.js', import.meta.url),'utf8');
const doc=fs.readFileSync(new URL('../docs/AUDIO_PARITY.md', import.meta.url),'utf8');

const used=[
  'menu','flipper','wall','bumper','target','wordbonus','ramp','launch','nudge',
  'ball-drained','blackhole-lock','blackhole-release','blackhole','hydrogen-released',
  'wormhole','timewarp','wormhole-close','supergravity-bonus'
];
for(const name of used){
  if(!audio.includes(`'${name}'`) && !audio.includes(`"${name}"`)) throw new Error(`missing clean SFX role in audio.js: ${name}`);
}
for(const name of ['wordbonus','ball-drained','blackhole-lock','blackhole-release','hydrogen-released','wormhole-close','supergravity-bonus']){
  if(!app.includes(`audio.play('${name}')`)) throw new Error(`missing historical trigger mapping in app.js: ${name}`);
}
if(!app.includes("audio.play('timewarp')")) throw new Error('timewarp trigger missing');
if(!app.includes("audio.play('wormhole')")) throw new Error('wormhole trigger missing');
if(!audio.includes('startWormholeLoop')) throw new Error('wormhole loop reconstruction missing');
if(!doc.includes('**19 WAV files**') || !doc.includes('**18 are used')) throw new Error('audio inventory counts not documented');
if(!doc.includes('`powerup-2.wav`') || !doc.includes('no v0.2.3 source reference found')) throw new Error('unused powerup-2 observation missing');
console.log('OK — 1.0.0 maps all 18 runtime-used historical SFX roles to clean synthesis and documents the unused 19th WAV');
