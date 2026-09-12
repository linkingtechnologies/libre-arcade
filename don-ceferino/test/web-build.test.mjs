import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('browser build has no runtime package dependencies', () => {
  const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
  assert.equal(pkg.version,'1.0.3');
  assert.ok(!pkg.dependencies || Object.keys(pkg.dependencies).length===0);
  // devDependencies are limited to the shared collection lint tooling (eslint),
  // not a runtime/build dependency for the game itself.
  assert.deepEqual(Object.keys(pkg.devDependencies||{}).sort(), ['@eslint/js','eslint']);
});

test('active browser source does not import quarantined assets', () => {
  const files=[
    'public/index.html','public/styles.css','public/src/ui/app.js','public/src/ui/assets.js','public/src/ui/renderer.js',
    'public/src/core/game.js','public/src/core/player.js','public/src/audio/audio.js'
  ];
  for(const file of files){
    const text=fs.readFileSync(path.join(root,file),'utf8');
    assert.ok(!text.includes('quarantine/'),`${file} references quarantine`);
  }
});

test('all assets declared by the browser loader exist', () => {
  for(const file of ['gaucho.png','pelota_1.png','pelota_2.png','pelota_3.png','pelota_4.png','niveles.png','fondos.jpg','tiros.png','items.png','mate.png','barra.png','menu.jpg','how_to_play.png','icono.png','pres_losers.jpg','pres_sentado.jpg','pres_lee.jpg','pres_casa.jpg','pres_rapto.jpg','pres_vs.jpg','final1.jpg','final2.jpg','final3.jpg','final4.jpg','final5.jpg','final6.jpg','tit_1.png','tit_2.png','tit_3.png']){
    assert.ok(fs.existsSync(path.join(root,'public/assets/graphics',file)),file);
  }
  assert.equal(fs.statSync(path.join(root,'public/assets/levels/base.map')).size,8400);
});

test('full browser shell exposes the restored scenes and responsive viewport guard', () => {
  const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
  for(const id of ['new-game','instructions','options','credits','scores','outcome','score-entry','touch-controls']) {
    assert.ok(html.includes(`id="${id}"`),id);
  }
  const css=fs.readFileSync(path.join(root,'public/styles.css'),'utf8');
  assert.match(css,/html,body\{[^}]*overflow:hidden/);
});

test('scene artwork is loaded from the active graphics directory, not quarantine', () => {
  const loader=fs.readFileSync(path.join(root,'public/src/ui/assets.js'),'utf8');
  for(const file of ['menu.jpg','tit_1.png','tit_2.png','tit_3.png','how_to_play.png','pres_losers.jpg','final6.jpg']) {
    assert.ok(loader.includes(file),file);
  }
  assert.ok(!loader.includes('quarantine'));
});
