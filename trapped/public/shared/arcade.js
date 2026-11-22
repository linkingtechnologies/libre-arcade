// SPDX-License-Identifier: GPL-3.0-only
// Libre Arcade shared presentation helpers for the Rysm restorations.
// Source of truth lives in rysm-restoration/shared/; scripts/sync-shared.mjs
// COPIES it into each game's public/shared/ so every game stays a fully
// independent folder (no runtime sharing). Never edit the per-game copies.

/** Safe localStorage wrapper: every call may throw (private mode, blocked). */
export function createStore(prefix) {
  const k = (name) => prefix + '.' + name;
  return {
    get(name, fallback = null) {
      try {
        const raw = globalThis.localStorage.getItem(k(name));
        return raw === null ? fallback : JSON.parse(raw);
      } catch { return fallback; }
    },
    set(name, value) {
      try { globalThis.localStorage.setItem(k(name), JSON.stringify(value)); return true; }
      catch { return false; }
    },
    remove(name) {
      try { globalThis.localStorage.removeItem(k(name)); } catch { /* ignore */ }
    },
  };
}

/** English unless the browser prefers Italian; an explicit choice wins. */
export function detectLang(store, nav = globalThis.navigator) {
  const saved = store && store.get('lang');
  if (saved === 'it' || saved === 'en') return saved;
  const prefs = (nav && (nav.languages && nav.languages.length ? nav.languages : [nav.language])) || [];
  for (const p of prefs) {
    const l = String(p || '').toLowerCase();
    if (l.startsWith('it')) return 'it';
    if (l.startsWith('en')) return 'en';
  }
  return 'en';
}

/** Minimal translator. dicts = { en: {key: 'text {n}'}, it: {...} }. */
export function createI18n(dicts, lang) {
  const listeners = [];
  const api = {
    lang,
    t(key, params) {
      const s = (dicts[api.lang] && dicts[api.lang][key]) ?? dicts.en[key] ?? key;
      return params ? s.replace(/\{(\w+)\}/g, (m, p) => (p in params ? params[p] : m)) : s;
    },
    setLang(l) {
      if (!dicts[l]) return;
      api.lang = l;
      if (globalThis.document) globalThis.document.documentElement.lang = l;
      api.apply();
      listeners.forEach((f) => f(l));
    },
    onChange(f) { listeners.push(f); },
    apply(root = globalThis.document) {
      if (!root) return;
      root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = api.t(el.dataset.i18n); });
      root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = api.t(el.dataset.i18nHtml); });
      root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
        el.dataset.i18nAttr.split(';').forEach((pair) => {
          const [attr, key] = pair.split(':');
          if (attr && key) el.setAttribute(attr.trim(), api.t(key.trim()));
        });
      });
    },
  };
  return api;
}

/** Swipe detector (touch). Calls cb('up'|'down'|'left'|'right'). */
export function bindSwipe(el, cb, minDist = 24) {
  let sx = 0, sy = 0, active = false;
  el.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; active = true;
  }, { passive: true });
  el.addEventListener('touchmove', (e) => {
    if (!active) return;
    const dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < minDist) return;
    active = false;
    cb(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }, { passive: true });
  el.addEventListener('touchend', () => { active = false; }, { passive: true });
}

/** Hold-to-press on-screen buttons: [data-hold="name"] -> down(name)/up(name). */
export function bindHoldButtons(root, down, up) {
  root.querySelectorAll('[data-hold]').forEach((b) => {
    const name = b.dataset.hold;
    const on = (e) => { e.preventDefault(); b.classList.add('on'); down(name); };
    const off = (e) => { e.preventDefault(); b.classList.remove('on'); up(name); };
    b.addEventListener('pointerdown', on);
    b.addEventListener('pointerup', off);
    b.addEventListener('pointercancel', off);
    b.addEventListener('pointerleave', off);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });
}

/** Wire the standard chrome: pause, restart, language select, credits dialog. */
export function wireChrome({ i18n, store, onPause, onRestart }) {
  const $ = (id) => globalThis.document.getElementById(id);
  const pause = $('btn-pause'), restart = $('btn-restart'), lang = $('lang'), cred = $('btn-credits'), dlg = $('credits');
  if (pause && onPause) pause.addEventListener('click', onPause);
  if (restart && onRestart) restart.addEventListener('click', onRestart);
  if (lang) {
    lang.value = i18n.lang;
    lang.addEventListener('change', () => { store.set('lang', lang.value); i18n.setLang(lang.value); });
  }
  if (cred && dlg) {
    cred.addEventListener('click', () => { if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); });
    const close = $('credits-close');
    if (close) close.addEventListener('click', () => { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); });
  }
}

/** Auto-pause when the tab is hidden. */
export function autoPauseOnHide(pauseFn) {
  globalThis.document.addEventListener('visibilitychange', () => { if (globalThis.document.hidden) pauseFn(); });
}

/** Deterministic PRNG (mulberry32) for tests and optional seeded play. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fit a fixed-ratio canvas into the stage: CSS scaling only, no vertical scroll. */
export function bindFit(canvas, stage, ratio) {
  const fit = () => {
    const r = stage.getBoundingClientRect();
    const w = Math.max(160, r.width - 8), h = Math.max(160, r.height - 8);
    let cw = w, ch = w / ratio;
    if (ch > h) { ch = h; cw = h * ratio; }
    canvas.style.width = Math.floor(cw) + 'px';
    canvas.style.height = Math.floor(ch) + 'px';
  };
  globalThis.addEventListener('resize', fit);
  globalThis.addEventListener('orientationchange', fit);
  fit();
  return fit;
}
