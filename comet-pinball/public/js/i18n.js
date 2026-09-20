/* UI strings only. Historical sources, physics, geometry and native oracles are not localized. */
(function(root,factory){
  const api=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.CometI18n=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(root){
  'use strict';
  const STORAGE_KEY='comet-pinball-language';
  const copy={
    en:{
      tagline:'The space pinball game',score:'SCORE',ball:'BALL',follow:'◉ Follow ball',overview:'▦ Full table',
      viewTitle:'Switch between following the ball and viewing the full table',
      boardLabel:'Comet Pinball: playable pinball table',canvasLabel:'Playing field',launch:'🚀 LAUNCH',space:'Space',
      stuck:'Ball stuck?',stuckAction:'Choose what to do',controls:'Game controls',left:'left',right:'right',launchWord:'launch',pauseWord:'pause',
      touchHelp:'Hold the flippers · Tap Launch',sfxTitle:'Turn sound effects on or off',musicTitle:'Turn music on or off',
      volume:'Music volume',pause:'Pause Ⅱ',resume:'▶ Resume',restart:'Restart ↻',menu:'Menu ☰',
      sfxOn:'🔊 Effects on',sfxOff:'🔇 Effects off',musicOn:'♫ Music on',musicOff:'♫ Music off',
      ballEnded:'Ball ended',ballLost:'Ball lost',nextBall:'Next ball',
      newGameQuestion:'New game?',newGameBody:'Reset your score and start over?',newGameButton:'New game',backToGame:'Back to game',
      leaveQuestion:'Leave this game?',leaveBody:'Your current score will be lost.',leaveYes:'Yes, go to menu',
      pausedHeading:'PAUSED',pausedBody:'Your game is on hold. Resume whenever you like.',
      stuckPause:'Ball stuck? End this ball',backMenu:'Back to menu',forfeitQuestion:'End this ball?',
      forfeitBody:'Use this only if you cannot keep playing. This ball will count as lost; your score will not increase.',
      forfeitYes:'Yes, next ball',backPause:'Back to pause',
      intro:'Three balls. One space pinball table.<br>Hit the bumpers and set your high score!',play:'▶ PLAY',highScores:'🏆 High scores',creditsButton:'✦ Credits',
      menuTip:'← / →: flippers · Space: launch<br>On phones, use the buttons below.',
      creditsTitle:'CREDITS',original:'Original game (2013)',authors:'Patrick Haring and Christian Bürgi',restoration:'HTML5 restoration',
      libreProject:'A Libre Arcade project',visitLibre:'Visit Libre Arcade ↗',musicCredit:'Music',
      webLicense:'Web version code: Apache 2.0',originalSource:'Original game source ↗',backCredits:'← Back to menu',
      playerFallback:'Player',emptyScores:'Your score could be the first!',storageNote:'High scores are available for this session only: your browser does not allow local saving.',
      gameOver:'GAME OVER',totalPrefix:'You scored',points:'points',playerPlaceholder:'Your name',playerAria:'Player name',saveRecord:'Save score',playAgain:'Play again',
      languageButton:'Language: English. Switch to Italian',languageTitle:'Switch to Italian',pageTitle:'Comet Pinball — Play'
    },
    it:{
      tagline:'Il flipper spaziale',score:'PUNTEGGIO',ball:'PALLINA',follow:'◉ Segui pallina',overview:'▦ Tavolo intero',
      viewTitle:'Alterna la telecamera che segue la pallina e il tavolo intero',
      boardLabel:'Comet Pinball: flipper giocabile',canvasLabel:'Campo di gioco',launch:'🚀 LANCIA',space:'Spazio',
      stuck:'Pallina ferma?',stuckAction:'Scegli cosa fare',controls:'Comandi di gioco',left:'sinistro',right:'destro',launchWord:'lancio',pauseWord:'pausa',
      touchHelp:'Tieni premuti i flipper · Tocca Lancia',sfxTitle:'Attiva o disattiva gli effetti sonori',musicTitle:'Attiva o disattiva la colonna sonora',
      volume:'Volume musica',pause:'Pausa Ⅱ',resume:'▶ Riprendi',restart:'Ricomincia ↻',menu:'Menu ☰',
      sfxOn:'🔊 Effetti accesi',sfxOff:'🔇 Effetti spenti',musicOn:'♫ Musica accesa',musicOff:'♫ Musica spenta',
      ballEnded:'Pallina terminata',ballLost:'Pallina persa',nextBall:'Prossima pallina',
      newGameQuestion:'Nuova partita?',newGameBody:'Vuoi azzerare il punteggio e ricominciare?',newGameButton:'Nuova partita',backToGame:'Torna alla partita',
      leaveQuestion:'Uscire dalla partita?',leaveBody:'I punti della partita in corso andranno persi.',leaveYes:'Sì, vai al menu',
      pausedHeading:'IN PAUSA',pausedBody:'La partita è ferma. Puoi riprendere quando vuoi.',
      stuckPause:'Pallina bloccata? Termina questa pallina',backMenu:'Torna al menu',forfeitQuestion:'Terminare questa pallina?',
      forfeitBody:'Serve solo se non riesci più a giocarla. La pallina sarà conteggiata come persa; il punteggio non aumenta.',
      forfeitYes:'Sì, passa alla prossima',backPause:'Torna alla pausa',
      intro:'Tre palline. Un tavolo spaziale.<br>Colpisci i bumper e fai il tuo record!',play:'▶ GIOCA',highScores:'🏆 Record',creditsButton:'✦ Crediti',
      menuTip:'← / →: flipper · Spazio: lancio<br>Su telefono, usa i pulsanti sotto.',
      creditsTitle:'CREDITI',original:'Gioco originale (2013)',authors:'Patrick Haring e Christian Bürgi',restoration:'Restauro HTML5',
      libreProject:'Un progetto di Libre Arcade',visitLibre:'Visita Libre Arcade ↗',musicCredit:'Musica',
      webLicense:'Codice della versione web: Apache 2.0',originalSource:'Sorgenti del gioco originale ↗',backCredits:'← Torna al menu',
      playerFallback:'Giocatore',emptyScores:'Il primo record può essere il tuo!',storageNote:'Record disponibili soltanto in questa sessione: il browser non permette il salvataggio locale.',
      gameOver:'PARTITA FINITA',totalPrefix:'Hai totalizzato',points:'punti',playerPlaceholder:'Il tuo nome',playerAria:'Nome giocatore',saveRecord:'Salva il record',playAgain:'Rigioca',
      languageButton:'Lingua: italiano. Passa a inglese',languageTitle:'Passa a inglese',pageTitle:'Comet Pinball — Gioca'
    }
  };
  function browserLanguage(nav){
    const values=(Array.isArray(nav?.languages)&&nav.languages.length?nav.languages:[nav?.language]).filter(Boolean);
    return values.some(value=>/^it(?:-|$)/i.test(String(value)))?'it':'en';
  }
  function readLanguage(storage,nav){
    try{const selected=storage?.getItem(STORAGE_KEY);if(selected==='it'||selected==='en')return selected;}catch{}
    return browserLanguage(nav);
  }
  function safeStorage(){try{return root.localStorage;}catch{return null;}}
  let language=readLanguage(safeStorage(),root.navigator);
  function getLanguage(){return language;}
  function t(key){if(!Object.prototype.hasOwnProperty.call(copy.en,key))throw new Error('Missing UI translation: '+key);return copy[language][key];}
  function setLanguage(next,persist=true){
    if(next!=='it'&&next!=='en')return language;
    language=next;
    if(persist){try{safeStorage()?.setItem(STORAGE_KEY,next);}catch{}}
    return language;
  }
  return {t,getLanguage,setLanguage,browserLanguage,readLanguage,copy,STORAGE_KEY};
});
