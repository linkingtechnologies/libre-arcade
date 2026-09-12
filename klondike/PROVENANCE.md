# Provenance / Provenienza

## English

Grugnetto’s Klondike is a composite software restoration, not a clean-room game.

| Layer | Source | Exact revision | License | Treatment |
|---|---|---|---|---|
| Game rules, state and card sprite | `rjanjic/js-solitaire` | `f67a187afd2cff31ed8d04929d544fa2f032f457` | MIT | Preserved in `reference/`; extracted and behavior-certified |
| Solver and certified deal model | `ShootMe/MinimalKlondike` | `8983a1375aa15c5ca7f8c3df054aef37218f85c8` | MIT | Preserved in `reference/`; ported from C# to readable JavaScript |
| Classic HD SVG deck | `letele/playing-cards` | `865a78eb940c1232e4b21523577c8fca52f694fe` | CC0-1.0 | Original SVG assets used without React; license and README retained |
| Historical woodcut SVG deck | `SONDLecT/woodcut-cards` | `29f062e550f0b8add3a9ba31f706cc610e370b39` | CC0-1.0 | Original standalone SVG cards and back; license and README retained |
| Integration and presentation | KlondikeLab | this repository | GPL-3.0-or-later | New adapter, worker, responsive UI, persistence and bilingual documentation |

The frozen upstream trees retain their original license files and are not silently reformatted. The executable oracle compares the extracted engine with the frozen `js-solitaire` source. Solver certificates are replayed in both the solver model and the restored game engine. A bounded search result of `unknown` is never described as impossible.

## Italiano

Grugnetto’s Klondike è un restauro software composito, non un gioco riscritto da zero.

| Livello | Fonte | Revisione esatta | Licenza | Trattamento |
|---|---|---|---|---|
| Regole, stato e sprite delle carte | `rjanjic/js-solitaire` | `f67a187afd2cff31ed8d04929d544fa2f032f457` | MIT | Conservato in `reference/`; estratto e certificato sul comportamento |
| Solver e modello delle partite certificate | `ShootMe/MinimalKlondike` | `8983a1375aa15c5ca7f8c3df054aef37218f85c8` | MIT | Conservato in `reference/`; convertito da C# a JavaScript leggibile |
| Mazzo SVG Classico HD | `letele/playing-cards` | `865a78eb940c1232e4b21523577c8fca52f694fe` | CC0-1.0 | Asset SVG originali usati senza React; licenza e README conservati |
| Mazzo SVG Incisione storica | `SONDLecT/woodcut-cards` | `29f062e550f0b8add3a9ba31f706cc610e370b39` | CC0-1.0 | Carte SVG autonome e retro originali; licenza e README conservati |
| Integrazione e presentazione | KlondikeLab | questo repository | GPL-3.0-or-later | Nuovi adapter, worker, UI responsive, persistenza e documentazione bilingue |

Gli alberi originali congelati conservano le licenze e non sono stati riformattati di nascosto. L’oracolo eseguibile confronta il motore estratto con il sorgente congelato di `js-solitaire`. I certificati del solver vengono rigiocati sia nel modello del solver sia nel motore restaurato. Un risultato limitato `unknown` non viene mai presentato come impossibile.
