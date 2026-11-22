// SPDX-FileCopyrightText: 2026 Libre Arcade contributors
// SPDX-License-Identifier: GPL-3.0-or-later
//
// English (default, the original text) and Italian for every string the 2013 game draws.
// Translation only replaces the text of a label when it is created; sizes, positions and timing are untouched.
// English is used unless the browser's language is Italian; ?lang=it or ?lang=en overrides.
(function () {
  "use strict";

  var IT = {
    "How to heal’em in three steps": "Come curarli in tre passi",
    "1st": "1°", "2nd": "2°", "3rd": "3°",
    "Move with arrows": "Usa le frecce",
    "Find Healing Gun": "Trova la pistola",
    "Use your Gun!": "Usa la pistola!",
    "Give me some zombies": "Dammi degli zombie",
    "The End": "Fine",
    "You did it!\nIf you like the game, follow us on twitter.\nAlso please give us some feedback.\nThanks for your time!":
      "Ce l'hai fatta!\nSe il gioco ti è piaciuto, seguici su Twitter.\nLasciaci anche un commento.\nGrazie per il tuo tempo!",
    "Back to all levels": "Torna ai livelli",
    "Game Over": "Game over",
    "Looks like these zombies cannot hope for your help :/\nBe better next time!":
      "Pare che questi zombie non possano sperare nel tuo aiuto :/\nFai meglio la prossima volta!",
    "All levels": "Livelli",
    "Everything begins here!": "Tutto comincia qui!",
    "Well done!": "Ben fatto!",
    "Play next": "Avanti",
    "There's a cure for zombies": "C'è una cura per gli zombie",
    "Continue": "Continua",
    "created by @krzysu and @pawelmadeja, follow us for updates": "creato da @krzysu e @pawelmadeja, seguici per gli aggiornamenti",
    "Paused": "In pausa",
    "I need to find the way out of here": "Devo trovare la via d'uscita",
    "I need the key": "Mi serve la chiave",
    "Nice! Now I need to 'jump' inside the door": "Bene! Ora devo 'saltare' dentro la porta",
    "I found the gun, I can shoot pressing Spacebar": "Ho trovato la pistola, posso sparare con la barra spaziatrice",
    "I'm out of ammo": "Sono senza munizioni",
    "I found the key, now I need to find the the door": "Ho trovato la chiave, ora devo trovare la porta",
    "I need to be more careful": "Devo stare più attento",
    "I feel better now!": "Ora sto meglio!",
    "That hurts!": "Ahi, che male!",
    "I was bitten. I'm turning. Nooo!": "Mi hanno morso. Mi sto trasformando. Noooo!",
    "I need to kill myself": "Devo uccidermi",
    "Ok, back to business": "Ok, torniamo al lavoro",
    "Loading...": "Caricamento...",
    "Imagine, what if the cure exists? What if zombies plague can be stoped? Explore old, abandoned graveyard, heal as many zombies as you can, and find your way out. But be careful not to become one of them!":
      "Immagina che la cura esista. E se la piaga degli zombie si potesse fermare? Esplora un vecchio cimitero abbandonato, cura più zombie che puoi e trova la via d'uscita. Ma attento a non diventare uno di loro!",
    "Heal'em All. There's a cure for zombies. HTML5 game.": "Heal'em All. C'è una cura per gli zombie. Gioco HTML5."
  };
  // Labels built from numbers: "Health collected: 2/6"
  var IT_PATTERNS = [
    [/^Health collected: (.*)$/, "Salute raccolta: $1"],
    [/^Zombies healed: (.*)$/, "Zombie curati: $1"],
    [/^Bullets wasted: (.*)$/, "Proiettili sprecati: $1"],
    [/^Zombie Mode: done$/, "Modalità zombie: fatta"],
    [/^Zombie Mode: not found$/, "Modalità zombie: non trovata"]
  ];

  function pickLanguage() {
    var m = /[?&]lang=(it|en)\b/.exec(window.location.search);
    if (m) { return m[1]; }
    var l = (navigator.languages && navigator.languages[0]) || navigator.language || "en";
    return /^it\b/i.test(l) ? "it" : "en";
  }

  var lang = pickLanguage();
  function t(text) {
    if (lang !== "it" || typeof text !== "string") { return text; }
    if (Object.prototype.hasOwnProperty.call(IT, text)) { return IT[text]; }
    for (var i = 0; i < IT_PATTERNS.length; i++) {
      if (IT_PATTERNS[i][0].test(text)) { return text.replace(IT_PATTERNS[i][0], IT_PATTERNS[i][1]); }
    }
    return text;
  }

  window.HealI18n = { lang: lang, t: t, strings: IT };
  document.documentElement.lang = lang;

  // The page's own text (splash screen, title, description)
  document.title = t(document.title);
  var desc = document.querySelector('meta[name="description"]');
  if (desc) { desc.setAttribute("content", t(desc.getAttribute("content"))); }
  function translateDom() {
    var nodes = document.querySelectorAll("#loading .loading-text, #loading h2");
    for (var i = 0; i < nodes.length; i++) { nodes[i].textContent = t(nodes[i].textContent); }
  }
  translateDom();
})();
