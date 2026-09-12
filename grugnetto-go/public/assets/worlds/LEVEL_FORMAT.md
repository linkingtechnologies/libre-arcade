# Formato "level design" (pre-Tiled)

Un formato JSON pensato per essere facile da leggere e modificare a mano — non è il formato che
il gioco carica direttamente (quello resta Tiled JSON, in `games/grugnetto-go/assets/world1-level1.json`).
Un compilatore (`tools/compile-level.py`) traduce un file in questo formato nel Tiled JSON reale.

Il terreno è pieno per default (niente griglia ASCII completa — basta descrivere cosa c'è SOPRA
il terreno: piattaforme, nemici, oggetti). Può però avere vere interruzioni tramite "pits" (vedi
sotto) — una scelta esplicita, non il comportamento originale: fino a poco fa il terreno era
sempre continuo per design ("mondo per bambini", niente cadute). Un livello senza `"pits"` resta
sicuro come prima; `"pits"` è opt-in.

```json
{
  "world": "world1",              // deve corrispondere a un file worlds/worldN-*.json
  "level": 1,
  "name": "Nome del livello",
  "tileSize": 64,
  "widthTiles": 122,               // larghezza totale del livello, in tile
  "heightTiles": 12,
  "groundTopRow": 8,               // riga (0-based) dove inizia il terreno solido alla colonna 0
                                    // (= riga del primo segmento di "ground", se presente)
  "playerSpawnCol": 2,             // colonna di partenza (sul terreno)

  "ground": [
    // opzionale — assente = terreno piatto a "groundTopRow" per tutta la larghezza (comportamento
    // originale, invariato). Se presente, il terreno cambia quota "a gradini" (mai a buca: resta
    // sempre continuo, vedi sopra) — ogni voce vale dalla propria "col" (inclusa) fino alla "col"
    // della voce successiva (esclusa), o fino a "widthTiles" per l'ultima. Deve iniziare con
    // { "col": 0, ... }. Un salto di 1 riga verso l'alto tra due segmenti consecutivi è sempre
    // raggiungibile con un salto singolo (vedi tools/generate_level.py per i calcoli); di più
    // richiede più segmenti in sequenza, uno per riga. Scendere non ha invece nessun limite: ci si
    // può sempre lasciar cadere sul terreno più basso.
    { "col": 0, "row": 8 },
    { "col": 40, "row": 6 }
  ],

  "platforms": [
    // ogni piattaforma è 1 tile di altezza, larga "span" tile, che parte da "col"
    { "col": 10, "span": 4, "row": 5 },
    // "material" opzionale — assente = terreno del mondo (grass/sand/stone). "bridge" la
    // disegna con la tile condivisa bridge_logs invece che col terreno, indipendentemente dal
    // mondo (vedi tools/compile-level.py, BRIDGE_GID) — usata dal gruppo "bridge" del
    // generatore, sempre larga almeno 3 tile.
    { "col": 30, "span": 7, "row": 7, "material": "bridge" }
  ],

  "coins": [
    // "row" è la riga assoluta (0=in alto); per monete a terra usare una riga 1-2 sopra il
    // terreno, per monete sopra una piattaforma usare la riga della piattaforma - 1
    { "col": 12, "row": 6 }
  ],

  "bonus": [
    // "kind" deve essere uno dei collectible elencati nel manifest del mondo (worldN-*.json)
    { "col": 8, "row": 6, "kind": "apple" }
  ],

  "trapCoins": [
    // opzionale — moneta-trappola (vedi entities/trapcoin.js): stessa moneta (colore invariato),
    // circondata da punte grigie, che invece di dare punti costa una vita (stessa conseguenza di un
    // nemico, incluso il breve tempo di grazia). Stessa convenzione "col"/"row" di "coins" sopra
    // — va piazzata di proposito in mezzo a monete vere, non ha un posizionamento suo. NON conta
    // per l'obiettivo "coinGoal": raccoglierle tutte non richiede toccare una trappola.
    { "col": 25, "row": 6 }
  ],

  "enemies": [
    // "kind" deve essere uno dei nemici elencati nel manifest del mondo
    // "patrolTiles" = quante tile di larghezza pattuglia (fermo sul terreno)
    { "col": 18, "kind": "snail", "patrolTiles": 3 }
  ],

  "props": [
    // opzionale — decorazione pura, nessuna collisione, nessun effetto su fisica/reachability.
    // "kind" deve essere uno dei file elencati in "props" nel manifest del mondo (senza percorso
    // né estensione, es. "tiles/fence.png" -> "fence"). Non tutti i file lì elencati sono validi:
    // strutture multi-tile (es. "ladder_*"), elementi legati alla storia (es. "door_*"), e nomi
    // che implicano un pericolo (es. "*danger*") sono esclusi di proposito — vedi
    // tools/generate_level.py (usable_props) per l'elenco esatto e il perché.
    { "col": 6, "row": 7, "kind": "bush" }
  ],

  "pits": [
    // opzionale — una vera interruzione nel terreno: nessuna tile, nessuna collisione per
    // "span" colonne a partire da "col". Cadere dentro è una caduta vera (vedi entities/
    // player.js, il controllo "fell below the viewport" già esistente, prima inutilizzato).
    // Due usi diversi in tools/generate_level.py, con vincoli diversi su "span":
    //  - build_pit: una fossa autonoma, attraversata con un salto diretto alla stessa quota —
    //    "span" resta sempre entro MAX_GAP_TILES, il valore calcolato dalla simulazione fisica
    //    del salto (vedi gap_crossable/MAX_GAP_PX), l'unica larghezza garantita superabile a
    //    piena velocità.
    //  - build_perch/build_staircase/build_bridge (_pit_under_platform): lo spazio sotto una
    //    piattaforma bassa — qui "span" combacia con lo "span" della piattaforma che ci sta
    //    sopra, spesso più largo di MAX_GAP_TILES: non si attraversa con un salto diretto ma
    //    atterrando sulla piattaforma, quindi quel limite non si applica.
    // Un file scritto a mano che dichiara uno span più largo di MAX_GAP_TILES SENZA una
    // piattaforma della stessa larghezza sopra produce una fossa che potrebbe non essere
    // superabile.
    { "col": 60, "span": 1 }
  ],

  "goalCol": 116,                  // colonna della bandiera/obiettivo, sul terreno

  "coinGoal": true                 // opzionale — assente/false = comportamento originale (basta
                                    // toccare la bandiera). true: la bandiera resta lì (e
                                    // "sventola" comunque) ma non conclude il livello finché non
                                    // sono state raccolte tutte le monete di "coins" sopra — vedi
                                    // entities/goal.js. Pensato per i livelli più facili/introduttivi
                                    // (es. world1/level1.json, senza nemici né fosse), dove
                                    // l'obiettivo diventa "raccogli tutto" invece di "arriva in fondo"
}
```

## Cosa fa (e non fa) il compilatore

- Genera terreno pieno (nessuna buca) su tutta `widthTiles`. Se "ground" è assente, dalla riga
  `groundTopRow` in giù come finora. Se presente, un segmento per voce di "ground", ciascuno dalla
  propria "col" alla successiva (o a `widthTiles`), dalla propria "row" in giù — un gradino
  verticale ad ogni cambio quota, non una rampa: le tile `terrain_*_ramp_*` già nei manifest dei
  mondi non sono ancora usate da questo formato (richiederebbe collisione a pendenza, non
  implementata nel gioco — vedi entities/player.js, nessuna gestione di superfici inclinate).
- Genera le piattaforme con la variante "cloud" del terreno del mondo (`PLATFORM_CLOUD_GIDS` in
  `compile-level.py`) — bordi arrotondati, pensata dal set Kenney per una piattaforma che
  galleggia in aria, non le tile squadrate `terrain_*_block*` usate per il terreno vero e
  proprio (che su una piattaforma tagliata a mezz'aria leggevano come un pezzo di terra staccato
  per errore, segnalato dal vivo). Left/middle/right per `span >= 2`, isolata per `span: 1` (una
  piattaforma a 1 tile non ha vicini su nessun lato — usare left/middle/right produrrebbe una
  tile deformata). Non è un caso raro: `tools/generate_level.py` genera `span: 1` di regola nelle
  scalinate (`build_staircase`), perché lo spazio raggiungibile con un salto singolo è più
  stretto di una piattaforma normale.
- "pits" ritaglia vere interruzioni dal terreno: niente tile (marcate con la tile `spikes`
  all'apertura, puramente visiva — nessuna collisione propria, la caduta è gestita dal controllo
  già esistente in player.js) e niente rettangolo di collisione per quelle colonne. Il rettangolo
  del segmento di terreno che contiene la fossa viene spezzato in due, uno per lato.
- Genera i rettangoli di collisione (uno per ogni tratto di terreno continuo — spezzato attorno
  a ogni "pits" al suo interno, vedi sopra — uno per piattaforma).
- Posiziona player/coins/bonus/enemies/goal/props come oggetti Tiled, usando le stesse
  convenzioni già verificate dal gioco (vedi entities/player.js, goal.js, enemy.js, bonus.js,
  prop.js — width/height degli oggetti Tiled non contano più di tanto, ogni entità usa le
  proprie costanti interne). "props" usa la stessa convenzione name/type di bonus/enemies
  ("name": "PropEntity", "type": il "kind") invece di un gid-tile-object — entities/prop.js è
  comunque un me.Sprite semplice, senza corpo fisico/collisione, coerente con "decorazione
  pura" anche se ora passa dalla stessa entity-factory delle altre.
- NON valida che i nomi in "kind" esistano davvero come risorse caricate dal gioco — quello va
  fatto a mano finché quell'entità/asset non è stata effettivamente collegata in resources.js
  (vedi i manifest dei mondi per l'elenco asset "candidati").
