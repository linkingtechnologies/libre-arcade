/* Copyright (C) 2026 Libre Arcade contributors; SPDX-License-Identifier: AGPL-3.0-or-later */
export const strings = {
  en: {
    title: '100-Square Challenge', play: 'Play', home: 'Main menu', tagline: 'How far can you get?',
    newGame: 'Start new game', undo: 'Undo last move', credits: 'Credits',
    back: 'Back', close: 'Close', startPlaying: 'Start playing', help: 'How to play', language: 'Language',
    progress: 'Squares filled', ready: 'Choose the highlighted square to begin.',
    playing: 'Select a highlighted square.',
    blocked: 'No more moves. Start a new game or undo your last move.',
    complete: 'All 100 squares filled!',
    helpBody: 'Start at the top-left square with 1. Fill the grid in order, moving like a chess knight: two squares along one axis and one along the other. You can land only on an empty square. Highlighted squares show your available moves. Try to reach 100.',
    helpControls: 'Click or tap a highlighted square. With a keyboard, use the arrow keys to choose a square, then press Enter or Space.',
    creditsTitle: 'Credits',
    original: 'Original game: 100-Square Challenge (TAJJAVA, 2011), created by Jasen Borisov.',
    port: 'Restored for browsers by Libre Arcade (2026).',
    license: 'Free software under GNU AGPLv3 or later. Source code and license are linked below.',
    archive: 'Libre Arcade', board: 'Game board', menu: 'Game menu',
    sourceLink: 'Source code & notices ↗', soundOn: 'Turn sound on', soundOff: 'Turn sound off', soundUnavailable: 'Sound unavailable',
    cellEmpty: 'Empty square', cellNumber: 'Square', selected: 'current position', available: 'available move',
    restartConfirm: 'Start a new game? Your current progress will be lost.',
  },
  it: {
    title: '100-Square Challenge', play: 'Gioca', home: 'Menu principale', tagline: 'Fin dove riesci ad arrivare?',
    newGame: 'Nuova partita', undo: 'Annulla ultima mossa', credits: 'Crediti',
    back: 'Indietro', close: 'Chiudi', startPlaying: 'Inizia a giocare', help: 'Come si gioca', language: 'Lingua',
    progress: 'Caselle riempite', ready: 'Seleziona la casella evidenziata per iniziare.',
    playing: 'Scegli una casella evidenziata.',
    blocked: 'Non ci sono altre mosse. Inizia una nuova partita oppure annulla l’ultima mossa.',
    complete: 'Hai riempito tutte e 100 le caselle!',
    helpBody: 'Inizia dalla casella in alto a sinistra, inserendo 1. Riempi la griglia in ordine, muovendoti come il cavallo degli scacchi: due caselle lungo un asse e una lungo l’altro. Puoi atterrare soltanto sulle caselle vuote. Le caselle evidenziate indicano le mosse consentite. Prova ad arrivare a 100.',
    helpControls: 'Clicca o tocca una casella evidenziata. Con la tastiera usa le frecce per scegliere una casella, quindi premi Invio o Spazio.',
    creditsTitle: 'Crediti',
    original: 'Gioco originale: 100-Square Challenge (TAJJAVA, 2011), creato da Jasen Borisov.',
    port: 'Restauro per browser: Libre Arcade (2026).',
    license: 'Software libero sotto licenza GNU AGPLv3 o successiva. Qui sotto trovi sorgenti e licenza.',
    archive: 'Libre Arcade', board: 'Griglia di gioco', menu: 'Menu di gioco',
    sourceLink: 'Sorgenti e note legali ↗', soundOn: 'Attiva audio', soundOff: 'Disattiva audio', soundUnavailable: 'Audio non disponibile',
    cellEmpty: 'Casella vuota', cellNumber: 'Casella', selected: 'posizione attuale', available: 'mossa disponibile',
    restartConfirm: 'Iniziare una nuova partita? I progressi attuali andranno persi.',
  },
};

export function preferredLanguage() {
  const first = navigator.languages?.[0] || navigator.language || 'en';
  return /^it(?:-|$)/i.test(first) ? 'it' : 'en';
}
