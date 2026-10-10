'use strict';
const fs=require('fs');
const path=require('path');
const css=fs.readFileSync(path.join(__dirname,'..','public','style.css'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
function req(ok,msg){if(!ok)throw new Error(msg);}
req(/body\{[^}]*overflow:hidden/.test(css),'body must suppress document scrolling');
req(/\.shell\{[^}]*height:min\(98dvh,720px\)/.test(css),'shell viewport-height cap missing');
req(/@media\(max-height:620px\)/.test(css),'short viewport breakpoint missing');
req(/@media\(max-width:430px\)/.test(css),'phone width breakpoint missing');
// The body keeps 6px of padding on each side, so a phone-width shell of 99vw overflowed it by 2px and pushed the "?" button off the screen.
req(/@media\(max-width:430px\)\{\.shell\{width:100%\}/.test(css),'phone-width shell must fit the body (width:100%), not 99vw');
// The canvas is sized from the card's real padding; a fixed 12px allowance left the board 2px taller than wide.
const app=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
req(app.includes('paddingLeft')&&app.includes('paddingTop'),'canvas size must account for the card padding');
req(/@media\(max-width:340px\)/.test(css),'narrow phone breakpoint missing');
req(/canvas\{[^}]*max-width:100%[^}]*max-height:100%[^}]*aspect-ratio:1\/1/.test(css),'canvas responsive square contract missing');
req(/viewport-fit=cover/.test(html),'safe-area viewport support missing');
console.log('VIEWPORT CONTRACT PASS');
