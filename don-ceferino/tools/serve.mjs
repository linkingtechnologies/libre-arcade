import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', process.argv[2] || 'public');
const port = Number(process.argv[3] || process.env.PORT || 8080);
const mime = new Map([
  ['.html','text/html; charset=utf-8'],['.css','text/css; charset=utf-8'],['.js','text/javascript; charset=utf-8'],
  ['.png','image/png'],['.jpg','image/jpeg'],['.jpeg','image/jpeg'],['.wav','audio/wav'],['.map','application/octet-stream'],['.md','text/markdown; charset=utf-8'],['.json','application/json; charset=utf-8']
]);

http.createServer((req,res) => {
  const raw = decodeURIComponent((req.url || '/').split('?')[0]);
  const relative = raw === '/' ? 'index.html' : raw.replace(/^\/+/, '');
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep) && target !== path.join(root,'index.html')) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.readFile(target, (error, data) => {
    if (error) { res.writeHead(error.code === 'ENOENT' ? 404 : 500); return res.end('Not found'); }
    res.setHeader('Content-Type', mime.get(path.extname(target).toLowerCase()) || 'application/octet-stream');
    res.setHeader('Cache-Control','no-store');
    res.end(data);
  });
}).listen(port, '127.0.0.1', () => console.log(`Don Ceferino Hazaña: http://127.0.0.1:${port}`));
