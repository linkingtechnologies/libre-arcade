'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const html=fs.readFileSync(path.join(root,'public','index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'public','style.css'),'utf8');
const app=fs.readFileSync(path.join(root,'public','app.js'),'utf8');
function req(ok,msg){if(!ok)throw new Error(msg);}
req(/<canvas[^>]+tabindex="0"/.test(html),'Canvas must be keyboard-focusable');
req(/overflow:hidden/.test(css),'Page must suppress vertical document scrolling');
req(/@media\(max-height:620px\)/.test(css),'Small-height viewport rule missing');
req(/touch-action:manipulation/.test(css),'Touch behavior missing');
req(/You WIN!!!/.test(app),'Historical-style win banner missing');
req(/HAI VINTO!!!/.test(app),'Italian result banner missing');
req(/ArrowLeft/.test(app)&&/ArrowRight/.test(app)&&/Enter/.test(app),'Keyboard controls missing');
req(!/shotxo|slikax|slikao/i.test(html+css+app),'Historical raster assets leaked into browser build');
console.log('UI CONTRACT PASS');
