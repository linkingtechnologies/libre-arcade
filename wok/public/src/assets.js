/* SPDX-License-Identifier: GPL-3.0-or-later */
(function (root) {
  'use strict';
  const W = root.Wok = root.Wok || {};

  const spriteFiles = [
    'ball_b7.png', 'ball_b10.png', 'ball_b15.png',
    'ball_g7.png', 'ball_g10.png', 'ball_g15.png',
    'ball_r7.png', 'ball_r10.png', 'ball_r15.png',
    '0s.png', '1s.png', '2s.png', '3s.png', '4s.png', '5s.png', '6s.png', '7s.png', '8s.png', '9s.png', 'xs.png',
    'pp0s.png', 'pp1s.png', 'pp2s.png', 'pp3s.png', 'pp4s.png', 'pp5s.png', 'pp6s.png', 'pp7s.png',
    'pr0.png', 'pr2.png', 'pr4.png', 'pr6.png',
    'panh.png', 'panv.png',
    'fire.png', 'vlcn.png', 'tree.png', 'vcnt.png', 'clud.png', 'watg.png',
    'bar0.png', 'bar1.png', 'bar2.png', 'bar3.png',
    'start.png', 'quit.png', 'hiscore.png', 'cursor.png'
  ];

  class AssetLoader {
    constructor(base = 'assets/original/images/') {
      this.base = base;
      this.sprites = [];
    }

    loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Unable to load ${src}`));
        img.src = src;
      });
    }

    colorKey(img, index) {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const key = index < 3 ? [255, 0, 0] : [0, 0, 255];
      for (let i = 0; i < data.data.length; i += 4) {
        if (data.data[i] === key[0] && data.data[i + 1] === key[1] && data.data[i + 2] === key[2]) {
          data.data[i + 3] = 0;
        }
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(data, 0, 0);
      return canvas;
    }

    async load() {
      const images = await Promise.all(spriteFiles.map(name => this.loadImage(this.base + name)));
      this.sprites = images.map((img, i) => this.colorKey(img, i));
      return this;
    }
  }

  W.Assets = { AssetLoader, spriteFiles };
})(window);
