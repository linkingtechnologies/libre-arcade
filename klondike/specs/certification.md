# Solver certification / Certificazione del solver

## English

The deterministic campaign generated 100 random deals for draw one and 100 for draw three (`xorshift32`, seeds 1–100, 50,000-state bound). Results on 2026-08-29:

| Mode | Attempted | Solved | Replayed in restored engine | Unknown | Mismatches |
|---|---:|---:|---:|---:|---:|
| Draw 1 | 100 | 62 | 62 | 38 | 0 |
| Draw 3 | 100 | 63 | 63 | 37 | 0 |

A deal enters the certified set only when the JS solver reaches all 52 foundation cards and the exact move certificate also wins in the restored `js-solitaire` engine. `Unknown` means the bounded search did not finish and makes no claim of impossibility. The machine-readable report is `certification/random-deals-latest.json`.

## Italiano

La campagna deterministica ha generato 100 partite casuali per pesca uno e 100 per pesca tre (`xorshift32`, seed 1–100, limite di 50.000 stati). Risultati del 29 agosto 2026:

| Modalità | Tentate | Risolte | Rigiocate nel motore restaurato | Unknown | Discrepanze |
|---|---:|---:|---:|---:|---:|
| Pesca 1 | 100 | 62 | 62 | 38 | 0 |
| Pesca 3 | 100 | 63 | 63 | 37 | 0 |

Una partita entra nell’insieme certificato soltanto quando il solver JS porta tutte le 52 carte alle fondazioni e lo stesso certificato di mosse vince anche nel motore `js-solitaire` restaurato. `Unknown` indica soltanto che la ricerca limitata non è terminata e non afferma che la partita sia impossibile. Il rapporto leggibile dalle macchine è `certification/random-deals-latest.json`.
