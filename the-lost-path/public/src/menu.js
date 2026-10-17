// Menu, instructions, credits and the Italian/English switch for The Lost
// Path. Not part of upstream: script.js has no interface text of its own
// beyond a timer and three end-of-round messages, so this file only adds
// dialogs and translates those strings after script.js writes them.
(function () {
  const I18N = globalThis.LPI18N;
  let lang = 'en';

  const t = (key) => I18N[lang][key] || key;
  const langBtn = document.getElementById('langBtn');
  const helpDialog = document.getElementById('helpDialog');
  const creditsDialog = document.getElementById('creditsDialog');
  const difficultyDialog = document.getElementById('difficultyDialog');
  const timer = document.getElementById('timer');
  const ARROWS = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

  // The exact English strings script.js writes into the end-of-round overlay.
  const UPSTREAM = {
    'Congratulations! You finished the maze :)': 'won',
    'You Won! But at what cost :(': 'wonCheat',
    "Time's Up! Try Again.": 'lost',
  };

  function applyI18n() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    langBtn.textContent = lang === 'en' ? 'IT' : 'EN';
  }

  // script.js writes English text into the timer and into the overlay;
  // rewrite it in the current language as soon as it appears.
  function translate(text) {
    for (const code of ['en', 'it']) {
      const label = I18N[code].time + ':';
      if (text.startsWith(label)) return t('time') + ':' + text.slice(label.length);
    }
    if (UPSTREAM[text]) return t(UPSTREAM[text]);
    for (const code of ['en', 'it']) {
      for (const key of ['won', 'wonCheat', 'lost']) if (text === I18N[code][key]) return t(key);
    }
    return text;
  }

  function retranslate(node) {
    const next = translate(node.textContent);
    if (next !== node.textContent) node.textContent = next;
  }

  new MutationObserver(() => retranslate(timer)).observe(timer, { childList: true, characterData: true, subtree: true });
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType === 1 && node.tagName === 'DIV' && node !== timer) retranslate(node);
      }
    }
  }).observe(document.body, { childList: true });

  function closeMenus() {
    document.querySelectorAll('.toolbarMenu[open]').forEach((d) => d.removeAttribute('open'));
  }

  function openDialog(dialog) {
    closeMenus();
    // Let go of any arrow key the game thinks is held.
    ARROWS.forEach((key) => document.dispatchEvent(new KeyboardEvent('keyup', { key })));
    dialog.showModal();
  }

  // While a dialog is open the arrow keys must not steer the game behind it.
  document.addEventListener('keydown', (e) => {
    if (document.querySelector('dialog[open]') && ARROWS.includes(e.key)) e.stopImmediatePropagation();
  }, true);

  document.querySelectorAll('dialog').forEach((dialog) => {
    dialog.querySelector('.close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  });

  document.getElementById('newBtn').addEventListener('click', closeMenus);
  document.getElementById('difficultyBtn').addEventListener('click', () => openDialog(difficultyDialog));

  // Apply a difficulty by setting script.js's (patched, see specs/design.md)
  // maze size and timer settings, then starting a fresh maze.
  function setDifficulty(name) {
    const level = globalThis.LPDifficulty[name];
    globalThis.LPCurrent = level;
    rows = level.size;
    cols = level.size;
    timeBase = level.base;
    timePerTile = level.perTile;
    restartGame();
    document.querySelectorAll('.level').forEach((b) => b.classList.toggle('current', b.dataset.level === name));
  }
  document.querySelectorAll('.level').forEach((b) => {
    b.addEventListener('click', () => {
      setDifficulty(b.dataset.level);
      difficultyDialog.close();
    });
  });
  document.getElementById('helpBtn').addEventListener('click', () => openDialog(helpDialog));
  document.getElementById('creditsBtn').addEventListener('click', () => openDialog(creditsDialog));
  langBtn.addEventListener('click', () => {
    lang = lang === 'en' ? 'it' : 'en';
    applyI18n();
    retranslate(timer);
  });
  // Opening one menu closes the other.
  document.querySelectorAll('.toolbarMenu').forEach((menu) => {
    menu.addEventListener('toggle', () => {
      if (!menu.open) return;
      document.querySelectorAll('.toolbarMenu[open]').forEach((d) => { if (d !== menu) d.removeAttribute('open'); });
    });
  });

  applyI18n();
  // Start on Normal, but let the player choose first.
  setDifficulty('normal');
  openDialog(difficultyDialog);
})();
