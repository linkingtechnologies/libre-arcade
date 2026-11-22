// SPDX-FileCopyrightText: 2026 Umberto Bresciani
// SPDX-License-Identifier: GPL-3.0-or-later

// English and Italian. The English wording of the story and the controls follows the original's
// How to play screen (README.md, Petar Petrov); the Italian is a translation made for this port.

export const LANGS = ["en", "it"];

export const TEXT = {
  en: {
    title: "Raging Gardens",
    subtitle: "A hungry ninja rabbit, a field of carrots, three minutes.",
    play: "Play game", howto: "How to play", credits: "Credits", back: "Back", language: "Language",
    pause: "Pause", resume: "Resume", restart: "Restart", menu: "Main menu", playAgain: "Play again",
    music: "Music", sound: "Sound effects", on: "on", off: "off",
    time: "Time", carrots: "Carrots", best: "Best", score: "Score",
    gameOver: "Time is up!",
    gameOverText: "You are left with {n} carrots.",
    newBest: "New best score!",
    noCarrots: "You have no carrots to eat!",
    paused: "Paused",
    storyTitle: "Story",
    story: "It's a lovely day at the farmer's field. A great time for a hungry (ninja) rabbit to sneak in and pull some carrots to eat. Too bad you weren't the only one with that idea. A horde of hungry opponents approaches fast! Pull as many carrots as you can in 3 minutes. To fight your opponents, you must use ancient rabbitjutsu tactics. These are slightly unorthodox. Simply uhm ... fart to push your opponents away or use a Carrot-on-a-Fork totem decoy to deceive them.",
    controlsTitle: "Goal and controls",
    goal: "Collect as many carrots as possible in 3 minutes. Use the controls to move and repel opponents.",
    keyMove: "Arrow keys", keyMoveText: "Move your ninja rabbit on the map.",
    keyPull: "Z (or Y)", keyPullText: "Hold down to pull a carrot from the ground. You need to be close to a carrot.",
    keyPush: "Q", keyPushText: "Eat 1 carrot and fart to push nearby opponents away from you.",
    keyFork: "W", keyForkText: "Eat 2 carrots and spawn a \"Carrot-on-a-Fork\" totem on your position that attracts opponents and gives you time to pull more carrots elsewhere on the map.",
    keyPauseText: "P or Esc pauses the game.",
    touchTitle: "On a touch screen",
    touchText: "Use the arrows on the left, hold the carrot button to pull, and tap the other two buttons to repel opponents or plant the totem.",
    btnPull: "Pull", btnPush: "Push", btnFork: "Totem",
    creditsGame: "Original game",
    creditsGameText: "Raging Gardens, by Petar Petrov (game design and programming), made for the GitHub Game Off 2012 (honorable mention).",
    creditsArt: "Artwork in this version",
    creditsArtText: "The original artwork by Stremena Tuzsuzova is all rights reserved and is not included. The pictures here are drawn by this program's own code, and are new work, not the historical artwork.",
    creditsSound: "Sound",
    creditsSoundText: "Music: \"Trouble in the Garden\" by Augmentality (Brandon Morris), via OpenGameArt, CC0, the music of the original game too. Sound effects are synthesised by this program; the original recordings are not included.",
    creditsLibs: "Libraries",
    creditsLibsText: "The original used CraftyJS, jQuery, Backbone, RequireJS, Underscore, Modernizr and javascript-astar. This version needs none of them; its path finding is the original javascript-astar code (MIT, Brian Grinstead; heap by Marijn Haverbeke, CC BY 3.0).",
    creditsArcade: "This version",
    creditsArcadeText: "A restoration for Libre Arcade, GPL-3.0-or-later. The game logic is a port of the original (MIT) checked frame by frame against the original game.",
    creditsRepo: "Source code and the rest of the collection:",
  },
  it: {
    title: "Raging Gardens",
    subtitle: "Un coniglio ninja affamato, un campo di carote, tre minuti.",
    play: "Gioca", howto: "Come si gioca", credits: "Crediti", back: "Indietro", language: "Lingua",
    pause: "Pausa", resume: "Riprendi", restart: "Ricomincia", menu: "Menu principale", playAgain: "Gioca ancora",
    music: "Musica", sound: "Effetti sonori", on: "attivo", off: "spento",
    time: "Tempo", carrots: "Carote", best: "Record", score: "Punteggio",
    gameOver: "Tempo scaduto!",
    gameOverText: "Ti restano {n} carote.",
    newBest: "Nuovo record!",
    noCarrots: "Non hai carote da mangiare!",
    paused: "In pausa",
    storyTitle: "La storia",
    story: "È una bella giornata nel campo del contadino. Il momento giusto perché un coniglio (ninja) affamato si infili e strappi qualche carota da mangiare. Peccato che non fossi l'unico con questa idea. Una orda di avversari affamati si avvicina in fretta! Strappa più carote che puoi in 3 minuti. Per combattere gli avversari devi usare le antiche tattiche del rabbitjutsu, un po' poco ortodosse. Semplicemente, ehm... scoreggia per spingere via gli avversari, oppure usa un totem esca, la Carota-su-una-Forca, per ingannarli.",
    controlsTitle: "Obiettivo e comandi",
    goal: "Raccogli più carote che puoi in 3 minuti. Usa i comandi per muoverti e respingere gli avversari.",
    keyMove: "Frecce", keyMoveText: "Muovi il tuo coniglio ninja sulla mappa.",
    keyPull: "Z (o Y)", keyPullText: "Tieni premuto per strappare una carota dal terreno. Devi essere vicino a una carota.",
    keyPush: "Q", keyPushText: "Mangia 1 carota e scoreggia per spingere lontano gli avversari vicini.",
    keyFork: "W", keyForkText: "Mangia 2 carote e pianta nella tua posizione un totem \"Carota-su-una-Forca\" che attira gli avversari e ti dà il tempo di strappare altre carote altrove.",
    keyPauseText: "P o Esc mette il gioco in pausa.",
    touchTitle: "Su touch screen",
    touchText: "Usa le frecce a sinistra, tieni premuto il tasto carota per strappare, tocca gli altri due tasti per respingere gli avversari o piantare il totem.",
    btnPull: "Strappa", btnPush: "Spingi", btnFork: "Totem",
    creditsGame: "Gioco originale",
    creditsGameText: "Raging Gardens, di Petar Petrov (ideazione e programmazione), realizzato per il GitHub Game Off 2012 (menzione d'onore).",
    creditsArt: "Grafica di questa versione",
    creditsArtText: "La grafica originale di Stremena Tuzsuzova è con tutti i diritti riservati e non è inclusa. Le immagini qui sono disegnate dal codice di questo programma: sono lavoro nuovo, non la grafica storica.",
    creditsSound: "Suoni",
    creditsSoundText: "Musica: \"Trouble in the Garden\" di Augmentality (Brandon Morris), da OpenGameArt, CC0, la stessa musica del gioco originale. Gli effetti sonori sono sintetizzati da questo programma; le registrazioni originali non sono incluse.",
    creditsLibs: "Librerie",
    creditsLibsText: "L'originale usava CraftyJS, jQuery, Backbone, RequireJS, Underscore, Modernizr e javascript-astar. Questa versione non ne richiede nessuna; la ricerca dei percorsi è il codice originale di javascript-astar (MIT, Brian Grinstead; heap di Marijn Haverbeke, CC BY 3.0).",
    creditsArcade: "Questa versione",
    creditsArcadeText: "Un restauro per Libre Arcade, GPL-3.0-or-later. La logica di gioco è un porting dell'originale (MIT) verificato fotogramma per fotogramma contro il gioco originale.",
    creditsRepo: "Codice sorgente e il resto della collezione:",
  },
};

export function detectLang(navigatorLike = globalThis.navigator, stored = null) {
  if (stored && TEXT[stored]) return stored;
  const list = (navigatorLike && (navigatorLike.languages && navigatorLike.languages.length ? navigatorLike.languages : [navigatorLike.language])) || [];
  for (const l of list) {
    const code = String(l || "").toLowerCase().slice(0, 2);
    if (TEXT[code]) return code;
  }
  return "en";
}

export function t(lang, key, vars) {
  const s = (TEXT[lang] && TEXT[lang][key]) ?? TEXT.en[key] ?? key;
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k])) : s;
}
