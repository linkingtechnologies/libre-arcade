/* Elemental One restoration - integration layer (Libre Arcade), not historical code.
 * SPDX-License-Identifier: MIT
 * English / Italian strings. In-game texts are keyed by the ORIGINAL English
 * string from upstream's src/data.js and src/main.js, so the historical source
 * stays untouched; arcade.js swaps them at the moment Phaser creates a text. */
(function () {
  'use strict';

  var STR = {
    en: {
      'ui.arcade': 'Libre Arcade', 'ui.pause': 'Pause', 'ui.resume': 'Resume', 'ui.restart': 'Restart level',
      'ui.menu': 'Menu', 'ui.mute': 'Mute', 'ui.unmute': 'Unmute', 'ui.info': 'Info', 'ui.close': 'Close',
      'ui.paused': 'Paused',
      'title.sub': 'You only get one element.',
      'title.by': 'A game by Zaven Muradyan, 2013–2014. Restored for Libre Arcade.',
      'title.play': 'Play', 'title.how': 'How to play', 'title.credits': 'Credits',
      'pad.grab': 'Z grab', 'pad.drop': 'X drop', 'pad.use': 'Space', 'pad.enter': 'Enter',
      'how.title': 'How to play',
      'how.body':
        '<p>Reach the glowing star at the end of each of the four levels.</p>' +
        '<ul><li><b>Arrow keys</b>: left and right to walk, up to jump, down to duck.</li>' +
        '<li><b>Z</b>: pick up a powergem you are standing on.</li>' +
        '<li><b>Space</b>: unleash the element of your gem (stand still on the ground).</li>' +
        '<li><b>X</b>: drop your gem so you can pick up another.</li>' +
        '<li><b>Enter</b>: start from the title menu.</li></ul>' +
        '<p>You can carry only one powergem at a time. Blocks vanish only when hit by their own element: ' +
        'blue gems (water), green (earth), red (fire), yellow (air).</p>' +
        '<p>On a touch screen, use the on-screen buttons, which press the same keys. ' +
        'The extra keys here: P pauses, M mutes.</p>',
      'credits.title': 'Credits',
      'credits.body':
        '<p><b>Elemental One</b> &copy; 2014 Zaven Muradyan, MIT License. Made along the theme of Ludum Dare 28, built with Phaser 1.1.3.<br>' +
        '<a href="https://github.com/voithos/elemental-one" target="_blank" rel="noopener">github.com/voithos/elemental-one</a> (commit 609636d)</p>' +
        '<p>Restoration for Libre Arcade: the original game code and levels are unchanged; see PROVENANCE.md and GAMEPLAY-PARITY.md in the game folder.</p>' +
        '<p><b>Art:</b> Kenney (kenney.nl), CC0.<br>' +
        '<b>Music</b> &ldquo;Happy Arcade Tune&rdquo;: rezoner, CC BY 3.0.<br>' +
        '<b>Sound effects:</b> air: remaxim (CC0); water: kurt (CC BY 3.0); earth: qubodup (CC BY 3.0); fire and pickup: p0ss (CC BY-SA 3.0 / GPL); jump: synthesized for this restoration.<br>' +
        '<b>Font:</b> Jersey 10, &copy; The Soft Type Project Authors, SIL OFL 1.1 (replaces the original Minecraftia, which is personal-use only).</p>' +
        '<p>Phaser &copy; Photon Storm Ltd., Pixi.js &copy; Mat Groves, PolyK &copy; Ivan Kuckir: MIT.</p>' +
        '<p><a href="https://linkingtechnologies.github.io/libre-arcade/">Libre Arcade</a></p>'
    },
    it: {
      'ui.arcade': 'Libre Arcade', 'ui.pause': 'Pausa', 'ui.resume': 'Riprendi', 'ui.restart': 'Riavvia livello',
      'ui.menu': 'Menu', 'ui.mute': 'Muto', 'ui.unmute': 'Audio', 'ui.info': 'Info', 'ui.close': 'Chiudi',
      'ui.paused': 'In pausa',
      'title.sub': 'Puoi avere un solo elemento.',
      'title.by': 'Un gioco di Zaven Muradyan, 2013–2014. Restaurato per Libre Arcade.',
      'title.play': 'Gioca', 'title.how': 'Come si gioca', 'title.credits': 'Crediti',
      'pad.grab': 'Z prendi', 'pad.drop': 'X lascia', 'pad.use': 'Spazio', 'pad.enter': 'Invio',
      'how.title': 'Come si gioca',
      'how.body':
        '<p>Raggiungi la stella luminosa alla fine di ciascuno dei quattro livelli.</p>' +
        '<ul><li><b>Frecce</b>: sinistra e destra per camminare, su per saltare, giù per abbassarti.</li>' +
        '<li><b>Z</b>: raccogli la gemma su cui ti trovi.</li>' +
        '<li><b>Spazio</b>: scatena l’elemento della tua gemma (fermo a terra).</li>' +
        '<li><b>X</b>: lascia la gemma per poterne prendere un’altra.</li>' +
        '<li><b>Invio</b>: inizia dal menu del titolo.</li></ul>' +
        '<p>Puoi portare una sola gemma alla volta. I blocchi spariscono solo se colpiti dal loro elemento: ' +
        'gemme blu (acqua), verdi (terra), rosse (fuoco), gialle (aria).</p>' +
        '<p>Su touch screen usa i pulsanti a schermo, che premono gli stessi tasti. ' +
        'Tasti extra: P mette in pausa, M toglie l’audio.</p>',
      'credits.title': 'Crediti',
      'credits.body':
        '<p><b>Elemental One</b> &copy; 2014 Zaven Muradyan, licenza MIT. Nato sul tema di Ludum Dare 28, costruito con Phaser 1.1.3.<br>' +
        '<a href="https://github.com/voithos/elemental-one" target="_blank" rel="noopener">github.com/voithos/elemental-one</a> (commit 609636d)</p>' +
        '<p>Restauro per Libre Arcade: il codice originale e i livelli non sono modificati; vedi PROVENANCE.md e GAMEPLAY-PARITY.md nella cartella del gioco.</p>' +
        '<p><b>Grafica:</b> Kenney (kenney.nl), CC0.<br>' +
        '<b>Musica</b> “Happy Arcade Tune”: rezoner, CC BY 3.0.<br>' +
        '<b>Effetti sonori:</b> aria: remaxim (CC0); acqua: kurt (CC BY 3.0); terra: qubodup (CC BY 3.0); fuoco e raccolta: p0ss (CC BY-SA 3.0 / GPL); salto: sintetizzato per questo restauro.<br>' +
        '<b>Carattere:</b> Jersey 10, &copy; The Soft Type Project Authors, SIL OFL 1.1 (sostituisce l’originale Minecraftia, solo uso personale).</p>' +
        '<p>Phaser &copy; Photon Storm Ltd., Pixi.js &copy; Mat Groves, PolyK &copy; Ivan Kuckir: MIT.</p>' +
        '<p><a href="https://linkingtechnologies.github.io/libre-arcade/">Libre Arcade</a></p>'
    }
  };

  /* Keyed by the exact English strings the original game passes to game.add.text(). */
  var GAME_TEXT_IT = {
    'press enter': 'premi invio',
    'Hi! :D\nUse the arrow keys to move and jump about.\nTry to make it to the level exit!':
      'Ciao! :D\nUsa le frecce per muoverti e saltare.\nProva a raggiungere l’uscita del livello!',
    'Grab a powergem with the "Z" key.\nThen use the spacebar to unleash your element!':
      'Prendi una gemma con il tasto "Z".\nPoi usa la barra spaziatrice per scatenare il tuo elemento!',
    'Use your power to remove obstacles.\nEach obstacle type matches one of your elements.':
      'Usa il tuo potere per rimuovere gli ostacoli.\nOgni ostacolo corrisponde a uno dei tuoi elementi.',
    'Keep going!': 'Continua così!',
    'There are 4 types\nof powergems, but you\ncan only carry one at a time!':
      'Ci sono 4 tipi\ndi gemme, ma puoi\nportarne solo una alla volta!',
    'Use the "X" key to drop\nyour current powergem.\nThen, you can pick up a new one!':
      'Usa il tasto "X" per lasciare\nla gemma che hai.\nPoi potrai raccoglierne una nuova!',
    'From here on out,\nyou\'re on your own. :)': 'Da qui in poi\nti arrangi da solo. :)',
    'YOU WIN!': 'HAI VINTO!',
    'THE END': 'FINE'
  };

  window.I18N = { STR: STR, GAME_TEXT_IT: GAME_TEXT_IT };
})();
