/*
 * Terramancers HTML5 restoration - browser adaptation helpers.
 * Modified/ported for the HTML5 restoration: 2026-09-12.
 * SPDX-License-Identifier: GPL-3.0-or-later
 * See ../LICENSE and ../THIRD_PARTY_NOTICES.md.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TerramancersBrowserUtils = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function fitScene(sceneWidth, sceneHeight, viewportWidth, viewportHeight) {
    const sw = Math.max(1, Number(sceneWidth) || 1);
    const sh = Math.max(1, Number(sceneHeight) || 1);
    const vw = Math.max(1, Number(viewportWidth) || 1);
    const vh = Math.max(1, Number(viewportHeight) || 1);
    const scale = Math.min(vw / sw, vh / sh);
    const drawWidth = sw * scale;
    const drawHeight = sh * scale;
    return {
      scale,
      drawWidth,
      drawHeight,
      left: (vw - drawWidth) / 2,
      top: (vh - drawHeight) / 2
    };
  }

  return { fitScene };
});
