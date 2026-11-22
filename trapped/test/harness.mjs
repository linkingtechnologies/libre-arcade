// SPDX-License-Identifier: GPL-3.0-only
// Headless harness: runs a Twine/Sugarcane story HTML (the ORIGINAL engine, unmodified)
// inside jsdom with a seeded Math.random and exposes a tiny player API.
import { JSDOM, VirtualConsole } from 'jsdom';
import { readFileSync } from 'node:fs';
import { mulberry32 } from '../public/shared/arcade.js';

export async function loadStory(file, seed = 1) {
  const html = readFileSync(file, 'utf8');
  const errors = [];
  const vc = new VirtualConsole();
  vc.on('jsdomError', (e) => errors.push(String(e.message || e)));
  const rng = mulberry32(seed);
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/story.html', virtualConsole: vc,
    beforeParse(w) {
      w.Math.random = rng;
      w.confirm = () => true;
      w.scroll = () => {};
      w.scrollTo = () => {};
      if (!w.requestAnimationFrame) w.requestAnimationFrame = (f) => w.setTimeout(f, 0);
    },
  });
  const w = dom.window;
  if (w.document.readyState !== 'complete') await new Promise((r) => w.addEventListener('load', r));
  const doc = w.document;
  const api = {
    window: w, errors,
    /** Current passage title as the engine tracks it. */
    get title() { return w.state.history[0].passage.title; },
    get vars() { return JSON.parse(JSON.stringify(w.state.history[0].variables)); },
    /** Visible text of the passage area, whitespace-normalised. */
    get text() {
      const all = doc.querySelectorAll('#passages .passage');
      const el = all.length ? all[all.length - 1] : doc.getElementById('passages');
      return el.textContent.replace(/\s+/g, ' ').trim();
    },
    /** Links currently offered: { label, target, kind } (cycling links are 'cycle'). */
    get links() {
      return [...(([...doc.querySelectorAll('#passages .passage')].pop()) || doc).querySelectorAll('a')].map((a) => ({
        el: a, label: a.textContent.replace(/\s+/g, ' ').trim(),
        target: a.getAttribute('passage'),
        kind: a.classList.contains('cyclingLink') ? 'cycle' : 'passage',
      }));
    },
    setRandom(fn) { w.Math.random = typeof fn === 'function' ? fn : () => fn; },
    get domErrors() { return [...doc.querySelectorAll('.error')].map((e) => e.textContent); },
    click(index) { this.links[index].el.click(); },
    clickLabel(label) {
      const l = this.links.find((x) => x.label === label);
      if (!l) throw new Error(`no link "${label}" on ${this.title}; have: ${this.links.map((x) => x.label).join(' | ')}`);
      l.el.click();
    },
    passageNames: () => Object.keys(w.tale.passages),
    rawPassage: (name) => w.tale.passages[name].text,
    restart() { w.History.prototype.restart.call(w.state); },
  };
  return api;
}
