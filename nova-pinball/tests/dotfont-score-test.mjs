import fs from 'node:fs';
const dotfont=fs.readFileSync(new URL('../public/src/dotfont.js',import.meta.url),'utf8');
if(!dotfont.includes("',':['00000','00000','00000','00000','00110','00110','00100']")) throw new Error('comma glyph missing from dot-matrix font');
if(!dotfont.includes("'.':['00000','00000','00000','00000','00000','00110','00110']")) throw new Error('period glyph missing from dot-matrix font');
console.log('OK — dot-matrix score punctuation supports both comma and period thousands separators');
