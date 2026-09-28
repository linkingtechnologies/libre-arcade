import fs from 'node:fs';
const html=fs.readFileSync(new URL('../public/index.html', import.meta.url),'utf8');
const bundle=fs.readFileSync(new URL('../public/app.bundle.js', import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../src/app.js', import.meta.url),'utf8');
function ok(v,msg){if(!v)throw new Error(msg)}
ok(html.includes('<script src="app.bundle.js"></script>'),'index must use classic bundle');
ok(!html.includes('type="module"'),'index must not require ES modules');
ok(!/^\s*import\s/m.test(bundle),'bundle must contain no imports');
ok(!/import\.meta/.test(bundle),'bundle must contain no import.meta');
ok(app.includes('new FileReader()'),'image loader must use FileReader');
ok(app.includes("imageInput.value=''"),'same image must be re-selectable');
ok(app.includes("setLoadStatus('imageLoadError')"),'image decode failures must be visible');
console.log('file-mode/image-import smoke: OK');
