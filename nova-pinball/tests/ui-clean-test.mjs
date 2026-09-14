import fs from 'node:fs';
const app=fs.readFileSync(new URL('../public/src/app.js', import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../public/index.html', import.meta.url),'utf8');
const visible=[app,html].join('\n').toLowerCase();
const banned=[
  'web restoration','restauro web','clean-room sound effects','effetti sonori clean-room',
  'optional modern cc0 replacement','sostituzione moderna cc0','archaeology','archeologia',
  'code license','licenza codice','html5 + javascript clean-room','original soundtrack is not redistributed',
  'musica originale non è redistribuita'
];
for(const term of banned){
  if(visible.includes(term)) throw new Error(`player-facing nerd text remains: ${term}`);
}
if(!html.includes('<title>Nova Pinball</title>')) throw new Error('browser title is not clean');
console.log('ui-clean-test: OK');
