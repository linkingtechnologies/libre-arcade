import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { readPreference, writePreference } from '../public/src/ui/preferences.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('preferences survive unavailable or throwing localStorage', () => {
  const bad = { getItem(){ throw new Error('blocked'); }, setItem(){ throw new Error('blocked'); } };
  assert.equal(readPreference(bad,'x','fallback'),'fallback');
  assert.equal(writePreference(bad,'x','y'),false);
  const map = new Map();
  const good = { getItem:k => map.has(k) ? map.get(k) : null, setItem:(k,v)=>map.set(k,v) };
  assert.equal(readPreference(good,'x','fallback'),'fallback');
  assert.equal(writePreference(good,'x','y'),true);
  assert.equal(readPreference(good,'x','fallback'),'y');
});

test('production shell exposes loading/fatal recovery and background-pause guards', () => {
  const html = fs.readFileSync(path.join(root,'public/index.html'),'utf8');
  for (const id of ['loading','loading-text','fatal','fatal-title','fatal-body','fatal-retry']) assert.ok(html.includes(`id="${id}"`), id);
  const app = fs.readFileSync(path.join(root,'public/src/ui/app.js'),'utf8');
  assert.match(app,/visibilitychange/);
  assert.match(app,/pagehide/);
  assert.match(app,/pauseForFocusLoss/);
  assert.match(app,/AudioSystem/);
});

test('development server declares WAV MIME type', () => {
  const server = fs.readFileSync(path.join(root,'tools/serve.mjs'),'utf8');
  assert.match(server,/\.wav','audio\/wav'/);
});

test('all JavaScript modules pass node syntax validation', () => {
  const dirs = ['public/src','tools','test'];
  const files=[];
  for (const dir of dirs) {
    const walk = d => {
      for (const entry of fs.readdirSync(d,{withFileTypes:true})) {
        const full=path.join(d,entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(?:js|mjs)$/.test(entry.name)) files.push(full);
      }
    };
    walk(path.join(root,dir));
  }
  for (const file of files) {
    const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
    assert.equal(result.status,0,`${path.relative(root,file)}: ${result.stderr}`);
  }
});
