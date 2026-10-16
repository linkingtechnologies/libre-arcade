const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
function ok(v,m){if(!v)throw new Error(m)}
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const app=fs.readFileSync(path.join(ROOT,'src/app.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'src/style.css'),'utf8');
const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');

// Static package completeness and offline dependency check.
for(const f of ['levels.js','core.js','nes-assets.js','nes-gfx.js','transitions.js','audio-data.js','famitone.js','nes-audio.js','app.js']){
  ok(fs.existsSync(path.join(ROOT,'src',f)),`missing src/${f}`);
  ok(html.includes(`src/${f}`),`index missing src/${f}`);
}
for(const href of [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m=>m[1])){
  if(/^https?:/i.test(href)) continue; // navigation links are allowed; runtime assets are checked separately below.
  const clean=href.split('#')[0].split('?')[0];
  if(clean)ok(fs.existsSync(path.join(ROOT,clean)),`broken local reference ${href}`);
}
const runtimeTags=[...html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="([^"]+)"[^>]*>/gi)].map(m=>m[1]);
ok(runtimeTags.every(x=>!/^https?:/i.test(x)),'external runtime dependency found');

// HTML sanity: IDs unique and required release affordances present.
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
ok(new Set(ids).size===ids.length,'duplicate HTML id');
for(const id of ['menuScreen','helpScreen','creditsScreen','endingScreen','gameScreen','resetDataButton','creditsStatus'])ok(ids.includes(id),`missing #${id}`);
ok(html.includes('aria-live="polite"'),'live status region');
ok(html.includes('data-aria-i18n="gameScreenLabel"'),'game canvas accessibility label');
ok(html.includes('pattern="[0-9]*"'),'numeric passcode input hint');

// Responsive/no-scroll/mobile handling.
ok(/html,body\{[^}]*overflow:hidden/.test(css),'no-scroll rule missing');
ok(css.includes('@media(max-width:520px)'),'small-screen breakpoint missing');
ok(css.includes('touch-action:none'),'canvas touch handling missing');
ok(css.includes('touch-action:manipulation'),'button touch handling missing');

// User-facing release behavior.
ok(app.includes("state.screen='help'"),'Help must suspend menu input');
ok(app.includes("state.screen='credits'"),'Credits must suspend menu input');
ok(app.includes("state.screen='menu';show('menuScreen')"),'Back must restore menu state');
ok(app.includes("k.startsWith('lanmaster.')"),'scoped local-data reset missing');
ok(app.includes("localStorage.removeItem(k)"),'local-data reset missing');
ok(app.includes("localStorage.setItem('lanmaster.lang'"),'language persistence missing');
ok(!app.includes('sessionStorage'),'unexpected session persistence');

// Italian in-game panel localization; historical title/ending remain untouched.
for(const text of ['CONTINUA','ANCORA','TUTTO CONNESSO!','CODICE','TEMPO SCADUTO!','PARTITA FINITA'])ok(app.includes(text),`missing IT panel text ${text}`);
ok(app.includes("if(lang==='en')return A.gameMenuTable"),'EN pause parity table not preserved');
ok(app.includes("if(lang==='en')return A.levelClearTable"),'EN clear parity table not preserved');
ok(app.includes("if(lang==='en')return A.timeOutTable"),'EN timeout parity table not preserved');

// Credits / distribution requirements.
ok(app.includes('https://linkingtechnologies.github.io/libre-arcade/'),'Libre Arcade credits link missing');
ok(readme.includes('PRODUCTION READY'),'release status missing');
ok(fs.existsSync(path.join(ROOT,'PRODUCTION_CHECKLIST.md')),'production checklist missing');
ok(fs.existsSync(path.join(ROOT,'CHANGELOG.md')),'changelog missing');

// Keep debug/dev noise out of the user-visible HTML. Technical files are allowed in the package.
for(const term of ['SHA-256','RNG','NESASM','oracle','provenance','debug'])ok(!html.toLowerCase().includes(term.toLowerCase()),`technical term exposed in UI: ${term}`);

// No stray browser console debugging in production source.
for(const f of fs.readdirSync(path.join(ROOT,'src')).filter(x=>x.endsWith('.js'))){
  const text=fs.readFileSync(path.join(ROOT,'src',f),'utf8');
  ok(!/console\.(log|debug|info)\s*\(/.test(text),`console debug in src/${f}`);
}

console.log('M12 production regression: PASS');
