/* Netrok SFont browser adapter - based on recovered SFont behavior.
 * SPDX-License-Identifier: GPL-3.0-or-later
 */
(() => {
  'use strict';
  class SFont {
    constructor(image, charPos) {
      this.image = image;
      this.charPos = charPos;
      this.maxPos = image ? image.width - 1 : 0;
      this.height = image ? image.height - 1 : 9;
    }

    textWidth(text) {
      if (!text) return 0;
      let width = 0;
      for (const ch of String(text)) {
        const offset = (ch.charCodeAt(0) - 33) * 2 + 1;
        if (ch === ' ' || offset < 0 || offset > this.maxPos || offset + 1 >= this.charPos.length) {
          width += this.charPos[2] - this.charPos[1];
        } else {
          width += this.charPos[offset + 1] - this.charPos[offset];
        }
      }
      return width;
    }

    write(ctx, x, y, text) {
      if (!this.image || text == null) return;
      let dx = x;
      for (const ch of String(text)) {
        const offset = (ch.charCodeAt(0) - 33) * 2 + 1;
        if (ch === ' ' || offset < 0 || offset > this.maxPos || offset + 2 >= this.charPos.length) {
          dx += this.charPos[2] - this.charPos[1];
          continue;
        }
        const srcW = Math.floor((this.charPos[offset + 2] + this.charPos[offset + 1]) / 2) -
          Math.floor((this.charPos[offset] + this.charPos[offset - 1]) / 2);
        const srcX = Math.floor((this.charPos[offset] + this.charPos[offset - 1]) / 2);
        const dstX = Math.round(dx - (this.charPos[offset] - this.charPos[offset - 1]) / 2);
        ctx.drawImage(this.image, srcX, 1, srcW, this.height, dstX, Math.round(y), srcW, this.height);
        dx += this.charPos[offset + 1] - this.charPos[offset];
      }
    }

    writeCenter(ctx, y, text, width = 320) {
      this.write(ctx, Math.floor(width / 2 - this.textWidth(text) / 2), y, text);
    }
  }
  window.NetrokSFont = SFont;
})();
