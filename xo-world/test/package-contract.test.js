'use strict';
// Package, legal and browser-markup contract: what must ship, what must not.
const crypto=require('crypto');
const fs=require('fs');
const path=require('path');
const root=path.join(__dirname,'..');
const read=(file)=>fs.readFileSync(path.join(root,file),'utf8');
function need(file,needle){
  const p=path.join(root,file);
  if(!fs.existsSync(p))throw new Error(`missing ${file}`);
  if(needle&&!fs.readFileSync(p,'utf8').includes(needle))throw new Error(`${file} missing ${needle}`);
}

// Licence and provenance files.
need('LICENSE','GNU GENERAL PUBLIC LICENSE');
need('LICENSE','Version 3, 29 June 2007');
need('THIRD_PARTY_NOTICES.md','No AI-generated assets');
need('PROVENANCE.md','GPL-2.0-or-later');
need('PROVENANCE.md','GPL-3.0-or-later');
need('SOFTWARE_ARCHAEOLOGY.md');
need('specs/port-map.md');
need('docs/development/archaeology.md','DUBINA = 7');

// The preserved original sources still hash to the recorded values, and the
// four preserved files are the ones in the archive manifest.
const dir='reference/javagames-1.0';
const manifest=new Map(read(`${dir}/ARCHIVE_SHA256.txt`).trim().split('\n').map((line)=>{const [hash,name]=line.split(/\s+/);return [name.replace(/^\*/,''),hash];}));
for(const line of read(`${dir}/CHECKSUMS.txt`).trim().split('\n')){
  const [hash,rawName]=line.split(/\s+/);const name=rawName.replace(/^\*/,'');
  const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,dir,name))).digest('hex');
  if(actual!==hash)throw new Error(`${dir}/${name} no longer matches CHECKSUMS.txt`);
  if(manifest.get(name)!==hash)throw new Error(`${dir}/${name} is not the file in the archive manifest`);
}
if(manifest.size!==63)throw new Error('the archive manifest must list the 63 files of javagames-1.0.tgz');
if(!read(`${dir}/xoworld.java`).includes('any later version'))throw new Error('the "or later" grant must be readable in the preserved source header');

// Browser markup.
need('public/index.html','id="infoDialog"');
need('public/index.html','aria-atomic="true"');
need('public/index.html','aria-describedby="boardHelp"');
need('public/index.html','https://linkingtechnologies.github.io/libre-arcade/');
need('public/index.html','<script data-goatcounter="https://grugnetto.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>');
const html=read('public/index.html');
if(/<details\b/i.test(html))throw new Error('legacy inline help still present');
if(/shotxo|slikax|slikao/i.test(html))throw new Error('historical raster asset leaked into browser HTML');
const app=read('public/app.js');
for(const token of ['Aiuto e crediti','Credits','Crediti','showModal','boardHelp','row=Math.trunc(focusIndex/10)'])if(!app.includes(token))throw new Error(`app missing ${token}`);
console.log('PACKAGE CONTRACT PASS');
