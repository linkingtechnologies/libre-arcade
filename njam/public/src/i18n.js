export const I18N={
  it:{
    menu:['Un giocatore','Due giocatori','Duello a due','Opzioni','Editor livelli','Esci'],
    scroll:'NJAM 1.21 DI MILAN BABUSKOV               USA LE FRECCE PER MUOVERTI NEL MENU               PREMI INVIO PER SCEGLIERE               BUON DIVERTIMENTO!                              ',
    topColumns:'LIVELLO PUNTI', selectLevels:'SCEGLI LIVELLI', exited:'NJAM CHIUSO', returnEnter:'PREMI INVIO PER TORNARE',
    options:['Musica','Effetti','Aspetto','Lingua','Indietro'], on:'Sì', off:'No', random:'Casuale', style:'Aspetto', language:'Italiano',
    ready:['PRONTI','ATTENTI','VIA'], pause:'Pausa', resume:'Riprendi', restart:'Ricomincia', gameMenu:'Menu', paused:'PAUSA',
    level:'LIVELLO', points:'PUNTI', bonusLife:'VITA BONUS', livesLeft:'VITE RIMASTE', continueQuit:'SPAZIO PER CONTINUARE, ESC PER USCIRE',
    stats:'STATISTICHE', statsContinue:'SPAZIO PER CONTINUARE, ESC PER USCIRE',
    won:'COMPLIMENTI! HAI COMPLETATO TUTTI I LIVELLI.', anyKey:'PREMI UN TASTO PER CONTINUARE',
    hiscoreTitle:'BRAVO!', hiscoreSub:'SEI ENTRATO NELLA TOP 10', hiscoreName:'INSERISCI IL TUO NOME', hiscoreDone:'PREMI INVIO QUANDO HAI FINITO',
    helpBtn:'Istruzioni', fullscreen:'Schermo intero', helpTitle:'Come si gioca', close:'Chiudi',
    helpHtml:[
      '<b>Menu:</b> usa le frecce ↑/↓ e premi INVIO per scegliere. ESC torna indietro.',
      '<b>Giocatore 1:</b> frecce oppure WASD. <b>Giocatore 2:</b> R/F/D/G = su/giù/sinistra/destra.',
      '<b>Durante la partita:</b> P mette in pausa. SPAZIO continua dopo i riepiloghi. ESC torna indietro o abbandona la manche.',
      '<b>Editor livelli:</b> crea o modifica una mappa, scegli gli elementi e usa Prova per giocarla prima di salvarla.',
      'Su telefono puoi usare i controlli touch. Il pulsante Schermo intero è disponibile dove supportato.'
    ],
    editorTitle:'Editor livelli', load:'Carica', save:'Salva', saveAs:'Salva come', newLevels:'Nuovi livelli', cooperative:'Cooperativa', duel:'Duello', item:'elemento',
    editorSide:['LIVELLI','L CARICA','S SALVA','A SALVA+','K TIPO','', 'LIVELLO', 'P ATTIVO','U ANNULLA','C PULISCI','T PROVA','W SCAMBIA','Z PREC','X SUCC'],
    unsaved:'NON SALVATO', disabled:'LIVELLO OFF', editorFooter:'NJAM 1.21 EDITOR LIVELLI', openFile:'APRI FILE...', chooseSet:'SCEGLI LIVELLI',
    confirm:'SEI SICURO (S/N) ?', confirmExit:'VUOI DAVVERO USCIRE? (S/N)', swapped:'LIVELLI SCAMBIATI', loadFailed:'CARICAMENTO FALLITO', pressP:' PREMI P PER CAMBIARE.',
    errPlayable:'IL LIVELLO NON E ATTIVO', errDoor:'SERVE ESATTAMENTE UNA PORTA', errPentagram:'SERVE ESATTAMENTE UN PENTAGRAMMA',
    fileDescription:'Livelli Njam', gameOver:'FINE PARTITA', winner:'VINCITORE', invalidLevels:'FILE LIVELLI NON VALIDO', editorError:'OPERAZIONE NON RIUSCITA'
  },
  en:{
    menu:['One player game','Two player game','Two player duel','Options','Level editor','Exit'],
    scroll:'NJAM 1.21 BY MILAN BABUSKOV               USE ARROW KEYS TO NAVIGATE MENU               HIT ENTER TO SELECT               HAVE FUN!                              ',
    topColumns:'LEVEL SCORE', selectLevels:'SELECT LEVELS', exited:'NJAM EXITED', returnEnter:'PRESS ENTER TO RETURN',
    options:['Music','Sound','Look','Language','Back'], on:'On', off:'Off', random:'Random', style:'Style', language:'English',
    ready:['READY',' SET ',' GO  '], pause:'Pause', resume:'Resume', restart:'Restart', gameMenu:'Menu', paused:'PAUSED',
    level:'LEVEL', points:'PTS', bonusLife:'BONUS LIFE', livesLeft:'LIVES LEFT', continueQuit:'PRESS SPACE TO CONTINUE, ESC TO QUIT',
    stats:'GAME STATS', statsContinue:'PRESS SPACE TO CONTINUE, ESC TO EXIT',
    won:'CONGRATULATIONS! YOU COMPLETED ALL LEVELS.', anyKey:'PRESS ANY KEY TO CONTINUE',
    hiscoreTitle:'WELL DONE!', hiscoreSub:'YOU ENTERED THE TOP 10', hiscoreName:'ENTER YOUR NAME', hiscoreDone:'HIT ENTER WHEN DONE',
    helpBtn:'Instructions', fullscreen:'Fullscreen', helpTitle:'How to play', close:'Close',
    helpHtml:[
      '<b>Menu:</b> use ↑/↓ and press ENTER to select. ESC goes back.',
      '<b>Player 1:</b> arrow keys or WASD. <b>Player 2:</b> R/F/D/G = up/down/left/right.',
      '<b>During a game:</b> P pauses. SPACE continues after summaries. ESC goes back or leaves the round.',
      '<b>Level editor:</b> create or edit a map, choose the elements and use Test to play it before saving.',
      'On a phone you can use the touch controls. Fullscreen is available where supported.'
    ],
    editorTitle:'Level editor', load:'Load', save:'Save', saveAs:'Save as', newLevels:'New levels', cooperative:'Cooperative', duel:'Duel', item:'element',
    editorSide:['LEVELS','L LOAD','S SAVE','A SAVE AS','K MODE','', 'LEVEL', 'P ENABLED','U UNDO','C CLEAR','T TEST','W SWAP','Z PREV','X NEXT'],
    unsaved:'CHANGES NOT SAVED', disabled:'LEVEL DISABLED', editorFooter:'NJAM 1.21 LEVEL EDITOR', openFile:'OPEN FILE...', chooseSet:'SELECT LEVELSET',
    confirm:'ARE YOU SURE (Y/N) ?', confirmExit:'ARE YOU SURE YOU WISH TO EXIT? (Y/N)', swapped:'LEVELS SWAPPED', loadFailed:'LOAD FAILED', pressP:' PRESS P TO CHANGE.',
    errPlayable:'LEVEL IS NOT MARKED AS PLAYABLE', errDoor:'THERE MUST BE EXACTLY ONE DOOR', errPentagram:'THERE MUST BE EXACTLY ONE PENTAGRAM',
    fileDescription:'Njam levels', gameOver:'GAME OVER', winner:'WINNER', invalidLevels:'INVALID LEVEL FILE', editorError:'COULD NOT COMPLETE THE ACTION'
  }
};

export const MENU_INFO_IT=[
  {image:'G1',lines:['SHADDY','','SHADDY E UN FANTASMA CIECO. SI MUOVE A CASO E','SPESSO SVOLTA AGLI INCROCI. NON TORNA QUASI MAI','INDIETRO, TRANNE QUANDO SBATTE CONTRO UN MURO.','','ANCHE SE E CIECO, PERCEPISCE IL SUPERPOTERE E','SCAPPA COME GLI ALTRI FANTASMI.','','ESSERE INSEGUITI DA DUE O TRE SHADDY E UNA DELLE','SITUAZIONI PIU PERICOLOSE DEL GIOCO.']},
  {image:'G2',lines:['HUNTER','','HUNTER E IL FANTASMA INSEGUITORE. DI SOLITO VA','DRITTO E NON SVOLTA AGLI INCROCI. SE TI VEDE,','CAMBIA SUBITO DIREZIONE E TI DA LA CACCIA.','','SE SEI LONTANO PUOI NASCONDERTI DIETRO UN ANGOLO.','PUOI ANCHE ATTIRARLO E USARLO CONTRO GLI ALTRI.','HUNTER SEGUE IL GIOCATORE VISIBILE PIU VICINO.']},
  {image:'G0',lines:['ASSASSIN','','ASSASSIN E IL PIU PERICOLOSO. SI MUOVE COME','SHADDY, MA APPENA TI VEDE DIVENTA UN HUNTER.','SE TI PERDE DI VISTA PROSEGUE FINO AL MURO, POI','TORNA A MUOVERSI A CASO.','','PUOI FARLO DIVENTARE IL TUO INSEGUITORE, MA','FALLO CON MOLTA ATTENZIONE.']},
  {image:'P9',lines:['PENTAGRAMMA','','DA QUI ESCONO I FANTASMI.','','QUANDO E INATTIVO E NERO. PRIMA CHE ESCA UN','FANTASMA DIVENTA GIALLO, QUINDI FAI ATTENZIONE.','','RESTARE VICINO A UN PENTAGRAMMA GIALLO NON E UNA','BUONA IDEA, A MENO CHE TU ABBIA IL SUPERPOTERE.']},
  {image:'P1',lines:['LA PORTA','','QUANDO UN GIOCATORE VIENE ELIMINATO RESTA FUORI','PER UN BREVE PERIODO. POI RIENTRA ATTRAVERSO LA','PORTA. IN OGNI MAPPA C E SEMPRE UNA PORTA.','','SE VIENI BLOCCATO DA UNA TRAPPOLA, L ATTESA PRIMA','DEL RIENTRO RADDOPPIA.']},
  {image:'P2',lines:['JUICE (SUPERPOTERE)','','CON IL JUICE PUOI MANGIARE TUTTO CIO CHE SI MUOVE:','FANTASMI E ANCHE GLI ALTRI GIOCATORI.','','DURA POCO; VEDRAI IL CONTO ALLA ROVESCIA VICINO','AL GIOCATORE QUANDO STA PER FINIRE.','','NON PUOI PRENDERE UN ALTRO JUICE FINCHE IL POTERE','E ATTIVO. I FANTASMI TI SFUGGONO, A MENO CHE TU','SIA ANCHE INVISIBILE.']},
  {image:'P3',lines:['BISCOTTO','','I BISCOTTI SONO L OBIETTIVO DEL GIOCO. OGNUNO','VALE UN PUNTO E VINCE CHI TOTALIZZA PIU PUNTI.','','MANGIARE UN FANTASMA VALE 5 PUNTI.','','SE I GIOCATORI TERMINANO CON LO STESSO PUNTEGGIO,','LA PARTITA FINISCE IN PAREGGIO.']},
  {image:'P4',lines:['FREEZER','','BLOCCA I FANTASMI PER UN PERIODO LIMITATO, DUE','VOLTE PIU LUNGO DEL SUPERPOTERE.','','I FANTASMI NON POSSONO MUOVERSI, MA POSSONO','COMUNQUE MANGIARTI SE LI TOCCHI.']},
  {image:'P5',lines:['TRAPPOLA','','E UN PUNTO DEL TERRENO CHE PUOI ATTRAVERSARE UNA','SOLA VOLTA. DOPO IL PASSAGGIO SI CHIUDE E DIVENTA','UN MURO.','','SE PROVI A TORNARE SUBITO INDIETRO PUO ELIMINARTI.','I FANTASMI SONO IMMUNI ALLE TRAPPOLE.','','SE MUORI IN UNA TRAPPOLA NON PERDI UNA VITA, MA','DEVI ASPETTARE IL DOPPIO PRIMA DI RIENTRARE.']},
  {image:'P7',lines:['INVISIBILITA','','TI RENDE INVISIBILE AI FANTASMI. SHADDY E GIA','CIECO, QUINDI SU DI LUI NON CAMBIA NULLA.','','SE HAI ANCHE IL SUPERPOTERE PUOI MANGIARE I','FANTASMI SENZA FARLI SCAPPARE.','','L INVISIBILITA DURA TRE VOLTE IL SUPERPOTERE.']},
  {image:'P6',lines:['TELETRASPORTO','','ENTRANDO IN UN TELETRASPORTO VIENI SPOSTATO IN','UNO DEGLI ALTRI PRESENTI NELLA MAPPA, SCELTO A','CASO.','','MANTIENI LA DIREZIONE E CONTINUI A MUOVERTI SE','NON TROVI UN OSTACOLO.','','I FANTASMI CI PASSANO SOPRA: USALO PER SEMINARLI.']}
];
