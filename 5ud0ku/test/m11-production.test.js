import fs from 'node:fs';
import crypto from 'node:crypto';
import { GridStore, MemoryStorageBackend } from '../public/src/core/grid-store.js';
import { MoveStack } from '../public/src/core/move-stack.js';

let pass=0, fail=0;
function ok(name, value, detail=''){ console.log(`${value?'PASS':'FAIL'} | ${name}${detail?` | ${detail}`:''}`); value?pass++:fail++; }

const root=new URL('../', import.meta.url);
const read=(rel)=>fs.readFileSync(new URL(rel,root),'utf8');
const html=read('public/index.html');
const app=read('public/src/browser/app.js');
const css=read('public/src/browser/styles.css');
const pkg=JSON.parse(read('package.json'));

try {
  const backend=new MemoryStorageBackend();
  const store=new GridStore(backend);
  backend.set('AUTO_SAVE',new Uint8Array([1])); backend.set('A',new Uint8Array([2])); backend.set('B',new Uint8Array([3]));
  ok('GridStore.clearAll removes autosave and named saves', store.clearAll() && backend.keys().length===0);

  const moves=new MoveStack();
  ok('history starts with undo disabled', !moves.canUndo());
  ok('history starts with redo disabled', !moves.canRedo());
  moves.addMove(0,0,0,1,false);
  ok('history exposes undo after a move', moves.canUndo());

  ok('production package version is 1.0.0', pkg.version==='1.0.0');
  ok('settings exposes local-data reset', html.includes('id="resetDataButton"'));
  ok('Sudoku board exposes 9x9 ARIA grid metadata', html.includes('aria-rowcount="9"') && html.includes('aria-colcount="9"'));
  ok('all dialogs have accessible labelled-by metadata', (html.match(/<dialog[^>]+aria-labelledby=/g)||[]).length===8);
  ok('page has a noscript fallback', html.includes('<noscript>'));
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);
  ok('player HTML has no duplicate element ids', new Set(ids).size===ids.length);
  const blankTargets=[...html.matchAll(/<a[^>]+target="_blank"[^>]*>/g)].map(m=>m[0]);
  ok('external new-tab links use noopener', blankTargets.every(tag=>/rel="[^"]*noopener/.test(tag)));
  ok('reduced-motion preference is respected', css.includes('prefers-reduced-motion'));
  ok('forced-colors mode has explicit selected/conflict treatment', css.includes('forced-colors: active'));
  ok('app uses roving cell tabindex', app.includes('cell.tabIndex=isSelected?0:-1'));
  ok('cells expose localized row/column labels', app.includes("t('row')") && app.includes("t('column')"));
  ok('conflicts are reflected via aria-invalid', app.includes("setAttribute('aria-invalid'"));
  ok('undo/redo buttons mirror history availability', app.includes("session.moves.canUndo()") && app.includes("session.moves.canRedo()"));
  ok('worker timeout/crash/busy/cancel have user-facing handling', ['WORKER_TIMEOUT','WORKER_CRASH','WORKER_BUSY','WORKER_CANCELLED'].every(x=>app.includes(x)));
  ok('busy engine makes app inert and keyboard ignores input', app.includes("$('app').inert=isBusy") && app.includes('if(isBusy||document.querySelector'));
  ok('failed new-game generation restores previous timer state', app.includes('timerBase=previous.elapsed') && app.includes('running=previous.running'));
  ok('preference localStorage access is wrapped in safe helpers', (app.match(/localStorage\./g)||[]).length===3);

  const dataKeys=[...html.matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)].map(m=>m[1]);
  const missing=[];
  for(const key of new Set(dataKeys)){
    const re=new RegExp(`\\b${key.replace(/[.*+?^${}()|[\\]\\]/g,'\\$&')}\\s*:`, 'g');
    if((app.match(re)||[]).length<2) missing.push(key);
  }
  ok('every static UI translation key exists in EN and IT', missing.length===0, missing.length?`missing=${missing.join(',')}`:'');

  const forbidden=['oracle','backtracking','creatorSeed','digitSeed','provenance'];
  const htmlLower=html.toLowerCase();
  ok('player-facing HTML contains no laboratory/debug terminology', forbidden.every(x=>!htmlLower.includes(x.toLowerCase())));

  // The preserved original (reference/5ud0ku-1.8): every kept file still hashes to CHECKSUMS.txt and, for the source files, to the archive manifest.
  const refDir='reference/5ud0ku-1.8/';
  const lines=(file)=>read(refDir+file).trim().split(/\r?\n/);
  const archive=new Map(lines('ARCHIVE_SHA256.txt').map(line=>{const [h,n]=line.split(/\s+/);return [n.replace(/^\*/,''),h];}));
  ok('archive manifest lists the 55 files of the source archive', archive.size===55);
  let allKept=true, allInArchive=true;
  for(const line of lines('CHECKSUMS.txt')){
    const [hash,rawName]=line.split(/\s+/), name=rawName.replace(/^\*/,'');
    if(crypto.createHash('sha256').update(fs.readFileSync(new URL(refDir+name,root))).digest('hex')!==hash) allKept=false;
    if(name.startsWith('source/') && archive.get('5ud0ku.src/'+name.slice('source/'.length))!==hash) allInArchive=false;
  }
  ok('preserved original files remain byte-identical to CHECKSUMS.txt', allKept);
  ok('preserved source files are the ones in the archive manifest', allInArchive);
  ok('no image, jar or zip of the original is redistributed in public/', !fs.readdirSync(new URL('public/',root),{recursive:true}).some(f=>/\.(png|gif|jpe?g|jar|zip)$/i.test(String(f))));
} catch(error){ console.error(error); fail++; }

console.log(`SUMMARY | pass=${pass} fail=${fail}`);
if(fail)process.exit(1);
