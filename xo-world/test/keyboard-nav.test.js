'use strict';
const fs=require('fs');
const path=require('path');
const app=fs.readFileSync(path.join(__dirname,'..','public','app.js'),'utf8');
function req(ok,msg){if(!ok)throw new Error(msg);}
req(app.includes('row=Math.trunc(focusIndex/10),col=focusIndex%10'),'row/column keyboard navigation missing');
req(app.includes('row*10+Math.max(0,col-1)'),'left edge clamp missing');
req(app.includes('row*10+Math.min(9,col+1)'),'right edge clamp missing');
req(app.includes('Math.max(0,row-1)*10+col'),'top edge clamp missing');
req(app.includes('Math.min(9,row+1)*10+col'),'bottom edge clamp missing');
console.log('KEYBOARD NAV CONTRACT PASS');
