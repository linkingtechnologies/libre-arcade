// SPDX-License-Identifier: GPL-3.0-only
// Accessibility + save/resume shim for the unmodified Twine 1.4.2 story engine.
// It never touches story data or engine code: it only decorates the links the
// engine renders and reports the engine's own history hash to the host page.
(function () {
  'use strict';
  var area = null;

  function navLinks() {
    return Array.prototype.filter.call(
      document.querySelectorAll('#passages .passage a'),
      function (a) { return !a.classList.contains('cyclingLink'); }
    );
  }
  function allLinks() { return Array.prototype.slice.call(document.querySelectorAll('#passages .passage a')); }

  function decorate() {
    allLinks().forEach(function (a) {
      a.setAttribute('tabindex', '0');
      a.setAttribute('role', 'link');
      a.removeAttribute('data-key');
    });
    navLinks().slice(0, 9).forEach(function (a, i) { a.setAttribute('data-key', String(i + 1)); });
  }

  function report() {
    try { var h = (window.state && window.state.hash) || window.location.hash;
      window.parent.postMessage({ type: 'trapped-state', hash: h }, '*'); } catch { /* standalone */ }
  }

  function onChange() {
    decorate();
    window.setTimeout(report, 120);
  }

  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var links = allLinks();
    var i = links.indexOf(document.activeElement);
    if (/^[1-9]$/.test(e.key)) {
      var t = navLinks()[Number(e.key) - 1];
      if (t) { e.preventDefault(); t.click(); }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!links.length) return;
      e.preventDefault();
      var n = e.key === 'ArrowDown' ? i + 1 : i - 1;
      links[(n + links.length) % links.length].focus();
    } else if ((e.key === 'Enter' || e.key === ' ') && i >= 0) {
      e.preventDefault();
      links[i].click();
    }
  });

  function start() {
    area = document.getElementById('passages');
    if (!area) return;
    new MutationObserver(onChange).observe(area, { childList: true, subtree: true });
    window.addEventListener('hashchange', report);
    window.addEventListener('popstate', report);
    onChange();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
