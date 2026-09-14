import fs from 'node:fs';
const app=fs.readFileSync(new URL('../public/src/app.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../public/src/style.css',import.meta.url),'utf8');
const parity=fs.readFileSync(new URL('../docs/UI_PARITY.md',import.meta.url),'utf8');
const dotfont=fs.readFileSync(new URL('../public/src/dotfont.js',import.meta.url),'utf8');
for(const marker of [
  'previewActive','previewY','ledAdd(','updateLed(','missionHints','drawPlayfieldBackground',
  'drawHistoricalHud','drawDotText','gameOverActive','gameOverOffset+=dt*150','aboutNextAt'
]) if(!app.includes(marker)) throw new Error('missing 1.0.0 fidelity hook: '+marker);
for(const marker of ['.retro-menu','.pause-panel','.accessibility-hud','repeating-conic-gradient'])
  if(!css.includes(marker)) throw new Error('missing 1.0.0 fidelity style: '+marker);
for(const marker of ['50 px/s','36 px','150 px/s','Leave','procedural'])
  if(!parity.includes(marker)) throw new Error('UI parity doc missing: '+marker);
if(!app.includes("'#37358c'") && !app.includes('55,53,140') && !app.includes('55, 53, 140'))
  throw new Error('historical wall palette marker missing');
if(!dotfont.includes('Clean procedural 5x7 dot-matrix alphabet'))throw new Error('procedural dot font missing');
console.log('OK — 1.0.0 historical UI/presentation fidelity hooks, dot-matrix renderer and documentation');
