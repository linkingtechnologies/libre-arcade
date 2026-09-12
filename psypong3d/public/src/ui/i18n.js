// SPDX-License-Identifier: GPL-3.0-or-later
const S={
  en:{
    one:'1 PLAYER',two:'2 PLAYERS',how:'HOW TO PLAY',settings:'OPTIONS',about:'ABOUT',back:'BACK',pause:'PAUSE',resume:'RESUME',menu:'MENU',level:'LEVEL',score:'SCORE',winner:'PLAYER {n} WON!',demo:'GAME DEMO',
    warp:'Warp at the edges',swap:'Random side swap',rotate:'Camera rotation',reset:'Reset camera after a point',inc:'Level increases',startLevel:'Starting level',scoreLimit:'Points to win',apply:'APPLY',defaults:'DEFAULTS',
    howGoal:'Keep the ball in play and make it pass your opponent. The first player to reach the target score wins.',
    howSingle:'In 1-player mode you control Player 1 and the computer controls Player 2. In 2-player mode both paddles are human-controlled.',
    howControls:'Keyboard: Player 1 uses Q / A, Player 2 uses ↑ / ↓. Space pauses and Esc returns to the menu. Touch controls appear automatically on phones and tablets.',
    howEvents:'With the original options enabled, paddles can wrap around the top and bottom edges and the two sides may occasionally swap after a point.',
    howPace:'The game gradually becomes faster. The moving view is intentional: the original game rotates the camera as the level rises.',
    aboutText:'A browser restoration of PSY PONG 3D 0.9 (2009), originally created by Quetzy Garcia. The historical gameplay is preserved while the old third-party textures are replaced with new procedural visuals.',
    webglTitle:'3D GRAPHICS UNAVAILABLE',webglText:'PSY PONG 3D needs WebGL. Try enabling hardware acceleration, updating the browser, or opening the game in a current version of Chrome, Edge, Firefox or Safari.',reload:'TRY AGAIN'
  },
  it:{
    one:'1 GIOCATORE',two:'2 GIOCATORI',how:'COME SI GIOCA',settings:'OPZIONI',about:'INFO',back:'INDIETRO',pause:'PAUSA',resume:'RIPRENDI',menu:'MENU',level:'LIVELLO',score:'PUNTI',winner:'HA VINTO IL GIOCATORE {n}!',demo:'DEMO',
    warp:'Teletrasporto ai bordi',swap:'Scambio casuale dei lati',rotate:'Rotazione telecamera',reset:'Reset telecamera dopo un punto',inc:'Aumento del livello',startLevel:'Livello iniziale',scoreLimit:'Punti per vincere',apply:'APPLICA',defaults:'PREDEFINITE',
    howGoal:'Tieni la pallina in gioco e falla passare oltre la racchetta avversaria. Vince chi raggiunge per primo il punteggio stabilito.',
    howSingle:'Nella modalità a 1 giocatore controlli il Giocatore 1 e il computer controlla il Giocatore 2. In 2 giocatori entrambe le racchette sono controllate da persone.',
    howControls:'Tastiera: il Giocatore 1 usa Q / A, il Giocatore 2 usa ↑ / ↓. Spazio mette in pausa ed Esc torna al menu. Su smartphone e tablet compaiono automaticamente i controlli touch.',
    howEvents:'Con le opzioni originali attive, le racchette possono ricomparire dal lato opposto del campo e, dopo un punto, i due lati possono occasionalmente scambiarsi.',
    howPace:'La partita diventa gradualmente più veloce. La visuale che si muove è voluta: nel gioco originale la telecamera ruota con l’aumentare del livello.',
    aboutText:'Restauro per browser di PSY PONG 3D 0.9 (2009), creato originariamente da Quetzy Garcia. Il gameplay storico è preservato, mentre le vecchie texture di terze parti sono sostituite da una grafica procedurale nuova.',
    webglTitle:'GRAFICA 3D NON DISPONIBILE',webglText:'PSY PONG 3D richiede WebGL. Prova ad attivare l’accelerazione hardware, aggiornare il browser oppure aprire il gioco con una versione recente di Chrome, Edge, Firefox o Safari.',reload:'RIPROVA'
  }
};
export function tr(lang,key,vars={}){let x=(S[lang]||S.en)[key]||key;for(const[k,v]of Object.entries(vars))x=x.replace(`{${k}}`,v);return x;}
