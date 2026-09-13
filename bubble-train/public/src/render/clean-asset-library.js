// SPDX-License-Identifier: GPL-3.0-or-later

const COLOUR_NAMES = ['blue', 'red', 'green', 'orange', 'purple'];
const THEME_NAMES = ['default', 'arctic', 'beach', 'mexico', 'mountains', 'sea', 'sky', 'space'];

export class CleanAssetLibrary {
  constructor(baseUrl = '../assets-clean/svg/') {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    this.images = new Map();
    this.ready = this.#loadAll();
  }

  bubbleImage(colour = 0) {
    return this.images.get(`bubble:${COLOUR_NAMES[colour % COLOUR_NAMES.length]}`) ?? null;
  }

  image(key) { return this.images.get(key) ?? null; }

  themeBackground(theme = 'default') {
    const key = `theme:${String(theme || 'default').toLowerCase()}`;
    return this.images.get(key) ?? this.images.get('theme:default') ?? null;
  }

  async #loadAll() {
    if (typeof Image === 'undefined') return;
    const entries = [];
    for (const name of COLOUR_NAMES) entries.push([`bubble:${name}`, `bubbles/bubble-${name}.svg`]);
    entries.push(
      ['bubble:bomb', 'bubbles/bubble-bomb.svg'],
      ['bubble:colour-bomb', 'bubbles/bubble-colour-bomb.svg'],
      ['overlay:speed', 'bubbles/overlay-speed.svg'],
      ['overlay:rainbow', 'bubbles/overlay-rainbow.svg'],
      ['cannon:base', 'cannon/cannon-base.svg'],
      ['cannon:barrel', 'cannon/cannon-barrel.svg']
    );
    for (const name of THEME_NAMES) entries.push([`theme:${name}`, `../themes/${name}/background.svg`]);
    await Promise.all(entries.map(([key, path]) => this.#load(key, `${this.baseUrl}${path}`)));
  }

  #load(key, url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => { this.images.set(key, img); resolve(); };
      img.onerror = () => resolve();
      img.src = url;
    });
  }
}
