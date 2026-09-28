import fs from 'node:fs';
const bundle=fs.readFileSync(new URL('../public/app.bundle.js', import.meta.url),'utf8');
function must(re,msg){if(!re.test(bundle)) throw new Error(msg);}
must(/const \{computeViewport,canvasToPlayfield\}=VIEWPORT;/,'viewport helpers are not wired into app bundle');
must(/function updateViewport\(\).*computeViewport/s,'updateViewport missing computeViewport call');
must(/function pos\(e\).*canvasToPlayfield/s,'pointer conversion missing canvasToPlayfield call');
console.log('bundle wiring smoke: OK');
