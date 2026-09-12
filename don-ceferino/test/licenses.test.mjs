import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../reference/ceferino-0.97.8', import.meta.url));

test('all substantive original src files carry GPL-2.0-or-later header', () => {
  const src=path.join(root,'src');
  const files=fs.readdirSync(src).filter(f=>f.endsWith('.cc')||f.endsWith('.h'));
  const exceptions=[];
  let licensed=0;
  for(const file of files){
    const text=fs.readFileSync(path.join(src,file),'latin1');
    if(text.includes('either version 2 of the License, or') && text.includes('(at your option) any later version')) licensed++;
    else exceptions.push([file,text.trim().length]);
  }
  assert.equal(licensed,60);
  assert.deepEqual(exceptions.sort(), [['ceferino-i18n.h',0],['int.h',191]].sort());
});

test('all four historical asset groups carry the same GPL-2.0-or-later notice', () => {
  const dirs=['ima','levels','music','sounds'];
  const texts=dirs.map(d=>fs.readFileSync(path.join(root,'data',d,'LICENSE-KIND.FILES'),'latin1'));
  assert.ok(texts.every(t=>t.includes('either version 2 of the License, or') && t.includes('(at your option) any later version')));
  assert.ok(texts.every(t=>t===texts[0]));
});

test('preserved source tarball checksum matches the audited artifact', async () => {
  const crypto = await import('node:crypto');
  const tar = fs.readFileSync(new URL('../reference/ceferino_0.97.8.orig.tar.gz', import.meta.url));
  const digest = crypto.createHash('sha256').update(tar).digest('hex');
  assert.equal(digest, '6f0f2674a8a968950498570b89123e341dca50499d255e7bcdf3703a85aa3074');
});

test('production historical graphics and base.map are byte-identical copies of reference files', () => {
  const graphics=['gaucho.png','pelota_1.png','pelota_2.png','pelota_3.png','pelota_4.png','niveles.png','fondos.jpg','tiros.png','items.png','mate.png','barra.png','menu.jpg','how_to_play.png','icono.png','pres_sentado.jpg','pres_lee.jpg','pres_casa.jpg','pres_rapto.jpg','pres_vs.jpg','final1.jpg','final2.jpg','final3.jpg','final4.jpg','final5.jpg','final6.jpg','tit_1.png','tit_2.png','tit_3.png'];
  const projectRoot=fileURLToPath(new URL('..', import.meta.url));
  for (const name of graphics) {
    const active=fs.readFileSync(path.join(projectRoot,'public','assets','graphics',name));
    const historical=fs.readFileSync(path.join(root,'data','ima',name));
    assert.deepEqual(active,historical, name);
  }
  assert.deepEqual(
    fs.readFileSync(path.join(projectRoot,'public','assets','levels','base.map')),
    fs.readFileSync(path.join(root,'data','levels','base.map'))
  );
});

test('runtime pres_losers artwork is the documented URL-free derivative while reference stays original', async () => {
  const crypto = await import('node:crypto');
  const projectRoot=fileURLToPath(new URL('..', import.meta.url));
  const active=fs.readFileSync(path.join(projectRoot,'public','assets','graphics','pres_losers.jpg'));
  const historical=fs.readFileSync(path.join(root,'data','ima','pres_losers.jpg'));
  const activeHash=crypto.createHash('sha256').update(active).digest('hex');
  const historicalHash=crypto.createHash('sha256').update(historical).digest('hex');
  assert.equal(activeHash,'f60c1bd078e3d7688ec9b6fab2492b4ad25900bf0a8783d9aa634c9403db770e');
  assert.equal(historicalHash,'8a2dfe595597f951d1cac976d049872f20248bbf85cf924cd58547a52800f88f');
  assert.notDeepEqual(active,historical);
});

