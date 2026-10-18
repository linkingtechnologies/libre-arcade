# How to Play / Come si gioca

## English

### Goal
Cook and serve a turkey as well as you can. The game simulates heat travelling from the surface toward the center, so **Skin, Body, and Core do not heat at the same speed**.

### 1. Shop
Buy exactly one turkey. Different turkey types have different historical score modifiers. Optional purchases include:

- **Temperature Probe** — reads the Core temperature when the oven is fully open.
- **Alarm Clock** — lets you track cooking time.
- **Oven Light** — lets you see inside the oven while it is closed.
- **Cookbook** — keeps the original-style cooking log role.
- **Stuffing / Frills** — affect the final historical score and are shown visually in the kitchen.

### 2. Cook
Start cooking and set the oven temperature. The oven warms gradually rather than jumping instantly to the selected temperature.

Watch the three temperature layers:

- **Skin** — near the outside.
- **Body** — middle region.
- **Core** — center of the turkey.

The turkey appearance changes as cooking progresses, but appearance alone is not a reliable Core measurement.

### 3. Check the Core
If you own the probe:

1. open the oven fully;
2. activate **Probe**;
3. read the Core temperature shown in the HUD.

The interface marks **165°F (74°C)** as a food-safety reference. This marker is guidance added by the port; the original's score also rewards a Core close to that temperature.

**The open door costs heat.** Opening it fully takes 3°C off the oven's air at once, and every second it stays open takes another 1°C (the oven heats back up toward its setting). Peeking does not.

### 4. Time and difficulty
**Casual** allows **Skip 20 min**, which advances twenty minutes of cooking simulation.

**Hardcore** disables skip and uses the historical Hardcore score multiplier.

### 5. Serve
Choose **Serve turkey** when you are satisfied. The result screen shows temperature information and the historical score.

The score is the original's, as the authors left it on the night of 1 December 2013: the Skin is judged by the hottest it ever got (best near 260°F), the Core by how cooked it is and how close it is to 165°F, and a raw Skin costs 1,000 points. It is a game score, not a modern food-science rating.

### Saving
The game stores progress in browser `localStorage`. A saved cooking session includes the thermal state, oven state, timers, door state, purchases, and gameplay state so **Resume** continues the same simulation trajectory.

### Keyboard
`M` Market · `K` Kitchen · `+/-` Oven · `P` Peek · `O` Open · `T` Probe · `I` Light · `S` Skip · `F` Serve · `U` °F/°C · `L` EN/IT · `A` Audio

### Units
The **°F/°C** button (or `U`) switches every temperature between Fahrenheit and Celsius. In Fahrenheit the oven moves in steps of 25°F, as in the original; in Celsius in steps of 10°C. The choice is remembered.

---

## Italiano

### Obiettivo
Cuoci e servi il tacchino nel modo migliore possibile. Il gioco simula il calore che si sposta dalla superficie verso il centro, quindi **Pelle, Corpo e Cuore non si scaldano alla stessa velocità**.

### 1. Mercato
Compra un solo tacchino. I diversi tipi hanno modificatori storici differenti sul punteggio. Puoi inoltre acquistare:

- **Termometro a sonda** — misura la temperatura del Cuore quando il forno è completamente aperto.
- **Allarme** — aiuta a tenere sotto controllo il tempo di cottura.
- **Luce forno** — permette di vedere il tacchino a porta chiusa.
- **Libro di cucina** — mantiene il ruolo del registro di cottura originale.
- **Ripieni / Kit decorazioni** — influenzano il punteggio storico finale e sono rappresentati visivamente in cucina.

### 2. Cottura
Avvia la cottura e imposta la temperatura. Il forno si scalda gradualmente: non raggiunge immediatamente il valore selezionato.

Controlla i tre livelli:

- **Pelle** — zona esterna.
- **Corpo** — zona intermedia.
- **Cuore** — centro del tacchino.

L'aspetto del tacchino cambia durante la cottura, ma non sostituisce la misura della temperatura interna.

### 3. Controlla il Cuore
Se possiedi il termometro:

1. apri completamente il forno;
2. usa **Termometro**;
3. leggi la temperatura del Cuore nell'HUD.

L'interfaccia evidenzia **165°F (74°C)** come riferimento di sicurezza alimentare. È un'indicazione aggiunta dal porting; il punteggio originale premia comunque un Cuore vicino a quella temperatura.

**La porta aperta costa calore.** Aprirla completamente toglie subito 3°C all'aria del forno, e ogni secondo che resta aperta ne toglie altri 1°C (il forno poi torna verso la temperatura impostata). Socchiuderla non costa nulla.

### 4. Tempo e difficoltà
In **Casual** puoi usare **Salta 20 min**, che fa avanzare di venti minuti la simulazione di cottura.

In **Hardcore** lo skip non è disponibile e viene applicato il moltiplicatore storico Hardcore.

### 5. Servi
Premi **Servi il tacchino** quando sei soddisfatto. La schermata finale mostra temperature e punteggio storico.

Il punteggio è quello dell'originale, come lo lasciarono gli autori la sera del 1 dicembre 2013: la Pelle conta per la temperatura più alta che ha raggiunto (ottima intorno ai 260°F), il Cuore per quanto è cotto e quanto è vicino a 165°F, e una Pelle cruda costa 1.000 punti. È un punteggio di gioco, non una valutazione moderna di sicurezza alimentare.

### Salvataggio
La partita viene salvata nel `localStorage` del browser. Il salvataggio comprende stato termico, forno, timer, porta, acquisti e stato di gioco, quindi **Riprendi** continua realmente la stessa traiettoria di simulazione.

### Tastiera
`M` Mercato · `K` Cucina · `+/-` Forno · `P` Socchiudi · `O` Apri · `T` Termometro · `I` Luce · `S` Skip · `F` Servi · `U` °F/°C · `L` EN/IT · `A` Audio

### Unità
Il pulsante **°F/°C** (o `U`) cambia tutte le temperature fra Fahrenheit e Celsius. In Fahrenheit il forno si muove a passi di 25°F, come nell'originale; in Celsius a passi di 10°C. La scelta viene ricordata.
