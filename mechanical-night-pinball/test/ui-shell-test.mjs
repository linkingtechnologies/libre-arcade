import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
const js=await readFile(new URL('../public/src/main.js',import.meta.url),'utf8');
const css=await readFile(new URL('../public/styles.css',import.meta.url),'utf8');
const playfield=await readFile(new URL('../public/assets/graphics/playfield.svg',import.meta.url),'utf8');

for(const id of ['mainMenu','playButton','howButton','menuAudioButton','menuMusicButton','menuLangButton','gameOverMenuButton','launchMeter','launchMeterFill','launchPercent','musicButton'])
  assert.match(html,new RegExp(`id="${id}"`),`missing UI element ${id}`);
assert.match(js,/let mode='menu'/,'menu must be the initial runtime mode');
assert.match(js,/mode!=='playing'/,'physics must pause while the menu is open');
assert.match(js,/gameOverMenu\.addEventListener\('click',returnToMenu\)/,'game-over menu return must be wired');
assert.match(css,/\.menu-overlay/,'menu styling missing');
assert.match(css,/@media \(max-width:560px\)/,'compact HUD breakpoint missing');
assert.doesNotMatch(playfield,/clean-room artwork|preserved geometry|historical art reused/i,'technical archaeology text leaked into player artwork');
assert.match(js,/← \/ Z \/ A sinistra/,'Italian multi-key left flipper help missing');
assert.match(js,/→ \/ M \/ L destra/,'Italian multi-key right flipper help missing');
assert.match(js,/updateLaunchMeter/,'launcher charge feedback must be wired');
assert.match(css,/\.launch-meter/,'launcher charge styling missing');
console.log('Player UI shell: PASS');
