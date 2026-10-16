const fs=require('fs'),path=require('path');
const ROOT=path.resolve(__dirname,'..');
function ok(v,m){if(!v)throw new Error(m)}
const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
const app=fs.readFileSync(path.join(ROOT,'src/app.js'),'utf8');
const css=fs.readFileSync(path.join(ROOT,'src/style.css'),'utf8');
ok(html.includes('id="helpTitle" tabindex="-1"'),'help focus target missing');
ok(html.includes('id="creditsTitle" tabindex="-1"'),'credits focus target missing');
ok(html.includes('id="titleCanvas"')&&html.includes('tabindex="0"'),'title canvas must be focusable');
ok(app.includes('isTextControlTarget(e)'),'text-control keyboard guard missing');
ok(app.includes('isButtonLikeTarget(e)'), 'button/link keyboard guard missing');
ok(app.includes("e.stopPropagation();submitCode()"),'passcode Enter propagation guard missing');
ok(app.includes("e.stopPropagation();leaveCode()"),'passcode Escape propagation guard missing');
ok(app.includes("control(b.dataset.act)"),'on-screen control keyboard path missing');
ok(app.includes("$('#helpTitle').focus()"),'help focus transfer missing');
ok(app.includes("$('#creditsTitle').focus()"),'credits focus transfer missing');
ok(app.includes("(from==='help'?$('#helpButton'):$('#creditsButton')).focus()"),'overlay focus restoration missing');
ok(css.includes('.button:focus-visible'),'link focus-visible styling missing');
console.log('M13 UI regression: PASS');
