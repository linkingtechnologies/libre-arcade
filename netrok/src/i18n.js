/* Netrok bilingual UI (IT/EN) - SPDX-License-Identifier: GPL-3.0-or-later */
(() => {
  'use strict';
  const KEY = 'netrok095.language.v1';
  const autoLanguage = () => ((navigator.language || 'en').toLowerCase().startsWith('it') ? 'it' : 'en');
  const STRINGS = {
    en: {
      'brand.edition':'Web Edition','common.menu':'Menu','common.game':'Game','common.options':'Options','common.cheats':'Cheats','common.extras':'Extras','common.instructions':'Instructions','common.about':'About',
      'common.loading':'Loading…','common.loading_netrok':'Loading Netrok…','common.retry':'Retry','common.ready':'Ready','common.saved_ready':'Ready · saved game available',
      'common.run':'RUN','common.jump':'JUMP','common.flag':'FLAG','common.run_aria':'Run','common.jump_aria':'Jump','common.flag_aria':'Place checkpoint flag','common.shield':'Shield','common.close_menu':'Close menu',
      'common.up':'Up','common.down':'Down','common.left':'Left','common.right':'Right','common.touch_controls':'Touch game controls','common.game_canvas':'Netrok game canvas','common.game_area':'Netrok game',
      'game.resume':'Resume','game.continue_saved':'Continue saved game','game.back_to_game':'Back to game','game.new':'New game','game.restart':'Restart level','game.classic_menu':'Classic menu',
      'game.save_hint':'Progress is saved automatically. Continue lets you pick up where you left off. Cheat and custom-level runs are kept separate.',
      'options.title':'Options','options.music':'Music','options.effects':'Sound effects','options.touch':'Touch controls','options.touch_auto':'Automatic','options.touch_on':'Always show','options.touch_off':'Hide',
      'options.display':'Display','options.display_original':'Original','options.display_soft':'Soft','options.display_enhanced':'Enhanced','options.display_hint':'Choose the look you prefer. This does not change the gameplay.',
      'options.language':'Language','options.english':'English','options.italian':'Italiano',
      'cheat.title':'Cheat mode','cheat.warning':'Cheats are just for fun. High scores are disabled while they are on.','cheat.enable':'Enable cheat mode','cheat.lives':'Infinite lives',
      'cheat.invulnerable':'Invulnerable to enemies & spikes','cheat.freeze':'Freeze level timer','cheat.shields':'Infinite shields','cheat.powerup':'Power-up','cheat.normal':'Normal','cheat.red_shoes':'Red shoes','cheat.blue_shirt':'Blue shirt',
      'cheat.jump_level':'Jump to level','cheat.go':'Go','cheat.fill_shields':'Fill shields','cheat.add_score':'+5000 score','cheat.hint':'Falling out of the level can still defeat Netrok. Cheat settings reset when the page is reloaded.',
      'extras.title':'Extras','extras.editor':'Level Editor','extras.play_custom':'Play custom level','extras.import':'Import level file','extras.clear':'Clear custom level','extras.none':'No custom level saved in this browser.',
      'extras.ready':'Custom level ready: {name}.','extras.imported':'Imported {name}. Ready to play or edit.','extras.import_failed':'Import failed: {message}','extras.cleared':'Custom level cleared.','extras.hint':'Create and play your own levels. Custom levels do not affect your normal high score.',
      'instructions.title':'Instructions','instructions.move':'Move','instructions.move_text':'<kbd>←</kbd> <kbd>→</kbd> move · <kbd>↑</kbd> <kbd>↓</kbd> climb ladders.','instructions.jump_run':'Jump & run','instructions.jump_run_text':'<kbd>Space</kbd> / <kbd>Alt</kbd> jumps. <kbd>Shift</kbd> / <kbd>Ctrl</kbd> runs.',
      'instructions.checkpoint':'Checkpoint flag','instructions.checkpoint_text':'<kbd>Home</kbd> / <kbd>Delete</kbd> places your one checkpoint flag for the level. It costs points and cannot be moved again in the same level.',
      'instructions.shields':'Shields','instructions.shields_text':'Use numpad <kbd>8</kbd> / <kbd>4</kbd> / <kbd>2</kbd> / <kbd>6</kbd> to choose the shield to move, then its destination. Moving a shield costs points. Collect 20 red shield coins for a new shield.',
      'instructions.enemies':'Enemies','instructions.enemies_text':'Attack from a safe side. Spikes matter: upgrades can protect Netrok from attacks that would otherwise be lethal. Avoid the large spikes.',
      'instructions.score':'Score & lives','instructions.score_text':'Some helpful actions cost points; fast level completion and defeated enemies add points. Every 5,000 points earned grants an extra life.',
      'about.title':'About','about.p1':'Netrok is a platform game created in 2004 by Ioan-Tudor Parvulescu.','about.p2':'This edition adds modern controls, saving, display options, cheats and a level editor.','about.p3':'Credits and license details are included with the game files.',
      'dialog.new_confirm':'Start a new game? Current saved progress will be replaced.','file.too_large':'Level file is too large.','file.invalid_level':'This file is not a valid Netrok level.','file.invalid_bg':'This level has an invalid background color.','file.unsupported_blocks':'This level contains unsupported blocks.',
      'load.failed':'Load failed: {message}','load.unable':'Unable to load Netrok. Check the game files and retry.','load.unknown':'Unknown loading error',
      'status.skip_intro':'Press Enter to skip the intro.','status.classic_menu':'Classic menu.','status.playing':'Playing.','status.saved_restore':'Saved game restored at level {n}.','status.custom_ready':'Custom level ready.','status.level':'Level {n}','status.ready':'Ready.','status.load_failed':'The game could not load. Please retry.',
      'status.checkpoint_2000':'Checkpoint placed: -2000 points.','status.checkpoint_2500':'Checkpoint placed: -2500 points.','status.one_up':'1 UP: 5000 points earned.','status.cheat_on':'Cheat mode enabled.','status.cheat_off':'Cheat mode disabled.',
      'editor.title':'Netrok Level Editor','editor.subtitle':'Create your own level','editor.back':'Back to game','editor.tools_label':'Level tools','editor.start_from':'Start from','editor.load':'Load','editor.new':'New level','editor.undo':'Undo','editor.redo':'Redo','editor.zoom':'Zoom','editor.grid':'Grid','editor.screen':'Screen',
      'editor.tools':'Tools','editor.drawing_tools':'Drawing tools','editor.paint':'Paint','editor.erase':'Erase','editor.fill':'Fill','editor.pick':'Pick','editor.clouds':'Clouds','editor.cloud':'Cloud {n}','editor.background':'Background','editor.bg_color':'Background color','editor.red':'Red','editor.green':'Green','editor.blue':'Blue',
      'editor.file':'File','editor.import':'Import level','editor.export':'Export level','editor.save_draft':'Save draft','editor.load_draft':'Load draft','editor.playtest':'Playtest','editor.note':'Built-in levels are never changed.',
      'editor.cursor':'x {x} · y {y} · block {block}','editor.map_aria':'Scrollable Netrok level map','editor.blocks':'Blocks','editor.selected':'Selected:','editor.blocks_aria':'Blocks','editor.help':'Editor help',
      'editor.help1':'Choose a block, then click or drag on the level to draw. Use Erase to remove blocks and Fill to fill an area.','editor.help2':'Use <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> for undo/redo. Use <kbd>[</kbd> / <kbd>]</kbd> to move between sections.',
      'editor.level':'Level {n}','editor.level_copy':'Level {n} copy','editor.untitled':'Untitled custom level','editor.modified':'• modified','editor.imported':'Imported {name}.','editor.loaded_copy':'Loaded a writable copy of level {n}.','editor.blank':'Blank level created.',
      'editor.cloud_no_fit':'Cloud does not fit at this position.','editor.cloud_placed':'Cloud placed.','editor.cloud_prompt':'Cloud {n}: click the top-left map cell.','editor.block_title':'Block {id}','editor.missing_asset':'Missing block image {id}.png',
      'editor.exported':'Level exported.','editor.draft_saved':'Draft saved.','editor.draft_save_fail':'Could not save draft.','editor.draft_loaded':'Draft loaded.','editor.no_draft':'No saved draft found.','editor.playtest_fail':'Could not prepare playtest.',
      'editor.ready':'Ready. Level 1 loaded as a copy.','editor.asset_fail':'Editor could not load required images: {message}'
    },
    it: {
      'brand.edition':'Edizione Web','common.menu':'Menu','common.game':'Gioco','common.options':'Opzioni','common.cheats':'Trucchi','common.extras':'Extra','common.instructions':'Istruzioni','common.about':'Informazioni',
      'common.loading':'Caricamento…','common.loading_netrok':'Caricamento di Netrok…','common.retry':'Riprova','common.ready':'Pronto','common.saved_ready':'Pronto · partita salvata disponibile',
      'common.run':'CORRI','common.jump':'SALTA','common.flag':'BANDIERA','common.run_aria':'Corri','common.jump_aria':'Salta','common.flag_aria':'Posiziona bandiera checkpoint','common.shield':'Scudo','common.close_menu':'Chiudi menu',
      'common.up':'Su','common.down':'Giù','common.left':'Sinistra','common.right':'Destra','common.touch_controls':'Comandi touch','common.game_canvas':'Area di gioco Netrok','common.game_area':'Gioco Netrok',
      'game.resume':'Riprendi','game.continue_saved':'Continua partita salvata','game.back_to_game':'Torna al gioco','game.new':'Nuova partita','game.restart':'Ricomincia livello','game.classic_menu':'Menu classico',
      'game.save_hint':'I progressi vengono salvati automaticamente. Puoi continuare da dove avevi lasciato. Le partite con trucchi o livelli personalizzati restano separate.',
      'options.title':'Opzioni','options.music':'Musica','options.effects':'Effetti sonori','options.touch':'Comandi touch','options.touch_auto':'Automatici','options.touch_on':'Sempre visibili','options.touch_off':'Nascosti',
      'options.display':'Grafica','options.display_original':'Originale','options.display_soft':'Morbida','options.display_enhanced':'Migliorata','options.display_hint':'Scegli l’aspetto che preferisci. Il gioco non cambia.',
      'options.language':'Lingua','options.english':'English','options.italian':'Italiano',
      'cheat.title':'Modalità trucchi','cheat.warning':'I trucchi servono solo per divertirsi. Quando sono attivi il record non viene aggiornato.','cheat.enable':'Attiva modalità trucchi','cheat.lives':'Vite infinite',
      'cheat.invulnerable':'Invulnerabile a nemici e spuntoni','cheat.freeze':'Blocca il tempo','cheat.shields':'Scudi infiniti','cheat.powerup':'Potenziamento','cheat.normal':'Normale','cheat.red_shoes':'Scarpe rosse','cheat.blue_shirt':'Maglia blu',
      'cheat.jump_level':'Vai al livello','cheat.go':'Vai','cheat.fill_shields':'Riempi scudi','cheat.add_score':'+5000 punti','cheat.hint':'Cadere fuori dal livello può comunque sconfiggere Netrok. I trucchi si azzerano ricaricando la pagina.',
      'extras.title':'Extra','extras.editor':'Editor livelli','extras.play_custom':'Gioca livello personalizzato','extras.import':'Importa livello','extras.clear':'Cancella livello personalizzato','extras.none':'Nessun livello personalizzato salvato.',
      'extras.ready':'Livello personalizzato pronto: {name}.','extras.imported':'Importato {name}. Pronto da giocare o modificare.','extras.import_failed':'Importazione fallita: {message}','extras.cleared':'Livello personalizzato cancellato.','extras.hint':'Crea e gioca i tuoi livelli. I livelli personalizzati non modificano il record normale.',
      'instructions.title':'Istruzioni','instructions.move':'Movimento','instructions.move_text':'<kbd>←</kbd> <kbd>→</kbd> per muoversi · <kbd>↑</kbd> <kbd>↓</kbd> per salire e scendere dalle scale.','instructions.jump_run':'Salto e corsa','instructions.jump_run_text':'<kbd>Spazio</kbd> / <kbd>Alt</kbd> per saltare. <kbd>Maiusc</kbd> / <kbd>Ctrl</kbd> per correre.',
      'instructions.checkpoint':'Bandiera checkpoint','instructions.checkpoint_text':'<kbd>Home</kbd> / <kbd>Canc</kbd> posiziona l’unica bandiera checkpoint del livello. Costa punti e non può essere spostata nello stesso livello.',
      'instructions.shields':'Scudi','instructions.shields_text':'Usa <kbd>8</kbd> / <kbd>4</kbd> / <kbd>2</kbd> / <kbd>6</kbd> del tastierino numerico per scegliere lo scudo da spostare e poi la destinazione. Spostare uno scudo costa punti. Raccogli 20 monete rosse per ottenere un nuovo scudo.',
      'instructions.enemies':'Nemici','instructions.enemies_text':'Attacca dal lato sicuro. Gli spuntoni contano: i potenziamenti possono proteggere Netrok da attacchi altrimenti letali. Evita gli spuntoni grandi.',
      'instructions.score':'Punti e vite','instructions.score_text':'Alcune azioni utili costano punti; finire in fretta i livelli e sconfiggere i nemici ne fa guadagnare. Ogni 5.000 punti ottenuti ricevi una vita extra.',
      'about.title':'Informazioni','about.p1':'Netrok è un platform creato nel 2004 da Ioan-Tudor Parvulescu.','about.p2':'Questa edizione aggiunge comandi moderni, salvataggio, opzioni grafiche, trucchi e un editor di livelli.','about.p3':'Crediti e dettagli sulla licenza sono inclusi nei file del gioco.',
      'dialog.new_confirm':'Vuoi iniziare una nuova partita? I progressi salvati verranno sostituiti.','file.too_large':'Il file del livello è troppo grande.','file.invalid_level':'Questo file non è un livello Netrok valido.','file.invalid_bg':'Il livello contiene un colore di sfondo non valido.','file.unsupported_blocks':'Il livello contiene blocchi non supportati.',
      'load.failed':'Caricamento fallito: {message}','load.unable':'Impossibile caricare Netrok. Controlla i file del gioco e riprova.','load.unknown':'Errore di caricamento sconosciuto',
      'status.skip_intro':'Premi Invio per saltare l’introduzione.','status.classic_menu':'Menu classico.','status.playing':'In gioco.','status.saved_restore':'Partita ripristinata al livello {n}.','status.custom_ready':'Livello personalizzato pronto.','status.level':'Livello {n}','status.ready':'Pronto.','status.load_failed':'Impossibile caricare il gioco. Riprova.',
      'status.checkpoint_2000':'Checkpoint posizionato: -2000 punti.','status.checkpoint_2500':'Checkpoint posizionato: -2500 punti.','status.one_up':'1 UP: 5000 punti guadagnati.','status.cheat_on':'Modalità trucchi attivata.','status.cheat_off':'Modalità trucchi disattivata.',
      'editor.title':'Editor livelli Netrok','editor.subtitle':'Crea il tuo livello','editor.back':'Torna al gioco','editor.tools_label':'Strumenti livello','editor.start_from':'Parti da','editor.load':'Carica','editor.new':'Nuovo livello','editor.undo':'Annulla','editor.redo':'Ripristina','editor.zoom':'Zoom','editor.grid':'Griglia','editor.screen':'Schermata',
      'editor.tools':'Strumenti','editor.drawing_tools':'Strumenti di disegno','editor.paint':'Disegna','editor.erase':'Cancella','editor.fill':'Riempi','editor.pick':'Seleziona','editor.clouds':'Nuvole','editor.cloud':'Nuvola {n}','editor.background':'Sfondo','editor.bg_color':'Colore dello sfondo','editor.red':'Rosso','editor.green':'Verde','editor.blue':'Blu',
      'editor.file':'File','editor.import':'Importa livello','editor.export':'Esporta livello','editor.save_draft':'Salva bozza','editor.load_draft':'Carica bozza','editor.playtest':'Prova livello','editor.note':'I livelli inclusi nel gioco non vengono mai modificati.',
      'editor.cursor':'x {x} · y {y} · blocco {block}','editor.map_aria':'Mappa scorrevole del livello Netrok','editor.blocks':'Blocchi','editor.selected':'Selezionato:','editor.blocks_aria':'Blocchi','editor.help':'Aiuto editor',
      'editor.help1':'Scegli un blocco, poi fai clic o trascina sul livello per disegnare. Usa Cancella per rimuovere i blocchi e Riempi per riempire un’area.','editor.help2':'Usa <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> per annullare/ripristinare. Usa <kbd>[</kbd> / <kbd>]</kbd> per spostarti tra le sezioni.',
      'editor.level':'Livello {n}','editor.level_copy':'Copia livello {n}','editor.untitled':'Livello personalizzato senza nome','editor.modified':'• modificato','editor.imported':'Importato {name}.','editor.loaded_copy':'Caricata una copia modificabile del livello {n}.','editor.blank':'Creato un livello vuoto.',
      'editor.cloud_no_fit':'La nuvola non entra in questa posizione.','editor.cloud_placed':'Nuvola posizionata.','editor.cloud_prompt':'Nuvola {n}: fai clic sulla casella in alto a sinistra.','editor.block_title':'Blocco {id}','editor.missing_asset':'Manca l’immagine del blocco {id}.png',
      'editor.exported':'Livello esportato.','editor.draft_saved':'Bozza salvata.','editor.draft_save_fail':'Impossibile salvare la bozza.','editor.draft_loaded':'Bozza caricata.','editor.no_draft':'Nessuna bozza salvata trovata.','editor.playtest_fail':'Impossibile preparare la prova del livello.',
      'editor.ready':'Pronto. Il livello 1 è stato caricato come copia.','editor.asset_fail':'L’editor non riesce a caricare le immagini necessarie: {message}'
    }
  };

  function readLanguage() {
    try {
      const saved = localStorage.getItem(KEY);
      return saved === 'it' || saved === 'en' ? saved : autoLanguage();
    } catch (_) { return autoLanguage(); }
  }
  let language = readLanguage();
  function format(text, vars) {
    return String(text).replace(/\{(\w+)\}/g, (_, k) => Object.prototype.hasOwnProperty.call(vars || {}, k) ? vars[k] : `{${k}}`);
  }
  function t(key, vars = {}) {
    const table = STRINGS[language] || STRINGS.en;
    return format(table[key] ?? STRINGS.en[key] ?? key, vars);
  }
  function varsFor(el) {
    const raw = el.dataset.i18nVars || '';
    const vars = {};
    raw.split(',').forEach(part => {
      const i = part.indexOf(':');
      if (i > 0) vars[part.slice(0, i).trim()] = part.slice(i + 1).trim();
    });
    return vars;
  }
  function apply(root = document) {
    document.documentElement.lang = language;
    root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n, varsFor(el)); });
    root.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml, varsFor(el)); });
    root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria, varsFor(el))); });
    root.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle, varsFor(el)); });
    root.querySelectorAll('[data-language-select]').forEach(el => { el.value = language; });
  }
  function setLanguage(next) {
    if (next !== 'it' && next !== 'en') return;
    language = next;
    try { localStorage.setItem(KEY, language); } catch (_) {}
    apply(document);
    document.dispatchEvent(new CustomEvent('netrok-language-change', { detail: { language } }));
  }
  function translateGameMessage(message) {
    const msg = String(message || '');
    const exact = {
      'Press Enter to skip the intro.':'status.skip_intro','Classic menu.':'status.classic_menu','Playing.':'status.playing','Custom level ready.':'status.custom_ready','Ready.':'status.ready',
      'The game could not load. Please retry.':'status.load_failed','Jump-in flag placed: -2000 score (0.95 source behavior).':'status.checkpoint_2000','Jump-in flag placed without ground below: -2500 score.':'status.checkpoint_2500',
      '1 UP: 5000 earned points.':'status.one_up','Cheat mode enabled.':'status.cheat_on','Cheat mode disabled.':'status.cheat_off'
    };
    if (exact[msg]) return t(exact[msg]);
    let m = msg.match(/^Saved game restored at level (\d+)\.$/); if (m) return t('status.saved_restore',{n:m[1]});
    m = msg.match(/^Level (\d+)$/); if (m) return t('status.level',{n:m[1]});
    return msg;
  }
  function bindLanguageSelectors(root = document) {
    root.querySelectorAll('[data-language-select]').forEach(el => {
      el.value = language;
      if (el.dataset.i18nBound) return;
      el.dataset.i18nBound = '1';
      el.addEventListener('change', () => setLanguage(el.value));
    });
  }
  window.NetrokI18n = { t, apply, setLanguage, getLanguage: () => language, translateGameMessage, bindLanguageSelectors };
  apply(document);
  bindLanguageSelectors(document);
})();
