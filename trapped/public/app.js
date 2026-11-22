// SPDX-License-Identifier: GPL-3.0-only
import { createStore, detectLang, createI18n, wireChrome } from './shared/arcade.js';
import { dicts } from './i18n.js';

const store = createStore('rysm.trapped');
const i18n = createI18n(dicts, detectLang(store));
const frame = document.getElementById('story');

// The engine keeps its whole state (history + variables) in the URL hash; saving
// and resuming is simply remembering that hash. Language switching keeps it too:
// both builds have identical passage titles and order.
let hash = store.get('hash', '') || '';

function storyUrl(withHash) {
  return `story/trapped.${i18n.lang}.html` + (withHash && hash && hash !== '#' ? hash : '');
}
function load(withHash) { frame.src = storyUrl(withHash); }
// Keep keyboard focus inside the story so 1-9 / arrows / Enter work straight away.
frame.addEventListener('load', () => { try { frame.contentWindow.focus(); } catch { /* ignore */ } });

window.addEventListener('message', (e) => {
  if (e.source !== frame.contentWindow || !e.data || e.data.type !== 'trapped-state') return;
  hash = e.data.hash || '';
  store.set('hash', hash);
});

function restart() {
  if (!window.confirm(i18n.t('confirm'))) return;
  hash = ''; store.remove('hash');
  load(false);
}
window.__trappedRestart = () => { hash = ''; store.remove('hash'); load(false); }; // test hook (no confirm)

wireChrome({ i18n, store, onRestart: restart });
i18n.onChange(() => { frame.title = i18n.t('title'); load(true); });
i18n.setLang(i18n.lang);
frame.title = i18n.t('title');
load(true);
