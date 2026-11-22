// SPDX-License-Identifier: GPL-3.0-only
// Libre Arcade addition. English and Italian. Same language rule and same
// storage key as the arcade's own landing page, so the choice carries over.

export const LANG_KEY = 'libre-arcade-lang';

export const STRINGS = {
  en: {
    docTitle: 'Irisa · Libre Arcade',
    tagline: 'Get your beautiful purple circle to that sweet sweet green pentagon.',
    play: 'Play',
    playAgain: 'Play again',
    resume: 'Resume',
    restart: 'Restart level',
    menu: 'Main menu',
    paused: 'Paused',
    pause: 'Pause',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    language: 'Language',
    backToArcade: 'Libre Arcade',
    levelN: 'Level {n} of {total}',
    levelLabel: 'Level {n}',
    levels: 'Levels',
    board: 'Game board',
    controls: 'Touch controls',
    up: 'Move up',
    down: 'Move down',
    left: 'Move left',
    right: 'Move right',
    won: 'Level complete',
    lost: 'Caught. Try again',
    completeTitle: 'That\'s all for now',
    completeText: 'Thanks for playing!',
    howTitle: 'How to play',
    how: [
      'Move one square at a time with the arrow keys or W A S D. On a touchscreen use the arrow buttons or swipe on the board.',
      'Reach the green pentagon to finish the level.',
      'After every move, each red star takes one step towards you, sideways and up or down at once. If one reaches you, the level starts again.',
      'A star that walks into a wall disappears. Two stars that meet turn into a wall.',
      'Dashed circles come in pairs: step on one and you come out of the other.',
      'A yellow numbered circle freezes the stars for that many moves.',
      'The grey square with a red star swaps roles: every star becomes a wall and every wall becomes a star, and the stars wait for one move.',
      'R restarts the level, P or Esc pauses, M mutes the sound.',
    ],
    creditsTitle: 'Credits',
    creditsGame: 'Irisa by <a href="http://matthewminer.com" rel="noopener">Matthew Miner</a>, made for the Global Game Jam 2017 (MIT license).',
    creditsSound: 'Sound effects from Kenney\'s <a href="https://kenney.nl/assets/digital-audio" rel="noopener">Digital Audio</a> pack (CC0).',
    creditsArcade: 'Restored for <a href="../../index.html">Libre Arcade</a>. <a href="https://github.com/linkingtechnologies/libre-arcade/blob/main/irisa/public/CREDITS.md" rel="noopener">Full credits and licenses</a>.',
    footerBy: 'bits and bytes by',
  },
  it: {
    docTitle: 'Irisa · Libre Arcade',
    tagline: 'Porta il tuo bel cerchio viola fino al dolcissimo pentagono verde.',
    play: 'Gioca',
    playAgain: 'Gioca ancora',
    resume: 'Riprendi',
    restart: 'Ricomincia il livello',
    menu: 'Menu principale',
    paused: 'In pausa',
    pause: 'Pausa',
    soundOn: 'Audio acceso',
    soundOff: 'Audio spento',
    language: 'Lingua',
    backToArcade: 'Libre Arcade',
    levelN: 'Livello {n} di {total}',
    levelLabel: 'Livello {n}',
    levels: 'Livelli',
    board: 'Campo di gioco',
    controls: 'Comandi touch',
    up: 'Vai su',
    down: 'Vai giù',
    left: 'Vai a sinistra',
    right: 'Vai a destra',
    won: 'Livello completato',
    lost: 'Preso. Riprova',
    completeTitle: 'Per ora è tutto',
    completeText: 'Grazie per aver giocato!',
    howTitle: 'Come si gioca',
    how: [
      'Muoviti di una casella alla volta con le frecce o con W A S D. Sul touchscreen usa i pulsanti freccia oppure scorri il dito sul campo.',
      'Raggiungi il pentagono verde per finire il livello.',
      'Dopo ogni tua mossa, ogni stella rossa fa un passo verso di te, anche in diagonale. Se una ti raggiunge, il livello ricomincia.',
      'Una stella che entra in un muro sparisce. Due stelle che si incontrano diventano un muro.',
      'I cerchi tratteggiati sono a coppie: entra in uno ed esci dall\'altro.',
      'Un cerchio giallo numerato blocca le stelle per quel numero di mosse.',
      'Il quadrato grigio con la stella rossa scambia i ruoli: ogni stella diventa un muro e ogni muro diventa una stella, e le stelle aspettano per una mossa.',
      'R ricomincia il livello, P o Esc mette in pausa, M toglie l\'audio.',
    ],
    creditsTitle: 'Crediti',
    creditsGame: 'Irisa di <a href="http://matthewminer.com" rel="noopener">Matthew Miner</a>, realizzato per la Global Game Jam 2017 (licenza MIT).',
    creditsSound: 'Effetti sonori dal pacchetto <a href="https://kenney.nl/assets/digital-audio" rel="noopener">Digital Audio</a> di Kenney (CC0).',
    creditsArcade: 'Restaurato per <a href="../../index.html">Libre Arcade</a>. <a href="https://github.com/linkingtechnologies/libre-arcade/blob/main/irisa/public/CREDITS.md" rel="noopener">Crediti e licenze completi</a>.',
    footerBy: 'bit e byte di',
  },
};

export function pickLanguage (stored, browserLanguages) {
  if (stored && STRINGS[stored]) {
    return stored;
  }
  const first = (browserLanguages && browserLanguages[0]) || '';
  return first.toLowerCase().startsWith('it') ? 'it' : 'en';
}

export function format (template, values = {}) {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key]));
}

export function createI18n (initial) {
  let lang = STRINGS[initial] ? initial : 'en';
  return {
    get lang () {
      return lang;
    },
    set (next) {
      if (STRINGS[next]) {
        lang = next;
      }
    },
    t (key, values) {
      const value = STRINGS[lang][key];
      return typeof value === 'string' ? format(value, values) : value;
    },
  };
}
