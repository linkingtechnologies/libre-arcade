import fs from 'node:fs';
const app=fs.readFileSync(new URL('../public/src/app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
if(/localStorage\.(getItem|setItem)/.test(app))throw new Error('direct localStorage access remains in app.js');
for(const x of ["getStored('nova-camera-mode')","getStored('nova-lang')","getStored('nova-sfx')","setStored('nova-scores'","window.addEventListener('blur',pauseForInterruption)","document.addEventListener('visibilitychange'","releaseControls()"]){
  if(!app.includes(x))throw new Error('missing hardening hook: '+x);
}
if(!html.includes('meta name="description"')||!html.includes('rel="icon"'))throw new Error('release metadata/favicon missing');
console.log('OK — focus/visibility pause, safe storage and release metadata hooks present');
