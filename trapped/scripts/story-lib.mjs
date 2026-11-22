// SPDX-License-Identifier: GPL-3.0-only
// Twine 1.4.2 ("Sugarcane") story-file helpers: passage codec, translation layer
// and the two minimal injections (theme + accessibility script). The engine and
// every English passage are left byte-for-byte as Andy Wang's Twine published them.

const STORE_START = '<div id="storeArea"';

export function decode(s) {
  return s
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
    .replace(/\\([nts\\])/g, (m, c) => ({ n: '\n', t: '\t', s: '\\', '\\': '\\' }[c]));
}

export function encode(s) {
  return s
    .replace(/\\/g, '\\s').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/\n/g, '\\n').replace(/\t/g, '\\t');
}

const PASSAGE_RE = /<div tiddler="([^"]*)" tags="([^"]*)" created="([^"]*)" modifier="([^"]*)" twine-position="([^"]*)">([\s\S]*?)<\/div>/g;

/** Parse all passages from a story HTML. */
export function parsePassages(html) {
  const store = html.slice(html.indexOf(STORE_START));
  const out = [];
  for (const m of store.matchAll(PASSAGE_RE)) {
    out.push({ title: decode(m[1]), tags: m[2], position: m[5], raw: m[6], text: decode(m[6]), whole: m[0] });
  }
  return out;
}

/** Apply the Italian layer to one passage text. Throws if a segment does not match as declared. */
export function translateText(title, text, layer) {
  let t = text;
  for (const [from, to, count = 1] of layer.passages[title] ?? []) {
    const n = t.split(from).length - 1;
    if (n !== count) throw new Error(`"${title}": expected ${count} x ${JSON.stringify(from)}, found ${n}`);
    t = t.split(from).join(to);
  }
  // Room names are code-level string constants: translate them consistently everywhere.
  for (const [en, it] of Object.entries(layer.rooms)) t = t.split(`"${en}"`).join(`"${it}"`);
  return t;
}

export function buildStory(html, { layer = null, injectHead = '', injectBody = '' } = {}) {
  let out = html;
  if (layer) {
    for (const p of parsePassages(html)) {
      if (!(p.title in layer.passages) && p.title !== 'wheresKiller' && p.title !== 'hide') continue;
      const translated = translateText(p.title, p.text, layer);
      if (translated === p.text) continue;
      const rebuilt = p.whole.replace(`>${p.raw}</div>`, () => `>${encode(translated)}</div>`);
      out = out.replace(p.whole, () => rebuilt);
    }
  }
  if (injectHead) out = out.replace('</head>', `${injectHead}\n</head>`);
  if (injectBody) out = out.replace('</body>', `${injectBody}\n</body>`);
  return out;
}
