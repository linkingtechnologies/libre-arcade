import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const html=fs.readFileSync(path.join(root,'public/index.html'),'utf8');
const bundle=fs.readFileSync(path.join(root,'public/app.bundle.js'),'utf8');
const full=fs.readdirSync(path.join(root,'public/assets/photos')).filter(f=>f.endsWith('.jpg'));
const thumbs=fs.readdirSync(path.join(root,'public/assets/photos/thumbs')).filter(f=>f.endsWith('.jpg'));
if(full.length!==10||thumbs.length!==10)throw new Error(`gallery count ${full.length}/${thumbs.length}`);
for(const f of full)if(!thumbs.includes(f))throw new Error(`missing thumbnail ${f}`);
for(const forbidden of ['id="cutSelect"','id="snapSelect"','ConnectedSet','milestone','Piece style','Snap policy']){
  if(html.includes(forbidden))throw new Error(`player UI contains ${forbidden}`);
}
for(const required of ['id="saveBtn"','id="saveInput"','id="galleryBtn"','id="imageInput"','id="shapeSelect"','id="pieceCount"','id="layerSelect"','JS Nature Photos','CC BY-SA 3.0 US']){
  if(!html.includes(required))throw new Error(`missing ${required}`);
}
if(!bundle.includes('libre-jigsaw-html5'))throw new Error('save format missing from bundle');
if(/^\s*import\s/m.test(bundle))throw new Error('browser bundle still contains ES module imports');
const remote=[...html.matchAll(/<script[^>]+src=["']((?:https?:)?\/\/[^"']+)["']/g)].map(m=>m[1]);
if(remote.length!==1||remote[0]!=='//gc.zgo.at/count.js')throw new Error(`unexpected remote scripts: ${JSON.stringify(remote)}`);
for(const f of ['LICENSE','THIRD_PARTY_NOTICES.md','LICENSES/JS-Nature-Photos-attribution.txt','LICENSES/CC-BY-SA-3.0-US.html']){
  if(!fs.existsSync(path.join(root,f)))throw new Error(`missing ${f}`);
}
console.log('production-smoke: OK');
