export const DEFAULT_LANGUAGE = 'en';
export const SUPPORTED_LANGUAGES = Object.freeze(['en', 'it']);

const TEXT = Object.freeze({
  en: Object.freeze({
    'aria.canvas': 'For Science! game canvas',
    'aria.mainMenu': 'Main menu',
    'aria.options': 'Options',
    'aria.help': 'How to play',
    'menu.start': 'Start Game',
    'menu.demo': 'Demo',
    'menu.help': 'How to Play',
    'menu.options': 'Options',
    'menu.quit': 'Quit',
    'options.music': 'Music',
    'options.fullscreen': 'Fullscreen',
    'options.language': 'Language',
    'common.back': 'Back',
    'help.title': 'How to Play',
    'help.match': 'Match 3 or more cells to collect money, attacks and shield repairs.',
    'help.turn': "Each turn, either swap two adjacent cells or use one available item. Destroy Dr Z's base before he destroys yours.",
    'help.controls': '<strong>Mouse / touch:</strong> select cells or items. <strong>ESC:</strong> return to the menu. <strong>Ctrl/Cmd + F:</strong> fullscreen.',
    'help.credit': 'Original game by Juan J. Martínez for PyWeek 16, 2013.',
    'status.loading': 'Loading…',
    'status.quit': 'Thanks for playing. You can close this tab.',
    'status.startError': 'Unable to start. Reload the page to try again.',
    'game.ready': 'Ready?',
    'game.tipHuman': 'click 2 adjacent cells to swap',
    'game.tipDemo': 'press ESC to leave the demo',
    'game.newBoard': 'New Board',
    'game.timeout': 'Timeout!',
    'game.drXWon': 'Dr X Won!',
    'game.drZWon': 'Dr Z Won!',
    'game.youWon': 'You Won!',
    'game.gameOver': 'Game Over',
    'game.thanks': 'Thanks for playing!',
    'game.youLose': 'You lose!',
    'game.move': 'MOVE!',
    'asset.shield': 'Shield UP!',
    'asset.cow': 'Orbital Cow!',
    'asset.meteorite': 'Meteor Burst!',
    'asset.rocket': 'Rocket!',
    'asset.laser': 'Laser Beam!',
  }),
  it: Object.freeze({
    'aria.canvas': 'Area di gioco di For Science!',
    'aria.mainMenu': 'Menu principale',
    'aria.options': 'Opzioni',
    'aria.help': 'Come si gioca',
    'menu.start': 'Inizia partita',
    'menu.demo': 'Demo',
    'menu.help': 'Come si gioca',
    'menu.options': 'Opzioni',
    'menu.quit': 'Esci',
    'options.music': 'Musica',
    'options.fullscreen': 'Schermo intero',
    'options.language': 'Lingua',
    'common.back': 'Indietro',
    'help.title': 'Come si gioca',
    'help.match': 'Allinea 3 o più caselle per raccogliere denaro, attacchi e riparazioni dello scudo.',
    'help.turn': 'A ogni turno puoi scambiare due caselle adiacenti oppure usare un oggetto disponibile. Distruggi la base del Dr Z prima che lui distrugga la tua.',
    'help.controls': '<strong>Mouse / touch:</strong> seleziona caselle o oggetti. <strong>ESC:</strong> torna al menu. <strong>Ctrl/Cmd + F:</strong> schermo intero.',
    'help.credit': 'Gioco originale di Juan J. Martínez per PyWeek 16, 2013.',
    'status.loading': 'Caricamento…',
    'status.quit': 'Grazie per aver giocato. Puoi chiudere questa scheda.',
    'status.startError': 'Impossibile avviare il gioco. Ricarica la pagina e riprova.',
    'game.ready': 'Pronto?',
    'game.tipHuman': 'seleziona 2 caselle adiacenti per scambiarle',
    'game.tipDemo': 'premi ESC per uscire dalla demo',
    'game.newBoard': 'Nuova griglia',
    'game.timeout': 'Tempo scaduto!',
    'game.drXWon': 'Dr X ha vinto!',
    'game.drZWon': 'Dr Z ha vinto!',
    'game.youWon': 'Hai vinto!',
    'game.gameOver': 'Partita finita',
    'game.thanks': 'Grazie per aver giocato!',
    'game.youLose': 'Hai perso!',
    'game.move': 'MOSSA!',
    'asset.shield': 'Scudo su!',
    'asset.cow': 'Mucca orbitale!',
    'asset.meteorite': 'Pioggia di meteoriti!',
    'asset.rocket': 'Razzo!',
    'asset.laser': 'Raggio laser!',
  }),
});

function safeStorage() {
  try { return globalThis.localStorage; } catch { return null; }
}

export function normalizeLanguage(value) {
  const language = String(value || '').toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;
}

export function readLanguagePreference(storage = safeStorage(), browserLanguage = globalThis.navigator?.language) {
  try {
    const saved = storage?.getItem('forscience.language');
    if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  } catch { /* optional preference only */ }
  return normalizeLanguage(browserLanguage);
}

export function writeLanguagePreference(language, storage = safeStorage()) {
  const normalized = normalizeLanguage(language);
  try { storage?.setItem('forscience.language', normalized); } catch { /* optional preference only */ }
  return normalized;
}

export function translate(language, key) {
  const normalized = normalizeLanguage(language);
  return TEXT[normalized]?.[key] ?? TEXT[DEFAULT_LANGUAGE]?.[key] ?? key;
}

export class I18n {
  constructor(language = readLanguagePreference()) {
    this.language = normalizeLanguage(language);
  }

  t(key) {
    return translate(this.language, key);
  }

  setLanguage(language, { persist = true } = {}) {
    this.language = persist ? writeLanguagePreference(language) : normalizeLanguage(language);
    return this.language;
  }

  applyDocument(root = document) {
    root.documentElement?.setAttribute('lang', this.language);

    root.querySelectorAll?.('[data-i18n]').forEach((element) => {
      element.textContent = this.t(element.dataset.i18n);
    });
    root.querySelectorAll?.('[data-i18n-html]').forEach((element) => {
      element.innerHTML = this.t(element.dataset.i18nHtml);
    });
    root.querySelectorAll?.('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', this.t(element.dataset.i18nAriaLabel));
    });
  }
}
